#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""mappers_entrust.py — C3 委托单 / C4 K线快照
源 mock：entrustList / entrustDetail / klineDay

映射依据：DATABASE.md §3 C3~C4；裁决 D（委托域枚举独立于买单域）
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

def map_entrust_orders(m, product_by_name: dict | None = None) -> list[dict]:
    """C4 entrust_orders ← entrustList.json（begList 与之字节相同，跳过）。

    裁决 D：本表 order_status 用**委托域** {2 委托中, 3 已成交, 4 已取消}，
    与买单域 3=已取消 语义冲突，不可共用枚举。
    product_id 为设计关联：源站无 goods_id，用 goods_name 匹配 products.name，
    匹配不到填 0（不臆造 ID，由 FK 校验暴露为孤儿）。
    """
    rows = []
    product_by_name = product_by_name or {}
    for r in rows_of(m, "entrustList", "data"):
        gname = r.get("goods_name") or ""
        code, _num = collection_code_split(r.get("collection_code"))
        rows.append(
            {
                "id": to_int(r.get("id")),
                "order_sn": r.get("order_sn"),
                # 委托域 2/3/4；v1.2 DEFAULT NULL，源站未给写 NULL
                "order_status": to_int(r.get("order_status")),
                "user_id": LOGIN_USER_ID,  # 设计关联：委托人，源站无该字段
                # 名称匹配不到父记录时返回 None（→ NULL）+ product_id_raw 留痕，
                # 不填 0（0 是源站哨兵值，冒充「未提供」会伪造源站痕迹）
                "product_id": product_by_name.get(gname),
                "goods_name": gname,
                "cover_image": r.get("listimg") or "",
                "collection_code": code,  # 实测 "QC88231"，本表为正常形态
                "number": to_int(r.get("number"), 0),
                "num": to_int(r.get("num"), 0),
                "sale_number": to_int(r.get("sale_number"), 0),
                "price": dec(r.get("price"), 0),
                "total_price": dec(r.get("total_price"), 0),
                "pay_way": r.get("pay_way") or "",
                "beg_time": to_unix(r.get("createtime"), 0),
                "update_time": to_unix(r.get("updatetime"), 0),
            }
        )
    return rows


def map_kline_snapshots(m, seq_start: int = 1, product_by_name: dict | None = None) -> list[dict]:
    """C6 kline_snapshots ← klineInfo.json（单条快照）。

    §3 C6：change 实测 "-0.53%" 带百分号 → VARCHAR，不 CAST（§9 亦列为不入库项）。
    num.* 子对象为字符串数值（"30000"）→ int。
    product_id 为设计关联：源站仅给 name/series_name，按名称匹配 products，
    匹配不到填 0。asks/bids/deals 为纯展示挂单档位（实测 5~6 档），整组存 JSON。
    """
    d = dig(m, "klineInfo", "data", default={}) or {}
    if not d:
        return []
    product_by_name = product_by_name or {}
    num = d.get("num", {}) or {}
    return [
        {
            "id": seq_start,  # 设计新增：源站无 id
            # 同上：匹配不到 → None（→ NULL）并由_raw 留痕，不填 0
            "product_id": product_by_name.get(d.get("name")),
            "product_name": d.get("name") or "",
            "series_name": d.get("series_name") or "",
            "price": dec(d.get("price"), 0),  # 实测 "112.34"
            "change": str_col(d.get("change")),  # "-0.53%" 原样
            "increase": 1 if d.get("increase") else 0,
            "flux": to_int(num.get("flux"), 0),
            "deal_5min": to_int(num.get("deal_5min"), 0),
            "deal_1h": to_int(num.get("deal_1h"), 0),
            "deal_today": to_int(num.get("deal_today"), 0),
            "high_24h": dec(num.get("high_24h"), 0),
            "low_24h": dec(num.get("low_24h"), 0),
            "asks": dumps_json(d.get("asks")),
            "bids": dumps_json(d.get("bids")),
            "deals": dumps_json(d.get("deals")),
            "snapshot_time": 0,  # 设计新增：源站无快照时刻，如实填 0
        }
    ]
