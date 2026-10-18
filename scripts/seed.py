#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""seed.py — 青川数字艺术 H5 平台 · 数据灌库主程序

把 public/mock/ 下的源站mock 灌入 48 张表（docs/schema.sql 定稿 Schema）。

用法：
    cd /workspace/qingchuan-h5 && python3 scripts/seed.py
    DB=mysql DB_HOST=127.0.0.1 DB_USER=root DB_PASSWORD=xxx DB_NAME=qingchuan python3 scripts/seed.py

设计要点：
  1. 双数据库：SQLite（默认，零依赖）/ MySQL 8.0（可选），差异全在 dialect.py
  2. 两阶段灌库：先父表后子表，满足 45 个外键的依赖要求
  3. 孤儿行不静默跳过：全部记入 data/seed-report.json 的 orphan_rows
  4. 不臆造数据：源站没有的值一律 NULL 或表默认值
"""
from __future__ import annotations

import json
import os
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from dialect import create_dialect, load_table_order
from fk_normalize import normalize
from mappers import build_rows
from schema_review import collect_schema_pending
from validate import _parse_default, fk_orphans, table_columns, validate

ROOT = Path(__file__).resolve().parent.parent
MOCK_DIR = ROOT / "public" / "mock"
REPORT = ROOT / "data" / "seed-report.json"

# 78 个 mock 的处理台账（依据 DATABASE.md §8 映射表 + §9 不入库清单 + §6.6 字节重复）
SKIP_MOCKS = {
    "sms_getCapt.json": "base64 滑块验证码 + secretKey + token，不入库（§9）",
    "blindBoxList.json": "空数组，无数据（§8 #77）",
    "box_blind_box_list.json": "空数组，无数据（§8 #78）",
    "begList.json": "与 entrustList 字节完全相同，重复跳过（§6.6）",
    "market_market_MarketDetail_ids_240472.json": "与 marketDetail 字节完全相同，重复跳过（§6.6）",
    "https:__api.qingchuanart.vip_addons_diypage_index.json": "与 diypage 内容等价，重复跳过（§3 E10）",
    "afficheList.json": "与 index_afficheList 内容不同（total 430 vs 431），取更新的后者（§3 E8）",
    "tradeBaseInfo.json": "交易页聚合值，可由 products + market_listings 派生，不入库（§8 #24 / §9）",
    "drawResult.json": "开奖结果由 draw_codes 派生，不独立建表（§8 #43）",
    "leaderboard.json": "可由 product_market_stats ORDER BY flux 派生（§8 #63）；其字段已并入 products/F1",
    "blindBoxResult.json": "开盒结果列表，字段已由 blindBoxResultOne 覆盖 user_collections（§8 未列）",
    # blindBoxOpenRecord.json 已移除跳过：补建 B5b user_blind_box_records 表承载开盒流水
    # （此前「无独立表承载」的理由已不成立，见 mappers_collection.map_user_blind_box_records）
    "invitationInfo.json": "invite_code 与 users.inviter_code 不同源（QC3827 vs E99022291），仅校验不入库（§8 #3）",
}

# 两阶段灌库：PARENT 必须先于 CHILD，同阶段内按 schema 物理顺序
PARENT_TABLES = {
    "users", "series", "products", "product_pool_items", "product_sale_rules",
    "community_posts", "affiche_types", "compound_schemes", "chat_sessions",
    "app_configs", "activity_configs", "shop_goods", "trade_unions",
    "product_market_stats", "lottery_rounds", "sign_reward_rules", "activities",
    "user_collections", "community_comments",
}


def load_mocks() -> dict:
    """加载全部 mock，键为**不含扩展名的文件名**（mapper 按 §8 清单的短名引用）。

    容错处理非法 JSON：记入 parse_errors，不静默跳过。
    """
    mocks, errors = {}, []
    for p in sorted(MOCK_DIR.glob("*.json")):
        try:
            mocks[p.stem] = json.loads(p.read_text(encoding="utf-8"))
        except json.JSONDecodeError as e:
            errors.append({"file": p.name, "error": str(e)})
    if errors:
        print(f"[警告] {len(errors)} 个 mock 解析失败：{[e['file'] for e in errors]}")
    return mocks

def seed(db, rows: dict, report: dict):
    """两阶段灌库：先父表后子表，满足外键依赖。"""
    order = load_table_order()
    # 未在 schema 中出现的表不应存在（防 mapper 写错表名）
    unknown = set(rows) - set(order)
    if unknown:
        report["unknown_tables"] = sorted(unknown)

    parent = [t for t in order if t in rows and t in PARENT_TABLES]
    child = [t for t in order if t in rows and t not in PARENT_TABLES]

    for phase, tables in (("parent", parent), ("child", child)):
        for t in tables:
            data = rows[t]
            meta = table_columns(db, t)
            col_names = [c[0] for c in meta]
            # 只写 schema 中存在的列：mapper 写了 schema 没有的键 → 忽略并计入报告
            extra = set()
            for r in data:
                extra |= {k for k in r if k not in col_names}
            if extra:
                report.setdefault("mapper_extra_columns", {}).setdefault(t, []).extend(
                    sorted(extra)
                )
            used = set()
            for r in data:
                used |= {k for k in r if k in col_names}
            cols = [c for c in col_names if c in used]
            meta_by_name = {c[0]: c for c in meta}

            # 审计列 created_at / updated_at 是设计新增（源站无），
            # 无论 mapper 是否赋值都强制写入灌库时刻，否则会落成 schema DEFAULT 0
            for c in ("created_at", "updated_at"):
                if c in col_names and c not in cols:
                    cols.append(c)

            # 双向列校验（schema → mapper）：schema 声明了、但连 INSERT 都没写进去的列。
            # 基准是最终 cols（含强制补的审计列）。
            # 合法缺口只有一种：该表源站无任何数据（0 行），此时无从赋值。
            uncovered = sorted(set(col_names) - set(cols))
            if uncovered:
                report.setdefault("mapper_uncovered_columns", {})[t] = {
                    "columns": uncovered,
                    "rows": len(data),
                    "reason": "源站无数据（0 行），mapper 无可赋值的行"
                              if not data else "mapper 未覆盖，需人工确认",
                }

            now = int(time.time())
            clean = []
            for r in data:
                row = {}
                for c in cols:
                    v = r.get(c)
                    # NOT NULL 且有 DEFAULT 的列：源站没给值时用表默认值，
                    # 而不是写 NULL（既满足约束，也符合「不臆造数据」——
                    # 取的是 schema 既定默认值，非凭空编造）
                    if v is None and meta_by_name[c][1] == 1 and meta_by_name[c][2] is not None:
                        v = _parse_default(meta_by_name[c][2])
                    row[c] = v
                # created_at/updated_at 为设计新增审计列，统一填灌库时刻
                if "created_at" in row and row["created_at"] is None:
                    row["created_at"] = now
                if "updated_at" in row and row["updated_at"] is None:
                    row["updated_at"] = now
                clean.append(row)
            db.insert_many(t, cols, clean)
            db.commit()
            report["filled_columns"][t] = cols
            report["tables"].append(
                {"table": t, "rows": db.count(t), "columns_filled": len(cols), "phase": phase}
            )
            print(f"  [{phase:6}] {t:32} {db.count(t):>5} 行  {len(cols):>2} 列")


def main() -> int:
    started = time.time()
    print("=" * 68)
    print("青川数字艺术 H5 · 数据灌库  |  源 public/mock/ → docs/schema.sql")
    print("=" * 68)

    db = create_dialect()
    print(f"目标数据库：{db.name}"
          + (f"  ({getattr(db, 'path', '')})" if db.name == "sqlite" else ""))

    mocks = load_mocks()
    print(f"已加载 mock：{len(mocks)} 个")

    db.create_schema()
    print(f"建表完成：{len(load_table_order())} 张表\n")

    rows = build_rows(mocks)

    # 方案X 归一化（DATABASE.md §7.1.4）：必须在灌库前完成，
    # 否则弱引用的 0/悬空值会在 FK 开启状态下直接中断 INSERT。
    fk_report = normalize(rows)

    report = {
        "started_at": time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(started)),
        "database": db.name,
        "db_path": str(getattr(db, "path", "")) if db.name == "sqlite" else os.environ.get("DB_NAME", ""),
        "source_mocks": len(mocks),
        "skipped_mocks": len(SKIP_MOCKS),
        "seeded_mocks": len(mocks) - len(SKIP_MOCKS),
        "skipped_detail": [{"file": k, "reason": v} for k, v in sorted(SKIP_MOCKS.items())],
        "tables": [],
        "filled_columns": {},
        "totals": {},
        "orphan_rows": [],
        "schema_pending": [],
        "fk_normalization": fk_report,
        "validation": {},
    }

    if not getattr(db, "fk_enforced", True):
        print("\n" + "!" * 68)
        print("警告：本次以 PRAGMA foreign_keys=OFF 灌库（ALLOW_FK_OFF=1）。")
        print("该状态下的 foreign_key_check 结果不构成有效校验，不得据此判定通过。")
        print("!" * 68 + "\n")

    print("开始灌库：")
    seed(db, rows, report)

    # 孤儿行：独立扫库得出，不依赖写入过程
    report["orphan_rows"] = fk_orphans(db)
    report["validation"] = validate(db, load_table_order())
    report["schema_pending"] = collect_schema_pending(db, report)
    total_rows = sum(t["rows"] for t in report["tables"])
    report["totals"] = {
        "tables_seeded": len(report["tables"]),
        "rows_inserted": total_rows,
    }

    finished = time.time()
    report["finished_at"] = time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(finished))
    report["duration_sec"] = round(finished - started, 2)

    REPORT.parent.mkdir(parents=True, exist_ok=True)
    REPORT.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    db.close()

    # --- 控制台自检摘要 ---
    print("\n" + "=" * 68)
    print(f"表数 {report['totals']['tables_seeded']} / 总行数 {total_rows}"
          f" / 耗时 {report['duration_sec']}s")
    v = report["validation"]
    print(f"外键校验     : {v['foreign_key_check']}   孤儿行 {len(report['orphan_rows'])} 条")
    print(f"NOT NULL 违规: {v['not_null_violations']}")
    print(f"枚举越界     : {len(v['enum_out_of_range'])}"
          f"（另有 {len(v.get('schema_default_fallback', []))} 项 schema DEFAULT 0 回退）")
    # 双向列校验摘要
    extra_n = sum(len(x) for x in (report.get("mapper_extra_columns") or {}).values())
    unc = report.get("mapper_uncovered_columns") or {}
    unc_n = sum(len(x["columns"]) for x in unc.values())
    unc_rows0 = sum(1 for x in unc.values() if x["rows"] == 0)
    print(f"双向列校验   : mapper→schema 多余键 {extra_n} / schema→mapper 未覆盖 {unc_n}"
          f"（其中 {unc_rows0} 张表源站 0 行）")
    if report["orphan_rows"]:
        print("\n外键孤儿行明细（按表汇总）：")
        agg = {}
        for o in report["orphan_rows"]:
            k = (o["table"], o["fk"])
            agg.setdefault(k, set()).add(str(o["value"]))
        for (t, f), vals in sorted(agg.items()):
            sample = ", ".join(sorted(vals)[:6])
            print(f"  {t}.{f}: {len(vals)} 个不同值 → {sample}")
    print(f"\n报告已写入 {REPORT.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
