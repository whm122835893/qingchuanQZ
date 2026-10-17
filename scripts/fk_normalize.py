#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""fk_normalize.py — 外键强度分级落地（DATABASE.md §7.1，schema v1.1）

背景：v1.0 把所有关联建成硬FK，灌库后 `PRAGMA foreign_key_check` 实测 141 条违规，
根因是弱引用（源站给 0 哨兵 / 悬空ID / 根本不返回该字段）。v1.1 已把强FK 收敛到 17 个，
其余 26 列降级为「仅索引、不建FK」。

本模块按 §7.1.4 方案 X 执行归一化，规则只有两条，全部由此处一处实现：

  规则 1（需归一化的列 = 17 个强 FK 列 ∪ 9 个带 _raw 的弱引用列）：
      有效 ID（能在父表主键里查到）→ 落 xxx_id，xxx_raw = NULL
      无效值（0 哨兵 / 悬空 / 源站未给）→ xxx_id = NULL，xxx_raw = 源站原值字符串

  规则 2（无 _raw 列的弱引用，如全部指向 users.id 的 21 列）：
      **原值原样保留**，不做任何改写。
      理由：这些列无 FK 约束，不存在违规；且 schema 未给 _raw 列，
      改成 NULL 就等于**销毁源站事实**（0 与悬空 ID 是真实观测值，不是脏数据）。
      如实统计进report.we kept_weak_refs，由人决定要不要加 _raw 列。

【为什么放在 mapper 之后而不是 mapper 内部】
mapper 逐表写死 0 / None 会让「什么是哨兵、什么是缺失」的知识散落在 13 个文件里。
归一化需要「全库父主键集合」这一全局事实，只能在 build_rows 之后做。
"""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SQLITE_DDL = ROOT / "scripts" / "schema_sqlite.sql"

# 弱引用列 → 父表。带 _raw 列的 9 个弱引用列在此显式声明父子关系。
# 强FK 的父子关系直接从 DDL 的 FOREIGN KEY 子句解析，不手抄，避免漂移。
WEAK_PARENT = {
    ("market_listings", "series_id"): "series",
    ("market_listings", "buy_user_id"): "users",
    ("product_market_stats", "series_id"): "series",
    ("rank_snapshots", "product_id"): "products",
    ("collection_price_ticks", "product_id"): "products",
    ("entrust_orders", "product_id"): "products",
    ("kline_snapshots", "product_id"): "products",
}


def parse_ddl() -> tuple[dict, set]:
    """从 schema_sqlite.sql 解析出 (强FK 父子映射, 带 _raw 的列集合)。

    不手抄 schema：强FK 数量、列名一旦架构师修订，本模块自动跟随。
    """
    ddl = SQLITE_DDL.read_text(encoding="utf-8")
    strong: dict[tuple[str, str], str] = {}
    raw_cols: set[tuple[str, str]] = set()
    for m in re.finditer(r"CREATE TABLE `(\w+)`(.*?)\n\);", ddl, re.S):
        table, body = m.group(1), m.group(2)
        for fk in re.finditer(r"FOREIGN KEY \(`(\w+)`\) REFERENCES `(\w+)`", body):
            strong[(table, fk.group(1))] = fk.group(2)
        for col in re.findall(r"`(\w+_raw)`", body):
            base = col[: -len("_raw")]
            # 只把「ID 类混合列」纳入归一化。collection_code_raw / income_type_raw
            # 虽然同名 _raw，但它们不是外键（裁决 A/B 的原值留痕），父表概念不存在，
            # 若一并纳入会误判成「找不到父表」而错置 NULL。
            if base.endswith("_id") and re.search(r"`%s`" % re.escape(base), body):
                raw_cols.add((table, base))
    return strong, raw_cols


def normalize(rows: dict) -> dict:
    """就地把 rows 归一化，返回审计报告。"""
    strong, raw_cols = parse_ddl()
    targets = dict(strong)
    for key in raw_cols:
        targets.setdefault(key, WEAK_PARENT.get(key, ""))  # 无FK 的补父子映射

    # 父表主键集合：空表也要能判（此时所有非 NULL 值都算悬空）
    pk: dict[str, set] = {
        t: {r["id"] for r in data if r.get("id") is not None}
        for t, data in rows.items()
    }
    for parent in set(targets.values()):
        pk.setdefault(parent, set())

    report = {
        "strategy": "方案X（DATABASE.md §7.1.4）：有效值落 xxx_id，无效值 xxx_id=NULL + xxx_raw 留痕",
        "constraints_enforced_during_seed": True,
        "strong_fk_count": len(strong),
        "normalized_columns": [],
        "nullified": [],          # 被置NULL + _raw 留痕的明细
        "kept_weak_refs": [],     # 无 _raw 列、保留原值的弱引用统计
        "targets_without_parent": [],
    }

    for (table, col), parent in sorted(targets.items()):
        data = rows.get(table)
        if not data:
            continue
        raw_col = f"{col}_raw"
        has_raw = (table, col) in raw_cols
        if not parent:
            report["targets_without_parent"].append(f"{table}.{col}")
            continue
        parent_ids = pk.get(parent, set())
        nullified = 0
        for r in data:
            # 无论是否发生归一化，都显式写入 _raw 键（值可能是 None）：
            # 这样 _raw 列一定出现在 INSERT 列清单里，双向列校验才算「已覆盖」。
            # 若只在归一化时才写，entrust_orders / kline_snapshots 这类
            # 「本批数据恰好全部有效」的表会报出列覆盖缺口（假缺口）。
            if has_raw and f"{col}_raw" not in r:
                r[f"{col}_raw"] = None
            if col not in r:
                continue
            v = r[col]
            if v is None:
                # 源站未提供：xxx_id 保持 NULL；raw 也保持 NULL（「未提供」≠「无效值」）
                continue
            if v in parent_ids:
                if has_raw:
                    r[raw_col] = None  # 有效值不留原值痕迹，避免冗余
                continue
            # 无效值：0 哨兵 / 悬空 ID → 置 NULL + 原值留痕
            if has_raw:
                r[raw_col] = str(v)
            r[col] = None
            nullified += 1
            if len(report["nullified"]) < 500:  # 明细上限，防止报告膨胀
                report["nullified"].append(
                    {"table": table, "column": col, "source_value": v,
                     "parent_table": parent, "raw_column": raw_col if has_raw else None}
                )
        if nullified:
            report["normalized_columns"].append(
                {"table": table, "column": col, "parent_table": parent,
                 "is_strong_fk": (table, col) in strong,
                 "nullified_rows": nullified, "has_raw_column": has_raw}
            )

    # 规则 2：统计未归一化的弱引用（列名以 _id 结尾且不在 targets 里）
    for table, data in sorted(rows.items()):
        if not data:
            continue
        for col in sorted(data[0].keys()):
            if not col.endswith("_id") or (table, col) in targets:
                continue
            zeros = sum(1 for r in data if r.get(col) == 0)
            if zeros:
                report["kept_weak_refs"].append(
                    {"table": table, "column": col, "zero_rows": zeros,
                     "reason": "无 _raw 列的弱引用：无FK 约束故不违规，改 NULL 会销毁源站事实，原值保留"}
                )
    return report