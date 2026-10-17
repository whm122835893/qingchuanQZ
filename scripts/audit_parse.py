#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""audit_parse.py — audit.py 的独立 MySQL DDL 解析层

从 docs/schema.sql **原文**重新解析出表、列、强 FOREIGN KEY、行内索引。
本模块只做「读文本 → 结构」，不含任何数据库访问，也不复用 scripts/ 下
其他模块（dialect / convert_schema / sql_scan / mappers / seed 等一律不用），
以保证 audit 的结论与灌库链路完全解耦。

独立性要点：
  1. 自己实现 MySQL 词法扫描（注释 / 字符串 / 反引号标识符），
     注释内容抹成空格而非删行 —— 保持偏移量与括号配平，
     否则 `-- 商品ID,` 这类「逗号被行注释吞掉」的缺陷会骗过解析器。
  2. 自己按顶层逗号切分 CREATE TABLE 括号内的表元素。
  3. 强 FK 只认 FOREIGN KEY 子句（表级与列级两种写法）。
"""
from __future__ import annotations

import re
from pathlib import Path

CREATE_RE = re.compile(r"^CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?`?(\w+)`?\s*\(", re.I)
COL_RE = re.compile(r"^`(\w+)`\s+(.*)$", re.S)
# 表级：CONSTRAINT `fk_x` FOREIGN KEY (`a`) REFERENCES `p` (`id`) ON DELETE ...
FK_TABLE_RE = re.compile(
    r"^(?:CONSTRAINT\s+`?(\w+)`?\s+)?FOREIGN\s+KEY\s*\(([^)]+)\)\s*"
    r"REFERENCES\s+`?(\w+)`?\s*\(([^)]+)\)",
    re.I | re.S,
)
# 列级：`col` TYPE ... REFERENCES `p` (`id`)
FK_COL_RE = re.compile(r"^`(\w+)`\s+.*?\bREFERENCES\s+`?(\w+)`?\s*\(([^)]+)\)", re.I | re.S)
KEY_RE = re.compile(r"^(UNIQUE\s+)?(?:KEY|INDEX)\s+`?(\w+)`?\s*\((.+)\)$", re.I | re.S)


def strip_noise(sql: str) -> str:
    """去掉 -- 行注释与 /* */ 块注释，保留字符串字面量内容。

    注释内容替换为等长空格（换行保留），目的是**不改变字符偏移**，
    这样后续按字符位置扫描括号配平时不会错位。
    """
    out: list[str] = []
    i, n = 0, len(sql)
    while i < n:
        ch = sql[i]
        nxt = sql[i + 1] if i + 1 < n else ""
        if ch in "'\"`":
            quote = ch
            out.append(ch)
            i += 1
            while i < n:
                c = sql[i]
                out.append(c)
                if c == "\\" and quote != "`" and i + 1 < n:
                    out.append(sql[i + 1])
                    i += 2
                    continue
                if c == quote:
                    if i + 1 < n and sql[i + 1] == quote:  # '' / "" 转义
                        out.append(sql[i + 1])
                        i += 2
                        continue
                    i += 1
                    break
                i += 1
            continue
        if ch == "-" and nxt == "-":
            while i < n and sql[i] != "\n":
                out.append(" ")
                i += 1
            continue
        if ch == "/" and nxt == "*":
            out.append("  ")
            i += 2
            while i < n and not (sql[i] == "*" and i + 1 < n and sql[i + 1] == "/"):
                out.append("\n" if sql[i] == "\n" else " ")
                i += 1
            out.append("  ")
            i += 2
            continue
        out.append(ch)
        i += 1
    return "".join(out)


def split_statements(sql: str) -> list[str]:
    """按分号切分语句（字符串字面量内的分号受保护）。"""
    stmts: list[str] = []
    buf: list[str] = []
    i, n = 0, len(sql)
    while i < n:
        ch = sql[i]
        if ch in "'\"`":
            q = ch
            buf.append(ch)
            i += 1
            while i < n:
                buf.append(sql[i])
                if sql[i] == q:
                    if i + 1 < n and sql[i + 1] == q:
                        buf.append(sql[i + 1])
                        i += 2
                        continue
                    i += 1
                    break
                i += 1
            continue
        if ch == ";":
            s = "".join(buf).strip()
            if s:
                stmts.append(s)
            buf = []
            i += 1
            continue
        buf.append(ch)
        i += 1
    s = "".join(buf).strip()
    if s:
        stmts.append(s)
    return stmts


def split_top_level(body: str) -> list[str]:
    """按顶层逗号切分括号内的表元素（括号内与字符串内的逗号不算）。"""
    parts: list[str] = []
    buf: list[str] = []
    depth = 0
    i, n = 0, len(body)
    while i < n:
        ch = body[i]
        if ch in "'\"`":
            q = ch
            buf.append(ch)
            i += 1
            while i < n:
                buf.append(body[i])
                if body[i] == q:
                    i += 1
                    break
                i += 1
            continue
        if ch == "(":
            depth += 1
        elif ch == ")":
            depth -= 1
        if ch == "," and depth == 0:
            parts.append("".join(buf).strip())
            buf = []
            i += 1
            continue
        buf.append(ch)
        i += 1
    tail = "".join(buf).strip()
    if tail:
        parts.append(tail)
    return [p for p in parts if p]


def _body_of(stmt: str, open_at: int) -> str | None:
    """从 CREATE TABLE 的左括号起做配平扫描，返回括号内正文。"""
    depth = 0
    for j in range(open_at, len(stmt)):
        c = stmt[j]
        if c == "(":
            depth += 1
        elif c == ")":
            depth -= 1
            if depth == 0:
                return stmt[open_at + 1: j]
    return None


def parse_schema(path: Path) -> dict:
    """独立解析 MySQL DDL，返回 {tables, fks, index_count}。"""
    clean = strip_noise(path.read_text(encoding="utf-8"))
    tables: dict[str, dict] = {}
    fks: list[dict] = []
    indexes = 0
    for stmt in split_statements(clean):
        m = CREATE_RE.match(stmt)
        if not m:
            continue
        table = m.group(1)
        body = _body_of(stmt, m.end() - 1)
        if body is None:
            continue
        cols: list[str] = []
        tail: list[str] = []
        for part in split_top_level(body):
            if KEY_RE.match(part):
                indexes += 1
                continue
            cm = COL_RE.match(part)
            if cm:
                cols.append(cm.group(1))
                tail.append(part)
                continue
            tail.append(part)
        tables[table] = {"columns": cols, "constraints": tail}
        fks.extend(_fks_of(table, tail))
    return {"tables": tables, "fks": fks, "index_count": indexes}


def _fks_of(table: str, tail: list[str]) -> list[dict]:
    """从表元素列表中提取强 FK（表级 + 列级两种写法）。"""
    out: list[dict] = []
    for part in tail:
        fm = FK_TABLE_RE.match(part)
        if fm:
            child = [c.strip().strip("`") for c in fm.group(2).split(",")]
            ref = [c.strip().strip("`") for c in fm.group(4).split(",")]
            for lc, rc in zip(child, ref):
                out.append({"table": table, "column": lc, "ref_table": fm.group(3),
                            "ref_column": rc, "name": fm.group(1) or "", "style": "table"})
            continue
        cm = COL_RE.match(part)
        if cm:
            fm = FK_COL_RE.match(part)
            if fm:
                out.append({"table": table, "column": cm.group(1),
                            "ref_table": fm.group(2),
                            "ref_column": fm.group(3).split(",")[0].strip().strip("`"),
                            "name": "", "style": "column"})
    return out
