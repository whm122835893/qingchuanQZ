#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""mappers_shop.py — D5 商城 / D6 晶石流水
源 mock：shopList / shopGoodsDetail / shopBoxDetail / shopCollectionDetail /
        shopExchangeRecord / crystalLog

映射依据：DATABASE.md §3 D5~D6；裁决 C（商城域枚举独立）
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

def map_shop_goods(m) -> list[dict]:
    """D12 shop_goods ← shopList.json（列表）+ shopGoodsDetail/BoxDetail/CollectionDetail（详情）。

    裁决 C：本表 goods_type 使用**商城域**枚举 E-GOODS-TYPE-SHOP
    （1=数字藏品 2=盲盒 3=合集），与 products.goods_type（藏品域 1/2）严禁混用。
    详情接口的 info.id 实测**全部为 101**（三个不同商品共用同一 id），
    因此以 shopList 的 goods_id 为准建行，详情字段按 id=101 合并（实测该组
    三商品详情 id 同值，属源站 ID 复用，已在报告标注）。
    """
    rows: dict[int, dict] = {}

    def put(gid, **kw):
        if gid is None:
            return
        row = rows.setdefault(
            gid,
            {
                "id": gid,
                "name": "",
                "list_image": "",
                "crystal_price": 0,
                # v1.2 DEFAULT NULL：源站未给写 NULL，不兜 0
                "exchange_status": None,
                "total_num": 0,
                "exchange_num": 0,
                # 裁决 C：商城域枚举；v1.2 DEFAULT NULL，源站未给写 NULL
                "goods_type": None,
                "end_time": 0,
                "max_count": 0,
                "is_sub": 0,
                "count_down": 0,
                "shop_type": 0,
                "details": None,
                "crystal_type": 0,
                "pool_items": None,
            },
        )
        for k, v in kw.items():
            if v is None or v == "":
                continue
            row[k] = v

    for g in rows_of(m, "shopList", "list"):
        put(
            to_int(g.get("goods_id")),
            name=clean_str(g.get("goods_name"), ""),
            list_image=clean_str(g.get("list_image"), ""),
            crystal_price=to_int(g.get("crystal_price"), 0),  # 整型龙晶点数，非金额
            exchange_status=to_int(g.get("exchange_status")),
            total_num=to_int(g.get("total_num"), 0),
            exchange_num=to_int(g.get("exchange_num"), 0),
            goods_type=to_int(g.get("goods_type")),
            end_time=to_unix(g.get("end_time"), 0),
        )

    for key in ("shopGoodsDetail", "shopBoxDetail", "shopCollectionDetail"):
        d = dig(m, key, "data", default={}) or {}
        info, prod = d.get("info", {}) or {}, d.get("product", {}) or {}
        if not info:
            continue
        gid = to_int(info.get("id"))
        # 概率池：§9 规定空数组统一存 NULL（空即无，与 NULL 语义重叠）
        pool = prod.get("collectionlist")
        put(
            gid,
            name=clean_str(prod.get("name"), ""),
            list_image=clean_str(prod.get("listimg"), ""),
            crystal_price=to_int(info.get("crystal_price"), 0),
            exchange_status=to_int(info.get("exchange_status")),
            total_num=to_int(prod.get("total_num"), 0),
            max_count=to_int(info.get("max_count"), 0),
            is_sub=bool_int(info.get("is_sub")),
            count_down=to_int(info.get("count_down"), 0),
            shop_type=to_int(info.get("type"), 0),  # 语义未确认，原样存
            details=clean_str(info.get("details")) or clean_str(prod.get("details")),
            crystal_type=to_int(info.get("crystal_type"), 0),
            # 商城域 goods_type 取自 product.goods_type（实测 1/2/3）
            goods_type=to_int(prod.get("goods_type")),
            pool_items=dumps_json(pool) if pool else None,
        )
    return list(rows.values())


def map_user_shop_exchanges(m) -> list[dict]:
    """D13 user_shop_exchanges ← shopExchangeRecord.json。

    §3 D13：order_id 与 orders.id 同 ID 空间（实测 9001~9004），
    外键关联 orders.id —— 故 orders 必须先灌。crystal_type 实测 1/2 两种。
    """
    rows = []
    for r in rows_of(m, "shopExchangeRecord"):
        rows.append(
            {
                "id": to_int(r.get("id")),
                "user_id": LOGIN_USER_ID,
                "order_id": to_int(r.get("order_id"), 0),
                "goods_name": clean_str(r.get("goods_name"), ""),
                "list_image": clean_str(r.get("list_image"), ""),
                "crystal_number": to_int(r.get("crystal_number"), 0),
                "crystal_type": to_int(r.get("crystal_type"), 0),
                "create_time": to_unix(r.get("create_time"), 0),
            }
        )
    return rows


def map_user_crystal_logs(m) -> list[dict]:
    """D14 user_crystal_logs ← shopCrystalDetail.json。

    §3 D14：model 为流水方向（1=支出 2=收入，依据实测 model:1 全为「兑换…」扣减）。
    crystal 为整型龙晶点数（非金额，用 INT 而非 DECIMAL，依据 §6.4 第 3 条）。
    """
    rows = []
    for r in rows_of(m, "shopCrystalDetail"):
        rows.append(
            {
                "id": to_int(r.get("id")),
                "user_id": LOGIN_USER_ID,
                "model": to_int(r.get("model")),
                "memo": clean_str(r.get("memo"), ""),
                "crystal": to_int(r.get("crystal"), 0),
                "log_time": to_unix(r.get("createtime"), 0),
            }
        )
    return rows
