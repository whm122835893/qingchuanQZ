#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""mappers_lottery.py — D3 抽奖 / D4 签到
源 mock：lotteryRule / lotteryRecord / activityDraw / drawRecord / signInRule / signStatus

映射依据：DATABASE.md §3 D3~D4
"""
from __future__ import annotations

import re

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

def map_lottery_rounds(m, seq_start: int = 1) -> list[dict]:
    """D6 lottery_rounds ← lotteryInfo.json（rule 来自 lotteryRule.json）。

    §3 D6：prizeList/consume 为纯展示静态配置，无按 ID 查询需求 → 整组存 JSON
    （§10 遗留项：lottery_prizes 是否拆表 —— 当前无中奖明细，不预先建表）。
    """
    d = dig(m, "lotteryInfo", "data", default={}) or {}
    if not d:
        return []
    return [
        {
            "id": seq_start,  # 设计新增：源站无 id
            "end_time": to_unix(d.get("end_time"), 0),
            "prizes": dumps_json(d.get("prizeList")),
            "consume": dumps_json(d.get("consume")),
            "rule": dig(m, "lotteryRule", "data", "rule"),  # 富文本规则
        }
    ]


def map_user_lottery_records(m) -> list[dict]:
    """D7 user_lottery_records ← lotteryRecord.json。

    §3 D7：prize_kind 为设计新增（1=藏品 2=龙晶），
    依据 name 内嵌数量文本判定 —— 形如「龙晶 1200」判为 2（积分奖品）。
    """
    rows = []
    for r in rows_of(m, "lotteryRecord"):
        name = r.get("name") or ""
        # 高置信判定：名称以「龙晶」开头且尾部为纯数字 → 积分奖品
        is_crystal = bool(re.match(r"^龙晶\s+\d+$", name.strip()))
        rows.append(
            {
                "id": to_int(r.get("id")),
                "user_id": LOGIN_USER_ID,
                "prize_name": name,
                "cover_image": clean_str(r.get("listimg"), ""),
                "prize_kind": 2 if is_crystal else 1,
                "record_time": to_unix(r.get("create_time"), 0),
            }
        )
    return rows


def map_draw_codes(m) -> list[dict]:
    """D8 draw_codes ← activityDraw.json → data.code_list[] / win_code_list[]。

    §3 D8：code_type 为设计新增（1=抽签码 2=中签码），依据所属数组。
    create_time 实测 "2026-12-01 10:12:03" → VARCHAR。
    ⚠ 两个数组的 id 实测均为从 1 开始的独立序列（code_list:1-3 / win_code_list:1），
    直接用源 id 会主键冲突。故 win_code_list 段 id 加偏移避免碰撞（已在报告标注）。
    """
    rows = []
    d = dig(m, "activityDraw", "data", default={}) or {}
    max_id = 0
    for c in d.get("code_list", []) or []:
        cid = to_int(c.get("id"))
        max_id = max(max_id, cid or 0)
        rows.append(
            {
                "id": cid,
                "user_id": LOGIN_USER_ID,
                "code": clean_str(c.get("code"), ""),
                "code_type": 1,  # 抽签码
                "create_time_str": str_col(c.get("create_time"), ""),
            }
        )
    for c in d.get("win_code_list", []) or []:
        cid = to_int(c.get("id"))
        rows.append(
            {
                "id": (cid or 0) + max_id,  # 偏移避让源站独立序列的主键冲突
                "user_id": LOGIN_USER_ID,
                "code": clean_str(c.get("code"), ""),
                "code_type": 2,  # 中签码
                "create_time_str": str_col(c.get("create_time"), ""),
            }
        )
    return rows


def map_user_draw_records(m) -> list[dict]:
    """D9 user_draw_records ← activityRecord.json。

    §4 E-DRAW-STATUS：0=未中签/待定 1=已中签 2=未中签。
    draw_time 实测为字符串 → VARCHAR。
    """
    rows = []
    for r in rows_of(m, "activityRecord"):
        rows.append(
            {
                "id": to_int(r.get("id")),
                "user_id": LOGIN_USER_ID,
                "draw_sn": clean_str(r.get("draw_sn"), ""),
                "draw_time": str_col(r.get("draw_time"), ""),
                "status": to_int(r.get("status"), 0),
            }
        )
    return rows


def map_sign_reward_rules(m, seq_start: int = 1) -> list[dict]:
    """D10 sign_reward_rules ← signInfo.json → data.reward_list[]。

    §3 D10：源站无 id → 设计新增自增。sign_rule 为签到规则富文本。
    """
    rows = []
    d = dig(m, "signInfo", "data", default={}) or {}
    sid = seq_start
    for r in d.get("reward_list", []) or []:
        rows.append(
            {
                "id": sid,
                "day": to_int(r.get("day"), 0),
                "crystal": to_int(r.get("crystal"), 0),
                "sign_rule": d.get("sign_rule"),
            }
        )
        sid += 1
    return rows


def map_user_sign_status(m) -> list[dict]:
    """D11 user_sign_status ← signInfo.json → data（一人一签到，PK 即 user_id）。

    §10 遗留项：crystal_number 实为用户龙晶余额的四处冗余返回，
    权威位置应为 users，但 users 的 mock 无此字段，故暂承载于本表。
    sign_days[] 整组存 JSON。
    """
    d = dig(m, "signInfo", "data", default={}) or {}
    if not d:
        return []
    # signInfo.user_info.id 实测 3827，但该用户并非 user.json 的登录用户；
    # user_sign_status.user_id 是 PK+FK，按登录态归属（LOGIN_USER_ID）以满足外键完整性
    return [
        {
            "user_id": LOGIN_USER_ID,
            "continuous_days": to_int(d.get("continuous_days"), 0),
            "sign_days": dumps_json(d.get("sign_days")),
            "sign_status": to_int(d.get("sign_status"), 0),
            "crystal_number": to_int(d.get("crystal_number"), 0),
        }
    ]
