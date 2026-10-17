#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""mappers_product.py — B2 products（商品主数据，多源合并）
源 mock：productDetail / marketDetail / myCollectionDetail / sellInfo / marketGoodsList /
        noticeDetails / marketList / market_market_getMarketList / marketCapRanking / leaderboard

映射依据：DATABASE.md §3 B2；清洗依据 §6.1/§6.4/§6.6
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

_PRODUCT_ORDER = [
    "productDetail",     # 富：goods_type/collectionlist/introduce/publisher/series
    "marketDetail",      # 富：3d_url_*/purchase_information/release_time
    "myCollectionDetail",  # 中：weither_*/can_compose/series
    "sellInfo",          # 少：batch
    "marketGoodsList",   # 中：collection_level/introduce_image
    "marketList",
    "market_market_getMarketList",
    "marketCapRanking",
    "leaderboard",
    "noticeDetails",
]


def _merge_product(store: dict, pid: int, fields: dict):
    """按 products.id 合并商品字段：已有非空值不被后续源覆盖。"""
    if pid is None:
        return
    cur = store.setdefault(pid, {"id": pid})
    for k, v in fields.items():
        if v is None:
            continue
        if isinstance(v, str) and v == "":
            continue
        if cur.get(k) in (None, "", 0) and not (isinstance(v, str) and v == ""):
            cur[k] = v


def _collect_products(m) -> dict:
    """遍历各 mock 抽取 products 记录，返回 {id: row}。"""
    store: dict[int, dict] = {}

    # 1) productDetail：字段最全，且含 introduce（富文本）与 collectionlist
    pd = dig(m, "productDetail", "data", default={}) or {}
    pp = pd.get("product", {}) or {}
    if pp.get("id"):
        _merge_product(
            store,
            to_int(pp.get("id")),
            {
                "name": clean_str(pp.get("name"), ""),
                "goods_type": to_int(pp.get("goods_type")),
                "listimg": clean_str(pp.get("listimg"), ""),
                "main_image": clean_str(pp.get("main_image"), ""),
                "total_num": to_int(pp.get("total_num"), 0),
                "flux": to_int(pp.get("flux"), 0),
                "sale_total_num": to_int(pp.get("sale_total_num"), 0),
                "price": dec(pd.get("price"), 0),  # 发行价在 data.price 而非 product.price
                "introduce": clean_str(pd.get("introduce")),
                "publisher_name": dig(pp, "publisher", "name"),
                "series_id": to_int(dig(pp, "series", "id")),
                "is_like": to_int(pp.get("is_like"), 0),
                "is_sub": to_int(pp.get("is_sub"), 0),
                "weither_regift": to_int(pp.get("weither_regift"), 0),
                "weither_resale": to_int(pp.get("weither_resale"), 0),
                "can_compose": to_int(pp.get("can_compose"), 0),
                "is_lock": to_int(pp.get("is_lock"), 0),
                "is_img_diff": to_int(pp.get("is_img_diff"), 0),
                "compound_num": to_int(pp.get("compound_num"), 0),
                "release_time": to_unix(pp.get("release_time"), 0),
                "types": to_int(pp.get("types"), 0),
            },
        )

    # 2) marketDetail.data.product：含 3d_url_* / purchase_information
    md = dig(m, "marketDetail", "data", "product", default={}) or {}
    if md.get("id"):
        _merge_product(
            store,
            to_int(md.get("id")),
            {
                "name": clean_str(md.get("name"), ""),
                "series_id": to_int(md.get("series_id")),
                "listimg": clean_str(md.get("listimg"), ""),
                "main_image": clean_str(md.get("main_image"), ""),
                "introduce_image": clean_str(md.get("introduce_image"), ""),
                "total_num": to_int(md.get("total_num"), 0),
                "flux": to_int(md.get("flux"), 0),
                "sale_total_num": to_int(md.get("sale_total_num"), 0),
                "price": dec(md.get("price"), 0),
                "issuer_id": to_int(md.get("issuer_id"), 0),
                "creator_id": to_int(md.get("creator_id"), 0),
                "types": to_int(md.get("types"), 0),
                "compound_num": to_int(md.get("compound_num"), 0),
                "release_time": to_unix(md.get("release_time"), 0),
                "is_img_diff": to_int(md.get("is_img_diff"), 0),
                "is_like": to_int(md.get("is_like"), 0),
                "publisher_name": dig(md, "publisher", "name"),
                "publisher_logo": dig(md, "publisher", "company_logo"),
                # 源字段名以数字开头，DB 列名改为 url_3d_type / url_3d（§3 B2）
                "url_3d_type": clean_str(md.get("3d_url_type"), ""),
                "url_3d": clean_str(md.get("3d_url"), ""),
                # §6.6：purchase_information 是一串空格 → NULL
                "purchase_information": empty_str_to_none(md.get("purchase_information")),
            },
        )

    # 3) myCollectionDetail.data.product（我的藏品详情内嵌）
    mcd = dig(m, "myCollectionDetail", "data", "product", default={}) or {}
    if mcd.get("id"):
        _merge_product(
            store,
            to_int(mcd.get("id")),
            {
                "name": clean_str(mcd.get("name"), ""),
                "goods_type": to_int(mcd.get("goods_type")),
                "listimg": clean_str(mcd.get("listimg"), ""),
                "main_image": clean_str(mcd.get("main_image"), ""),
                "total_num": to_int(mcd.get("total_num"), 0),
                "flux": to_int(mcd.get("flux"), 0),
                "sale_total_num": to_int(mcd.get("sale_total_num"), 0),
                "series_id": to_int(dig(mcd, "series", "id")),
                "publisher_name": dig(mcd, "publisher", "name"),
                "is_lock": to_int(mcd.get("is_lock"), 0),
                "weither_regift": to_int(mcd.get("weither_regift"), 0),
                "weither_resale": to_int(mcd.get("weither_resale"), 0),
                "can_compose": to_int(mcd.get("can_compose"), 0),
            },
        )

    # 4) sellInfo.data.product：唯一提供 batch 的源
    sp = dig(m, "sellInfo", "data", "product", default={}) or {}
    if sp.get("id"):
        _merge_product(
            store,
            to_int(sp.get("id")),
            {
                "name": clean_str(sp.get("name"), ""),
                "listimg": clean_str(sp.get("listimg"), ""),
                "main_image": clean_str(sp.get("main_image"), ""),
                "batch": clean_str(sp.get("batch"), ""),  # 实测 "2024"
                "publisher_name": clean_str(sp.get("publisher"), ""),
            },
        )

    # 5) marketGoodsList.data.product：专辑维度商品
    mgp = dig(m, "marketGoodsList", "data", "product", default={}) or {}
    if mgp.get("id"):
        _merge_product(
            store,
            to_int(mgp.get("id")),
            {
                "name": clean_str(mgp.get("name"), ""),
                "total_num": to_int(mgp.get("total_num"), 0),
                "flux": to_int(mgp.get("flux"), 0),
                "is_like": to_int(mgp.get("is_like"), 0),
                # §6.6：collection_level 实测空串，保留 '' 不转 NULL
                "collection_level": clean_str(mgp.get("collection_level"), ""),
                "listimg": clean_str(mgp.get("listimg"), ""),
                "introduce_image": clean_str(mgp.get("introduce_image"), ""),
            },
        )

    # 6) noticeDetails.collection[]：公告相关藏品（仅 id/name/listimg/price）
    for c in dig(m, "noticeDetails", "data", "collection", default=[]) or []:
        if c.get("id"):
            _merge_product(
                store,
                to_int(c.get("id")),
                {
                    "name": clean_str(c.get("name"), ""),
                    "listimg": clean_str(c.get("listimg"), ""),
                    "price": dec(c.get("price"), 0),
                },
            )

    # 7) marketList / market_market_getMarketList / marketCapRanking / leaderboard
    for key in ("marketList", "market_market_getMarketList"):
        for r in rows_of(m, key):
            if r.get("id"):
                _merge_product(
                    store,
                    to_int(r.get("id")),
                    {
                        "name": clean_str(r.get("name"), ""),
                        "series_id": to_int(r.get("series_id")),
                        "listimg": clean_str(r.get("listimg"), ""),
                        "total_num": to_int(r.get("total_num"), 0),
                        "flux": to_int(r.get("flux"), 0),
                        # marketList / getMarketList 实测携带 goods_type（藏品域 1/2），
                        # 是列表类商品唯一的类型来源；v1.2 DEFAULT NULL，缺值写 NULL
                        "goods_type": to_int(r.get("goods_type")),
                    },
                )
    for r in rows_of(m, "marketCapRanking", "list"):
        if r.get("id"):
            _merge_product(
                store,
                to_int(r.get("id")),
                {
                    "name": clean_str(r.get("name"), ""),
                    "listimg": clean_str(r.get("listimg"), ""),
                    "total_num": to_int(r.get("total_num"), 0),
                    "flux": to_int(r.get("flux"), 0),
                },
            )
    for r in rows_of(m, "leaderboard"):
        if r.get("id"):
            _merge_product(
                store,
                to_int(r.get("id")),
                {
                    "name": clean_str(r.get("name"), ""),
                    "listimg": clean_str(r.get("listimg"), ""),
                    "total_num": to_int(r.get("total_num"), 0),
                    "flux": to_int(r.get("flux"), 0),
                    "price": dec(r.get("min_price"), 0),
                    "is_like": to_int(r.get("is_like"), 0),
                },
            )

    # 8) entrustList/myCollectionList 用 goods_name / collection_id 关联，
    #    但源站不提供完整商品对象，故不据此创建 products 行（避免臆造发行主体）。
    return store


def _apply_empty_string_columns(m, store: dict):
    """补齐「源站实测为空串」的3 个列（§6.6 的例外分支，必须显式落库）。

    `_merge_product` 按设计跳过空串（避免用空值覆盖已有真值），
    但 §6.6 明确区分两种「空」：
      - `collection_level: ""` / `introduce_image: ""` → **保留 ''**
        （语义为「有字段但未设置」，与 NULL「源站未提供」不同）
      - `purchase_information: "      "`（纯空格）→ **NULL**（语义为无内容）

    后果：若不在此处显式补齐，这 3 列会因「从未出现在 mapper 输出里」而
    完全不出现在 INSERT 列表中，schema 与 mapper 的双向校验会报缺口。
    """
    # 权威源：marketGoodsList.data.product（专辑维度商品，实测两列均为 ""）
    mgp = dig(m, "marketGoodsList", "data", "product", default={}) or {}
    pid = to_int(mgp.get("id"))
    if pid is not None and pid in store:
        # 空串是**有效观测值**，直接赋值，绕过 _merge_product 的空串跳过逻辑
        store[pid]["collection_level"] = clean_str(mgp.get("collection_level"), "")
        store[pid]["introduce_image"] = clean_str(mgp.get("introduce_image"), "")
    # 权威源：marketDetail.data.product（purchase_information 实测为一串空格）
    md = dig(m, "marketDetail", "data", "product", default={}) or {}
    mid = to_int(md.get("id"))
    if mid is not None and mid in store:
        store[mid]["purchase_information"] = empty_str_to_none(
            md.get("purchase_information")
        )
        store[mid]["introduce_image"] = clean_str(md.get("introduce_image"), "")


def map_products(m) -> list[dict]:
    """B2 products ← 8 类 mock 合并（见 _collect_products）。

    注意：products 的权威来源必须先于所有引用表灌库，否则 FK 失败。
    """
    store = _collect_products(m)
    _apply_empty_string_columns(m, store)
    return list(store.values())
