# 青川数字艺术 H5 平台 · 后端技术方案

> 版本：v1.0 · 勘察日期 2026-10-18
> 状态：方案定稿（本轮不出实现代码）
> 依据：`src/api/index.js`（313 行实测）、`src/utils/api.js`、`src/pages/` 下105 个 `.vue` 实测调用、`docs/DATABASE.md` v1.2（48 表）、`scripts/dialect.py`
> 铁律：路径与 `src/api/index.js` 逐字一致，由 `docs/backend/verify_paths.py` 门禁校验

---

## 0. 前置事实修正声明（重要）

开工前对「112 个接口」这一前提做了实测复核，结论如下。**这不是纠错，而是必须先对齐的契约基线**——若按 112 条写文档，其中 42 条会是凭空发明的路径，后端照着实现即为纯浪费。

| 指标 | 提交口径 | 实测 | 判定依据 |
|---|---|---|---|
| `request()` 调用次数 | 112 | **65** | `grep -c "request(" src/api/index.js` |
| 唯一请求路径 | 112 | **58** | 65 次去重（5 组多函数复用 + 1 条动态路径） |
| `MOCK_MAP` 登记路径 | — | **67** | 解析 `MOCK_MAP` 字面量 |
| **后端需实现路径（并集）** | 112 | **69** | 58 活跃 + 11 条 MOCK_MAP 已登记但无函数调用；另有 1 条脏键已豁免 |
| `src/pages/` 下 `.vue` | 105 | **105** | 一致 |

差异根因：112 这个数字**不存在于代码中**。全仓 grep 确认接口定义唯一来源是 `src/api/index.js`，无第二处定义点。65 次调用里有 5 组多函数指向同一路径，这是「函数数≠路径数」的主要来源：

| 路径 | 指向它的 api 函数 |
|---|---|
| `/order/order/myConsignment` | `consignList` / `myConsignment` / `consignSearch` / `cancelConsignment` |
| `/market/trade/begBuyOrderList` | `entrustList` / `begList` |
| `/market/trade/begBuyOrderInfo` | `entrustInfo` / `begInfo` |
| `/market/trade/createBegBuyOrder` | `submitEntrust` / `submitBegBuy` |
| `/index/getSeries` | `getSeries` / `seriesList` |

**本方案按 69 条并集口径推进**，每条在 API.md 总览表中标注`调用状态`（活跃 / 仅登记），使范围可追溯。

### 0.1 阻塞级缺陷：`utils/api.js` 调用了 11 个不存在的方法

`src/utils/api.js` 在远程模式下会调用 11 个 `api.xxx()`，但 `src/api/index.js` 的 api 对象里**没有这些键**：

```
chatMessages      klineInfo        leaderboardGoods   leaderboardUser
marketCapRanking  masterRank       rebateInfo         rebateInviteDetail
rebateLeaderboard regiftRecord     userBuyRank
```

后果链条：远程模式 → `api.rebateInfo is not a function` 抛 `TypeError` → 被 `utils/api.js` L26的 `catch (e) {}` 静默吞掉 → 回落读本地 mock。**页面看起来正常，但返利中心 / 排行榜 / 转赠记录 / 聊天 / K线这 5 个域在远程模式下永远拿不到真实数据**，且无任何报错暴露。

这与「不需要改前端一行代码」的判断冲突。本方案的处理：后端按路径正常实现这 11 个接口，另出前端补丁清单（§10），**改动仅限api 对象新增转发函数，不触碰任何页面**。

---

## 1. 技术栈选型

### 1.1 候选组合与评分

评价维度按 MVP 实际权重设定。`扩展性`权重刻意压低——本项目接口契约已由前端固化，扩缩容需求要到有真实流量后才会出现，为不存在的需求付设计成本是本末倒置。

评分 1-5 分，5 为最优。

**候选 A：Express 4 + better-sqlite3 / mysql2 + 裸 SQL（本方案选定）**

| 维度 | 权重 | 得分 | 加权 | 依据 |
|---|---|---|---|---|
| 学习成本 | 高 | 5 | 25 | 团队无需学新框架，Express 中间件模型是 Node 生态默认心智 |
| 生态成熟度 | 高 | 5 | 25 | 生态最大，运维遇到的问题必有前人踩过 |
| 部署成本 | 高 | 5 | 25 | 零外部依赖，Node 标准库 +两个驱动即可|
| 扩展性 | 低 | 3 | 3 | 单体无状态可水平扩，但 Express 无内置约束校验 |
| 团队熟悉度 | 高 | 4 | 20 | 与前端同为 JS，类型定义可共享 |
| **合计** | | | **98** | |

**候选 B：Fastify 5 + Prisma 5**

| 维度 | 得分 | 加权 | 扣分原因 |
|---|---|---|---|
| 学习成本 | 3 | 15 | Fastify 插件体系有学习成本；Prisma 的 schema DSL 需新增一层建模语言 |
| 生态成熟度 | 4 | 20 | 生态小于 Express，但足够 |
| 部署成本 | 2 | 10 | **Prisma 需独立 query engine 二进制**，SQLite 场景下体积 +启动开销明显；Docker 镜像膨胀 |
| 扩展性 | 5 | 5 | schema 迁移工具最强|
| 团队熟悉度 | 2 | 10 | 团队无 Prisma 经验 |
| **合计** | | **60** | |

否决理由（核心一条）：**Prisma 的价值在「schema 优先 + 迁移」，而本项目的 schema 已经 100% 定稿**（`docs/schema.sql` 48 表已通过 sqlglot MySQL 解析 + SQLite 实执行双重验证）。引入 ORM 等于用一个尚未定稿的 DSL 去覆盖一份已定稿的 DDL，纯增加翻译层与故障面。且 Prisma 对 SQLite 的支持是二等公民，切MySQL 时行为差异需重测——而本项目「SQLite 优先 + MySQL 可换」是已定决策，不能让ORM 的方言偏好干扰它。

**候选 C：Koa 2 + Drizzle ORM**

| 维度 | 得分 | 加权 | 扣分原因 |
|---|---|---|---|
| 学习成本 | 3 | 15 | Koa 的洋葱模型对团队是额外概念负担 |
| 生态成熟度 | 3 | 15 | 明显小于 Express |
| 部署成本 | 4 | 20 | Drizzle 轻量，无独立二进制，优于 Prisma |
| 扩展性 | 4 | 4 | 支持多方言 |
| 团队熟悉度 | 3 | 15 | 无 Drizzle 经验 |
| **合计** | | **69** | |

否决理由：Drizzle 的类型推导质量确实好，但本项目响应结构被前端按5 种封装硬解析，**类型推导的价值在服务端被削弱**——我们需要的是精确控制输出的 JSON 形状，而非推导出的类型。且 Drizzle 的 schema 定义需手写 TS，与已有的 MySQL DDL 同样是重复建设。

### 1.2 数据访问层：裸 SQL + 自建方言适配器

**结论：不引入 ORM，在 Node 侧重建一个轻量方言适配器（不复用 Python 的 `dialect.py` 代码，但复用其设计思想）。**

为什么不复用 `scripts/dialect.py`：它是 Python + 标准库 `sqlite3` + PyMySQL 的实现，Node 侧无法直接引用。且它的职责是「灌库」（建表 + 批量插入 + FK 校验），而服务端需要的是「查询 + 分页 + 事务」。**复用设计思想，不复用代码**。

需要收敛的方言差异及本项目实际是否触发：

| 差异点 | SQLite | MySQL 8.0 | 本项目是否触发 | 处理方式 |
|---|---|---|---|---|
| 占位符 | `?` | `?`（mysql2 也支持） | 是 | 统一用 `?`，两侧通吃，零成本 |
| 自增 | `INTEGER PRIMARY KEY AUTOINCREMENT` | `BIGINT AUTOINCREMENT` | 否 | DDL 已由 `schema_sqlite.sql` / `schema.sql` 分别生成，运行时不管 DDL |
| 布尔 | `INTEGER` 0/1 | `TINYINT(1)` | 是 | DAL 出入参统一 `boolean`，adapter 转换 |
| 日期函数 | `date()` / `strftime()` | `DATE_FORMAT()` | 是 | 收敛到 `D.dialects.sqlDateFormat()`，默认不用 SQL 格式化，**时间在应用层处理** |
| 分页 | `LIMIT n OFFSET m` | `LIMIT m, n` | 是 | **关键差异**。统一暴露 `D.limit(limit, offset)` 生成方言正确子句，不让 SQL 散落各repository |
| `INSERT` 返回自增 id | `lastInsertRowid` | `insertId` | 写操作阶段触发 | `D.insertAndGetId()` |
| JSON 字段 | `TEXT` | `JSON` | 是 | 查询侧统一 `JSON.parse`，避免方言函数 |
| 金额精度 | `TEXT`（无 DECIMAL） | `DECIMAL` | 是 | **禁止 float**。DAL 出入参用字符串，MySQL 侧交给驱动按 DECIMAL 精度落库 |

**分页差异是唯一必须在 SQL 层处理的**——因为 `LIMIT n OFFSET m` 与 `LIMIT m, n` 是语法级的，不收敛就会在每个 repository 里写if 判断。

### 1.3 Node 侧关键依赖（仅 3 个）

| 依赖 | 版本 | 用途 | 为什么必须有 |
|---|---|---|---|
| `express` | ^4.19 | HTTP 框架 | 路由与中间件 |
| `better-sqlite3` | ^11 | SQLite 驱动 | 同步 API，事务处理最简，无回调地狱 |
| `mysql2` | ^3 | MySQL 驱动 | 切换 MySQL 时用，SQLite 模式下不 require |

JWT 用 `jsonwebtoken`（^9），密码哈希用 `node:crypto` 的 `scrypt`（**标准库自带，不引 bcrypt**——省掉一个原生编译依赖，scrypt 是 Argon2 之外的 NIST 推荐方案）。

**跨域不引 `cors` 包，手写 `middleware/cors.js`**：依赖刻意锁在 3 个，`cors` 的全部能力就是「设几个响应头 + 拦 OPTIONS」；且本项目需要「白名单外来源不写CORS 头、但请求照常处理」这一非标准行为。手写 75 行可控、可审计，也不必为一个中间件引入第 4 个依赖。白名单读 `CORS_ORIGINS`（逗号分隔，默认 `http://localhost:5173`）。

**挂载顺序（`src/app.js`，不可调换）**：
`express.json` → **`cors`** → `auth(attach)` → `requestLog` → routes → notFound → errorHandler。
CORS 必须**早于 auth**：否则 OPTIONS 预检会先撞鉴权返回 401，浏览器判定预检失败，全站跨源请求被拦截（表现为页面靠 mock 兜底不报错、但后端一个接口都没接通）。

**刻意不引入的东西**：pino（日志先用标准库 `console` + 结构化 JSON 格式，够用）、helmet（先手工加 3 个响应头）、swagger-ui（契约文档已由 openapi.yaml 承担）。

---

## 2. 分层架构

```
HTTP 请求
    │
    ▼
┌─────────────────────────────────────────────────────┐
│ routes/          路由注册 · 路径绑定 · 零业务逻辑      │
│                  只做三件事：挂中间件、绑handler、声明   │
│                  路径参数校验                          │
├─────────────────────────────────────────────────────┤
│ middleware/      横切关注点（可在任意层前后执行）       │
│  auth.js         token 解析 → 挂 req.user             │
│  respond.js      统一 {code,msg,data,time} 封装       │
│  error.js        异常 → 错误码映射                   │
│  requestLog.js   访问日志                            │
├─────────────────────────────────────────────────────┤
│ controllers/     HTTP 语义层                          │
│                  解析 param/body → 调 service         │
│                  → 用 responder 还原源站5 种封装之一   │
│                  【边界】不做业务判断、不写 SQL        │
├─────────────────────────────────────────────────────┤
│ services/        业务逻辑层                            │
│                  权限校验、状态机流转、跨表编排          │
│                  【边界】不感知 HTTP（不读 req/res）    │
├─────────────────────────────────────────────────────┤
│ repositories/    数据访问层                │
│                  单表 CRUD + 领域聚合查询               │
│                  【边界】只有本层写 SQL                 │
├─────────────────────────────────────────────────────┤
│ db/              方言适配 + 连接管理                   │
│                  D.limit() / D.bool() / D.insertId()  │
└─────────────────────────────────────────────────────┘
```

### 2.1 每层职责与「为什么这样切」

**为什么 controllers 要有「还原封装」这一职责**：本项目最硬的约束是前端按 5 种不同形状解析 `data`。若让 services 返回规范化的 `{items, total}`，则封装逻辑散落在每个 service 里，一旦漏改就是整页白屏。**把封装收拢到 controller 的 responder，让「哪些接口是哪种封装」在一处可查、可测**，是防御白屏的最有效手段。

**为什么 services 不感知 HTTP**：写操作（TODO 阶段）会包含状态机校验（如订单 `status=1` 才可取消）。这些规则与传输无关，写在 service 里才能被将来的定时任务、CLI 复用。若写进 controller，逻辑就锁死在 HTTP 场景。

**为什么 repositories 单表为主但允许聚合查询**：DATABASE.md §8 的映射显示多处 mock 天然跨表（如 `marketDetail` → `market_listings` + `products` + `user_collections` + `users`）。强行拆成单表查询会让 N+1 问题暴露。规则定为：**单表操作用 baseRepository，多表聚合允许写专用 SQL 方法，但一律只出现在 repositories 层。**

**依赖方向铁律**：只能向下。`repositories` 不得 import `services`；`services` 不得 import `controllers`。这条靠 ESLint `import/no-restricted-paths` 规则机器化校验，不靠人自觉。

### 2.2 「先读后写」在分层上的体现

本轮 69 条中 **7 条为写操作**，全部只到 controller 层即止：

```
route → middleware → controller → service（返回契约声明的空成功响应）
                                    ↑
                          service 内部 TODO 桩：本轮不写库
```

service 层写方法先返回符合源站结构的成功响应，并打印一条带 `TODO_IMPL` 前缀的警告日志。**理由**：前端在远程模式下需要能跑通完整流程做联调，若返回错误会导致页面中断；但绝不能假写入——一旦假写入，`orderList` 会返回伪造订单，联调时无法区分真实 bug 与桩数据 bug，排查成本反而更高。

---

## 3. 数据访问层设计

### 3.1 连接配置

单一配置入口 `src/config/database.js`，依据 `DB` 环境变量二选一：

```js
// 决策依据：与 scripts/dialect.py 完全一致的开关语义，保持团队心智统一
const driver = process.env.DB === 'mysql' ? mysqlAdapter : sqliteAdapter
```

**为什么沿用 `DB=mysql` 这个开关名**：`scripts/dialect.py` 已用该约定并写入 `scripts/README.md`，换名字会让「同一项目两套切换方式」成为新的困惑源。复用已验证的约定比引入新约定更划算。

### 3.2 方言差异收敛点（`db/dialect.js`）

只暴露 6 个方言方法，其余差异不允许出现在 repository 里：

| 方法 | SQLite | MySQL | 调用方 |
|---|---|---|---|
| `limit(l, off)` | `LIMIT l OFFSET off` | `LIMIT off, l` | 所有分页查询 |
| `bool(v)` | `v ? 1 : 0` | 同| 布尔条件 |
| `insertAndGetId()` | `lastInsertRowid` | `insertId` | 写操作阶段 |
| `inPlaceholders(n)` | `?,?,?` | 同 | IN 查询 |
| `jsonParse(s)` | `JSON.parse` | 同 | JSON 列 |
| `money(v)` | 字符串透传 | 字符串透传 | 金额，禁止 float |

**「禁止 float」的硬约束**：DATABASE.md §6.4 已裁决金额禁用 FLOAT/DOUBLE。Node 侧 `JSON.parse` 出的数字一律不参与金额运算；金额在 DAL 边界即转字符串。违反此条会导致分账总额对不上——这是数字藏品平台最敏感的缺陷。

### 3.3 连接生命周期

单例连接 + 进程退出时关闭，**不用连接池**。理由：SQLite 是单文件单写者，连接池无意义；MySQL 场景下本项目是只读为主的分析型负载，连接数不超过 10，池化收益低于其带来的「连接被借出后未归还」故障面。

---

## 4. 鉴权方案

### 4.1 选 JWT 的理由（对比 session）

| 方案 | 结论 |
|---|---|
| **JWT（本方案）** | 服务端无状态 → 可多进程/多实例直接扩，无需 session 共享（Redis 或粘性会话）。这与「DevOps 部署后验证」的场景强相关 |
| 不透明 token + session表 | 与源站行为最像，但服务端存状态，进程重启即全员登出；水平扩容需引入 Redis，等于把「单体零依赖」的优势全部抵消 |

### 4.2 契约（与前端既有约定完全对齐，不改一处前端代码）

**请求头**（前端 `remoteRequest` 已固定发出）：

| 头| 值 | 备注 |
|---|---|---|
| `Content-Type` | `application/json` | 前端硬编码 |
| `version` | `1.0.1` | 前端硬编码，服务端仅记录日志，不做校验（校验会引入源站未证实的约束） |
| `token` | JWT string | **仅登录后存在**，未登录时前端不发此头 |

**为什么不用 `Authorization: Bearer`**：前端已硬编码为 `token` 头。改这个头要动前端，违反铁律。服务端从 `token` 头读取即可。

**响应失效**：`code === 401` 时前端 `setToken('')` 清 token。服务端在 token 缺失/无效/过期时统一返回 401。

**注意对称性**：前端 `localRequest` 的兜底返回是 `{ code: 1 }`（成功）。所以 **401 绝不能与业务错误码混用**，必须独占。

### 4.3 JWT 设计

| 项 | 值 | 为什么 |
|---|---|---|
| 算法 | HS256 | 单体服务，无公钥分发需求；RS256 的密钥管理成本在单体阶段是纯浪费 |
| 载荷 | `{ uid, nickname, iat, exp }` | **只放鉴权必需项**。不放手机号、不放权限列表——载荷是 Base64 明文，前端可解码 |
| 有效期 | 7 天 | 与源站 token 生命周期量级一致；H5 场景用户不应频繁重登 |
| 密钥 | `JWT_SECRET` 环境变量 | **禁止硬编码、禁止入库**。缺失时服务启动即失败（fail-fast）而非降级为「密钥为空」 |
| 刷新 | 本轮不做 | 无 refresh 接口契约。过期后前端清 token 走登录流程——**这是当前前端能处理的唯一路径**，加 refresh 反而要改前端 |

**为什么 fail-fast 而非降级**：`JWT_SECRET` 为空时若用默认值启动，服务能跑但**任何人都能伪造 token**。这类「静默降级为不安全状态」是安全事故的常见起点。启动失败会在部署时立刻暴露（DevOps 健康检查拦截），比运行中被利用好得多。

### 4.4 免鉴权白名单（按 69 条实测清单判定）

判定依据是**接口是否依赖登录用户身份**，而非源站是否传了 token。

> 本节清单由 `endpoint_meta.py` 的 `auth` 字段导出，与 `API.md` 总览表同源，勿手工维护。

**公开读（30 条）**

`/activeSelected/list`、`/activity/draw/info`、`/addons/diypage/index`、`/banner/show/getBanner`、`/box/blind_box/list`、`/community/chat/messageList`、`/compound/compound/list`、`/compound/compound/scheme`、`/index/afficheDetail`、`/index/afficheList`、`/index/affichetypelist`、`/index/getConfig`、`/index/getSeries`、`/index/newsDetail`、`/kline/info/detail`、`/leaderboard/leaderboard/goods`、`/lottery/lottery/info`、`/lottery/lottery/rule`、`/market/market/MarketDetail/ids/{id}`、`/market/market/getMarketList`、`/market/market/seriesGoodsList`、`/market/trade/collectionDetail`、`/marketCapRanking/marketCapRanking/list`、`/product/product/detail`、`/product/product/rule`、`/rank/masterRank/list`、`/rank/userBuy/list`、`/shequ/rumor/info`、`/user/login`、`/user/register`

**登录类（2 条，单列）**：`/user/login`、`/user/register`

**需鉴权（39 条）**

`/activity/draw/record`、`/box/blind_box/myBox`、`/box/blind_box/openlog`、`/compound/compound/record`、`/compound/compound/result`、`/crystal_goods/boxDetail`、`/crystal_goods/collectionDetail`、`/crystal_goods/crystalDetail`、`/crystal_goods/crystalList`、`/crystal_goods/exchangeRecord`、`/crystal_goods/goodsDetail`、`/draw/InvitationFriendAssist/info`、`/draw/Leaderboard/list`、`/draw/communityShare/info`、`/draw/drawResult/result`、`/invitation/invitation/info`、`/invitation/invitation/record`、`/leaderboard/leaderboard/user`、`/lottery/lottery/record`、`/market/trade/begBuyOrderInfo`、`/market/trade/begBuyOrderList`、`/market/trade/collectionInfo`、`/market/trade/createBegBuyOrder`、`/market/trade/flowDoc`、`/market/trade/getSellCollectionInfo`、`/market/trade/sell`、`/market/trade/userCollectionList`、`/order/order/myConsignment`、`/order/order/orderList`、`/order/order/saleMarketOrderDetail`、`/rebate/rebate/index`、`/rebate/rebate/inviteDetail`、`/rebate/rebate/leaderboard`、`/regift/record/list`、`/sign/index/info`、`/user/address/lists`、`/user/getUserInfo`、`/user_collection/user_collection/openbox`、`/user_collection/user_collection/openboxone`

**三处需说明的判定**：

1. `/community/chat/messageList` 定为**公开**。mock 是静态 7 条演示数据，但这是 11 个缺失方法之一，前端当前调不到。**真实落地时必须改为鉴权** —— `is_self` 字段说明聊天记录天然属用户私有数据。契约先按 mock 可用性定，语义风险已记录。
2. `/crystal_goods/crystalList` 定为**需鉴权**：响应含 `user_info`（昵称、头像）与 `crystal_number`（积分余额），是用户私有数据。`/crystal_goods/*` 其余 5 条为公开。
3. `/draw/Leaderboard/list`（含 `myrank` 我的排名）、`/leaderboard/leaderboard/user`（含 `my` 我的手机号）、`/draw/drawResult/result`（本人抽签码与结果）均定为**需鉴权**；而`/rank/*`、`/marketCapRanking/*`、`/leaderboard/leaderboard/goods`、`/activity/draw/info` 为纯公开榜单/活动信息。

**白名单的实现边界**：白名单只免除「必须登录」，**不免除参数校验**。公开接口的 `id` 仍要校验类型与范围 —— 公开接口是攻击面，不是豁免区。

---

## 5. 错误处理规范

### 5.1 源站 code=1 是成功 —— 错误码必须避开 1

前端两处硬编码依赖此事实：
- `utils/api.js` L24：`if (res && res.code === 1) return pick(...)` —— **非 1 一律视为失败**
- `api/index.js` L158：兜底返回 `{ code: 1, msg: 'ok', data: [] }`

故错误码从 **400 段起**，完全不占用 1与 0。

| code | 语义 | msg 示例 | 前端行为 |
|---|---|---|---|
| `1` | **成功** | `ok` / 业务自定义文案 | 正常解析 |
| `0` | 保留（不用） | — | 视为失败（因非 1） |
| `400` | 参数校验失败 | `参数 id 缺失` | 视为失败 |
| `401` | 未登录 / token 无效或过期 | `登录已失效，请重新登录` | **清空 token** |
| `403` | 无权限（非本人数据） | `无权访问该数据` | 视为失败 |
| `404` | 资源不存在 | `藏品不存在` | 视为失败 |
| `409` | 状态冲突（如重复提交） | `订单已取消，无法重复操作` | 视为失败 |
| `422` | 业务规则不通过（库存不足等） | `余额不足` | 视为失败 |
| `500` | 系统内部错误 | `服务异常` | 视为失败 |
| `503` | 数据库不可用 | `数据源暂不可用` | 视为失败 |

### 5.2 分层错误的传播机制

```
repository 抛 DataError(code, msg)      ← 数据层已知的问题（唯一允许抛业务码的地方）
    ↓
service 捕获并补充业务语义，或抛BusinessError
    ↓
controller 不捕获，直接向上抛
    ↓
middleware/error.js 统一捕获 →映射为 {code,msg,data:null,time}
```

**为什么 controller 不捕获**：一旦 controller 各写各的 try/catch，错误码映射就会分散，最终出现「某些接口返回 code:0」这类不一致——前端视其为失败但 `data` 有值，行为不可预测。**错误映射只允许有一个地方**。

**500 的 msg 必须是固定文案**：不得把 `err.message` 直接返回。SQL 错误信息会泄露表名与列名。前端只需知道「失败了」，诊断靠服务端日志。

### 5.3 分层错误类型定义

| 异常类 | 抛出层 | code | 说明 |
|---|---|---|---|
| `ValidationError` | routes / controllers | 400 | 参数缺失、类型错、越界 |
| `AuthError` | middleware | 401 | token 无效或过期 |
| `ForbiddenError` | services | 403 | 访问他人数据 |
| `NotFoundError` | repositories / services | 404 | 资源不存在 |
| `ConflictError` | services | 409 | 状态冲突 |
| `BusinessError` | services | 422 | 业务规则不通过 |
| `DataSourceError` | db | 503 | 数据库不可用 |
| 其他 `Error` | 任意 | 500 | 未预期，走统一兜底 |

---

## 6. 分页规范

### 6.1 源站两种分页风格

| 风格 | 结构 | 实测出现于 |
|---|---|---|
| **标准分页** | `{total, per_page, current_page, last_page, data:[]}` | `orderList` `afficheList` `banner_show_getBanner` |
| **精简分页** | `{total, data:[]}` | `marketGoodsList` `entrustList` `myConsignment` `invitationRecord` |
| **裸数组** | `[]`（无分页元数据） | `marketList` `flowDoc` `leaderboard` 等 24 个 |

### 6.2 统一实现

分页元数据由 service 层以统一结构返回，**由 controller 的 responder 决定输出哪种形状**：

```
service 返回 { items: [], total: 120, page: 1, pageSize: 15 }
    │
    ├─ responder.standardPagination() → {total, per_page, current_page, last_page, data: items}
    ├─ responder.slimPagination()     → {total, data: items}
    └─ responder.bareList()           → items
```

**为什么不让前端适配后端统一格式**：前端 `listOf()` 只做了一层兼容（`data` 是数组，或 `data.data` 是数组）。若后端统一成标准分页，`listOf` 能兼容；但若统一成精简分页，依赖 `per_page` 的页面就拿不到值。**响应形状必须匹配前端既有解析，不是匹配后端审美。**

### 6.3 分页参数命名不统一（重要）

实测前端在不同接口用了**两套分页参数名**：

| 参数名 | 使用接口 | 来源 |
|---|---|---|
| `page` + `limit` | `orderList` `consignList` | `utils/api.js` L70 / L79 实参 |
| `page` + `list_rows` | `afficheList` `marketList` | `Market.vue` L237 / `Search.vue` L120 实参 |

**这是源站的混乱，不是前端的 bug。** 后端必须**两条都接受**，否则 `orderList` 或 `afficheList` 其中之一会失效。

**为什么接受而不「修正」**：修正意味着要改前端调用实参（违反零改动铁律），或在后端做猜测映射（引入隐式行为，且新页面无法自解释）。

统一优先级：`limit` > `list_rows` > 默认 15；`page` 两边同名，直接使用。`page` 从 1 开始（实测 `page: 1` 为首屏），转 SQL 时 `OFFSET = (page-1) * pageSize`。

`pageSize` 上限 100，**防止 `list_rows: 99999` 打爆内存**——这是公开接口最容易被滥用的参数。

---

## 7. 配置管理

### 7.1 环境变量清单

| 变量 | 默认值 | 必填 | 说明 |
|---|---|---|---|
| `PORT` | `3000` | 否 | 监听端口 |
| `HOST` | `0.0.0.0` | 否 | 容器内需 `0.0.0.0`，否则只监听 loopback 导致健康检查失败 |
| `DB` | `sqlite` | 否 | `sqlite` / `mysql` |
| `SQLITE_PATH` | `./data/qingchuan.db` | 否 | SQLite 文件路径 |
| `DB_HOST` | `127.0.0.1` | MySQL 必填 | |
| `DB_PORT` | `3306` | 否 | |
| `DB_USER` | `root` | MySQL 必填 | |
| `DB_PASSWORD` | — | MySQL 必填 | 生产必须设置 |
| `DB_NAME` | `qingchuan` | MySQL 必填 | |
| `JWT_SECRET` | — | **是** |缺失则启动失败（§4.3） |
| `JWT_EXPIRES_IN` | `7d` | 否 | |
| `LOG_LEVEL` | `info` | 否 | `debug` / `info` / `warn` / `error` |
| `PAGE_SIZE_MAX` | `100` | 否 | 分页上限（§6.3） |

### 7.2 .env 约定

- `.env.example` 入库，**`.env` 不入库**（`.gitignore` 必须含 `.env`，否则密钥泄露）
- `JWT_SECRET` 生成：`node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`
- 本地 `.env` 与生产 `.env` 的差异只有 `JWT_SECRET` 与 `DB_*`，其余共用

**为什么不用 `.env` 之外的环境注入（Vault / KMS）**：本项目是单体 MVP，密钥需求量级为 1（`JWT_SECRET`）。引入密钥管理服务是运维复杂度的净增加。**但 `.env` 必须进 `.gitignore` 这条不可让步。**

---

## 8. 健康检查与可观测性

### 8.1 健康检查设计（DevOps 部署后验证依赖此端点）

`GET /health`（**不加 `/api/v1` 前缀**——因为前端路径不能改，但健康检查是后端自有端点，不与前端契约冲突；且多数 PaaS 默认探测根路径 `/`）

**关键设计：区分存活与就绪。** 单个端点返回所有信息，会导致「数据库抖动」被误判为「进程已死」并触发重启，restart 治不好数据库问题，只会造成重启风暴。

| 端点 | 语义 | 判定 | 用途 |
|---|---|---|---|
| `GET /health` |存活 | 进程能响应即 200，**不查数据库** | 存活探针，挂了才重启 |
| `GET /health/ready` | 就绪 | 校验数据库连通 + 关键表存在，异常返回 503 | 就绪探针，未就绪则不接流量 |
| `GET /health/meta` | 元信息 | 版本、启动时长、驱动类型、各表行数 | 部署后人工验证 |

`/health` 响应示例：

```json
{ "code": 1, "msg": "ok", "data": { "status": "alive", "uptime": 3725 }, "time": "2026-10-18T10:00:00Z" }
```

`/health/ready` 在数据库不可用时：

```json
{ "code": 503, "msg": "数据源不可用", "data": { "status": "not_ready", "driver": "sqlite", "error": "SQLITE_CANTOPEN" }, "time": "..." }
```

**为什么 `ready` 要校验关键表存在**：SQLite 文件存在但表未灌完（`seed.py` 执行中或中断）时，连通性检查会通过，但业务查询会全表报错。加一句 `SELECT COUNT(*) FROM products LIMIT 1` 类检查可提前发现。这类故障在开发环境出现过多次。

**`/health/meta` 的表行数是核对灌库结果的最快手段**：`docs/DATABASE.md` 记载 SQLite 应有 48 表 / 341 行，部署后可直接比对，不用连数据库。

### 8.2 请求日志

结构化 JSON，每请求一行，字段：

```
ts, method, path, status, duration_ms, code, uid, ip
```

**刻意不打 request body**：`/user/login` 的 body 含密码。原始 Apache 日志风格的全量 body 记录是密码泄露的最常见途径。只在 `LOG_LEVEL=debug` 时记录，且需显式脱敏白名单。

---

## 9. 文件结构

```
server/
├── src/
│   ├── index.js               # 入口：装配中间件与路由，listen（仅装配，不含逻辑）
│   ├── app.js                 # Express 实例与中间件链组装
│   ├── config/
│   │   ├── env.js             # 环境变量读取与校验（fail-fast 唯一出口）
│   │   └── database.js        # 驱动选择，导出 db 单例
│   ├── db/
│   │   ├── index.js           # 连接管理、query/queryOne/run 三个出口
│   │   ├── dialect.js         # 方言差异收敛（limit/bool/insertId/inPh/money）
│   │   ├── sqlite.js          # SQLite adapter（better-sqlite3）
│   │   └── mysql.js           # MySQL adapter（mysql2，按需 require）
│   ├── middleware/
│   │   ├── cors.js            # 跨域；白名单 + OPTIONS 预检立即结束（须最先挂载）
│   │   ├── auth.js            # token 解析 → req.user；白名单放行
│   │   ├── respond.js         # {code,msg,data,time} 封装 + 5 种 responder
│   │   ├── error.js           # 异常 → 错误码映射（全项目唯一出口）
│   │   └── requestLog.js      # 结构化访问日志
│   ├── errors/
│   │   └── index.js           # 7 类异常定义（各 3-5 行）
│   ├── routes/
│   │   ├── index.js           # 汇总挂载各域路由
│   │   ├── index.routes.js         # 首页配置 / 轮播 / 公告 / 系列 / 装修
│   │   ├── market.routes.js        # 市场 / 行情 / 品类
│   │   ├── trade.routes.js         # 订单 / 寄售 / 委托 / 求购 / 成交
│   │   ├── user.routes.js          # 账户 / 地址 / 邀请 / 认证
│   │   ├── collection.routes.js    # 我的藏品 / 流转 / 盲盒
│   │   ├── activity.routes.js      # 合成 / 转盘 / 签到 / 抽签 / 精选活动
│   │   ├── shop.routes.js          # 积分商城
│   │   ├── community.routes.js     # 墙 / 聊天 / 潮玩有话说
│   │   └── stats.routes.js         # 返利 / 榜单 / 市值 / K线
│   ├── controllers/           # 与 routes 一一对应，每文件 ≤6 个接口
│   │   ├── index.controller.js
│   │   ├── market.controller.js
│   │   ├── trade.controller.js
│   │   ├── user.controller.js
│   │   ├── collection.controller.js
│   │   ├── activity.controller.js
│   │   ├── shop.controller.js
│   │   ├── community.controller.js
│   │   └── stats.controller.js
│   ├── services/              # 与 controllers 对应
│   │   ├── index.service.js
│   │   ├── market.service.js
│   │   ├── trade.service.js
│   │   ├── user.service.js
│   │   ├── collection.service.js
│   │   ├── activity.service.js
│   │   ├── shop.service.js
│   │   ├── community.service.js
│   │   └── stats.service.js
│   ├── repositories/          # 数据访问，SQL 只出现在这一层
│   │   ├── base.repository.js     # baseRepository 通用 CRUD
│   │   ├── product.repository.js
│   │   ├── collection.repository.js
│   │   ├── market.repository.js
│   │   ├── order.repository.js
│   │   ├── user.repository.js
│   │   ├── community.repository.js
│   │   ├── activity.repository.js
│   │   ├── shop.repository.js
│   │   └── stats.repository.js
│   └── utils/
│       ├── pick.js            # 从响应对象挑选字段（防脏字段直出）
│       └── validate.js        # 参数校验小工具（类型/范围/必填）
├── docs/backend/
│   ├── ARCHITECTURE.md        # 本文
│   ├── API.md                 # 69 接口契约
│   ├── openapi.yaml           # OpenAPI 3.0
│   └── verify_paths.py        # 路径一致性门禁
├── .env.example
├── .eslintrc.json             # 含 import/no-restricted-paths 分层约束
└── package.json
```

**行数门禁：单文件 ≤300 行（硬约束）**

按此约束推导：`controllers/` 9 个文件覆盖 69 接口 → 平均 7.7 个/文件；`trade` 域有 10 个接口，是最大域，故拆为 `trade.controller.js`（订单/寄售）+ 委托求购合并处理。**任何文件超300 行的处理方式是拆文件，不是压缩代码。**

`utils/pick.js` 单独存在的原因：mock 中存在源站的冗余/脏字段（DATABASE.md §9 列出 12 类，如 `low_price_text` 大写金额、`listimg` 的 `?image_process=` 参数）。用统一 pick 显式声明输出字段，而非把数据库行直接序列化——**后者会把内部字段泄漏成对外契约，一旦泄漏就再也改不动**。

### 9.1 依赖方向校验配置

```json
{
  "rules": {
    "import/no-restricted-paths": ["error", {
      "target": "./src/repositories/**",
      "message": "repositories 不得依赖 services 或上层"
    }]
  }
}
```

---

## 10. 前端补丁清单（11 个缺失方法）

后端按路径实现这 11 个接口后，需前端在 `src/api/index.js` 的 api 对象中补 11 个转发函数。**改动仅限 api 对象，不触碰任何 `.vue` 页面。**

| # | 待新增函数 | 路径 | 需补的方法 |
|---|---|---|---|
| 1 | `rebateInfo` | `/rebate/rebate/index` | POST |
| 2 | `rebateLeaderboard` | `/rebate/rebate/leaderboard` | POST |
| 3 | `rebateInviteDetail` | `/rebate/rebate/inviteDetail` | POST |
| 4 | `masterRank` | `/rank/masterRank/list` | POST |
| 5 | `userBuyRank` | `/rank/userBuy/list` | POST |
| 6 | `regiftRecord` | `/regift/record/list` | POST |
| 7 | `leaderboardGoods` | `/leaderboard/leaderboard/goods` | POST |
| 8 | `leaderboardUser` | `/leaderboard/leaderboard/user` | POST |
| 9 | `marketCapRanking` | `/marketCapRanking/marketCapRanking/list` | POST |
| 10 | `chatMessages` | `/community/chat/messageList` | POST |
| 11 | `klineInfo` | `/kline/info/detail` | POST |

同时需清理 `MOCK_MAP` 中的脏键 `/addons_diypage_index`（该键是文件名而非路径，`localRequest` 永不命中；真路径 `/addons/diypage/index` 已正确登记）。

---

## 11. 本轮发现的问题清单

| # | 问题 | 严重度 | 证据 | 处理 |
|---|---|---|---|---|
| P1 | `utils/api.js` 调用 11 个不存在的 api 方法，远程模式下静默回落 mock | **阻塞** | `utils/api.js` L176-212 vs `api/index.js` api 对象 | §10补丁清单；后端本轮实现路径 |
| P2 | `/market/kline/info/detail` 实际不存在，真实路径为 `/kline/info/detail` | 高 | `MOCK_MAP` L80 | 后端按 `/kline/info/detail` 实现；见下|
| P3 | 分页参数两套命名（`limit` 与 `list_rows`） | 中 | `orderList` L470 vs `marketList` `Market.vue` L237 | 后端两条都接受（§6.3） |
| P4 | `/order/order/myConsignment` 被 4 个函数复用，其中 `cancelConsignment` 是写语义但路径为读接口 | 中 | `api/index.js` L189-200 | 本轮只返回成功响应，见 API.md 该条说明 |
| P5 | `/addons_diypage_index` 是文件名被误登记为路径 | 低 | `api/index.js` L43 | §10 一并清理 |
| P6 | `MOCK_MAP` 有 11 条已登记但无函数调用的路径 | 低 | 本文 §0 | API.md 标注「仅登记」，不删不改 |
| P7 | `/market/market/MarketDetail/ids/{id}` 是唯一动态路径 | 低 | `api/index.js` L174 | Express 路由用 `:id`，契约文档保留 `{id}` 记法 |

**P2 说明**：契约若写成 `/market/kline/info/detail` 会是一条不存在的死路由。因此 API.md 与 openapi.yaml 均采用 `MOCK_MAP` 中登记的真实路径 `/kline/info/detail`，并在此处显式记录该差异来源，避免后续误以为笔误。

---

## 11.1 接口分类统计（实测）

| 业务域 | 条数| 读 | 写 |
|---|---|---|---|
| A 用户与账户 | 7 | 5 | 2 |
| B 藏品与系列 | 6 | 6 | 0 |
| C 交易与订单 | 12 | 10 | 2 |
| D 活动与玩法 | 25 | 22 | 3 |
| E 内容社区 | 9 | 9 | 0 |
| F 统计分销 | 8 | 8 | 0 |
| G 转赠与配置 | 2 | 2 | 0 |
| **合计** | **69** | **62** | **7** |

| 维度 | 分布 |
|---|---|
| 鉴权 | 需登录 39（含 2 个登录接口）/ 公开 30 |
| 响应封装 | D 单对象 38、 A 裸数组 23、 C 精简分页 4、 B 标准分页 3、 E 嵌套混合 1 |
| 调用状态 | 活跃 58 / 仅 MOCK_MAP 登记 11 |
| 方法 | 全部 POST（前端 `remoteRequest` 对 GET 会忽略 body） |

7 条写接口：`/user/login`、`/user/register`、`/market/trade/createBegBuyOrder`、
`/market/trade/sell`、`/user_collection/user_collection/openbox`、
`/user_collection/user_collection/openboxone`、`/compound/compound/result`。

---

## 12. 决策理由速查（每条的「为什么」）

| 决策 | 一句话理由 |
|---|---|
| Express而非 Fastify/Koa | 中间件心智模型是 Node 生态默认值，团队零学习成本；性能在本项目不是瓶颈（读多写少、数据量 341 行） |
| 裸 SQL 而非 Prisma/Drizzle | schema 已 100% 定稿并双重验证，ORM 是对已定稿 DDL 的重复翻译；且 Prisma 的 SQLite 支持会干扰「SQLite 优先 + MySQL 可换」决策 |
| 不复用 `dialect.py` 代码 | Python 实现无法被 Node 引用，且职责不同（灌库 vs 查询）；复用设计思想即可 |
| JWT 而非 session | 单体无状态可水平扩，无需 Redis，与 DevOps 部署诉求一致 |
| 错误码从 400 起 | `code=1` 是成功、`code=401` 有特殊语义，1与 0 全部保留 |
| 封装修复放controller | 5 种封装必须一处可查可测，散落即白屏风险 |
| 分页两套参数都接受 | 改前端违反铁律，源站混乱必须由后端吸收 |
| 单文件 ≤300 行 | 超限说明职责不单一，拆文件而非压缩代码 |
| 健康检查分活/就绪 | 避免数据库抖动触发无意义的重启风暴 |
| 不打 request body | `/user/login` body 含密码 |
| JWT_SECRET缺失即启动失败 | 静默降级为默认密钥 = 任何人都能伪造 token |

---

## 13. 遗留待确认项

| 项 | 说明 | 当前处理 |
|---|---|---|
| `crystal_number` 权威位置 | DATABASE.md §10 遗留项：4 处 mock 冗余返回，`users` 中无此字段 | 按 DATABASE.md 承载于 `user_sign_status` |
| `E-SOURCE-TYPE` 语义 | 实测与 id 同步，疑为递增 ID 而非类型枚举 | 存 TINYINT 不建枚举约束 |
| 写操作的 7 条详细契约 | 本轮只出契约不实现，字段依据来自页面实参 | 标TODO，实现前需产品确认业务规则 |
| `/community/chat/messageList` 鉴权 | 当前定公开（mock 为演示数据） | 真实落地时须改为鉴权 |
| MySQL 真库联调 | `dialect.py` 的 MySQL 分支无 PyMySQL，未实测 | 后端 DAL 需补 MySQL 集成测试 |
