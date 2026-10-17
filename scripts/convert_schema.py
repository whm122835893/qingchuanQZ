#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""convert_schema.py — MySQL DDL → SQLite DDL 转换器

依据：docs/schema.sql 为 MySQL 8.0 定稿脚本（48 表 / 563 字段 / 46 外键），
本脚本将其**自动转换**为 SQLite 可执行 DDL，不手抄、不遗漏。

转换规则（MySQL → SQLite 亲和类型）：
    BIGINT / BIGINT UNSIGNED / INT / INTEGER / TINYINT / SMALLINT  → INTEGER
    DECIMAL(p,s) / NUMERIC(p,s)                                    → NUMERIC
    VARCHAR(n) / CHAR / TEXT / LONGTEXT / JSON / DATE               → TEXT
被丢弃的 MySQL 专有子句（SQLite 无对应概念）：
    ENGINE= / DEFAULT CHARSET= / COLLATE= / 表级 COMMENT='...'
    列级 COMMENT '...'（SQLite 无列注释语法；语义保留在本脚本的 COLUMN_COMMENTS 中）
    UNIQUE KEY / KEY（行内索引）→ 转为独立的 CREATE UNIQUE INDEX / CREATE INDEX 语句
保留：PRIMARY KEY、FOREIGN KEY ... REFERENCES（SQLite 支持，且需 parent 先建）

用法：
    python3 scripts/convert_schema.py            # 生成 scripts/schema_sqlite.sql
    python3 scripts/convert_schema.py --check    # 仅校验是否与 docs/schema.sql 同步
"""
from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

from sql_scan import _scan, _split_statements, _split_top_level

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "docs" / "schema.sql"
DST = ROOT / "scripts" / "schema_sqlite.sql"

# 逐条 DDL 语句由分号切分。CREATE TABLE 内部的分号只出现在 COMMENT 字符串中，
# 因此切分前先把注释块与字符串内容做保护处理。
_TYPE_MAP = [
    (re.compile(r"\bBIGINT\s+UNSIGNED\b", re.I), "INTEGER"),
    (re.compile(r"\bBIGINT\b", re.I), "INTEGER"),
    (re.compile(r"\bSMALLINT\b", re.I), "INTEGER"),
    (re.compile(r"\bTINYINT\b", re.I), "INTEGER"),
    (re.compile(r"\bMEDIUMINT\b", re.I), "INTEGER"),
    (re.compile(r"\bINT\b", re.I), "INTEGER"),
    (re.compile(r"\bINTEGER\b", re.I), "INTEGER"),
    (re.compile(r"\bDECIMAL\s*\(\s*\d+\s*,\s*\d+\s*\)", re.I), "NUMERIC"),
    (re.compile(r"\bNUMERIC\s*\(\s*\d+\s*,\s*\d+\s*\)", re.I), "NUMERIC"),
    (re.compile(r"\bVARCHAR\s*\(\s*\d+\s*\)", re.I), "TEXT"),
    (re.compile(r"\bLONGTEXT\b", re.I), "TEXT"),
    (re.compile(r"\bMEDIUMTEXT\b", re.I), "TEXT"),
    (re.compile(r"\bTINYTEXT\b", re.I), "TEXT"),
    (re.compile(r"\bTEXT\b", re.I), "TEXT"),
    (re.compile(r"\bJSON\b", re.I), "TEXT"),
    (re.compile(r"\bDATE\b", re.I), "TEXT"),
    (re.compile(r"\bDATETIME\b", re.I), "TEXT"),
    (re.compile(r"\bCHAR\s*\(\s*\d+\s*\)", re.I), "TEXT"),
]


def _map_type(decl: str) -> str:
    """把单个列声明中的 MySQL 类型替换为 SQLite 亲和类型。"""
    # 只替换类型部分（第一个出现的类型关键字），避免误伤 DEFAULT 值
    for pat, repl in _TYPE_MAP:
        m = pat.search(decl)
        if m:
            return decl[: m.start()] + repl + decl[m.end():]
    return decl



_COL_RE = re.compile(r"^`(\w+)`\s+(.*)$", re.S)
_CREATE_HEAD_RE = re.compile(
    r"CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?`?(\w+)`?\s*\(", re.I
)


def _match_create(stmt: str):
    """返回 (表名, 括号内正文)，用扫描器找配平的右括号。

    不能用正则 `\\((.*)\\)` 贪心匹配：CREATE TABLE 之后还有
    `) ENGINE=InnoDB ... ON DELETE SET NULL`，贪心会把外层 ENGINE 段一起吞进来，
    导致 CONSTRAINT 行被截断（实测生成出 `REFERENCES \`series\` (\`id\`` 这种残缺 DDL）。
    """
    m = _CREATE_HEAD_RE.match(stmt)
    if not m:
        return None
    open_at = m.end() - 1  # 左括号在 stmt 中的绝对位置
    depth = 0
    for kind, text, seg_start, _e in _scan(stmt[open_at:]):
        if kind != "code":
            continue
        for off, ch in enumerate(text):
            if ch == "(":
                depth += 1
            elif ch == ")":
                depth -= 1
                if depth == 0:
                    close_at = open_at + seg_start + off
                    return m.group(1), stmt[open_at + 1: close_at]
    return None
_KEY_RE = re.compile(r"^(UNIQUE\s+)?(?:KEY|INDEX)\s+`?(\w+)`?\s*\((.+)\)$", re.I | re.S)
_DROP_RE = re.compile(r"^DROP\s+TABLE\s+(IF\s+EXISTS\s+)?`?(\w+)`?$", re.I)
# 列级 COMMENT '...'：SQLite 无列注释语法，整段丢弃（语义已在 docs/DATABASE.md §3 保留）
_COL_COMMENT_RE = re.compile(r"\s+COMMENT\s+'(?:[^']|'')*'\s*", re.I)


def _strip_column_comment(decl: str) -> str:
    """剥离列级COMMENT '...'（SQLite 无列注释语法）。

    COMMENT 文本里含反引号（`series_id`）与双引号（"0"），
    故用扫描器而非正则定位结尾，避免误截。
    """
    segs = _scan(decl)
    for idx, (kind, text, _s, _e) in enumerate(segs):
        if kind != "code":
            continue
        m = re.search(r"\bCOMMENT\s*$", text)
        if m:
            # COMMENT 之后（含其字符串内容与任何残留）整体丢弃，
            # 只保留关键字之前的类型声明（如 "BIGINT UNSIGNED NULL"）
            return "".join(s[1] for s in segs[:idx] + [("code", text[: m.start()], 0, 0)]).strip()
    return decl.strip()


MISSING_COMMA_AFTER_RAW = re.compile(
    r"(`\w+_raw`\s+VARCHAR\(\d+\)[^,\n]*COMMENT\s+'(?:[^']|'')*')(?=\s*\n\s*`)"
)


def repair_missing_commas(sql: str) -> tuple[str, list[str]]:
    """修复 docs/schema.sql v1.1 的语法缺陷：12 个新增 _raw 列行尾漏了逗号。

    ⚠ 这是**源 schema 的真实缺陷**，不是转换器的问题：MySQL 侧同样无法执行。
    本函数只做「补一个逗号」这一件事，且把修复清单返回给调用方写进报告，
    由人决定是否回头改 docs/schema.sql——转换器不替架构师改设计稿。
    """
    fixed = []

    def repl(m):
        fixed.append(m.group(1).split()[0].strip("`"))
        return m.group(1) + ","

    return MISSING_COMMA_AFTER_RAW.sub(repl, sql), fixed


def convert(sql: str) -> tuple[str, dict, list[str]]:
    """返回 (sqlite_ddl, tables_info, index_statements)。"""
    out: list[str] = [
        "-- 本文件由 scripts/convert_schema.py 从 docs/schema.sql 自动生成，请勿手工编辑。",
        "-- 源：docs/schema.sql（MySQL 8.0 定稿）  生成器：convert_schema.py",
        "-- 转换：类型映射 + 剥离 ENGINE/CHARSET/COMMENT + 行内索引转独立 CREATE INDEX",
        "",
    ]
    indexes: list[str] = []
    tables: dict[str, dict] = {}

    for stmt in _split_statements(sql):
        if re.match(r"^SET\s", stmt, re.I):
            continue  # SET NAMES utf8mb4 / SET FOREIGN_KEY_CHECKS
        m = _DROP_RE.match(stmt)
        if m:
            out.append(f"DROP TABLE IF EXISTS `{m.group(2)}`;")
            continue
        m = _match_create(stmt)
        if not m:
            continue
        table, body = m
        cols: list[tuple[str, str]] = []
        tail: list[str] = []
        for part in _split_top_level(body):
            km = _KEY_RE.match(part)
            if km:
                unique = "UNIQUE " if km.group(1) else ""
                cols_txt = km.group(3)
                kind = "UNIQUE INDEX" if unique else "INDEX"
                indexes.append(
                    f"CREATE {kind} IF NOT EXISTS `{km.group(2)}` "
                    f"ON `{table}` ({cols_txt});"
                )
                continue
            cm = _COL_RE.match(part)
            if cm:
                decl = _strip_column_comment(cm.group(2))
                cols.append((cm.group(1), _map_type(decl)))
                continue
            tail.append(part)  # PRIMARY KEY / FOREIGN KEY / CONSTRAINT
        tables[table] = {"columns": cols, "constraints": tail}
        out.append(f"-- 表 {table}（{len(cols)} 字段）")
        out.append(f"CREATE TABLE `{table}` (")
        lines = [f"  `{n}` {t}" for n, t in cols]
        lines += [f"  {c}" for c in tail]
        out.append(",\n".join(lines))
        out.append(");")
        out.append("")

    out.append("-- ---- 索引（由 MySQL 行内 KEY/UNIQUE KEY 转换而来）----")
    out += indexes
    out.append("")
    return "\n".join(out), tables, indexes


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true", help="仅校验同步状态，不写文件")
    ap.add_argument("--print-repairs", action="store_true", help="打印 _raw 列缺逗号的修复清单")
    args = ap.parse_args()

    src, repairs = repair_missing_commas(SRC.read_text(encoding="utf-8"))
    ddl, tables, indexes = convert(src)

    if repairs:
        msg = (f"注意：源 schema 存在 {len(repairs)} 处语法缺陷"
               f"（新增 _raw 列行尾漏逗号，MySQL 侧同样无法执行），已在本转换器内修复：")
        print(msg)
        for c in repairs:
            print(f"  - {c}")
        print("  → 该缺陷需回写 docs/schema.sql，请架构师确认。\n")

    if args.print_repairs:
        return 0

    if args.check:
        if not DST.exists() or DST.read_text(encoding="utf-8") != ddl:
            print("schema_sqlite.sql 与 docs/schema.sql 不同步，请重新运行 convert_schema.py")
            return 1
        print(f"同步正常：{len(tables)} 表 / {sum(len(t['columns']) for t in tables.values())} 字段")
        return 0

    DST.write_text(ddl, encoding="utf-8")
    ncols = sum(len(t["columns"]) for t in tables.values())
    print(f"已生成 {DST.relative_to(ROOT)}：{len(tables)} 表 / {ncols} 字段 / {len(indexes)} 索引")
    return 0


if __name__ == "__main__":
    sys.exit(main())
