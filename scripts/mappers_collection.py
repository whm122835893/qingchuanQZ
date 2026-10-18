#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""mappers_collection.py — B5 藏品实例

源 mock：myCollectionDetail / myCollectionList / userCollectionList / blindBoxMyBox /
        blindBoxResultOne / marketDetail.user_collection

映射依据：DATABASE.md §3 B5；清洗依据 §6.1/§6.3/§6.5
B6/B7/F1 已拆至 mappers_flow.py（单文件 ≤300 行门禁）。
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

def map_user_collections(m) -> list[dict]:
    """B5 user_collections ← myCollectionDetail / myCollectionList /
    userCollectionList / marketDetail.user_collection / blindBoxMyBox / blindBoxResultOne。

    裁决 A（§6.1）：collection_code 拆 VARCHAR + BIGINT 双列。
      - "QC88231" 等业务编号 → collection_code
      - 387750 数值编号（marketDetail / marketGoodsList）→ collection_code_num
        **不与 id 建 FK**（不同自增序列，不制造虚假关联）
    userCollectionList 的 id 与 user_collection_id 是两个 ID 空间
    （前者 5001~5003 是「持有记录」后者 77001~77003 才是藏品实例），
    故取 user_collection_id 作为 user_collections.id，name/price 等作为冗余补充。
    """
    rows: list[dict] = []
    seen: set = set()

    def put(**kw):
        rid = kw.get("id")
        if rid is None or rid in seen:
            return
        seen.add(rid)
        rows.append(kw)

    base = {
        "user_id": LOGIN_USER_ID,
        "serial_num": 0, "series_total": 0,
        "user_hash": "", "user_hash_text": "",
        "rz_code": None,
        # v1.2：user_collections.status 为 DEFAULT NULL 枚举列，
        # 源站多数接口不携带该字段 → 写 NULL，不拿 0 冒充「未提供」
        "status": None, "is_lock": 0,
        "weither_regift": 0, "weither_resale": 0, "can_compose": 0,
        "price": 0, "min_price": 0,
        "today_volume": 0, "has_sold": 0, "count": 0,
        "flux": 0, "total_num": 0,
        "zuzhao_info_id": None, "task_id": "",
        "blind_box_id": None,
        "name": "", "listimg": "", "main_image": "",
        "createtime": 0,
    }

    # (1) myCollectionDetail：单条，字段最全
    d = dig(m, "myCollectionDetail", "data", default={}) or {}
    if d.get("id"):
        code, num = collection_code_split(d.get("collection_code"))
        put(**{
            **base,
            "id": to_int(d.get("id")),
            "product_id": to_int(dig(d, "product", "id")),
            "collection_code": code,
            "collection_code_num": num,
            "serial_num": to_int(d.get("serial_num"), 0),
            "series_total": to_int(d.get("series_total"), 0),
            # §6.3：user_hash 原样存（实测三形态：0x 地址/哈希串/已脱敏），不加格式约束
            "user_hash": clean_str(d.get("user_hash"), ""),
            "user_hash_text": clean_str(d.get("user_hash_text"), ""),
            "rz_code": clean_str(d.get("rz_code")),  # 实测两种类型
            "status": to_int(d.get("status")),
            "is_lock": to_int(d.get("is_lock"), 0),
            "weither_regift": to_int(d.get("weither_regift"), 0),
            "weither_resale": to_int(d.get("weither_resale"), 0),
            "can_compose": to_int(d.get("can_compose"), 0),
            "price": dec(d.get("price"), 0),
            "min_price": dec(d.get("min_price"), 0),
            "today_volume": to_int(d.get("today_volume"), 0),
            "createtime": to_unix(d.get("createtime"), 0),
        })

    # (2) myCollectionList：我的藏品列表（collection_id 才是 product_id，§3 B5）
    for r in rows_of(m, "myCollectionList", "data"):
        code, num = collection_code_split(r.get("collection_code"))
        put(**{
            **base,
            "id": to_int(r.get("id")),
            "product_id": to_int(r.get("collection_id")),
            # 藏品名/图源站直取（补列）：源站 8 条为「赛博铁牛/青川山水/赛博之神…」，
            # 与 products.name（「赛博铁牛盲盒」）不同，必须存原值
            "name": clean_str(r.get("name"), ""),
            "listimg": clean_str(r.get("listimg"), ""),
            "main_image": clean_str(r.get("main_image"), ""),
            "collection_code": code,
            "collection_code_num": num,
            "status": to_int(r.get("status")),
            "has_sold": to_int(r.get("has_sold"), 0),
            "count": to_int(r.get("count"), 0),
            "price": dec(r.get("price"), 0),
            "flux": to_int(r.get("flux"), 0),
            "total_num": to_int(r.get("total_num"), 0),
            "createtime": to_unix(r.get("createtime"), 0),
        })

    # (3) userCollectionList：以 user_collection_id 为实例 ID（见函数 docstring）
    for r in dig(m, "userCollectionList", "data", "user_collection_list", default=[]) or []:
        code, num = collection_code_split(r.get("collection_code"))
        put(**{
            **base,
            "id": to_int(r.get("user_collection_id")),
            # 该接口无 product_id，源站仅有 name；按名称无法可靠反查发行主体。
            # 写 None（→ NULL）而非 0：0 是源站哨兵值，不能拿来冒充「未提供」
            "product_id": None,
            "name": clean_str(r.get("name"), ""),
            "listimg": clean_str(r.get("listimg"), ""),
            "main_image": clean_str(r.get("main_image"), ""),
            "collection_code": code,
            "collection_code_num": num,
            "count": to_int(r.get("count"), 0),
            "price": dec(r.get("price"), 0),
            "total_num": to_int(r.get("total_num"), 0),
        })

    # (4) marketDetail.user_collection：挂单对应的藏品实例（数值编号体系）
    uc = dig(m, "marketDetail", "data", "user_collection", default={}) or {}
    if uc.get("id"):
        code, num = collection_code_split(uc.get("collection_code"))
        put(**{
            **base,
            "id": to_int(uc.get("id")),
            "product_id": to_int(dig(m, "marketDetail", "data", "goods_id")),
            "collection_code": code,
            "collection_code_num": num,  # 实测 387750
            "user_hash": clean_str(uc.get("user_hash"), ""),
            "user_hash_text": clean_str(uc.get("user_hash_text"), ""),
            "rz_code": clean_str(uc.get("rz_code")),  # 实测数字 238166
            "zuzhao_info_id": to_int(uc.get("zuzhao_info_id")),  # 实测 null → NULL
            "task_id": clean_str(uc.get("task_id"), ""),
        })

    # (5) blindBoxMyBox：盲盒实例（product_id=102 属商城域，user_collection_id=55012）
    bb = dig(m, "blindBoxMyBox", "data", default={}) or {}
    if bb.get("user_collection_id"):
        put(**{
            **base,
            "id": to_int(bb.get("user_collection_id")),
            "product_id": to_int(bb.get("product_id")),
            "blind_box_id": to_int(bb.get("id")),  # 所属盲盒实例
            "collection_code": None,
            "collection_code_num": None,
        })

    # (6) blindBoxResultOne：单条开盒结果（§8 #15）
    br = dig(m, "blindBoxResultOne", "data", default={}) or {}
    if br.get("id"):
        code, num = collection_code_split(br.get("collection_code"))
        put(**{
            **base,
            "id": to_int(br.get("id")),
            # 该接口无 product_id → None（→ NULL），0 是源站哨兵值不可冒用
            "product_id": None,
            "collection_code": code,
            "collection_code_num": num,
        })
    return rows


def map_user_blind_box_records(m) -> list[dict]:
    """B5b user_blind_box_records ← blindBoxOpenRecord（/box/blind_box/openlog）

    【补建说明】该快照此前在 seed.py 的 SKIP_MOCKS 里被跳过（理由「无独立表承载」），
    导致开盒记录页恒只能取到 user_collections 中 blind_box_id 非空的 1 行，
    而源站实测 5 条。开盒记录是历史流水事件，与 user_collections（当前持有状态）
    语义不同、不可互相派生，故补建表并灌库。

    字段映射全部为源站直取，不做推断：
      - user_id：源站按当前登录用户返回 → 取 LOGIN_USER_ID
      - product_id / blind_box_id：源站只给**名字**不给 ID，
        按 name / box_name 反查 products.name 得到；查不到留 NULL 并存 _raw，
        不用 0 冒充（0 在源站是合法哨兵值）
      - rarity_icon：源站本快照中即等于 listimg，原样保留不臆造
    """
    rows = []
    seen = set()

    def put(**kw):
        key = kw.get("id")
        if key is None or key in seen:
            return
        seen.add(key)
        rows.append(kw)

    # 名字 → id 的反查表（marketGoodsList 顶层是分页对象，产品名在 product 段，
    # 由 _product_name_index 单独处理，不在此遍历）
    name_to_id = _product_name_index(m)

    now = 1792347925
    for r in rows_of(m, "blindBoxOpenRecord") or []:
        name = clean_str(r.get("name"), "")
        box_name = clean_str(r.get("box_name"), "")
        pid = name_to_id.get(name)
        put(
            id=to_int(r.get("id")),
            user_id=LOGIN_USER_ID,
            product_id=pid,
            product_id_raw=None if pid else (name or None),
            blind_box_id=name_to_id.get(box_name),
            listimg=clean_str(r.get("listimg"), ""),
            name=name,
            collection_code=clean_str(r.get("collection_code"), ""),
            rarity_icon=clean_str(r.get("rarity_icon"), ""),
            box_name=box_name,
            createtime=to_unix(r.get("createtime")),
            created_at=now,
            updated_at=now,
        )
    return rows


def _product_name_index(m) -> dict:
    """products 的 name → id 反查索引（含盲盒名）。

    遍历所有含产品列表的 mock，收集 {id, name} 对。
    仅用于「源站只给名字不给 ID」的反向补全，命中不到则留 NULL。
    """
    idx = {}
    for key in ("marketList", "crystalList", "shopList", "activeSelectedList"):
        for r in rows_of(m, key) or []:
            rid, rname = to_int(r.get("id")), clean_str(r.get("name"), "")
            if rid and rname:
                idx.setdefault(rname, rid)
    # 系列商品列表的 product 段
    prod = dig(m, "marketGoodsList", "product", default={}) or {}
    if prod.get("id") and prod.get("name"):
        idx.setdefault(clean_str(prod.get("name"), ""), to_int(prod.get("id")))
    return idx
