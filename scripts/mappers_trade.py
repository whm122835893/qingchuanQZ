#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""mappers_trade.py — C1 市场挂单 / C2 买单订单
源 mock：marketDetail / marketGoodsList / consignList / myConsignment / orderList / orderDetail

映射依据：DATABASE.md §3 C1~C2；裁决 A（collection_code 错位值）/ 裁决 B（income_type）
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

def _listing_base():
    """market_listings 行模板：未出现的列一律取schema DEFAULT，不臆造。

    ⚠ 关联列的「缺失」必须写 None（→ NULL），**不能写 0**：
    0是源站的合法哨兵值（=未成交），若用 0 表示「本mock 没这个字段」，
    归一化层会把它当成真实观测值写进 xxx_raw 列，留下一条伪造的源站痕迹。
    依据 DATABASE.md §7.1.4：NULL 表示「源站确未提供」，_raw 只记真实观测到的原值。
    """
    return {
        "series_id": None, "collection_id": None,
        "sale_user_nickname": "", "buy_user_id": None,
        "min_price": 0, "income_type": None, "income_type_raw": None,
        "pay_way": "", "order_sn": None,
        "sale_time": None,
        "rush_status": 0,
        "pay_platform_service_rate": 0, "platform_service_price": 0,
        "creator_service_price": 0, "real_income": 0,
        "buy_version": 0, "is_deleted": 0, "pay_text": 0,
        "img": "", "name_ext": "",
    }


def map_market_listings(m, collection_by_code: dict | None = None) -> list[dict]:
    """C1 market_listings ← marketDetail / marketGoodsList / consignList / myConsignment。

    §3 C1 合并依据：consignList 的 id:7001/7002 与 myConsignment 的 7001/7002/7003
    **ID 空间完全一致**，marketDetail 亦含 sale_user_id —— 三者是**同一实体的不同视图**
    （market 全部 vs sale_user_id=当前用户）。故按 id 合并去重。

    裁决 A（§6.1）：consignList 的 collection_code 实测为 "226"/"225"，
    等于同记录 goods_id，**根本不是藏品编号**（语义错位）。
    但 schema 中 market_listings **没有** collection_code / collection_code_raw /
    collection_code_num 任一列（藏品编号仅在 orders / user_collections /
    collection_flow_records / entrust_orders 落库），故本表一律不写编号，
    避免臆造列或污染语义。真正的藏品编号通过 collection_id 关联
    user_collections.collection_code 取。
    """
    rows: dict[int, dict] = {}

    def put(rid, **kw):
        if rid is None:
            return
        row = rows.setdefault(rid, {**_listing_base(), "id": rid})
        for k, v in kw.items():
            if v is None or v == "":
                continue  # 空值不覆盖已有数据
            row[k] = v

    # (1) marketDetail：单条挂单详情，字段最全
    d = dig(m, "marketDetail", "data", default={}) or {}
    if d.get("id"):
        # 挂单引用的藏品实例：marketDetail 直接给出 sale_user_collection_id（权威）
        put(
            to_int(d.get("id")),
            product_id=to_int(d.get("goods_id")),
            series_id=to_int(d.get("series_id")),
            collection_id=to_int(d.get("sale_user_collection_id")),
            sale_user_id=to_int(d.get("sale_user_id")),
            sale_user_nickname=d.get("sale_user_nickname") or "",
            # 实测 0 = 未成交，是**真实源站观测值**，必须留原值：
            # 归一化层会把它转成 buy_user_id=NULL + buy_user_id_raw='0'（方案X）
            buy_user_id=to_int(d.get("buy_user_id"), 0),
            name=d.get("goods_name") or "",
            cover_image=d.get("goods_cover_image") or "",
            series_name=d.get("series_name") or "",
            price=dec(d.get("price"), 0),  # 实测数字 15
            # v1.2：两列均 DEFAULT NULL，源站未给写 NULL（orders.order_status 0=已完成
            # 是合法枚举值，不在此列，故这里不兜 0）
            status=to_int(d.get("status")),
            goods_type=to_int(d.get("goods_type")),
            # 裁决 B：字符串 "huifu" → 单值 "huifu" + raw "huifu"
            **{"income_type": income_type(d.get("income_type"))[0],
               "income_type_raw": income_type(d.get("income_type"))[1]},
            order_sn=d.get("order_sn"),
            sale_time=to_int(d.get("sale_time")),  # 实测 null → NULL
            listing_time=to_unix(d.get("createtime"), 0),
            update_time=to_unix(d.get("updatetime"), 0),
            rush_status=to_int(d.get("rush_status"), 0),
            pay_platform_service_rate=dec(d.get("pay_platform_service_rate"), 0),
            platform_service_price=dec(d.get("platform_service_price"), 0),
            creator_service_price=dec(d.get("creator_service_price"), 0),
            real_income=dec(d.get("real_income"), 0),
            buy_version=to_int(d.get("buy_version"), 0),
            is_deleted=to_int(d.get("deleted"), 0),
            pay_text=to_int(d.get("pay_text"), 0),
            img=d.get("img") or "",
            name_ext=d.get("name") or "",  # 实测空串
        )

    # (2) marketGoodsList.data.data[]：专辑在售挂单（30 条）
    mgp_id = to_int(dig(m, "marketGoodsList", "data", "product", "id"))
    mgp_name = dig(m, "marketGoodsList", "data", "product", "name")
    for r in rows_of(m, "marketGoodsList", "data"):
        it, itr = income_type(r.get("income_type"))  # 裁决 B：数组取首元素 + 原值留痕
        put(
            to_int(r.get("id")),
            product_id=mgp_id,  # 专辑维度：商品来自外层 product
            name=r.get("name") or mgp_name or "",
            cover_image=r.get("listimg") or "",
            min_price=dec(r.get("min_price"), 0),
            # v1.2：market_listings.status DEFAULT NULL，源站未给写 NULL
            status=to_int(r.get("status")),
            income_type=it,
            income_type_raw=itr,
            listing_time=to_unix(r.get("createtime"), 0),
        )

    # (3) consignList：市场挂单（含 goods_id / 错位 collection_code）
    for r in rows_of(m, "consignList", "data"):
        gid = to_int(r.get("goods_id"))
        # 裁决 A（§6.1）：consignList 的 collection_code 实测为 "226"/"225"，
        # 与 goods_id 同值 → 语义错位。schema 中 market_listings 无
        # collection_code / collection_code_raw 列（编号仅存在于 orders 表），
        # 故此处不落库，避免污染业务编号语义。
        put(
            to_int(r.get("id")),
            product_id=gid,
            name=r.get("goods_name") or "",
            cover_image=r.get("listimg") or "",
            price=dec(r.get("price"), 0),
            # v1.2：market_listings.status DEFAULT NULL，源站未给写 NULL
            status=to_int(r.get("status")),
            listing_time=to_unix(r.get("createtime"), 0),
        )

    # (4) myConsignment：我的寄售（提供 pay_way）
    for r in rows_of(m, "myConsignment", "data"):
        put(
            to_int(r.get("id")),
            # 该接口无 goods_id：写 None（→ NULL），不用 0 冒充源站观测值
            product_id=None,
            name=r.get("goods_name") or "",
            cover_image=r.get("listimg") or "",
            # v1.2：market_listings.status DEFAULT NULL，源站未给写 NULL
            status=to_int(r.get("status")),
            price=dec(r.get("price"), 0),
            pay_way=r.get("pay_way") or "",
            listing_time=to_unix(r.get("createtime"), 0),
            update_time=to_unix(r.get("updatetime"), 0),
        )
    return list(rows.values())


def map_orders(m) -> list[dict]:
    """C2 orders ← orderList.json + orderDetail.json（同一订单实体的两个视图）。

    orderList 的 9001~9004 与 orderDetail 的 9001 是**同一订单**（ID 空间一致），
    按 id 合并：orderList 提供列表字段，orderDetail 补齐金额明细字段。

    裁决 A（§6.1）：orderList[].collection_code 实测 "226"，等于同记录 goods_id，
    **根本不是藏品编号**（语义错位）。处理：
      - collection_code_raw = "226"（原值保留，可追溯源站异常）
      - collection_code = 从 goods_id 派生的规范值（"226" 对应商品 226）
      - 权威归属仍是 product_id（FK 已指向 products.id）
    裁决 B：income_type 字符串 "huifu" → 单值 + raw。
    裁决 D：order_status 用买单域 {0,1,2,3,4}，**不臆造 7**。
    """
    rows: dict[int, dict] = {}

    def put(rid, **kw):
        if rid is None:
            return
        row = rows.setdefault(rid, {"id": rid})
        for k, v in kw.items():
            if v is None:
                continue
            row[k] = v

    def base_fields(r, order_type, order_status, has_num_field):
        gid = to_int(r.get("goods_id"))
        raw_code = r.get("collection_code")
        code, num = collection_code_split(raw_code)
        misplaced = code is None and num is not None and num == gid
        it, itr = income_type(r.get("income_type"))
        out = {
            "order_sn": r.get("order_sn"),
            "order_status": order_status,
            "order_type": order_type,
            "product_id": gid,
            "product_name": r.get("goods_name") or "",
            "cover_image": r.get("listimg") or "",
            "number": to_int(r.get("number"), 0),
            "sale_number": to_int(r.get("sale_number"), 0),
            "price": dec(r.get("price"), 0),
            "total_price": dec(r.get("total_price"), 0),
            "order_time": to_unix(r.get("createtime"), 0),
            "update_time": to_unix(r.get("updatetime"), 0),
            "user_hash_text": r.get("user_hash_text") or "",
            "income_type": it,
            "income_type_raw": itr,
        }
        if has_num_field:
            out["num"] = to_int(r.get("num"), 0)
        if misplaced:
            # 裁决 A 双写：原值留痕 + 派生值
            out["collection_code_raw"] = str(raw_code)
            out["collection_code"] = str(gid) if gid else None
        else:
            out["collection_code_raw"] = None
            out["collection_code"] = code
        return out

    for r in rows_of(m, "orderList", "data"):
        put(to_int(r.get("id")), **base_fields(r, 1, to_int(r.get("order_status"), 0), False))

    d = dig(m, "orderDetail", "data", default={}) or {}
    if d.get("id"):
        f = base_fields(d, 1, to_int(d.get("order_status"), 0), True)
        f.update(
            {
                "num": to_int(d.get("num"), 0),
                "order_amount": dec(d.get("order_amount"), 0),
                "discount_amount": dec(d.get("discount_amount"), 0),
                "pay_price": dec(d.get("pay_price"), 0),
                "pay_way": d.get("pay_way") or "",
                "pay_name": d.get("pay_name") or "",
                # 实测 1；裁决 C：藏品域枚举；v1.2 DEFAULT NULL
                "goods_type": to_int(d.get("goods_type")),
                "remark": d.get("remark") or "",
                "card": dumps_json(d.get("card")),  # 实测 []，保留空数组事实
            }
        )
        put(to_int(d.get("id")), **f)

    out = []
    for row in rows.values():
        row.setdefault("user_id", LOGIN_USER_ID)
        out.append(row)
    return out
