#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""mappers.py — mapper 聚合入口（按领域分包，此文件只做编排）

每个领域一个 mappers_<domain>.py，本文件不写任何字段映射逻辑，
只声明「哪个 mock 经哪个 mapper 灌进哪张表」，并处理跨表依赖
（products 必须先算，其他表要用 name→id 映射）。

分包划分（均≤300 行）：
    mappers_user       A 域 用户 + G 域 配置
    mappers_catalog    B1 series / B3 藏品池 / B4 销售规则
    mappers_product    B2 products（8 源合并）
    mappers_collection B5~B7 藏品实例 + F1 行情统计
    mappers_trade      C1 市场挂单 / C2 买单订单
    mappers_entrust    C3 委托单 / C4 K线快照
    mappers_activity   D1 活动 / D2 合成
    mappers_lottery    D3 抽奖 / D4 签到
    mappers_shop       D5 商城 / D6 晶石流水
    mappers_community  E1 社区帖子与评论
    mappers_content    E2~E4 公告 / 装修 / 资讯
    mappers_growth     F2 榜单快照 / F3 返佣邀请 / F4 转赠记录
"""
from __future__ import annotations

import time

import mappers_activity as ma
import mappers_catalog as mcatalog
import mappers_collection as mc
import mappers_community as mcom
import mappers_content as mo
import mappers_entrust as me
import mappers_flow as mflow
import mappers_growth as mg
import mappers_lottery as ml
import mappers_product as mp
import mappers_shop as ms
import mappers_trade as mt
import mappers_user as mu

def build_rows(mocks: dict) -> dict:
    """调用各领域 mapper，返回 {表名: [行...]}。顺序无关，seed 时按依赖重排。"""
    rows: dict[str, list] = {}

    def put(table, data):
        rows.setdefault(table, []).extend(data)

    # --- 先算 products（其他表要用 name→id 映射） ---
    products = mp.map_products(mocks)
    product_by_name = {r["name"]: r["id"] for r in products if r.get("name")}
    
    schemes = ma.map_compound_schemes(mocks)
    scheme_by_play = {r["play_id"]: r["id"] for r in schemes}
    scheme_by_title = {r["title"]: r["id"] for r in schemes}
    records = ma.map_user_compound_records(mocks, scheme_by_title)
    record_ids = [r["id"] for r in records]

    # --- A 域 + G 域 ---
    put("users", mu.map_users(mocks))
    put("user_addresses", mu.map_user_addresses(mocks))
    put("user_invitations", mu.map_user_invitations(mocks))
    put("user_invitation_assists", mu.map_user_invitation_assists(mocks))
    put("trade_unions", mu.map_trade_unions(mocks))
    put("app_configs", mu.map_app_configs(mocks))
    put("activity_configs", mu.map_activity_configs(mocks))
    put("rebate_profiles", mu.map_rebate_profiles(mocks))

    # --- B 域 + F1 ---
    put("series", mcatalog.map_series(mocks))
    put("products", products)
    put("product_pool_items", mcatalog.map_product_pool_items(mocks))
    put("product_sale_rules", mcatalog.map_product_sale_rules(mocks))
    put("user_collections", mc.map_user_collections(mocks))
    put("user_blind_box_records", mc.map_user_blind_box_records(mocks))
    put("collection_flow_records", mflow.map_collection_flow_records(mocks))
    put("collection_price_ticks", mflow.map_collection_price_ticks(mocks))
    put("product_market_stats", mflow.map_product_market_stats(mocks))

    # --- C 域 ---
    put("market_listings", mt.map_market_listings(mocks))
    put("orders", mt.map_orders(mocks))
    put("entrust_orders", me.map_entrust_orders(mocks, product_by_name))
    put("kline_snapshots", me.map_kline_snapshots(mocks, 1, product_by_name))

    # --- D 域 ---
    put("activities", ma.map_activities(mocks))
    put("compound_schemes", schemes)
    put("compound_scheme_items", ma.map_compound_scheme_items(mocks, scheme_by_play))
    put("user_compound_records", records)
    put("compound_results", ma.map_compound_results(mocks, record_ids))
    put("lottery_rounds", ml.map_lottery_rounds(mocks))
    put("user_lottery_records", ml.map_user_lottery_records(mocks))
    put("draw_codes", ml.map_draw_codes(mocks))
    put("user_draw_records", ml.map_user_draw_records(mocks))
    put("sign_reward_rules", ml.map_sign_reward_rules(mocks))
    put("user_sign_status", ml.map_user_sign_status(mocks))
    put("shop_goods", ms.map_shop_goods(mocks))
    put("user_shop_exchanges", ms.map_user_shop_exchanges(mocks))
    put("user_crystal_logs", ms.map_user_crystal_logs(mocks))

    # --- E 域 + F 域剩余 ---
    posts, comments = mcom.map_community(mocks)
    put("community_posts", posts)
    put("community_comments", comments)
    put("community_share_records", mcom.map_community_share_records(mocks))
    sessions, msgs = mo.map_chat(mocks)
    put("chat_sessions", sessions)
    put("chat_messages", msgs)
    put("news_articles", mo.map_news_articles(mocks))
    put("affiche_types", mo.map_affiche_types(mocks))
    put("affiches", mo.map_affiches(mocks))
    put("banners", mo.map_banners(mocks))
    put("diypage_components", mo.map_diypage_components(mocks))
    put("rank_snapshots", mg.map_rank_snapshots(mocks, int(time.time())))
    put("rebate_invites", mg.map_rebate_invites(mocks))
    put("regift_records", mg.map_regift_records(mocks))

    # 骨架表：schema 定稿了字段但源站 mock 无对应数据（order_cards.card[] 实测为空数组，
    # DATABASE.md §3 C3 明确「不臆造，仅定义骨架」）。显式登记空行集，
    # 让报告覆盖全部 48 张表（否则 order_cards 会在表数统计里凭空消失）。
    put("order_cards", [])

    return rows
