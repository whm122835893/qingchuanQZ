#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""mappers_catalog.py — B1 series / B3 藏品池 / B4 销售规则
源 mock：series-10 / series-10-pid / categoryManager / poolDetail / productRule

映射依据：DATABASE.md §3 B1/B3/B4
"""
from __future__ import annotations

from clean import (
    LOGIN_USER_ID,
    bool_int,
    clean_str,
    collection_code_split,
    dec,
    dig,
    dumps_json,
    empty_str_to_none,
    income_type,
    rows_of,
    str_col,
    to_int,
    to_unix,
)

def map_series(m) -> list[dict]:
    """B1 series ← series-10 / series-10-pid / categoryManager。

    §3 B1 命名冲突警告：series-10 的 id=10 名为「2026」，series-10-pid 的 id=15 名为
    「赛博」，productDetail.series.name 为「赛博系列」，三者文案不统一属源站事实，
    **入库保留各自原值，不做归一**。
    categoryManager 只有 series_id/series_name 两个字段，其余列取默认值。
    """
    store: dict[int, dict] = {}

    def put(sid, name, **kw):
        if sid is None:
            return
        row = store.setdefault(
            sid,
            {
                "id": sid,
                "name": "",
                "is_def": 0,
                "flag": 0,
                "pattern": 0,
                # v1.3 新增：系列父子关系，NULL=顶级。依据见下方 series-10-pid 循环注释
                "pid": None,
                # 设计新增：1=自营 2=平台；v1.2 DEFAULT NULL，
                # categoryManager 未覆盖到的系列写 NULL（0 不在枚举取值范围内）
                "category_group": None,
                "resale_put_start_time": "",
                "resale_put_end_time": "",
                "resale_buy_start_time": "",
                "resale_buy_end_time": "",
            },
        )
        if not row.get("name") and name:
            row["name"] = name
        for k, v in kw.items():
            if v is not None and not row.get(k):
                row[k] = v

    for s in rows_of(m, "series-10"):
        put(
            to_int(s.get("series_id")),
            clean_str(s.get("series_name"), ""),
            is_def=to_int(s.get("is_def"), 0),
            flag=to_int(s.get("flag"), 0),
            pattern=to_int(s.get("pattern"), 0),
            # §6.5：实测 "18:26:45" 是纯时刻串，非时间戳 → VARCHAR 原样存
            resale_put_start_time=str_col(s.get("resale_put_start_time"), ""),
            resale_put_end_time=str_col(s.get("resale_put_end_time"), ""),
            resale_buy_start_time=str_col(s.get("resale_buy_start_time"), ""),
            resale_buy_end_time=str_col(s.get("resale_buy_end_time"), ""),
        )
    for s in rows_of(m, "series-10-pid"):
        put(
            to_int(s.get("series_id")),
            clean_str(s.get("series_name"), ""),
            is_def=to_int(s.get("is_def"), 0),
            flag=to_int(s.get("flag"), 0),
            pattern=to_int(s.get("pattern"), 0),
            # v1.3：pid 由「两份快照的差集」推断 —— 出现在 series-10 的是顶级
            # (pid=NULL)，仅出现在 series-10-pid 的是子系列。实测 series-10-pid
            # 即 /index/getSeries?type=10&pid=10 的响应，故其全部行挂 pid=10。
            # 依据：type=10 返回 10「2026」/11「光」，pid=10 返回 15「赛博」，
            # 若无父子关系则后端会拿 pid 当主键返回父系列，导致市场页取到
            # 错误的 series_id 而列表空白。详见 DATABASE.md §3 B1。
            pid=10,
            resale_put_start_time=str_col(s.get("resale_put_start_time"), ""),
            resale_put_end_time=str_col(s.get("resale_put_end_time"), ""),
            resale_buy_start_time=str_col(s.get("resale_buy_start_time"), ""),
            resale_buy_end_time=str_col(s.get("resale_buy_end_time"), ""),
        )
    # categoryManager：两个数组仅给 id/name，用数组语义归类 category_group
    cm = dig(m, "categoryManager", "data", default={}) or {}
    for key, group in (("self_series", 1), ("platform_series", 2)):
        for s in cm.get(key, []) or []:
            put(to_int(s.get("series_id")), clean_str(s.get("series_name"), ""),
                category_group=group)
    return list(store.values())


def map_product_pool_items(m) -> list[dict]:
    """B3 product_pool_items ← productDetail.collectionlist[]。

    §3 B3：shopBoxDetail / shopCollectionDetail 的 collectionlist **不灌本表**，
    它们属商城域（裁决 C），已整体存入 shop_goods.pool_items JSON。
    is_out 仅 productDetail 有，缺失时留 NULL（schema 允许 NULL）。
    """
    rows = []
    for it in dig(m, "productDetail", "data", "product", "collectionlist", default=[]) or []:
        rows.append(
            {
                "id": to_int(it.get("id")),
                "product_id": to_int(dig(m, "productDetail", "data", "product", "id")),
                "name": clean_str(it.get("name"), ""),
                # 实测两种形态：数字 60.0 / 字符串 "12.5" → 统一 Decimal
                "probability": dec(it.get("probability"), 0),
                "show_total_num": to_int(it.get("show_total_num"), 0),
                "listimg": clean_str(it.get("listimg"), ""),
                "rarity_icon": clean_str(it.get("rarity_icon"), ""),
                "is_out": to_int(it.get("is_out")),  # 无此键 → None（NULL）
            }
        )
    return rows


def map_product_sale_rules(m) -> list[dict]:
    """B4 product_sale_rules ← productRule.json。

    §3 B4：rules[] 为 {icon,title,lines[]}，icon/title/lines 强绑定且纯展示，
    故**整组存 JSON 不拆表**（§5 附录二第 7 条）。
    product_id 为设计关联：productRule.data.id 即商品 ID。
    """
    d = dig(m, "productRule", "data", default={}) or {}
    if not d.get("id"):
        return []
    return [
        {
            "id": to_int(d.get("id")),
            "product_id": to_int(d.get("id")),
            "name": clean_str(d.get("name"), ""),
            "price": dec(d.get("price"), 0),
            "total_num": to_int(d.get("total_num"), 0),
            "sale_num": to_int(d.get("sale_num"), 0),
            "rule_updated": clean_str(d.get("rule_updated"), ""),  # "2026-10-16" 日期串
            "rules": dumps_json(d.get("rules")),
        }
    ]
