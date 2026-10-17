#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""schema_review.py — 灌库后「schema 自身缺陷」的复查与上报

与 validate.py 的分工：
  - validate.py 查**数据层**问题（外键孤儿、NOT NULL 违规、枚举脏值）
  - 本模块查**schema 定义层**问题：即使数据全对也依然存在的矛盾

三类复查项（均为回归检测，检出即如实上报，不静默改架构师的设计稿）：
  1. schema_raw_missing_comma：v1.1 的 _raw 列漏逗号 → v1.2 应已清零
  2. app_configs_composite_pk：复合主键改造是否真正生效（跨组共存 / 无前缀残留 /
     复合键无重复）
  3. enum_column_default_0_vs_dictionary：枚举列 NOT NULL DEFAULT 0 与 §4 字典矛盾
     → v1.2 已改 DEFAULT NULL，应归零
"""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from convert_schema import repair_missing_commas

ROOT = Path(__file__).resolve().parent.parent


def collect_schema_pending(db, report: dict) -> list[dict]:
    """收集「灌库层能绕过、但 schema 本身有缺陷」的问题，如实上报不掩盖。

    与 orphan_rows 的区别：orphan_rows 是数据层孤儿行；
    这里是 schema 定义层面的缺陷，即使数据全对也依然存在。
    """
    out: list[dict] = []

    # 1) docs/schema.sql v1.1：12 个新增 _raw 列行尾漏逗号 + 3 类语法问题
    #    v1.2 已由架构师回写修复，此处仅做回归检测（检出即上报，不静默改设计稿）。
    src = (ROOT / "docs" / "schema.sql").read_text(encoding="utf-8")
    _fixed, repairs = repair_missing_commas(src)
    if repairs:
        out.append({
            "id": "schema_raw_missing_comma",
            "severity": "blocking",
            "location": "docs/schema.sql",
            "detail": f"{len(repairs)} 个新增 _raw 列定义行尾缺少逗号，"
                      "该 DDL 在 MySQL 8.0 上无法执行（缺逗号会与下一列合并成非法列名）",
            "affected_columns": repairs,
            "handled_by": "scripts/convert_schema.py 在转换时补逗号（不改架构师的设计稿）",
            "needs": "架构师回写 docs/schema.sql",
        })

    # 2) app_configs 复合主键（v1.2 已改为 (config_group, config_key)）
    #    回归验证：同名 key 跨组共存 + 无 group: 前缀残留 + 重复 (group,key) 被拦截
    keyed = db.rows(
        "SELECT config_group, config_key, config_value FROM `app_configs` ORDER BY config_group, config_key"
    )
    by_key: dict[str, dict[str, str]] = {}
    for grp, key, val in keyed:
        by_key.setdefault(key, {})[grp] = val
    cross = {k: v for k, v in by_key.items() if len(v) > 1}
    prefixed = [k for _g, k, _v in keyed if ":" in k]
    dup = db.scalar(
        "SELECT COUNT(*) FROM (SELECT config_group, config_key FROM `app_configs` "
        "GROUP BY config_group, config_key HAVING COUNT(*) > 1)"
    )
    out.append({
        "id": "app_configs_composite_pk",
        "severity": "resolved" if cross and not prefixed and not dup else "medium",
        "location": "docs/schema.sql · app_configs",
        "detail": f"v1.2 主键已改为复合 (config_group, config_key)。实测："
                  f"共 {len(keyed)} 行 / {len(by_key)} 个不同 config_key；"
                  f"跨组同名 key {len(cross)} 个（{sorted(cross)[:5]}）；"
                  f"mapper 残留 group: 前缀 {len(prefixed)} 个；"
                  f"重复 (group,key) 组合 {dup} 组。",
        "cross_group_same_key": {k: v for k, v in list(cross.items())[:10]},
        "residual_prefixed_keys": prefixed[:10],
        "duplicate_composite_keys": dup,
        "handled_by": "mapper 已删除 `group:` 前缀拼接，config_key 直写源站字段名，"
                      "分组由独立 config_group 列承载；INSERT 全程具名参数（列顺序无关）",
        "needs": None if (cross and not prefixed and not dup) else "架构师复核 app_configs 主键",
    })

    # 3) NOT NULL DEFAULT 0 与 §4 枚举字典不含 0 的矛盾（v1.2 已把 15 个枚举列改 DEFAULT NULL）
    fb = report["validation"]["schema_default_fallback"]
    out.append({
        "id": "enum_column_default_0_vs_dictionary",
        "severity": "medium" if fb else "resolved",
        "location": "docs/schema.sql · goods_type / user_collections.status 等枚举列",
        "detail": "v1.1 时这些枚举列是 NOT NULL DEFAULT 0，而 §4 字典不含 0，"
                  "源站未给值时必然落成越界的 0。v1.2 已将 15 个枚举列改为 DEFAULT NULL"
                  "并在 COMMENT 注明「0 不在本枚举取值范围内」，源站无值时写 NULL + _raw 留痕。",
        "still_present": bool(fb),
        "affected": fb,
        "handled_by": "mapper 未赋值时写 NULL（可空列），原始值保留在对应 *_raw 列",
        "needs": "架构师处理剩余项" if fb else None,
    })
    return out
