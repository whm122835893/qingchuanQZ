#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""mappers_community.py — E1 社区帖子与评论
源 mock：communityPost / communityDetail / communityShareRecord

映射依据：DATABASE.md §3 E1；裁决 E（create_time_str 不补全年份）
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

def map_community(m) -> tuple[list[dict], list[dict]]:
    """E1 community_posts + E2 community_comments ← wallDetails.json。

    裁决 E（§6.5/§10.E）：create_time 实测 "10-16 09:24" **缺年份**，
    保持 VARCHAR(32) **不补全年份** —— 补全属数据伪造（2027 年再灌会得到不同年份，
    数据不可复现）。§7 已确认社区动态按 id DESC 排序，不依赖该时间列。

    评论两级扁平化：comment_list[].reply_id=0 → parent_id=NULL（顶层）；
    reply[].reply_id=7001 → parent_id=7001（自关联指向父评论 id）。
    """
    d = dig(m, "wallDetails", "data", default={}) or {}
    posts = []
    if d.get("id"):
        posts.append(
            {
                "id": to_int(d.get("id")),
                # 源站仅给 profile.nickname，不给 user_id；按登录态归属
                "user_id": LOGIN_USER_ID,
                "nickname": clean_str(dig(d, "profile", "nickname"), ""),
                "avatar": clean_str(dig(d, "profile", "avatar"), ""),
                "content": clean_str(d.get("content")),
                "create_time_str": str_col(d.get("create_time")),  # "10-16 09:24" 原样
                "images": dumps_json(d.get("images")),  # 顺序有语义，整组存 JSON
            }
        )

    post_id = to_int(d.get("id"))
    comments = []

    def add(c, parent_id):
        code_p, _ = collection_code_split(None)
        comments.append(
            {
                "id": to_int(c.get("id")),
                "post_id": post_id,
                # 顶层评论 reply_id=0 → 存 NULL（不是 0，避免指向不存在的父评论）
                "parent_id": parent_id,
                "content": clean_str(c.get("content")),
                "nickname": clean_str(dig(c, "profile", "nickname"), ""),
                "avatar": clean_str(dig(c, "profile", "avatar"), ""),
                "reply_nickname": clean_str(dig(c, "reply_profile", "nickname"), ""),
                "reply_avatar": clean_str(dig(c, "reply_profile", "avatar"), ""),
                "has_more": bool_int(c.get("has_more")),
                "create_time_str": str_col(c.get("create_time")),
            }
        )

    for c in d.get("comment_list", []) or []:
        cid = to_int(c.get("id"))
        add(c, None)  # 顶层
        for r in c.get("reply", []) or []:
            # 二级回复：reply_id 指向父评论 id
            add(r, to_int(r.get("reply_id")) or cid)
    return posts, comments


def map_community_share_records(m) -> list[dict]:
    """E3 community_share_records ← communityShare.json → data.share_records[]。

    §3 E3：share_images/audit_status/audit_text 为活动级数据，入 activity_configs，不建列。
    create_time 实测字符串 → VARCHAR。
    """
    rows = []
    for r in dig(m, "communityShare", "data", "share_records", default=[]) or []:
        rows.append(
            {
                "id": to_int(r.get("id")),
                "community": clean_str(r.get("community"), ""),
                "create_time": str_col(r.get("create_time"), ""),
            }
        )
    return rows
