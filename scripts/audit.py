#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""audit.py — 独立审计（**不复用灌库链路的任何模块**）

存在理由：seed.py 的自检与灌库共用 dialect / mappers / fk_normalize，
若这几处存在同一个 bug，自检就会「自己造的数据自己校验通过」（自欺）。
本脚本改从 **docs/schema.sql 原文**（经 audit_parse 独立解析）取约束清单，
再用**自己写的 LEFT JOIN** 逐条核对孤儿行，与 seed.py 结论交叉比对。

独立性核查（脚本启动时自检，失败直接退出码 2）：
  - 运行时若加载了 dialect / mappers / seed / fk_normalize / convert_schema
    / clean / validate 中任一模块 → 判定独立性失败
  - 只读 docs/schema.sql 与 data/qingchuan.db
  - 不读 scripts/schema_sqlite.sql（转换产物），避免「用转换结果验证转换输入」

审计四件事：
  A. 独立解析强 FK（只认 FOREIGN KEY 子句）
  B. 每个 FK 跑一条 LEFT JOIN，统计孤儿行与样本
  C. 结构比对：schema 声明 vs 实际库（缺表 / 多表 / 列差）
  D. v1.2 三项关键改造定点核查：app_configs 复合主键、枚举列 NULL 语义、抽样行

输出：data/audit-report.json     用法：python3 scripts/audit.py
"""
from __future__ import annotations

import json
import sqlite3
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from audit_parse import parse_schema  # noqa: E402  仅解析层，不含 DB 访问

ROOT = Path(__file__).resolve().parent.parent
SCHEMA = ROOT / "docs" / "schema.sql"
DB = ROOT / "data" / "qingchuan.db"
OUT = ROOT / "data" / "audit-report.json"

BANNED_MODULES = (
    "dialect", "mappers", "seed", "fk_normalize",
    "convert_schema", "clean", "validate", "sql_scan",
)

INDEPENDENCE = {
    "reused_pipeline_modules": [],
    "imports": ["audit_parse（仅 DDL 解析，不含 DB 访问）"],
    "reads": ["docs/schema.sql", "data/qingchuan.db"],
    "method": "从 MySQL 原稿独立重解析 FK + 独立 LEFT JOIN 核对孤儿行",
}

# v1.2 改造涉及的枚举列：0 不在取值范围内，出现 0 即非法
ENUM_ILLEGAL_ZERO = [
    "products.goods_type", "market_listings.goods_type", "orders.goods_type",
    "product_market_stats.goods_type", "shop_goods.goods_type",
    "shop_goods.exchange_status", "user_collections.status",
    "market_listings.status", "regift_records.status",
    "entrust_orders.order_status", "activities.type", "user_crystal_logs.model",
    "series.category_group", "collection_price_ticks.sale_type",
    "user_lottery_records.prize_kind",
]


def check_independence() -> list[str]:
    """运行时若加载了灌库链路模块 → 视为独立性失败。"""
    return sorted(m for m in BANNED_MODULES
                  if m in sys.modules or any(k.startswith(m + "_") for k in sys.modules))


# --------------------------------------------------------------------------
# B. 孤儿行：每个 FK 一条 LEFT JOIN
# --------------------------------------------------------------------------
def audit_orphans(conn, fks, db_tables: set[str]) -> dict:
    results, total = [], 0
    for fk in fks:
        t, c, rt, rc = fk["table"], fk["column"], fk["ref_table"], fk["ref_column"]
        row = dict(fk)
        if t not in db_tables:
            results.append({**row, "status": "table_missing", "orphans": None, "samples": []})
            total += 1
            continue
        cols = {r[1] for r in conn.execute(f"PRAGMA table_info(`{t}`)")}
        if c not in cols:
            results.append({**row, "status": "column_missing", "orphans": None, "samples": []})
            total += 1
            continue
        base = (f"FROM `{t}` ch LEFT JOIN `{rt}` p ON ch.`{c}` = p.`{rc}` "
                f"WHERE ch.`{c}` IS NOT NULL AND p.`{rc}` IS NULL")
        n = int(conn.execute(f"SELECT COUNT(*) {base}").fetchone()[0])
        samples = [r[0] for r in conn.execute(f"SELECT ch.`{c}` {base} LIMIT 5")]
        results.append({**row, "status": "ok", "orphans": n, "samples": samples})
        total += n
    return {
        "fk_count": len(fks),
        "orphan_rows_total": total,
        "violated_fks": sum(1 for r in results
                            if r["status"] != "ok" or (r["orphans"] or 0) > 0),
        "per_fk": results,
    }


# --------------------------------------------------------------------------
# C. 结构比对
# --------------------------------------------------------------------------
def audit_structure(conn, schema) -> dict:
    db_tables = {r[0] for r in conn.execute(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")}
    col_diff: dict[str, dict] = {}
    for t, info in schema["tables"].items():
        if t not in db_tables:
            continue
        actual = {r[1] for r in conn.execute(f"PRAGMA table_info(`{t}`)")}
        miss = sorted(set(info["columns"]) - actual)
        extra = sorted(actual - set(info["columns"]))
        if miss or extra:
            col_diff[t] = {"missing_in_db": miss, "extra_in_db": extra}
    return {
        "schema_tables": len(schema["tables"]),
        "db_tables": len(db_tables),
        "missing_tables": sorted(set(schema["tables"]) - db_tables),
        "extra_tables": sorted(db_tables - set(schema["tables"])),
        "column_differences": col_diff,
        "column_diff_count": len(col_diff),
    }


# --------------------------------------------------------------------------
# D. v1.2 定点核查
# --------------------------------------------------------------------------
def audit_app_configs(conn) -> dict:
    rows = conn.execute(
        "SELECT config_group, config_key, config_value FROM app_configs "
        "ORDER BY config_group, config_key").fetchall()
    by_key: dict[str, dict[str, str]] = {}
    for g, k, v in rows:
        by_key.setdefault(k, {})[g] = v
    return {
        "rows": len(rows),
        "distinct_keys": len(by_key),
        "groups": {g: sum(1 for r in rows if r[0] == g) for g in sorted({r[0] for r in rows})},
        "cross_group_same_key": {k: v for k, v in by_key.items() if len(v) > 1},
        "prefixed_keys": [r[1] for r in rows if ":" in r[1]],
        "duplicate_composite": int(conn.execute(
            "SELECT COUNT(*) FROM (SELECT config_group, config_key FROM app_configs "
            "GROUP BY config_group, config_key HAVING COUNT(*)>1)").fetchone()[0]),
    }


def audit_enums(conn) -> dict:
    zeros, nulls = {}, {}
    for item in ENUM_ILLEGAL_ZERO:
        t, c = item.split(".")
        n0 = int(conn.execute(f"SELECT COUNT(*) FROM `{t}` WHERE `{c}` = 0").fetchone()[0])
        nn = int(conn.execute(f"SELECT COUNT(*) FROM `{t}` WHERE `{c}` IS NULL").fetchone()[0])
        if n0:
            zeros[item] = n0
        nulls[item] = nn
    return {"columns_checked": len(ENUM_ILLEGAL_ZERO),
            "columns_with_illegal_zero": zeros,
            "illegal_zero_total": sum(zeros.values()),
            "null_counts": nulls}


def audit_samples(conn) -> dict:
    r = conn.execute(
        "SELECT id, product_id, product_id_raw, status, collection_code "
        "FROM user_collections WHERE id = 77001").fetchone()
    uc = list(r) if r else None
    r = conn.execute(
        "SELECT id, product_id, series_id, status, goods_type, rush_status "
        "FROM market_listings WHERE id = 240472").fetchone()
    ml = list(r) if r else None
    cc = conn.execute(
        "SELECT c.id, c.post_id, c.parent_id, p.id AS parent_row_exists, c.nickname, "
        "       substr(c.content, 1, 12) FROM community_comments c "
        "LEFT JOIN community_comments p ON c.parent_id = p.id ORDER BY c.id").fetchall()
    return {
        "user_collections_77001": uc,
        "market_listings_240472": ml,
        "community_comments_two_level": [list(x) for x in cc],
    }


def main() -> int:
    started = time.time()
    print("=" * 68)
    print("独立审计 audit.py —— 不复用灌库链路任何模块")
    print("=" * 68)

    leaked = check_independence()
    if leaked:
        print(f"独立性校验失败：运行时加载了 {leaked}")
        return 2

    schema = parse_schema(SCHEMA)
    print(f"独立解析 docs/schema.sql：{len(schema['tables'])} 表 / "
          f"{len(schema['fks'])} 强 FK / {schema['index_count']} 行内索引")

    conn = sqlite3.connect(str(DB))
    db_tables = {r[0] for r in conn.execute(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")}
    orphans = audit_orphans(conn, schema["fks"], db_tables)
    struct = audit_structure(conn, schema)
    appcfg = audit_app_configs(conn)
    enums = audit_enums(conn)
    samples = audit_samples(conn)
    pragma_fk = [list(r) for r in conn.execute("PRAGMA foreign_key_check")]
    total_rows = sum(
        int(conn.execute(f"SELECT COUNT(*) FROM `{t}`").fetchone()[0]) for t in sorted(db_tables))
    conn.close()

    report = {
        "generated_at": time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(started)),
        "independence": INDEPENDENCE,
        "db_rows_total": total_rows,
        "schema_parsed_independently": {
            "tables": len(schema["tables"]),
            "strong_fks": len(schema["fks"]),
            "indexes": schema["index_count"],
        },
        "orphan_audit": orphans,
        "pragma_foreign_key_check": {"count": len(pragma_fk), "rows": pragma_fk},
        "structure_audit": struct,
        "app_configs_audit": appcfg,
        "enum_zero_audit": enums,
        "samples": samples,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"\n库内总行数              ：{total_rows}")
    print(f"孤儿行（独立 LEFT JOIN）：{orphans['orphan_rows_total']}")
    print(f"违规 FK 条数            ：{orphans['violated_fks']} / {orphans['fk_count']}")
    print(f"PRAGMA foreign_key_check：{len(pragma_fk)}")
    print(f"结构差异 缺表/多表/列差 ：{len(struct['missing_tables'])}/"
          f"{len(struct['extra_tables'])}/{struct['column_diff_count']}")
    print(f"枚举列非法 0 值         ：{enums['illegal_zero_total']}"
          f"（抽查 {enums['columns_checked']} 列）")
    print(f"app_configs             ：{appcfg['rows']} 行 / 跨组同名 key "
          f"{len(appcfg['cross_group_same_key'])} 个 / 前缀残留 {len(appcfg['prefixed_keys'])}"
          f" / 复合键重复 {appcfg['duplicate_composite']}")
    print(f"\n报告：{OUT.relative_to(ROOT)}   耗时 {round(time.time() - started, 2)}s")

    ok = (orphans["orphan_rows_total"] == 0 and orphans["violated_fks"] == 0
          and len(pragma_fk) == 0 and struct["column_diff_count"] == 0
          and not struct["missing_tables"] and not struct["extra_tables"]
          and enums["illegal_zero_total"] == 0 and not appcfg["prefixed_keys"]
          and appcfg["duplicate_composite"] == 0)
    print("\n审计结论：" + ("PASS" if ok else "FAIL"))
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
