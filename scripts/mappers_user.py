#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""mappers_user.py — A 域（用户与账户）+ G 域（配置 KV）

源 mock：user / addressList / invitationRecord / invitationAssist /
        invitationInfo / tradeUnion / getConfig / index_getConfig /
        rebate / lotteryRule
映射依据：DATABASE.md §3 A1~A4、G1、G2、F3
"""
from __future__ import annotations

from clean import (
    LOGIN_USER_ID,
    bool_int,
    clean_str,
    dec,
    dig,
    dumps_json,
    rows_of,
    str_col,
    to_int,
    to_unix,
)


def map_users(m):
    """A1 users ← user.json → data.userinfo（另含 marketDetail 内嵌 user 对象）。

    §9：userinfo.token **丢弃不入库**（会话令牌，属临时认证态）。
    """
    rows = []
    info = dig(m, "user", "data", "userinfo")
    if info:
        rows.append(
            {
                "id": to_int(info.get("id")),
                "username": clean_str(info.get("username"), ""),
                "nickname": clean_str(info.get("nickname"), ""),
                "mobile": clean_str(info.get("mobile"), ""),
                "avatar": clean_str(info.get("avatar"), ""),
                "score": to_int(info.get("score"), 0),
                "inviter_code": clean_str(info.get("inviter_code"), ""),
                "yao_count": to_int(info.get("yao_count"), 0),
                # §6.4：金额走 Decimal，不经 float
                "huifu_service_charge": dec(info.get("huifu_service_charge"), 0),
                "sandpay_service_charge": dec(info.get("sandpay_service_charge"), 0),
            }
        )
    # marketDetail.data.user 是另一位真实用户（挂单卖方 sale_user_id=4930），
    # §8 #19 明确要求 marketDetail 同时灌 users。字段仅取源站实有项，不补默认值。
    u = dig(m, "marketDetail", "data", "user")
    if u and to_int(u.get("id")) != to_int(info.get("id") if info else None):
        rows.append(
            {
                "id": to_int(u.get("id")),
                "username": clean_str(u.get("mobile"), ""),  # 源站 user 对象仅有 mobile
                "nickname": clean_str(u.get("nickname"), ""),
                "mobile": clean_str(u.get("mobile"), ""),
                "avatar": clean_str(u.get("avatar"), ""),
                "score": 0,
                "inviter_code": "",  # 源站未给，不臆造
                "yao_count": 0,
                "huifu_service_charge": 0,
                "sandpay_service_charge": 0,
            }
        )
    return rows


def map_user_addresses(m):
    """A2 user_addresses ← addressList.json（data[] 为数组）。

    §3 A2：接口无 user_id，按登录态归属 → LOGIN_USER_ID。
    """
    rows = []
    for a in rows_of(m, "addressList"):
        rows.append(
            {
                "id": to_int(a.get("address_id")),  # 源字段名是 address_id，非 id
                "user_id": LOGIN_USER_ID,
                "name": clean_str(a.get("name"), ""),
                "mobile": clean_str(a.get("mobile"), ""),
                "province": clean_str(a.get("province"), ""),
                "city": clean_str(a.get("city"), ""),
                "area": clean_str(a.get("area"), ""),
                "address": clean_str(a.get("address"), ""),
                "is_default": to_int(a.get("is_default"), 0),
            }
        )
    return rows


def map_user_invitations(m):
    """A3 user_invitations ← invitationRecord.json → data.list[]。

    §3 A3：create_time 实测为字符串 "1766000000"，属 unix 秒形态 → CAST 成 BIGINT。
    对比 §6.5：只有 unix 秒形态才 CAST，"10-16 09:24" 类缺年份串绝不 CAST。
    """
    rows = []
    for r in rows_of(m, "invitationRecord", "list"):
        rows.append(
            {
                "id": to_int(r.get("id")),
                "user_id": LOGIN_USER_ID,
                "invitee_mobile": clean_str(r.get("mobile"), ""),
                "invite_time": to_unix(r.get("create_time"), 0),
                "status": to_int(r.get("status"), 0),  # E-INVITE-STATUS 0/1/2
                "remark": clean_str(r.get("remark"), ""),
            }
        )
    return rows


def map_user_invitation_assists(m):
    """A4 user_invitation_assists ← invitationAssist.json → data.records[]。

    §3 A4：这是**抽签助力**，与 A3 邀请注册是两回事，故独立建表。
    assist_num/need_num 为聚合值可派生，hero_image/assist_tip 属配置（入 activity_configs）。
    """
    rows = []
    d = dig(m, "invitationAssist", "data", default={}) or {}
    code = d.get("code")
    for r in d.get("records", []) or []:
        rows.append(
            {
                "id": to_int(r.get("id")),
                "code": clean_str(code, ""),
                "user_id": LOGIN_USER_ID,
                "nickname": clean_str(r.get("nickname"), ""),
                "avatar": clean_str(r.get("avatar"), ""),
                # 实测 "2026-12-01 11:20:03" 日期串 → VARCHAR，不 CAST（§6.5）
                "assist_time": str_col(r.get("create_time"), ""),
                "is_new_user": bool_int(r.get("is_new_user")),
                "is_real": bool_int(r.get("is_real")),
            }
        )
    return rows


def map_trade_unions(m):
    """C5 trade_unions ← tradeUnion.json（单行配置，id 固定 1）。

    §3 C5：getConfig.data.trade_union 与本 mock 字段完全一致，取 tradeUnion 为权威。
    """
    d = dig(m, "tradeUnion", "data", default={}) or {}
    if not d:
        return []
    return [
        {
            "id": 1,  # 设计新增：单行配置固定 1
            "unlock": bool_int(d.get("unlock")),
            "member_count": to_int(d.get("member_count"), 0),
            "rebate_holder": dec(d.get("rebate_holder"), 0),
            "rebate_invited": dec(d.get("rebate_invited"), 0),
            "rebate_extra": dec(d.get("rebate_extra"), 0),
            "max_bind": to_int(d.get("max_bind"), 0),
        }
    ]


def _kv(key, value, group, prefix_key=True):
    """构造 KV 行。value_type 按 Python 类型判定（string/int/json/bool）。

    prefix_key=False 时 config_key 保持源站字段名原样，分组只由 config_group 承载。
    app_configs 用复合主键 (config_group, config_key)，无需前缀（schema v1.2）。
    """
    if isinstance(value, bool):
        vt = "bool"
        val = "true" if value else "false"
    elif isinstance(value, int):
        vt, val = "int", str(value)
    elif isinstance(value, (list, dict)):
        vt, val = "json", dumps_json(value)
    else:
        vt, val = "string", str(value)
    return {
        "config_key": f"{group}:{key}" if prefix_key else key,
        "config_value": val,
        # activity_configs 表无 value_type 列，此处由调用方裁掉（见 map_activity_configs）
        "value_type": vt,
        "config_group": group,
    }


def map_app_configs(m):
    """G1 app_configs ← index_getConfig.json（basic）+ getConfig.json（trade）。

    §3 G1：两份 getConfig 是**同名不同接口**，appName 分别为「青川」「青川数字艺术」，
    按 config_group 区分避免覆盖。

    schema v1.2：app_configs 主键已改为复合主键 (config_group, config_key)，
    两组同名 key 可自然共存。故 config_key 直接写源站字段名原样，**不再拼 `group:` 前缀**
    （前缀会让按 config_key 直查的调用方拿到 'basic:appName' 而非 'appName'）。
    """
    rows = []
    basic = dig(m, "index_getConfig", "data", default={}) or {}
    for k, v in basic.items():
        # §3 G1：仅收录有值项，空串不入库
        if v is None or (isinstance(v, str) and v.strip() == ""):
            continue
        rows.append(_kv(k, v, "basic", prefix_key=False))

    trade = dig(m, "getConfig", "data", default={}) or {}
    for k, v in trade.items():
        # trade_union 已独立为 C5，不重复收录；consignment_sales 恒为 null
        if k == "trade_union" or v is None:
            continue
        if isinstance(v, str) and v.strip() == "":
            continue
        rows.append(_kv(k, v, "trade", prefix_key=False))
    return rows


def map_activity_configs(m):
    """G2 activity_configs ← activityDraw / invitationAssist / communityShare / lotteryRule。

    §3 G2：四组配置 draw / assist / community_share / lottery。
    """
    rows = []
    ad = dig(m, "activityDraw", "data", default={}) or {}
    if ad.get("activity"):
        rows.append(_kv("activity", ad["activity"], "draw"))
    if ad.get("draw_rule"):
        rows.append(_kv("draw_rule", ad["draw_rule"], "draw"))

    ia = dig(m, "invitationAssist", "data", default={}) or {}
    for k in ("hero_image", "assist_tip"):
        if ia.get(k):
            rows.append(_kv(k, ia[k], "assist"))

    cs = dig(m, "communityShare", "data", default={}) or {}
    for k in ("share_images", "audit_status", "audit_text"):
        if cs.get(k) is not None:
            rows.append(_kv(k, cs[k], "community_share"))

    lr = dig(m, "lotteryRule", "data", default={}) or {}
    if lr.get("rule"):
        rows.append(_kv("rule", lr["rule"], "lottery"))
    # activity_configs 无 value_type 列（schema 只有 4 列），统一裁掉
    for r in rows:
        r.pop("value_type", None)
    return rows


def map_rebate_profiles(m):
    """F3 rebate_profiles ← rebate.json → data.c_info（一人一概况，PK 即 user_id）。

    §3 F3：all_commision / mingxia_commision 是**源站拼写错误**，
    按铁律保留原名（改了即脱离源站）。
    rebate 页面是「我的返佣」，user_id 按登录态归属。
    """
    c = dig(m, "rebate", "data", "c_info", default={}) or {}
    if not c:
        return []
    return [
        {
            "user_id": LOGIN_USER_ID,
            "all_commision": dec(c.get("all_commision"), 0),
            "yesterday_commision": dec(c.get("yesterday_commision"), 0),
            "user_transaction": dec(c.get("user_transaction"), 0),
            "mingxia_commision": dec(c.get("mingxia_commision"), 0),
            "yao_counts": to_int(c.get("yao_counts"), 0),  # 实测字符串 "36"
            "you_yao_counts": to_int(c.get("you_yao_counts"), 0),
        }
    ]
