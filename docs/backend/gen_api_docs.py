#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""gen_api_docs.py — 由 endpoint_meta.py 生成 API.md 与 openapi.yaml

设计意图：**契约不可能手抄**。路径、响应字段、参数依据全部来自 endpoint_meta.py
单一事实源，生成器保证 API.md 与 openapi.yaml 永不漂移；verify_paths.py 再保证
二者与 src/api/index.js 永不漂移。三方一致性由机器保证，不靠人自觉。
"""
from __future__ import annotations
import sys, json, re
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from endpoint_meta import E  # noqa: E402

ROOT = HERE.parent.parent
API_JS = ROOT / "src" / "api" / "index.js"

STYLE_DESC = {
    'A': 'A. 裸数组（`data: []`）',
    'B': 'B. 标准分页（`{total,per_page,current_page,last_page,data[]}`）',
    'C': 'C. 精简分页（`{total,data[]}`）',
    'D': 'D. 单对象（`data:{...}`）',
    'E': 'E. 嵌套混合（`data:{product:{},...分页}`）',
}

DOMAIN_ORDER = ['A 用户与账户', 'B 藏品与系列', 'C 交易与订单', 'D 活动与玩法',
                'E 内容社区', 'F 统计分销', 'G 转赠与配置']


def read_source():
    """从 src/api/index.js 提取真实路径集合（不依赖元数据，交叉验证用）"""
    s = API_JS.read_text(encoding='utf-8')
    used = {re.sub(r'\$\{[^}]+\}', '{id}', p)
            for p in re.findall(r"request\(\s*[`'\"](/[^`'\"]*)", s)}
    mm = set(re.findall(r"^\s*'(/[^']+)'\s*:\s*", s, re.M))
    fns = {}
    for m in re.finditer(r"^\s{2}([a-zA-Z_]\w*):\s*(.*?)$", s, re.M):
        p = re.search(r"request\(\s*[`'\"](/[^`'\"]*)", m.group(2))
        if p:
            fns[m.group(1)] = re.sub(r'\$\{[^}]+\}', '{id}', p.group(1))
    return used, mm, fns


# ---------------------------------------------------------------- 总览表
def gen_overview(used, mm, fns):
    L = []
    L.append('| # | 路径 | 方法 | 域 | 读/写 | 状态 | 封装 | 鉴权 | 调用状态 | mock |')
    L.append('|---|---|---|---|---|---|---|---|---|---|')
    rows = []
    for path, m in E.items():
        active = path in used
        domain = m['domain']
        rows.append((DOMAIN_ORDER.index(domain) if domain in DOMAIN_ORDER else 9, path, m))
    rows.sort(key=lambda r: (r[0], r[1]))
    i = 0
    for _, path, m in rows:
        i += 1
        w = '写' if m['impl'] == 'todo' else '读'
        st = '✅ 已设计' if m['impl'] == 'done' else '⚠️ TODO 待实现'
        cs = '活跃' if path in used else '**仅登记**'
        L.append('| %d | `%s` | %s | %s | %s | %s | %s | %s | %s | `%s` |' % (
            i, path, m['method'], m['domain'], w, st,
            STYLE_DESC[m['style']].split('（')[0],
            '是' if m['auth'] else '否', cs, m.get('mock', '—')))
    return '\n'.join(L), i


# ---------------------------------------------------------------- 详情
def gen_detail(path, m):
    L = []
    w = '写' if m['impl'] == 'todo' else '读'
    L.append('### %s `%s`' % (path, path))
    L.append('')
    L.append('- **方法**：`%s`' % m['method'])
    L.append('- **用途**：%s' % m['title'])
    L.append('- **业务域**：%s' % m['domain'])
    L.append('- **读/写**：%s' % w)
    L.append('- **鉴权**：%s' % ('需登录（token 请求头）' if m['auth'] else '公开'))
    L.append('- **响应封装**：%s' % STYLE_DESC[m['style']])
    L.append('- **数据来源表**：%s' % m['tables'])
    L.append('- **mock 文件**：`%s`' % m.get('mock', '（无）'))
    L.append('- **实现状态**：%s' % ('✅ 已设计' if m['impl'] == 'done'
                                   else '⚠️ **TODO 写操作，本轮只出契约不实现**'))
    L.append('')
    L.append('**消费页面**（`src/pages/` 实测）：%s' % m['pages'])
    L.append('')
    # 请求参数
    L.append('**请求参数**')
    L.append('')
    if not m['params']:
        L.append('无。')
    else:
        L.append('| 来源 | 字段 | 类型 | 必填 | 说明 |')
        L.append('|---|---|---|---|---|')
        for src, name, typ, req, desc in m['params']:
            L.append('| `%s` | `%s` | %s | %s | %s |' % (
                src, name, typ, '是' if req else '否', desc))
    L.append('')
    L.append('> `param` 拼 query string，`data` 作为 JSON body。'
             '前端 `remoteRequest` 对 GET 会忽略 body，故本项目接口统一 POST。')
    L.append('')
    # 响应
    L.append('**响应结构**（`{code, msg, data, time}`，`code=1` 为成功）')
    L.append('')
    L.append('| 字段 | 类型 | 说明 |')
    L.append('|---|---|---|')
    for f, t, d in m['resp']:
        L.append('| `%s` | %s | %s |' % (f, t, d))
    L.append('')
    if m.get('note'):
        L.append('> **说明**：%s' % m['note'])
        L.append('')
    return '\n'.join(L)


# ---------------------------------------------------------------- API.md
def build_md(used, mm, fns):
    overview, total = gen_overview(used, mm, fns)
    missing = sorted(set(E) - (used | mm))
    extra = sorted((used | mm) - set(E))

    P = []
    P.append('# 青川数字艺术 H5 平台 · API 契约文档')
    P.append('')
    P.append('> 版本：v1.0 · 生成日期：2026-10-18')
    P.append('> **本文件由 `docs/backend/gen_api_docs.py` 从 `endpoint_meta.py` 生成，请勿手工编辑**')
    P.append('> 路径唯一事实源：`src/api/index.js`，由 `verify_paths.py` 机器校验')
    P.append('> 字段依据：`public/mock/*.json` 实测 + `src/pages/` 实测实参 + `docs/DATABASE.md` v1.2')
    P.append('')
    P.append('---')
    P.append('')
    P.append('## 0. 范围与口径')
    P.append('')
    P.append('| 指标 | 数量 |')
    P.append('|---|---|')
    P.append('| 本文档覆盖路径 | **%d** |' % total)
    P.append('| 其中活跃（有 api 函数调用） | %d |' % len([p for p in E if p in used]))
    P.append('| 其中仅 MOCK_MAP 登记（无函数调用） | %d |' % len([p for p in E if p not in used]))
    P.append('| 读接口 | %d |' % len([p for p, m in E.items() if m['impl'] == 'done']))
    P.append('| 写接口（本轮 TODO） | %d |' % len([p for p, m in E.items() if m['impl'] == 'todo']))
    P.append('')
    P.append('> **提交口径为 112 个接口，实测为 %d 条**。差异根因与证据见 `ARCHITECTURE.md` §0。'
             % total)
    P.append('> 简单说：65 次 `request()` 调用去重后 58 条活跃路径，'
             '加上 MOCK_MAP 已登记但当前无函数调用的 12 条，构成 %d 条并集。' % total)
    P.append('')
    P.append('### 0.1 路径复用（源站存在多函数指向同一路径）')
    P.append('')
    P.append('源站有 5 组函数指向同一路径，**后端按路径实现一份即可**，但需按下表区分参数语义：')
    P.append('')
    P.append('| 路径 | 复用函数 | 差异 |')
    P.append('|---|---|---|')
    P.append('| `/order/order/myConsignment` | `consignList` / `myConsignment` / `consignSearch` / `cancelConsignment` | **4 个函数**。前三者读列表，`cancelConsignment` 是取消动作（写语义）却复用读路径 —— 本轮按读实现，取消逻辑标 TODO |')
    P.append('| `/market/trade/begBuyOrderList` | `entrustList` / `begList` | 委托列表 / 求购列表，**靠参数区分**，参数名待确认 |')
    P.append('| `/market/trade/begBuyOrderInfo` | `entrustInfo` / `begInfo` | 委托详情 / 求购详情 |')
    P.append('| `/market/trade/createBegBuyOrder` | `submitEntrust` / `submitBegBuy` | 发起委托 / 发起求购 |')
    P.append('| `/index/getSeries` | `getSeries` / `seriesList` | 均取系列列表，`seriesList` 额外传 `{type:10}` |')
    P.append('')
    P.append('**动态路径 1 条**：`/market/market/MarketDetail/ids/{id}` —— Express 注册为 `:id`。')
    P.append('')
    if extra:
        P.append('### 0.2 未覆盖路径')
        P.append('')
        for p in extra:
            P.append('- `%s`' % p)
        P.append('')
    P.append('---')
    P.append('')
    P.append('## 1. 接口总览表')
    P.append('')
    P.append(overview)
    P.append('')
    P.append('---')
    P.append('')
    P.append('## 2. 接口详情')
    P.append('')
    rows = sorted(E.items(), key=lambda kv: (
        DOMAIN_ORDER.index(kv[1]['domain']) if kv[1]['domain'] in DOMAIN_ORDER else 9, kv[0]))
    cur = None
    for path, m in rows:
        if m['domain'] != cur:
            cur = m['domain']
            P.append('## 域：%s' % cur)
            P.append('')
        P.append(gen_detail(path, m))
    P.append('---')
    P.append('')
    P.append('## 3. 通用约定')
    P.append('')
    P.append('### 3.1 请求头')
    P.append('')
    P.append('| 头 | 值 | 说明 |')
    P.append('|---|---|---|')
    P.append('| `Content-Type` | `application/json` | 前端硬编码 |')
    P.append('| `version` | `1.0.1` | 前端硬编码，服务端仅记录日志 |')
    P.append('| `token` | JWT | **仅登录后存在**；缺失/无效/过期返回 `code=401`，前端据此清token |')
    P.append('')
    P.append('### 3.2 响应封装')
    P.append('')
    P.append('```json')
    P.append('{ "code": 1, "msg": "ok", "data": {}, "time": "2026-10-18T10:00:00Z" }')
    P.append('```')
    P.append('')
    P.append('`data` 的形状按接口取 §1 总览表的 5 种风格之一，**由 controller 层 responder 还原**，')
    P.append('改动前必须确认前端 `utils/api.js` 的 `listOf` / `objOf` 解析方式未被破坏。')
    P.append('')
    P.append('### 3.3 错误码')
    P.append('')
    P.append('| code | 语义 | 前端行为 |')
    P.append('|---|---|---|')
    P.append('| `1` | **成功** | `utils/api.js` L24 只认 1 |')
    P.append('| `400` | 参数校验失败 | 视为失败 |')
    P.append('| `401` | 未登录 / token 失效 | **前端清空 token** |')
    P.append('| `403` | 无权限 | 视为失败 |')
    P.append('| `404` | 资源不存在 | 视为失败 |')
    P.append('| `409` | 状态冲突 | 视为失败 |')
    P.append('| `422` | 业务规则不通过 | 视为失败 |')
    P.append('| `500` | 系统内部错误 | 视为失败 |')
    P.append('| `503` | 数据源不可用 | 视为失败 |')
    P.append('')
    P.append('### 3.4 分页参数（两套命名，后端必须都接受）')
    P.append('')
    P.append('| 参数名 | 使用接口 |')
    P.append('|---|---|')
    P.append('| `page` + `limit` | `orderList` `consignList` |')
    P.append('| `page` + `list_rows` | `afficheList` `getMarketList` |')
    P.append('')
    P.append('后端优先级：`limit` > `list_rows` > 默认 15；`page` 从 1 起；')
    P.append('`pageSize` 上限 100（`PAGE_SIZE_MAX`）。理由见 `ARCHITECTURE.md` §6.3。')
    P.append('')
    P.append('---')
    P.append('')
    P.append('## 4. 待确认项汇总')
    P.append('')
    P.append('以下参数**无 mock 或页面实参依据**，实现前需前端/产品确认，**已在各接口中逐条标注**：')
    P.append('')
    n = 0
    for path, m in E.items():
        for src, name, typ, req, desc in m['params']:
            if '待确认' in desc:
                n += 1
                P.append('%d. `%s` → `%s`：%s' % (n, path, name, desc))
    P.append('')
    P.append('共**%d 项**。其中影响面最大的是各列表接口的 `page`/`limit` 字段名 —— '
             'mock 是静态快照，分页元数据不入库（DATABASE.md §9），'
             '故无法从 mock 反推页面真实传参。' % n)
    P.append('')
    P.append('---')
    P.append('')
    P.append('## 5. 前端阻塞项')
    P.append('')
    P.append('`utils/api.js` 调用了 11 个 `api/index.js` 中**不存在**的方法，'
             '远程模式下必然抛 `TypeError` 并被静默 catch 吞掉、回落本地 mock。')
    P.append('后端已按路径实现，**前端需补 11 个转发函数**（清单见 `ARCHITECTURE.md` §10）。')
    P.append('')
    P.append('| 路径 | 待新增方法 |')
    P.append('|---|---|')
    fix = [('/rebate/rebate/index', 'rebateInfo'), ('/rebate/rebate/leaderboard', 'rebateLeaderboard'),
           ('/rebate/rebate/inviteDetail', 'rebateInviteDetail'), ('/rank/masterRank/list', 'masterRank'),
           ('/rank/userBuy/list', 'userBuyRank'), ('/regift/record/list', 'regiftRecord'),
           ('/leaderboard/leaderboard/goods', 'leaderboardGoods'), ('/leaderboard/leaderboard/user', 'leaderboardUser'),
           ('/marketCapRanking/marketCapRanking/list', 'marketCapRanking'),
           ('/community/chat/messageList', 'chatMessages'), ('/kline/info/detail', 'klineInfo')]
    for p, f in fix:
        P.append('| `%s` | `%s` |' % (p, f))
    P.append('')
    return '\n'.join(P) + '\n'


# ---------------------------------------------------------------- openapi.yaml
def yaml_quote(s):
    return '"%s"' % str(s).replace('\\', '\\\\').replace('"', '\\"')


def build_openapi():
    L = []
    L.append('# OpenAPI 3.0 契约 —— 由 gen_api_docs.py 从 endpoint_meta.py 生成')
    L.append('# 路径唯一事实源：src/api/index.js，由 verify_paths.py 机器校验')
    L.append('openapi: 3.0.3')
    L.append('info:')
    L.append('  title: 青川数字艺术 H5 平台 API')
    L.append('  version: 1.0.0')
    L.append('  description: |')
    
    L.append('    注意：code=1 表示成功（前端 utils/api.js L24 仅认 1），非 0。')
    L.append('servers:')
    L.append('  - url: http://localhost:3000')
    L.append('    description: 本地开发')
    L.append('')
    L.append('security:')
    L.append('  - TokenAuth: []')
    L.append('')
    L.append('paths:')
    for path, m in sorted(E.items()):
        # OpenAPI 路径参数用 {param} 记法，动态段固定为 {id}
        opath = re.sub(r'\{[a-z_]+\}', '{id}', path)
        L.append('  %s:' % yaml_quote(opath))
        L.append('    post:')
        L.append('      summary: %s' % yaml_quote(m['title']))
        L.append('      tags: [%s]' % yaml_quote(m['domain'].split(' ')[0]))
        if not m['auth']:
            L.append('      security: []')
        # parameters 数组：无参数时必须写 []，否则 YAML 把空键解析为 null
        has_params = m['auth'] or any(
            s in ('path', 'param') for s, *_ in m['params'])
        if has_params:
            L.append('      parameters:')
            if m['auth']:
                L.append('        - $ref: "#/components/parameters/Token"')
            for src, name, typ, req, desc in m['params']:
                if src == 'path':
                    L.append('        - name: id')
                    L.append('          in: path')
                    L.append('          required: true')
                    L.append('          schema: { type: integer }')
                    L.append('          description: %s' % yaml_quote(desc))
                elif src == 'param':
                    L.append('        - name: %s' % yaml_quote(name))
                    L.append('          in: query')
                    L.append('          required: %s' % str(req).lower())
                    L.append('          schema: { type: %s }'
                             % ('integer' if typ == 'integer' else 'string'))
                    L.append('          description: %s' % yaml_quote(desc))
        else:
            L.append('      parameters: []')
        # body
        bs = [(n, t, r, d) for s, n, t, r, d in m['params'] if s == 'data']
        if bs:
            props = []
            reqp = []
            for n, t, r, d in bs:
                if n in ('无', '待确认'):
                    continue
                jt = 'string' if t == 'string' else 'integer'
                # 缩进须与 properties 下的子键对齐（16 空格），否则 YAML 层级错乱
                props.append('                %s:\n                  type: %s\n'
                             '                  description: %s'
                             % (yaml_quote(n), jt, yaml_quote(d)))
                if r:
                    reqp.append(n)
            if props:
                L.append('      requestBody:')
                L.append('        required: true')
                L.append('        content:')
                L.append('          application/json:')
                L.append('            schema:')
                L.append('              type: object')
                if reqp:
                    L.append('              required: [%s]' % ', '.join(yaml_quote(x) for x in reqp))
                L.append('              properties:')
                L.extend(props)
        # responses
        L.append('      responses:')
        L.append('        "200":')
        L.append('          description: %s' % yaml_quote(
            SCHEMA_KEY[m['style']] + '（code=1 表示业务成功）'))
        L.append('          content:')
        L.append('            application/json:')
        L.append('              schema:')
        L.append('                allOf:')
        L.append('                  - $ref: "#/components/schemas/Envelope"')
        L.append('                  - type: object')
        L.append('                    properties:')
        L.append('                      data:')
        RESP_LINES(m, L)
        L.append('        "401":')
        L.append('          description: %s' % yaml_quote('未登录或 token 失效（前端将清除 token）'))
        L.append('          content:')
        L.append('            application/json:')
        L.append('              schema: { $ref: "#/components/schemas/Envelope" }')
    L.append('')
    L.append('components:')
    L.append('  securitySchemes:')
    L.append('    TokenAuth:')
    L.append('      type: apiKey')
    L.append('      in: header')
    L.append('      name: token')
    L.append('      description: %s' % yaml_quote('JWT。源站用 token 头（非 Authorization: Bearer），不可更改。'))
    L.append('  parameters:')
    L.append('    Token:')
    L.append('      name: token')
    L.append('      in: header')
    L.append('      required: true')
    L.append('      schema: { type: string }')
    L.append('      description: %s' % yaml_quote('登录接口返回的 JWT'))
    L.append('  schemas:')
    L.append('    Envelope:')
    L.append('      type: object')
    L.append('      required: [code, msg, data, time]')
    L.append('      properties:')
    L.append('        code:')
    L.append('          type: integer')
    L.append('          description: 1=成功；400/401/403/404/409/422/500/503=错误。**1 是成功，不是 0**')
    L.append('          enum: [1, 400, 401, 403, 404, 409, 422, 500, 503]')
    L.append('          example: 1')
    L.append('        msg:')
    L.append('          type: string')
    L.append('          example: ok')
    L.append('        data:')
    L.append('          description: 业务数据。形状按接口而定，共 5 种封装风格')
    L.append('        time:')
    L.append('          type: string')
    L.append('          format: date-time')
    return '\n'.join(L) + '\n'


SCHEMA_KEY = {
    'A': 'data 为裸数组',
    'B': 'data 为标准分页对象 {total,per_page,current_page,last_page,data[]}',
    'C': 'data 为精简分页对象 {total,data[]}',
    'D': 'data 为单对象',
    'E': 'data 为嵌套混合对象 {product:{},...分页}',
}


def RESP_LINES(m, L):
    """把响应字段写成 OpenAPI properties；数组风格给出 items 说明"""
    style = m['style']
    indent = ' ' * 24
    fields = [(f, t, d) for f, t, d in m['resp']]
    # 顶层是数组的场景
    if fields and fields[0][0] == '[]':
        L.append(indent + 'type: array')
        L.append(indent + 'items:')
        L.append(indent + '  type: object')
        L.append(indent + '  description: %s' % yaml_quote(fields[0][2]))
        return
    L.append(indent + 'type: object')
    L.append(indent + 'description: %s' % yaml_quote(SCHEMA_KEY[style]))
    L.append(indent + 'properties:')
    for f, t, d in fields:
        L.append(indent + '  %s:' % yaml_quote(f))
        if t.startswith('array'):
            L.append(indent + '    type: array')
            L.append(indent + '    description: %s' % yaml_quote(d))
            L.append(indent + '    items: { type: object }')
        elif t in ('object',):
            L.append(indent + '    type: object')
            L.append(indent + '    description: %s' % yaml_quote(d))
        elif t == '-':
            L.append(indent + '    description: %s' % yaml_quote(d))
        else:
            L.append(indent + '    type: %s' % t)
            L.append(indent + '    description: %s' % yaml_quote(d))


if __name__ == '__main__':
    used, mm, fns = read_source()
    (HERE / 'API.md').write_text(build_md(used, mm, fns), encoding='utf-8')
    (HERE / 'openapi.yaml').write_text(build_openapi(), encoding='utf-8')
    print('已生成 API.md（%d 接口）' % len(E))
    print('已生成 openapi.yaml（%d paths）' % len(E))
