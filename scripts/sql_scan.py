#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""sql_scan.py — MySQL DDL 的词法切分原语（被convert_schema.py 复用）

职责单一：把一段 MySQL DDL 切成「代码段 / 字符串段 / 反引号标识符段 / 行注释段」，
并在此基础上提供三种切分：语句（分号）、CREATE TABLE 顶层项（逗号）、表体（配平括号）。

【为什么必须手写扫描器，不能用正则】
本轮实测踩过的三个坑，全部源于「正则跨字段误匹配」，且失败方式是**静默丢列**：
  1. `re.sub(r"'(?:[^']|'')*'", "''", sql)` 在引号总数奇偶失衡处会跨字段匹配，
     把列定义之间的逗号一起吞掉 → products 表凭空少一个字段，DDL 报语法错误。
  2. `_split_statements` 里用分号后的残片判空（`if p.strip()`），而残片常常只是
     "\n\n"（语句以 `;` 结尾后接空行）→ 已拼好的整条语句连同缓冲被丢弃，
     48 张表只剩 1 张。
  3. 紧跟字符串字面量之后的 `;` 若被行注释分支吞掉，两条 CREATE TABLE 会粘成一条。
正则无法表达「引号内的分号不是分隔符」这种有状态需求，故改为单遍带状态扫描。

【本文件不做类型映射、不做 DDL 改写】——那些是 convert_schema.py 的事。
"""
from __future__ import annotations

import re

def _scan(sql: str):
    """单遍扫描 SQL，返回 [(kind, text, start, end)]。

    kind ∈ {'code','str','bt','line_comment'}；只有 'code' 段里的
    分号/逗号/括号才具备分隔语义（详见本文件头部「为什么必须手写扫描器」）。
    """
    out = []
    i, n = 0, len(sql)
    buf_start = 0
    while i < n:
        ch = sql[i]
        if ch == "'":
            out.append(("code", sql[buf_start:i], buf_start, i))
            q, j = ch, i + 1
            while j < n:
                if sql[j] == q:
                    if j + 1 < n and sql[j + 1] == q:  # 转义的 ''
                        j += 2
                        continue
                    break
                j += 1
            out.append(("str", sql[i: j + 1], i, j + 1))
            i = buf_start = j + 1
        elif ch == "`":
            j = sql.find("`", i + 1)
            j = n if j < 0 else j + 1
            out.append(("code", sql[buf_start:i], buf_start, i))
            out.append(("bt", sql[i:j], i, j))
            i = buf_start = j
        elif ch == "-" and i + 1 < n and sql[i + 1] == "-":
            j = sql.find("\n", i)
            j = n if j < 0 else j + 1
            # ⚠ 必须先把 buf_start..i 的 code 段吐出：否则紧跟在字符串字面量后的
            # 语句终止符 `;` 会随注释一起被吞掉，导致两条 CREATE TABLE 粘成一条
            # （实测 products 表整个消失，表数 48 → 33）。
            out.append(("code", sql[buf_start:i], buf_start, i))
            out.append(("line_comment", sql[i:j], i, j))
            i = buf_start = j
        else:
            i += 1
    out.append(("code", sql[buf_start:], buf_start, n))
    return out


def _split_statements(sql: str) -> list[str]:
    """按分号切分语句。只在 code 段切，字符串/反引号/注释内不切。"""
    stmts, cur = [], []
    for kind, text, _s, _e in _scan(sql):
        if kind == "line_comment":
            continue  # 注释整体丢弃
        if kind == "code":
            parts = text.split(";")
            cur.append(parts[0])
            for p in parts[1:]:
                # ⚠ 判空必须判「累积后的整条语句」，不能判分号后的残片 p。
                # p 常常只是 "\n\n"（语句以 `;` 结尾后接空行），若用 p 判空就会
                # 把已经拼好的整条语句连同 cur 一起丢掉——实测 48 张表只剩 1 张。
                stmt = "".join(cur).strip()
                if stmt:
                    stmts.append(stmt)
                cur = [p]
        else:
            cur.append(text)  # str / 反引号标识符原样保留
    tail = "".join(cur).strip()
    if tail:
        stmts.append(tail)
    return [s for s in stmts if s.strip()]


def _split_top_level(body: str) -> list[str]:
    """按顶层逗号切分 CREATE TABLE 体（字符串/反引号内的逗号与括号不参与）。"""
    parts, buf = [], []
    depth = 0
    for kind, text, _s, _e in _scan(body):
        if kind != "code":
            buf.append(text)
            continue
        for ch in text:
            if ch == "(":
                depth += 1
                buf.append(ch)
            elif ch == ")":
                depth -= 1
                buf.append(ch)
            elif ch == "," and depth == 0:
                parts.append("".join(buf).strip())
                buf = []
            else:
                buf.append(ch)
    tail = "".join(buf).strip()
    if tail:
        parts.append(tail)
    return parts

