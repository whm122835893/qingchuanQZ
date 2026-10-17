#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""mappers_growth.py — F2 榜单快照 / F3 返佣邀请 / F4 转赠记录
源 mock：marketCapRanking / getMarketList / rebateInvitation / regiftRecord

映射依据：DATABASE.md §3 F2~F4
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

def map_rank_snapshots(m, snapshot_time: int = 0,
                       product_by_name: dict | None = None) -> list[dict]:
    """F2 rank_snapshots ← 五个榜单（leaderboardUser / masterRank / userBuyRank /
    drawLeaderboard / rebateLeaderboard）合并为单表 + rank_type 维度。

    §3 F2：五榜结构同构（排名 + 昵称/头像 + 度量值），拆 5 表会产生大量重复列。
    度量字段映射（依据 §4 E-RANK-TYPE）：
        user_buy    ← leaderboardUser.yao_count
        master      ← masterRank.num
        product_buy ← userBuyRank.total_price（并取 product_id / count）
        draw        ← drawLeaderboard.nums
        rebate      ← rebateLeaderboard.com_price
    user_id 为设计关联：榜单只给昵称不给用户 ID，按登录态归属。
    """
    product_by_name = product_by_name or {}
    rows = []
    sid = 1

    def emit(rank_type, nickname, avatar, score, **kw):
        nonlocal sid
        rows.append(
            {
                "id": sid,  # 设计新增：源站无 id
                "rank_type": rank_type,
                "user_id": LOGIN_USER_ID,
                # 榜单类接口（leaderboardUser/masterRank/drawLeaderboard）不返回
                # 商品 ID → None（→ NULL）。0 是源站哨兵值，不可拿来冒充「未提供」
                "product_id": kw.pop("product_id", None),
                "nickname": nickname,
                "avatar": avatar,
                "score": dec(score, 0),
                "secondary_score": dec(kw.pop("secondary_score", None), 0),
                "count": to_int(kw.pop("count", None), 0),
                "event_time": str_col(kw.pop("event_time", None), ""),
                "payload": dumps_json(kw.pop("payload", None)) if kw.get("payload") else None,
                "snapshot_time": snapshot_time,  # 设计新增
            }
        )
        sid += 1

    for r in rows_of(m, "leaderboardUser", "list"):
        emit(
            "user_buy",
            clean_str(r.get("nickname"), ""),
            clean_str(r.get("avatar"), ""),
            r.get("yao_count"),  # 实测字符串 "386"
            secondary_score=r.get("buy_collection_total_price"),
        )
    for r in rows_of(m, "masterRank"):
        emit(
            "master",
            clean_str(r.get("nickname"), ""),
            clean_str(r.get("avatar"), ""),
            r.get("num"),
            event_time=r.get("createtime"),
            # 该榜特有字段：用户买入的商品名与封面（无对应列，入 payload 兜底）
            payload={
                "goods_name": r.get("goods_name"),
                "goods_cover_image": r.get("goods_cover_image"),
            },
        )
    for r in rows_of(m, "userBuyRank"):
        # §3 F2：product_buy 榜的 id 即商品 ID，可直接关联 products
        emit(
            "product_buy",
            "",  # 该榜只给商品名不给昵称
            "",
            r.get("total_price"),  # 实测 "128620.00"
            product_id=to_int(r.get("id"), 0),
            count=to_int(r.get("count"), 0),
            event_time=r.get("createtime"),
            payload={
                "goods_name": r.get("goods_name"),
                "goods_cover_image": r.get("goods_cover_image"),
                "num": to_int(r.get("num"), 0),
            },
        )
    for r in rows_of(m, "drawLeaderboard", "list"):
        emit(
            "draw",
            clean_str(r.get("nickname"), ""),
            clean_str(r.get("avatar"), ""),
            r.get("nums"),  # 实测数字 46
        )
    for r in rows_of(m, "rebateLeaderboard"):
        emit(
            "rebate",
            clean_str(r.get("nickname"), ""),
            "",  # 该榜无头像字段
            r.get("com_price"),  # 实测 "3286.40"
        )
    return rows


def map_rebate_invites(m) -> list[dict]:
    """F4 rebate_invites ← rebateInviteDetail.json。

    §3 F4：inviter_id 按登录态归属；invitee_id 源站**仅给 nickname 不给 ID**，
    如实填 NULL（不臆造被邀请人 ID），否则会产生虚假关联。
    jointime / first_transaction_time 实测为日期串 → VARCHAR。
    """
    rows = []
    for r in rows_of(m, "rebateInviteDetail"):
        rows.append(
            {
                "id": to_int(r.get("id")),
                "inviter_id": LOGIN_USER_ID,
                "invitee_id": None,  # 源站无被邀请人 ID，不臆造
                "nickname": clean_str(r.get("nickname"), ""),
                "join_time": str_col(r.get("jointime"), ""),
                "first_transaction_time": str_col(r.get("first_transaction_time"), ""),
                "user_transaction": dec(r.get("user_transaction"), 0),
                "month_transaction": dec(r.get("month_transaction"), 0),
            }
        )
    return rows


def map_regift_records(m) -> list[dict]:
    """F5 regift_records ← regiftRecord.json。

    §3 F5 / §6.5：back_time 实测 "1812061059386431" 是**雪花 ID 不是时间戳**，
    CAST 会得荒谬值，故用 VARCHAR 原样存（裁决：非标准时间形态一律不 CAST）。
    collection_code 实测 "PBCE/2000000000000001" 属链上凭证体系，
    前缀天然区分（§6.1 裁决 A）。collection_id 源站只给 code 不给实例 ID → NULL。
    """
    rows = []
    for r in rows_of(m, "regiftRecord"):
        code, _num = collection_code_split(r.get("collection_code"))
        rows.append(
            {
                "id": to_int(r.get("id")),
                "collection_id": None,  # 源站只给 collection_code，不给实例 ID
                "collection_code": code,
                "product_name": clean_str(r.get("goods_name"), ""),
                "cover_image": clean_str(r.get("goods_cover_image"), ""),
                "from_user_id": LOGIN_USER_ID,  # 源站给 from_user 昵称，按登录态归属
                "from_user_nickname": clean_str(r.get("from_user"), ""),
                # E-REGIFT-STATUS 1/2/3；v1.2 DEFAULT NULL，源站未给写 NULL
                "status": to_int(r.get("status")),
                "status_text": clean_str(r.get("status_text"), ""),
                "order_no": clean_str(r.get("order_no"), ""),
                "create_time_str": str_col(r.get("create_time"), ""),
                "back_time": str_col(r.get("back_time"), ""),  # 雪花 ID 原样
            }
        )
    return rows
