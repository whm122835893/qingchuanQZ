#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""mappers_activity.py — D1 活动 / D2 合成
源 mock：activeList / compoundList / compoundDetail / compoundResult

映射依据：DATABASE.md §3 D1~D2
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

def map_activities(m) -> list[dict]:
    """D1 activities ← activeSelectedList.json。

    §4 E-ACTIVITY-TYPE：type 枚举经 route 反查确认（1→compound 2→lottery
    3→blindBox 4→sign），映射确定。start/end_time 实测为日期串 → VARCHAR。
    """
    rows = []
    for a in rows_of(m, "activeSelectedList"):
        rows.append(
            {
                "id": to_int(a.get("id")),
                "title": clean_str(a.get("title"), ""),
                "listimg": clean_str(a.get("listimg"), ""),
                "type": to_int(a.get("type")),
                "start_time": str_col(a.get("start_time"), ""),
                "end_time": str_col(a.get("end_time"), ""),
                "join_num": to_int(a.get("join_num"), 0),
                "status": to_int(a.get("status"), 0),
                "qualify": clean_str(a.get("qualify"), ""),
                "route": clean_str(a.get("route"), ""),
            }
        )
    return rows


def map_compound_schemes(m) -> list[dict]:
    """D2 compound_schemes ← compoundList.json（rule_text 由 compoundScheme 补入）。

    §3 D2：此处 start_time/end_time 为 unix 秒（与 D1 的日期串不同）。
    rule_text 来自 compoundScheme.data.rule_text[]（按 play_id 匹配），整组存 JSON。
    """
    rows = []
    scheme = dig(m, "compoundScheme", "data", default={}) or {}
    rule_by_play = scheme.get("rule_text") if scheme.get("play_id") else None
    for s in rows_of(m, "compoundList"):
        rt = rule_by_play if (rule_by_play and scheme.get("play_id") == s.get("play_id")) else None
        rows.append(
            {
                "id": to_int(s.get("id")),
                "play_id": to_int(s.get("play_id"), 0),
                "title": clean_str(s.get("title"), ""),
                "listimg": clean_str(s.get("listimg"), ""),
                "target_img": clean_str(scheme.get("target_img"), "") if rt else "",
                "start_time": to_unix(s.get("start_time"), 0),
                "end_time": to_unix(s.get("end_time"), 0),
                "join_num": to_int(s.get("join_num"), 0),
                "qualify": clean_str(s.get("qualify"), ""),
                "rule_url": clean_str(s.get("rule_url"), ""),
                "rule_text": dumps_json(rt) if rt else None,
            }
        )
    return rows


def map_compound_scheme_items(m, scheme_by_play: dict | None = None) -> list[dict]:
    """D3 compound_scheme_items ← compoundScheme.data.rule_text[].collectionList[]。

    §3 D3：嵌套数组经 play_id 匹配 compound_schemes，scheme_id 为设计关联。
    condition_name 取所属条件组名（「条件1」「条件2」），collection_name 取材料名。
    """
    rows = []
    scheme_by_play = scheme_by_play or {}
    d = dig(m, "compoundScheme", "data", default={}) or {}
    scheme_id = scheme_by_play.get(to_int(d.get("play_id")), 0)
    for group in d.get("rule_text", []) or []:
        gname = group.get("name") or ""
        for c in group.get("collectionList", []) or []:
            code, _num = collection_code_split(c.get("collection_code"))
            rows.append(
                {
                    "id": to_int(c.get("id")),
                    "scheme_id": scheme_id,
                    "condition_name": gname,
                    "need_num": to_int(group.get("number"), 0),
                    "collection_code": code,
                    "collection_name": clean_str(c.get("name"), ""),
                    "total_num": to_int(c.get("total_num"), 0),
                    "image": clean_str(c.get("image"), ""),
                }
            )
    return rows


def map_user_compound_records(m, scheme_by_title: dict | None = None) -> list[dict]:
    """D4 user_compound_records ← compoundRecord.json。

    §3 D4：scheme_id 为设计关联，用 title 匹配 compound_schemes.title；
    consume[] 为材料数组（{name,collection_code,total_num,image}），整组存 JSON。
    method 实测全 1，语义未确认，原样保留。
    """
    rows = []
    scheme_by_title = scheme_by_title or {}
    for r in rows_of(m, "compoundRecord"):
        title = r.get("title") or ""
        rows.append(
            {
                "id": to_int(r.get("id")),
                "user_id": LOGIN_USER_ID,
                "scheme_id": scheme_by_title.get(title, 0),
                "title": title,
                "cover_image": clean_str(r.get("listimg"), ""),
                "materials": clean_str(r.get("materials"), ""),
                "method": to_int(r.get("method"), 0),
                "consume": dumps_json(r.get("consume")),
                "record_time": to_unix(r.get("create_time"), 0),
            }
        )
    return rows


def map_compound_results(m, record_ids: list | None = None) -> list[dict]:
    """D5 compound_results ← compoundResult.json → data.result[]。

    §4 E-COMPOUND-RESULT：type 为字符串枚举 C=合集藏品 / M=材料 / S=龙晶积分，
    三种异质产出混在同一数组，用 result_type 区分；各专属字段仅对应类型携带，
    缺失者取 0/NULL（不跨类型填充）。
    compoundResult 无 record_id，按顺序关联 compoundRecord 的记录 ID（设计关联）。
    """
    rows = []
    record_ids = record_ids or []
    res = dig(m, "compoundResult", "data", "result", default=[]) or []
    for i, r in enumerate(res):
        rows.append(
            {
                "id": i + 1,  # 设计新增：源站 result 项无 id
                "record_id": record_ids[i] if i < len(record_ids) else 0,
                "result_type": clean_str(r.get("type"), ""),
                "name": clean_str(r.get("name"), ""),
                "user_collection_code": clean_str(r.get("user_collection_code")),
                "total_num": to_int(r.get("total_num"), 0),
                "number": to_int(r.get("number"), 0),
                "crystal_type": to_int(r.get("crystal_type"), 0),
                "single_quantity": to_int(r.get("single_quantity"), 0),
            }
        )
    return rows
