#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""clean.py — 字段清洗原语（DATABASE.md §6 + §10 裁决的代码化）

把「金额禁用 float」「非标准时间不 CAST」「空串 vs 纯空格」等规则收敛为函数，
供各 mappers_*.py 复用，避免同一规则在 5 个文件里各写一遍而漂移。

依据章节均在函数 docstring 中标注。
"""
from __future__ import annotations

import json
from decimal import Decimal, InvalidOperation

# 登录用户上下文：源站多数列表接口不返回 user_id，DATABASE.md §3 统一说明
# 「按登录态归属」。user.json 的 userinfo.id = 22291 即该登录态，故作为设计关联值。
# 这不是臆造——它是 mock 中真实存在的唯一用户主体。
LOGIN_USER_ID = 22291

# 枚举字典（DATABASE.md §4），供 seed.py 做越界校验
ENUMS = {
    "goods_type_collection": {1, 2},          # E-GOODS-TYPE-COLLECTION 藏品域（裁决C）
    "goods_type_shop": {1, 2, 3},             # E-GOODS-TYPE-SHOP 商城域（裁决C）
    "collection_status": {1, 2, 10},
    "listing_status": {1, 2, 3},
    "order_status_buy": {0, 1, 2, 3, 4},      # E-ORDER-STATUS-BUY（裁决D：不臆造 7）
    "entrust_status": {2, 3, 4},              # E-ENTRUST-STATUS
    "pay_way": {"huifu", "yibao"},
    "income_type": {"huifu", "yibao"},
    "activity_type": {1, 2, 3, 4},
    "exchange_status": {1, 2, 3, 4, 5},
    "compound_result": {"C", "M", "S"},
    "draw_status": {0, 1, 2},
    "regift_status": {1, 2, 3},
    "invite_status": {0, 1, 2},
    "rank_type": {"user_buy", "master", "product_buy", "draw", "rebate"},
}


def dig(obj, *path, default=None):
    """安全取嵌套值：dig(d,'data','userinfo','id')。任一层缺失返回 default。"""
    cur = obj
    for key in path:
        if not isinstance(cur, dict) or key not in cur:
            return default
        cur = cur[key]
    return cur if cur is not None else default


def rows_of(mock, name, *inner_keys):
    """统一拆解 mock 的响应封装，返回**列表**（DATABASE.md §2 五种封装风格）。

    源站 78 个 mock 的 data 有三种形态，本函数统一处理，
    避免每个 mapper 各写一遍 `dig(...,'data','data')` 而漏掉裸数组风格：

        A 风格  {"code":..,"msg":..,"data":[ ... ]}          → 直接返回 data 列表
        B/C/E   {"code":..,"data":{"total":..,"data":[ ... ]}} → 逐级取 inner_keys
        D 风格  {"code":..,"data":{ ...单对象... }}            → 包装成单元素列表

    用法：rows_of(m, 'marketList') / rows_of(m, 'orderList', 'data')
    """
    payload = mock.get(name, {}) if isinstance(mock, dict) else {}
    if isinstance(payload, dict) and "data" in payload:
        payload = payload.get("data")
    for key in inner_keys:
        if isinstance(payload, dict):
            payload = payload.get(key)
    if payload is None:
        return []
    if isinstance(payload, list):
        return payload
    if isinstance(payload, dict):
        return [payload]  # D 风格单对象 → 单元素列表
    return []


def dec(value, default=None):
    """金额 → Decimal。

    依据 §6.4：源站金额有 "100.00" / 100.00 / "0" / 120.0 / 15 五种形态，
    统一 DECIMAL(18,4)，**全程 decimal.Decimal，禁止 float 中转**。
    SQLite 无 DECIMAL 亲和类型，由 dialect 存字符串保精度。
    """
    if value is None or value == "":
        return default
    if isinstance(value, Decimal):
        return value
    try:
        # 从字符串构造，规避二进制浮点表示误差
        return Decimal(str(value).strip())
    except (InvalidOperation, ValueError, ArithmeticError):
        return default


def to_int(value, default=None):
    """宽松转 int：兼容 "386" / 386 / "30000" / True。

    注意：仅用于**语义确为数值**的列（计数、unix 秒、枚举）。
    时间与金额分别走 to_unix / dec，不复用本函数。
    """
    if value is None or value == "" or isinstance(value, bool):
        return default
    if isinstance(value, int):
        return value
    try:
        return int(Decimal(str(value).strip()))
    except (InvalidOperation, ValueError, ArithmeticError):
        return default


def to_unix(value, default=None):
    """unix 秒 → int。

    依据 §6.5：unix 秒形态（数字或数字字符串）才 CAST 成 BIGINT。
    非标准形态（"10-16 09:24" 缺年份 / "1812061059386431" 雪花 ID / "18:26:45" 纯时刻）
    **一律不 CAST**，调用方须改用 str_col 存入 VARCHAR 列。
    """
    if value is None or isinstance(value, bool):
        return default
    s = str(value).strip()
    # 纯数字（允许负号）才视为 unix 秒；长度上限 11 位以排除雪花 ID
    if not s.lstrip("-").isdigit() or len(s.lstrip("-")) > 11:
        return default
    try:
        return int(s)
    except ValueError:
        return default


def str_col(value, default=None):
    """非标准时间形态 → 原样字符串（不补年份、不 CAST）。

    依据 §6.5 与裁决 E："10-16 09:24" 缺年份属源站事实，
    补全年份是「以灌库时点假设冒充源站事实」的伪造。
    """
    if value is None:
        return default
    s = str(value)
    return s if s != "" else default


def bool_int(value, default=0):
    """布尔 → TINYINT 0/1。依据 §6.6：源站 true/false 与 0/1 混用，统一转 0/1。"""
    if value is None:
        return default
    if isinstance(value, bool):
        return int(value)
    if isinstance(value, (int, float)):
        return int(value)
    if isinstance(value, str):
        s = value.strip().lower()
        if s in ("true", "1", "yes"):
            return 1
        if s in ("false", "0", "no", ""):
            return 0
    return default


def clean_str(value, default=None):
    """纯空格串 → None；普通字符串原样保留。

    依据 §6.6 两条例外，语义相反，必须区分：
      - `purchase_information: "      "`（纯空格）→ **转 NULL**（语义为无内容）
      - `collection_level: ""`（空串）→ **保留 ''**（源站语义为「有字段但未设置」）
    因此本函数只处理「去掉空白后为空」的情况（strip 后为空即视为纯空格），
    而**空串 '' 原样返回**，由调用方决定是否转 NULL。
    """
    if value is None:
        return default
    if isinstance(value, str):
        return default if value.strip() == "" else value
    return value


def empty_str_to_none(value):
    """显式空串 → None（仅用于 schema 标注「实测为空串，清洗为 NULL」的列）。

    依据 §3 B2：purchase_information 实测为一串空格，语义为无内容 → NULL。
    """
    return None if value is None or str(value).strip() == "" else value


def dumps_json(value):
    """数组/对象 → JSON 文本（schema 中 JSON 列在 SQLite 侧为 TEXT）。

    依据 §5 附录二第 7 条：JSON 列不拆表，整组存 JSON。
    空数组存 '[]'（保留「源站确实返回了空数组」这一事实，与 NULL 语义区分）。
    """
    if value is None:
        return None
    return json.dumps(value, ensure_ascii=False, separators=(",", ":"))


def income_type(raw):
    """income_type 三形态 → (单值, raw留痕)。裁决 B 定稿，依据 §6.2。

    - "huifu"        → ("huifu", "huifu")
    - ["huifu"]      → ("huifu", '["huifu"]')   数组取首元素 + 原值留痕
    - 1（数字形态）  → (None,    "1")          **不映射为 huifu，保持 NULL**
      理由：全库仅 tradeBaseInfo 一处出现数字形态，猜测 1=huifu 属臆造；
      且该 mock 顶层聚合已按 §9 判定不入库。
    """
    if raw is None:
        return (None, None)
    if isinstance(raw, list):
        if not raw:
            return (None, "[]")
        first = raw[0]
        # 首元素若仍是数字，同样不映射
        if isinstance(first, str):
            return (first, dumps_json(raw))
        return (None, dumps_json(raw))
    if isinstance(raw, bool):
        return (None, str(raw))
    if isinstance(raw, int):
        return (None, str(raw))  # 裁决B：数字形态保持 NULL
    s = str(raw)
    return (s if s else None, s if s else None)


def collection_code_split(raw):
    """collection_code → (VARCHAR 部分, BIGINT 数值部分)。裁决 A 定稿，依据 §6.1。

    - "QC88231"        → ("QC88231", None)
    - "QC-2024-0031"   → ("QC-2024-0031", None)
    - "PBCE/2000..."   → ("PBCE/2000...", None)
    - 387750（数字）   → (None, 387750)      承载 collection_code_num
    - "226"（字符串数字）→ (None, 226)        源站错位值仍按数值形态处理
    注意：不与 id 建 FK（不同 ID 空间），见 §6.1 理由 2。
    """
    if raw is None:
        return (None, None)
    if isinstance(raw, bool):
        return (str(raw), None)
    if isinstance(raw, int):
        return (None, raw)
    s = str(raw).strip()
    if s == "":
        return (None, None)
    if s.lstrip("-").isdigit():
        try:
            return (None, int(s))
        except ValueError:
            return (s, None)
    return (s, None)
