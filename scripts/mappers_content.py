#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""mappers_content.py — E2~E4 公告 / 装修 / 资讯
源 mock：index_afficheList / noticeDetails / diypage / newsList

映射依据：DATABASE.md §3 E2~E4
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

def map_chat(m) -> tuple[list[dict], list[dict]]:
    """E5 chat_sessions + E4 chat_messages ← chatMessages.json。

    §3 E5：源站**无会话实体**，为挂载消息所必需而设计新增，按单群固定 id=1。
    会话名取首条消息的 nickname（「敦煌守夜人」）作为群名，避免凭空命名。
    is_self/show_date 为 UI 状态，源站直接返回故保留。
    """
    data = rows_of(m, "chatMessages")
    sessions = [{"id": 1, "name": clean_str(data[0].get("nickname"), "") if data else ""}]
    msgs = []
    for r in data:
        msgs.append(
            {
                "id": to_int(r.get("id")),
                "session_id": 1,  # 设计关联：源站无会话概念，单群固定 1
                "is_self": bool_int(r.get("is_self")),
                "user_id": LOGIN_USER_ID,  # 源站无 user_id，按登录态归属
                "nickname": clean_str(r.get("nickname"), ""),
                "avatar": clean_str(r.get("avatar"), ""),
                "content": clean_str(r.get("content")),
                "date_text": str_col(r.get("date_text"), ""),
                "show_date": bool_int(r.get("show_date")),
            }
        )
    return sessions, msgs


def map_news_articles(m) -> list[dict]:
    """E6 news_articles ← newsDetails.json。"""
    d = dig(m, "newsDetails", "data", default={}) or {}
    if not d.get("id"):
        return []
    return [
        {
            "id": to_int(d.get("id")),
            "title": clean_str(d.get("title"), ""),
            "content": clean_str(d.get("content")),
            "publish_time": int(d.get("createtime") or 0),  # unix 秒
        }
    ]


def map_affiche_types(m) -> list[dict]:
    """E7 affiche_types ← affichetypelist.json（实测 7 条）。"""
    rows = []
    for t in rows_of(m, "affichetypelist"):
        rows.append(
            {
                "id": to_int(t.get("id")),
                "name": clean_str(t.get("name"), ""),
            }
        )
    return rows


def map_affiches(m) -> list[dict]:
    """E8 affiches ← index_afficheList.json（列表）+ noticeDetails.json（详情）。

    §3 E8 / §6.6：afficheList 与 index_afficheList **内容不同**（不同时间点快照），
    取 index_afficheList（更新）。noticeDetails 提供 content 与 collection[]，
    按 id 合并到同一条公告（noticeDetails.id=434 在列表中存在）。
    §9：列表接口 view_count 恒为 0，以详情值 1286 为准（详情覆盖列表）。
    """
    rows: dict[int, dict] = {}

    def put(rid, **kw):
        if rid is None:
            return
        row = rows.setdefault(
            rid,
            {
                "id": rid, "title": "", "image": "", "url": "",
                # type 实测字符串 "1"，schema 刻意用 VARCHAR 不用 FK（§5 附录二第 4 条）
                "type": "", "affiche_type": "",
                "view_count": 0, "publish_time": "",
                "publish_time_ts": 0, "content": None, "related_products": None,
            },
        )
        for k, v in kw.items():
            if v is None or v == "":
                continue
            row[k] = v

    for a in rows_of(m, "index_afficheList", "data"):
        put(
            to_int(a.get("id")),
            title=clean_str(a.get("title"), ""),
            image=clean_str(a.get("image"), ""),
            url=clean_str(a.get("url"), ""),
            type=str_col(a.get("type"), ""),
            affiche_type=clean_str(a.get("affiche_type"), ""),
            view_count=to_int(a.get("view_count"), 0),
            publish_time_ts=to_int(a.get("createtime"), 0),
        )

    d = dig(m, "noticeDetails", "data", default={}) or {}
    if d.get("id"):
        put(
            to_int(d.get("id")),
            title=clean_str(d.get("title"), ""),
            affiche_type=clean_str(d.get("affiche_type"), ""),
            publish_time=str_col(d.get("publish_time"), ""),
            publish_time_ts=to_int(d.get("createtime"), 0),
            # §9：列表 view_count 恒 0，详情值才是真实浏览量 → 覆盖
            view_count=to_int(d.get("view_count"), 0),
            content=clean_str(d.get("content")),
            related_products=dumps_json(d.get("collection")),  # 相关藏品整组存 JSON
        )
    return list(rows.values())


def map_banners(m) -> list[dict]:
    """E9 banners ← banner_show_getBanner.json。"""
    rows = []
    for b in rows_of(m, "banner_show_getBanner", "data"):
        rows.append(
            {
                "id": to_int(b.get("id")),
                "image": clean_str(b.get("image"), ""),
                "url": clean_str(b.get("url"), ""),
                "url_type": to_int(b.get("url_type"), 0),
                "is_show": to_int(b.get("is_show"), 0),
            }
        )
    return rows


def map_diypage_components(m) -> list[dict]:
    """E10 diypage_components ← diypage.json（https:__api... 版内容等价，跳过）。

    §3 E10：content 为 JSON 字符串，内含前端布局 DSL，**必须原样存 TEXT 不做结构化**。
    """
    rows = []
    for c in rows_of(m, "diypage"):
        rows.append(
            {
                "id": to_int(c.get("id")),
                "type": clean_str(c.get("type"), ""),
                "category": clean_str(c.get("category"), ""),
                "name": clean_str(c.get("name"), ""),
                "content": clean_str(c.get("content")),
                "decorate_id": to_int(c.get("decorate_id"), 0),
            }
        )
    return rows
