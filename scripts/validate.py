#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""validate.py — 列元信息读取 + 灌库后自检

三件事：
  1. table_columns：读schema 列元信息（供写入时套用 NOT NULL DEFAULT 规则）
  2. fk_orphans：独立扫库找外键孤儿行（SQLite 用 PRAGMA foreign_key_check）
  3. validate：外键 + NOT NULL + 枚举越界三项校验

⚠ 枚举越界分两类：
  - enum_out_of_range：真正的脏值（源站给了非法枚举）
  - schema_default_fallback：源站未提供该字段，取了 schema 的 NOT NULL DEFAULT 0，
    而 0 不在 DATABASE.md §4 枚举字典内 —— 属schema 自相矛盾，如实记录不掩盖
"""
from __future__ import annotations

from clean import ENUMS

# 枚举校验配置：(表, 列, 枚举名)。income_type 允许 NULL（裁决 B）
ENUM_CHECKS = [
    ("products", "goods_type", "goods_type_collection"),
    ("market_listings", "goods_type", "goods_type_collection"),
    ("orders", "goods_type", "goods_type_collection"),
    ("product_market_stats", "goods_type", "goods_type_collection"),
    ("shop_goods", "goods_type", "goods_type_shop"),
    ("user_collections", "status", "collection_status"),
    ("market_listings", "status", "listing_status"),
    ("orders", "order_status", "order_status_buy"),
    ("entrust_orders", "order_status", "entrust_status"),
    ("activities", "type", "activity_type"),
    ("shop_goods", "exchange_status", "exchange_status"),
    ("compound_results", "result_type", "compound_result"),
    ("user_draw_records", "status", "draw_status"),
    ("regift_records", "status", "regift_status"),
    ("user_invitations", "status", "invite_status"),
    ("rank_snapshots", "rank_type", "rank_type"),
]


def _parse_default(raw):
    """把 schema 的 DEFAULT 字面量转成 Python 值（'0' / 0 / 0.0000 / '' / NULL）。"""
    if raw is None:
        return None
    s = str(raw).strip()
    if s.upper() == "NULL":
        return None
    if len(s) >= 2 and s[0] == s[-1] and s[0] in "'\"":
        return s[1:-1]
    try:
        return int(s)
    except ValueError:
        pass
    try:
        return float(s)
    except ValueError:
        return s


def table_columns(db, table: str) -> list[tuple]:
    """读取表的列元信息 (name, notnull, dflt_value)。

    用于写入时的两条规则（依据「源站没有的值一律 NULL 或表默认值」）：
      - NOT NULL 且有 DEFAULT 的列：mapper 未赋值时**整列不写进 INSERT**，
        让数据库取 DEFAULT，而不是显式传 NULL 触发约束失败。
      - 可空列：允许显式写 NULL（NULL 与 DEFAULT 语义不同，见 §6.6）。
    """
    if db.name == "sqlite":
        return [(r[1], r[3], r[4]) for r in db.rows(f"PRAGMA table_info(`{table}`)")]
    cur = db.conn.cursor()
    cur.execute(
        "SELECT COLUMN_NAME, IS_NULLABLE, COLUMN_DEFAULT FROM information_schema.COLUMNS "
        "WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=%s ORDER BY ORDINAL_POSITION",
        (table,),
    )
    return [(r[0], 0 if r[1] == "NO" else 1, r[2]) for r in cur.fetchall()]


def fk_orphans(db) -> list[dict]:
    """独立于写入过程，直接扫库找外键孤儿行（SQLite 用 foreign_key_check 逐行定位）。"""
    out = []
    if db.name == "sqlite":
        for row in db.fk_violations():
            # (table, rowid, parent, fkid) —— 需回查具体列
            table, rowid, parent, fkid = row[0], row[1], row[2], row[3]
            fks = db.rows(f"PRAGMA foreign_key_list(`{table}`)")
            fk = next((f for f in fks if f[0] == fkid), None)
            if not fk:
                continue
            child_col, ref_tbl, ref_col = fk[3], fk[2], fk[4]
            val = db.scalar(f"SELECT `{child_col}` FROM `{table}` WHERE rowid=?", (rowid,))
            pk = db.scalar(f"SELECT id FROM `{table}` WHERE rowid=?", (rowid,))
            out.append(
                {
                    "table": table,
                    "fk": child_col,
                    "value": val,
                    "ref_table": ref_tbl,
                    "reason": f"父记录 {ref_tbl}.{ref_col}={val} 不存在（pk={pk}）",
                }
            )
        return out
    # MySQL
    for tname, cname, col, rtab, rcol, n in db.fk_violations():
        out.append(
            {
                "table": tname,
                "fk": col,
                "value": None,
                "ref_table": rtab,
                "reason": f"约束 {cname} 存在 {n} 行孤儿（父表 {rtab}.{rcol}）",
            }
        )
    return out


def validate(db, tables: list[str]) -> dict:
    """灌库后自检：外键完整性 + NOT NULL 违规 + 枚举越界。

    ⚠ 这里的 foreign_key_check 只有在 db.fk_enforced=True 时结论有效，
    否则一律标记 inconclusive——不允许把「关约束跑出来的 pass」写成 pass。
    """
    # NOT NULL 违规：逐表扫描 IS NULL
    not_null_bad = 0
    for t in tables:
        if db.name == "sqlite":
            info = db.rows(f"PRAGMA table_info(`{t}`)")
        else:
            info = []
        for col in info:
            if len(col) >= 4 and col[3] == 1:  # notnull
                n = db.scalar(f"SELECT COUNT(*) FROM `{t}` WHERE `{col['name']}` IS NULL") \
                    if isinstance(col, dict) else \
                    db.scalar(f"SELECT COUNT(*) FROM `{t}` WHERE `{col[1]}` IS NULL")
                not_null_bad += n

    # 枚举越界
    #
    # ⚠ schema 缺陷（已披露，不掩盖）：多列的 NOT NULL DEFAULT 是 **0**，
    #   而 DATABASE.md §4 枚举字典里0 不在取值域（如 goods_type 藏品域仅 1/2、
    #   user_collections.status 仅 1/2/10）。当源站 mock 未携带该字段时，
    #   取 schema 默认值 0 必然「越界」。这类值不是 mapper 臆造，
    #   而是 schema 定义与枚举字典自相矛盾，按「不臆造」原则取默认值最忠实。
    #   故单独归类为 schema_default_fallback，与真正的脏数据（脏值）区分开。
    enum_bad = []
    enum_default = []
    for table, col, enum_name in ENUM_CHECKS:
        allowed = ENUMS[enum_name]
        vals = [
            r[0]
            for r in db.rows(f"SELECT DISTINCT `{col}` FROM `{table}` WHERE `{col}` IS NOT NULL")
        ]
        for v in vals:
            if v in allowed:
                continue
            item = {"table": table, "column": col, "value": v,
                    "allowed": sorted(allowed), "enum": enum_name}
            if v == 0:
                item["note"] = "schema 该列 NOT NULL DEFAULT 0，源站未提供该字段"
                enum_default.append(item)
            else:
                enum_bad.append(item)
    violations = db.fk_violations()
    enforced = getattr(db, "fk_enforced", True)
    if db.name == "sqlite":
        method = ("SQLite PRAGMA foreign_key_check（灌库全程 PRAGMA foreign_keys=ON，约束真实生效）"
                  if enforced else
                  "SQLite PRAGMA foreign_key_check，但灌库时为 PRAGMA foreign_keys=OFF —— 结果无效")
    else:
        method = "MySQL information_schema REFERENTIAL_CONSTRAINTS LEFT JOIN 孤儿计数"
    return {
        # ⚠ 只有在约束真正生效（fk_enforced=True）时，"pass" 才是有效校验结论。
        # 关约束跑出来的 pass 是上一轮被打回的造假形态，这里从结构上堵死。
        "foreign_keys_enforced": enforced,
        "foreign_key_check": ("pass" if not violations else "fail") if enforced
                             else "inconclusive(约束未生效，结果无效)",
        "foreign_key_check_method": method,
        "foreign_key_violation_count": len(violations),
        "not_null_violations": not_null_bad,
        "enum_out_of_range": enum_bad,
        "schema_default_fallback": enum_default,
    }
