#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""mappers_flow.py — B6 流转记录 / B7 成交价轨迹 / F1 行情统计

从 mappers_collection.py 拆出（单文件行数门禁），映射逻辑与拆分前逐字一致。
源 mock：flowDoc / sellInfo / giftRecord / marketList / marketCapRanking / leaderboard
映射依据：DATABASE.md §3 B6~B7、F1
"""
from __future__ import annotations

from clean import (
    LOGIN_USER_ID,
    collection_code_split,
    clean_str,
    dec,
    dig,
    rows_of,
    str_col,
    to_int,
    to_unix,
)


def map_collection_flow_records(m) -> list[dict]:
    """B6 collection_flow_records ← flowDoc.json。

    §3 B6：createtime 实测字符串 "1758788129" 属 unix 秒 → CAST。
    collection_code 存 "QC-2024-0031" 断链格式，**不建 FK**（源站只给 code 不给 id）。
    """
    rows = []
    for r in rows_of(m, "flowDoc"):
        rows.append(
            {
                "id": to_int(r.get("id")),
                "collection_code": clean_str(r.get("collection_code"), ""),
                "user_id": LOGIN_USER_ID,
                "nickname": clean_str(r.get("nickname"), ""),
                "flow_time": to_unix(r.get("createtime"), 0),
                # §10 遗留项：source_type 与 id 严格同步，疑为递增 ID，存 TINYINT 不建枚举约束
                "source_type": to_int(r.get("source_type"), 0),
            }
        )
    return rows


def map_collection_price_ticks(m, seq_start: int = 1) -> list[dict]:
    """B7 collection_price_ticks ← sellInfo.data.list[]（sale_type=1）+ giftRecord（sale_type=2）。

    §3 B7：两接口同构但语义不同，用设计新增的 sale_type 区分。
    源站无 id → 本表 id 由调用方分配的自增值填充。
    tick_time 实测 "2026-10-15 14:22:10" 日期串 → VARCHAR，不 CAST（§6.5）。
    giftRecord 无 product_id（仅 collection_code），product_id 填 0 由 FK 校验暴露为孤儿。
    """
    rows = []
    sid = seq_start
    pid = to_int(dig(m, "sellInfo", "data", "id"))
    for r in rows_of(m, "sellInfo", "list"):
        code, _num = collection_code_split(r.get("collection_code"))
        rows.append(
            {
                "id": sid,  # 设计新增：源站无 id
                "product_id": pid,
                "collection_code": code,
                "price": dec(r.get("price"), 0),
                "num": to_int(r.get("num"), 0),
                "total_num": to_int(r.get("total_num"), 0),
                "tick_time": str_col(r.get("time"), ""),
                "sale_type": 1,  # 市场成交
            }
        )
        sid += 1
    for r in rows_of(m, "giftRecord"):
        code, _num = collection_code_split(r.get("collection_code"))
        rows.append(
            {
                "id": sid,
                # giftRecord 无商品 ID → None（→ NULL），0 是源站哨兵值不可冒用
                "product_id": None,
                "collection_code": code,
                "price": dec(r.get("price"), 0),
                "num": 0,  # 源站无 num
                "total_num": to_int(r.get("total_num"), 0),
                "tick_time": str_col(r.get("time"), ""),
                "sale_type": 2,  # 转赠
            }
        )
        sid += 1
    return rows


def map_product_market_stats(m, seq_start: int = 1) -> list[dict]:
    """F1 product_market_stats ← marketList + market_market_getMarketList + marketCapRanking。

    §6.6 / §3 F1：marketList(6条) 与 market_market_getMarketList(15条) **内容不同**，
    属不同时间点快照，不可合并；此处按 stat_date 分两期入库（设计新增列）。
    stat_date 取各 mock 自带的 time 字段日期（源站事实），无 time 时留 NULL。
    marketCapRanking 的 info.update_time 实测 "2026-10-16" 亦可作快照日。
    """
    import time as _t

    def snap_date(sec):
        if not sec:
            return None
        try:
            return _t.strftime("%Y-%m-%d", _t.localtime(to_int(sec)))
        except (ValueError, OverflowError, OSError):
            return None

    rows = []
    sid = seq_start

    def emit(r, series_key, stat_date, min_price_field="min_price"):
        nonlocal sid
        pid = to_int(r.get("id"))
        if pid is None:
            return
        rows.append(
            {
                "id": sid,  # 设计新增：源站无 id
                "product_id": pid,
                "name": clean_str(r.get("name"), ""),
                "listimg": clean_str(r.get("listimg"), ""),
                # series_key 为 None（marketCapRanking 无该字段）时写 None（→ NULL），
                # 不用 0 冒充源站观测值；否则保留源站真实值（含 0 哨兵）
                "series_id": to_int(r.get(series_key)) if series_key else None,
                # 实测字符串 "2" → int；裁决 C：藏品域枚举 1/2。
                # v1.2 DEFAULT NULL：marketCapRanking 源站不带此字段 → NULL
                "goods_type": to_int(r.get("goods_type")),
                "total_num": to_int(r.get("total_num"), 0),
                "flux": to_int(r.get("flux"), 0),  # 实测字符串 "550053"
                "min_price": dec(r.get(min_price_field), 0),
                "deal_num": to_int(r.get("deal_num"), 0),
                "market_value": to_int(r.get("market_value"), 0),
                "market_fluctuate": dec(r.get("market_fluctuate"), 0),
                "market_fluctuate_new": dec(r.get("market_fluctuate_new"), 0),
                "reprice_limit": dec(r.get("reprice_limit"), 0),
                "is_out": to_int(r.get("is_out"), 0),
                "flag": to_int(r.get("flag"), 0),
                "select_status": to_int(r.get("select_status"), 0),
                # §6.6：collection_level 空串保留 ''，不转 NULL
                "collection_level": clean_str(r.get("collection_level"), ""),
                "openresale_time": to_unix(r.get("openresale_time"), 0),
                "new_time": to_unix(r.get("new_time"), 0),
                "stat_date": stat_date,
            }
        )
        sid += 1

    d1 = rows_of(m, "marketList")
    for r in d1 or []:
        emit(r, "series_id", snap_date(dig(m, "marketList", "time")))

    d2 = rows_of(m, "market_market_getMarketList")
    for r in d2 or []:
        emit(r, "series_id", snap_date(dig(m, "market_market_getMarketList", "time")))

    # marketCapRanking：自有 info.update_time
    mc = dig(m, "marketCapRanking", "data", default={}) or {}
    for r in mc.get("list", []) or []:
        emit(r, None, mc.get("info", {}).get("update_time"))
    return rows
