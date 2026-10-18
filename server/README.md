# 青川数字艺术 · 后端服务（Mock 数据版）

以 `data/qingchuan.db`（48 表 / 341 行）为唯一数据源，按 `docs/backend/endpoint_meta.py` 的 69 条接口契约实现的读接口服务。
**62 个读接口全部实现**，7 个写接口注册路由并返回契约形状的 TODO 响应（避免前端 404 崩页）。

技术方案依据：`docs/backend/ARCHITECTURE.md`。路径一致性由 `docs/backend/verify_paths.py` 把关（当前 0 差异）。

---

## 快速启动

```bash
cd server
npm install
cp .env.example .env
# 生成 JWT_SECRET（缺失会fail-fast 拒绝启动）
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
# 把输出写进 .env 的 JWT_SECRET
npm start# 默认 3000端口
```

健康检查：

```bash
curl localhost:3000/health       # 存活（不查库）
curl localhost:3000/health/ready  # 就绪（查库+ 关键表）
curl localhost:3000/health/meta   # 版本 / 驱动 / 各表行数
```

`/health/meta` 实测：`table_count=48`、`row_count=341`，与 `docs/DATABASE.md` 记载一致。

---

## 关键约定（踩坑点，改代码前必读）

| 约定 | 说明 |
|------|------|
| `code: 1` 是成功 | `src/utils/api.js` L24 硬编码 `if (res.code === 1)`。错误码从 400 起，0 与 1 不占用 |
| `code: 401` 独占 | 前端收到 401 会 `setToken('')` 清 token，不可与其他错误复用 |
| HTTP 恒200 | 错误靠 body里的 `code` 表达（源站如此，前端只看 body） |
| 500 固定文案 | `服务异常`。绝不返回 `err.message`（会泄露表名列名） |
| token 从 `token` 头读 | 不是 `Authorization: Bearer` |
| `version: 1.0.1` 头 | 只记日志，不校验 |
| 分页双参数 | `limit` > `list_rows` > 默认 15；`page` 从 1 起；pageSize 上限 100 |
| 金额禁 float | DECIMAL 列一律经 `utils/pick.js` 的 `money` / `money2` 转字符串 |
| `income_type` 的 NULL | 合法状态（源站数字 `1` 未映射），不编造 |

### 5 种响应封装

前端按5 种不同形状硬解析 `data`，故全部经 `middleware/respond.js` 输出，controller 不自己拼 JSON：

| 风格 | 形状 | responder |
|------|------|-----------|
| A | 裸数组 | `bareList` |
| B | `{total,per_page,current_page,last_page,data}` | `standardPagination` |
| C | `{total,data}` | `slimPagination`（含 `withPageMeta` / `listKey` 两个显式变体） |
| D | `{...}` | `single` |
| E | `{product, total, current_page, last_page, data}` | `nested` |

---

## 目录结构

```
server/src/
├── index.js          # 入口：仅装配 + listen +优雅退出（35 行）
├── app.js            # Express 实例 + 中间件链 + 3 个健康端点（58 行）
├── config/env.js# 环境变量读取，JWT_SECRET 缺失即 fail-fast
├── db/               # 连接管理 + 方言收敛（sqlite / mysql 二选一）
├── middleware/       # auth / respond / error / requestLog / wrap
├── errors/           # 7 类异常：400/401/403/404/409/422/503
├── routes/           # 9 个域路由 + index汇总
├── controllers/      # 9 个域 controller（每文件 ≤6 个接口）+ todo.js（写接口空壳）
├── services/         # 9 个域 service + product-shape.js（product 对象映射）
├── repositories/     # 12 个仓储，**SQL 只出现在这一层**
└── utils/            # pick（字段白名单）/ validate（参数校验）
```

分层依赖单向向下：`routes → controllers → services → repositories → db`。
`.eslintrc.json` 配了 `no-restricted-imports` 规则，逆向依赖会 lint 报错。

---

## 自检脚本

```bash
# A 契约 diff：逐接口字段级比对 public/mock/*.json，输出 reports/contract-diff.json
npm run token                        # 生成本地调试 token
TOKEN=$(npm run --silent token) npm run diff:contract

# B 鉴权矩阵：39 需登录（含 5 写接口）/ 30 公开
TOKEN=$(npm run --silent token) npm run check:auth

# C 路径一致性（仓库根目录执行）
python3 docs/backend/verify_paths.py   # 期望 0 差异
```

---

## 接口覆盖情况

### 读接口 62 条 — 全部实现

| 域 | 条数 | 路径 |
|----|------|------|
| 内容社区 | 8 | getConfig / getBanner / afficheList / affichetypelist / getSeries / afficheDetail / newsDetail / diypage |
| 藏品与系列 | 6 | seriesGoodsList / productDetail / productRule / blindBoxList / userCollectionList / collectionInfo |
| 交易与订单 | 8 | getMarketList / MarketDetail / orderList / saleMarketOrderDetail / myConsignment / begBuyOrderList / begBuyOrderInfo / getSellCollectionInfo / collectionDetail / klineInfo |
| 用户与账户 | 6 | getUserInfo / addressList / invitationInfo / invitationRecord / marketCapRanking等 |
| 活动与玩法 | 21 | 合成 / 转盘 / 签到 / 抽签 / 精选活动 / 盲盒 |
| 积分商城 | 6 | crystalList / goodsDetail / boxDetail / collectionDetail / exchangeRecord / crystalDetail |
| 统计分销 | 9 | rebate 三接口 / masterRank / userBuyRank / leaderboard 两接口 / regiftRecord |

### 写接口 6 条 — 已注册路由，真实实现

`/user/login`、`/user/register`、`/market/trade/createBegBuyOrder`、`/market/trade/sell`、
`/user_collection/user_collection/openbox`、`/user_collection/user_collection/openboxone`

均为真实业务实现（非 TODO 空壳），详见下文「写接口实现状态」。

> `/compound/compound/result` 虽为 POST，但语义是**读接口**（查询某次合成的产出），
> 已按主理人裁决归入读接口，不计入写接口。

读写归属由 `endpoint_meta.py` 的 **`kind` 字段**决定（独立字段，与 `impl` 解耦——
「是否实现」与「是读是写」是两个正交维度），并由 `docs/backend/verify_kind.py` 机械校验
其与 `server/src/routes` 的一致性。**不可用 `impl == 'todo'` 反推读写**（那是本轮修复的错误耦合）。

---

## 契约 diff 结果（`reports/contract-diff.json`）

字段级比对基准是 `public/mock/*.json`（源站真实响应）。

| 状态 | 条数 |
|------|------|
| 字段完全对齐 | **54** |
| mock 本身为空，无字段基准 | 1（`/box/blind_box/list`，源站返回 `[]`） |
| 有差异 | 7 |

7 个差异全部是**数据库缺少该数据来源**，不是实现遗漏。逐条原因：

| 接口 | 差异 | 原因 |
|------|------|------|
| `/crystal_goods/goodsDetail`<br>`/crystal_goods/boxDetail`<br>`/crystal_goods/collectionDetail` | `product.publisher` 为 null（3 条） | `shop_goods` 无发行方列，且库中不存在与 `shop_goods.id` 同 id 的 `products` 行，无从取`publisher_name`。返回 null 而非编造 |
| `/crystal_goods/goodsDetail` | `product.collectionlist` 多 6 字段 | 源站该商品的概率池是 `[]`，但库中 `shop_goods.pool_items` 有 2 条真实数据。后端返回真实数据，故diff 记为 extra |
| `/box/blind_box/myBox` | `name` / `listimg` / `main_image` / `rarity_icon` / `product_id` 为 null | 库中唯一 `blind_box_id` 非空的藏品行（id=55012）同时 `product_id` 为 NULL，是悬空引用，无法定位产品 |
| `/box/blind_box/openlog` | 5 个字段为 null | 同上：开盒记录依赖 `product_id`，而库中该列为空 |
| `/market/market/MarketDetail/ids/{id}` | `buy_user_id`、`product.purchase_information` 为 null | `market_listings.buy_user_id` 与 `products.purchase_information` 在库中均为空值 |
| `/order/order/myConsignment` | `collection_code` 为 null | 已LEFT JOIN `user_collections` 取编号，但库中 33 条挂单仅 1 条有 `collection_id`，且该条对应的 `user_collections(5712041).collection_code` 本身为 NULL |

---

## 实现决策与设计稿的偏离（需复核）

1. **`myConsignment` 数据源改为 `market_listings`**：`orders` 表只有 `order_type=1`（买入）4 行，
   `order_type=2` 为 0 行；而 mock 的三条寄售记录（id 7001-7003）与 `market_listings` 完全对应。
   按数据实际情况取 `market_listings`（挂单人 = 当前用户）。
2. **`/market/market/seriesGoodsList` 的 `product` 段按挂单的 `product_id` 反查**：
   参数 `id` 按 `endpoint_meta.note` 是**系列 id**，但库中 `series_id=15` 没有对应的 `products` 行
   （源站的「系列 id」实为产品维度），故以挂单反查为主、系列首产品为回落，否则 `product` 恒为 null。
3. **`crystal_goods/boxDetail` 与 `collectionDetail` 不按 `goods_type` 分流**：
   库中 `goods_type=2` 的商品 `pool_items` 为空，按类型分流会得到与源站不一致的空概率池。
   三者统一按 `id` 取商品。
4. **`productDetail.sale_status`**：库中 `products.release_time` 全为 0（未采集），
   改以「存在 `product_sale_rules` 记录 = 曾开放申购 = 已结束（2）」推导。
5. **`req.input` 而非 `req.params` 承载 body/query**：Express 4 在路由匹配时会用 route params
   覆写 `req.params`，body/query 会被静默丢弃（表现为「参数 id 缺失」）。路径段取值走 `utils/validate.js`
   的 `routeId(req)`。
6. **`middleware/wrap.js`**：Express 4 不捕获 async handler 的 rejected Promise，
   不包装则 service 抛出的异常会变成 unhandledRejection 直接终止进程。
7. **SQLite 路径按项目根解析**（`db/sqlite.js` 以 `__dirname` 上溯三级），
   从 `server/` 或仓库根启动都指向同一个库文件（原先按 `cwd` 解析，换目录即读不到库）。

## 数据缺失与脏数据处理

- 库中 21 条悬空引用已按 `DATABASE.md` §6 填 NULL + `_raw` 留痕。接口遇到悬空引用时
  **返回能返回的部分**（相关字段为 null），不崩。
- `income_type` 的 NULL 是合法状态（源站数字 `1` 未映射到枚举），不为了"完整"编造映射。
- 金额、时间形态一律按源站原样：`listing_time` 等 unix 秒直出，`create_time_str` 这类 VARCHAR 保持字符串。

---

## 写接口实现状态（6 个写接口，本轮全部落地）

| 接口 | 实现 | 前端是否真调用 | 核实证据 |
|---|---|---|---|
| `/user/login` | 真实实现 | **是（唯一）** | `src/pages/login/Login.vue:85` 调`api.login({account,password})`，成功后写 localStorage |
| `/user/register` | 真实实现 | 否（死代码） | `Register.vue` 无任何提交调用，仅 `api/index.js:184` 定义 |
| `/market/trade/createBegBuyOrder` | 真实实现 | 否（死代码） | `SubmitBegBuy.vue:206` `onSubmitTap` 末行只弹 toast 后 `return`，从不发请求 |
| `/market/trade/sell` | 真实实现 | 否（死代码） | `SellBegBuy.vue:253` 同上，只弹 toast |
| `/user_collection/user_collection/openbox` | 真实实现 | 否（死代码） | `blindBox/Result.vue:55` 调 `fetchBlindBoxResult()`，**传空对象** |
| `/user_collection/user_collection/openboxone` | 真实实现 | 否（死代码） | `blindBox/Result2.vue:47` 同上，传空对象 |
| `/compound/compound/result` | 真实实现（**读接口**） | 否（死代码） | `compound/Result.vue:70`、`SchemeDetails.vue:129` 均传空对象 |

> **7 个接口里 6 个是死代码**：api 层定义了函数、路由也注册了，但页面提交动作从不触发。
> 本轮按契约实现了真实业务逻辑，但**没有为它们编造前端调用路径**。

## 业务级幂等（重复提交防护）

**核心原则**：同一用户 + 同一业务意图 + 同一关键参数，在「未终结状态」下重复提交，
返回已有记录而非新建。

| 接口 | 幂等键 | 终态条件 | 时间窗 | 重复提交返回 |
|---|---|---|---|---|
| `createBegBuyOrder` | `user_id + product_id + price + number` | `order_status = 2` 委托中 | 60s | `code:1` + 已有单 |
| `sell` | `user_id + collection_id` | 挂单 `status = 1` 寄售中 | 无 | `code:1` + 已有挂单 |
| `openbox` / `openboxone` | `user_id + blind_box_id` | 窗口内有产出藏品 | 60s | `code:1` + 已开结果 |
| `compound/result` | — | 只读接口，天然幂等 | — | 同一结果，不新增记录 |
| `register` | `mobile` | 手机号唯一 | — | **409**（真实冲突） |

实现要点（详见 `src/utils/idempotency-window.js` 与 `src/repositories/idempotency.repository.js`）：

- **不依赖 `order_sn`**。前端从不传该字段（源站契约亦无），早期实现因此完全失效——
  重复点击产生多笔在途委托单（实测 `entrust_orders` 3→5）。现改为业务键查重。
- **查重与插入同事务**。事务外查重存在「查完到插入」的并发窗口。
  `better-sqlite3` 的 transaction 回调是同步的，故事务内不做 `await`。
- **sell 的查重早于状态校验**：首次请求已把藏品置为寄售中，重试若先查状态会误报 409，
  客户端便无法安全重试。
- **openbox 的查重早于 count 校验**：count=1 的盒首次开盒后即为 0，
  先校验会返回 409 而非无感返回。
- **register 的检查在事务内**，否则并发下两个请求都能通过存在性检查。

> **时间窗取值 60s**：`sell` 不用时间窗（挂单终结后键自然失效，加窗口反而会漏）。
> 60s 覆盖客户端退避重试（累计约 15s）、弱网跨境单请求往返（5~10s）、
> 用户看清报错后手动重试（> 5s）并留一倍余量。改价后 `price` 变化即换键，不受窗口影响。

### 登录方案：A（不校验密码）

`users` 表**无 `password_hash` 列**——源站从不返回密码，无从获得。加列属schema 设计变更，
需先审批；且库中不存在任何真实密码，任何"校验"实现都是假的。故采用方案 A：

- 校验 `account`（手机号或用户名）匹配 `users`，**匹配不上返回 404**（不新建用户行）
- `password` 仅做非空校验，**任何非空密码都能登录**
- 返回的 `token` 是**真实 JWT**（`JWT_SECRET` 签名，`uid` + `nickname`），后续 39 条需鉴权接口依赖它

> ⚠️ **这是「演示环境不做鉴权」，不是「密码已校验」。** 生产部署前必须完成下方
> 「上生产前的必做项」清单。

### 其余 6 个的实现要点与简化

- **register**：事务内校验手机号唯一并写 `users` 一行（库内 `mobile` 无唯一索引，
  唯一性完全依赖应用层 + 事务）。`inviter_code` 由 `crypto.randomInt` 生成唯一值——
  该列有唯一索引 `uk_users_inviter_code` 而**空串也算占用**（库中 user 4930 已占位），
  写死 `''` 会导致「第二个新用户注册必 500」（已实测复现 UNIQUE constraint failed）。
- **createBegBuyOrder**：事务内写 `entrust_orders`；`order_status=2`（E-ENTRUST-STATUS 委托中）；
  金额 = price × number，全程定点十进制。幂等见上表。
- **sell**：事务内 3 表联动 —— `market_listings`（新挂单，含分账四字段）+ `orders`（`order_type=2`）
  + `user_collections`（藏品 `status` 1→2 寄售中）。任一失败全部回滚。
  业务校验：归属（非本人 403）、状态（已寄售 409）、锁定（422）、`count<=0`（422）。
  分账：`platform_service_price = price × 0.05`（2 位half-up），`real_income = price − platform − creator`。
- **openbox / openboxone**：事务内「扣减盲盒 `count` + 落库新藏品实例」。概率池按**归一化权重**抽样
  （库中概率合计 23 ≠ 100，当百分比用会让 77% 抽签落空）；用 `crypto.randomInt` 而非 `Math.random`。
  **简化**：单次开盒产出 **1 件**（源站 mock 恒 3 条，但库中无该配置列，不凭空取 3）。
  **已知局限**：产出行只落盲盒产品 id（池内变体共用），故幂等重放返回产品级名称，
  而首次开盒返回池级名称，二者可能不同。彻底解决需给 `user_collections` 加池条目 id 列。
- **compound/result**：**读接口（虽为 POST）**。源站此接口语义是「查询某次合成的产出」而非「触发合成」，
  故读取 `compound_results` 已落库数据；若按"写"理解为新建合成，会凭空造出用户没做过的合成行为。
  未传 `record_id` / `play_id` 时取当前用户最近一次合成记录（对应前端传空对象的场景）。

---

## 上生产前的必做项（当前为演示环境，上线前逐项完成）

以下每项在当前演示环境**均未完成**。方案 A（登录不校验密码）在演示环境是正确选择，
但**绝不能带到生产**。

### 1. `users` 表增加 `password_hash` 列

- **算法**：bcrypt（cost ≥ 12）或 argon2id。**禁止 MD5/SHA1 裸哈希**——无盐、可被彩虹表秒破。
- **盐值策略**：bcrypt/argon2 **自带随机盐**，存于哈希串本身（`$2b$12$<salt><hash>`），
  不要另建 `salt` 列。若用 PBKDF2 则盐须独立存储且每用户唯一。
- **迁移**：新增可空列，允许 NULL（NULL = 未设密码的老账号），
  首次登录时按「忘记密码」流程引导设置，**不要预置默认密码**。

### 2. 登录改为校验密码

- `auth.service.js` 的 `login` 从「仅非空校验」改为 `bcrypt.compare(明文, user.password_hash)`。
- **密码错误返回什么**：沿用现有「账号不存在返 404」的防御式口径，
  但两者须**返回完全相同的文案**，否则可枚举已注册手机号。
- **失败限流**：登录接口必须加限流（建议每 IP+账号每分钟 ≤ 10 次）防撞库。当前无任何登录限流。
- NULL 哈希的账号：拒绝登录并要求走密码重置，**不得放行**。

### 3. 注册写入密码哈希

- `register` 收到的 `password` 经 `bcrypt.hash(pw, 12)` 后落 `password_hash`，
  **明文密码绝不进日志、不进 `remark` 类字段**。
- 补密码强度校验（长度 ≥ 8，且不与手机号 `username` 相同）。
- 补手机号格式校验（当前仅校验非空与长度 ≤ 32）。

### 4. `JWT_SECRET` 强制从环境变量注入且无默认值

- **当前状态**：已是 fail-fast（`config/env.js` 中为空则 `process.exit(1)` 拒绝启动），
  **此行为保留，绝不要改成「缺省给默认值」**。默认密钥 = 任何人都能伪造任意 uid 的 token。
- 生产需补充：
  - 从密钥管理服务注入（KMS / Vault / 云厂商 Secrets Manager），不落 `.env` 文件；
  - 定期轮转（建议 ≤ 90 天），轮转需支持双密钥并存以免瞬时全量失效；
  - `JWT_EXPIRES_IN` 从当前 `7d` **收紧到 ≤ 2h**（access token 不应长期有效）；
  - 增加 refresh token 与主动吊销（当前无吊销手段，token 签发后在有效期内一直可用）。

### 5. 强制 HTTPS

- 明文 HTTP 下密码与 token 可被链路上的任何人截获，HTTPS 不是可选项。
- 服务端启用 HSTS（`Strict-Transport-Security`）；
  反向代理层强制 301 跳转 HTTPS 并拒绝明文端口；
  正确配置 `CORS_ORIGINS` 为正式域名（当前默认回落 `http://localhost:5173`）；
  若后续改用 Cookie 承载 token，`Secure` + `HttpOnly` + `SameSite` 三项都要设。
- 上线前用 `curl -I http://<域名>` 验证确实跳转。

### 6. 其他随生产必须关闭的演示假设

- **限流**：`login` / `register` / 写接口（求购、寄售、开盒）目前**均无速率限制**。
- **错误日志**：`500` 固定返回「服务异常」已正确（不泄露表名列名），保持。
- **数据基线**：`data/qingchuan.db` 是 48 表 / 341 行的**演示数据**，
  生产必须换真实数据源，且演示账号（`17587881293` 等）必须删除。
- **`/health/meta`** 会返回各表行数，对外暴露前需加鉴权或限流。

## 已知未实现 / 降级项

- **登录不校验密码**（见上「登录方案 A」），这是本轮最大的语义简化。
- **`/order/order/myConsignment` 的 `cancelConsignment`（取消寄售）仍是读语义**：
  4 个 api 函数复用同一路径，按设计稿本轮按读实现，取消动作未实现（写接口清单外的遗留项）。
- **`/box/blind_box/list` 无字段基准**：源站 mock 是空数组，无法比对字段形状。
- **`regift_records.collection_id`、`orders.collection_code` 等列在库中大面积为 NULL**，
  相关字段统一返回 null。若后续补数据，无需改代码。
- **SQLite 的 DECIMAL 列以 NUMERIC 存储**，写入的十进制串会被转为 double 读回
  （全库既有行为，非本轮引入）。**运算侧已全部走定点十进制**（`utils/decimal.js`，
  BigInt 缩放整数域，无浮点），但极端金额（如 15 位有效数字以上）的存储保真有赖于换MySQL。

## 自测

```bash
# 写接口正确性（事务回滚 / 幂等 / 金额精度 / 业务规则），19 项断言
# 必须在独立库副本上跑，服务进程需先持有该副本连接
cp data/qingchuan.db /tmp/wt/check.db
SQLITE_PATH=/tmp/wt/check.db PORT=3102 node src/index.js &
node scripts/write_checks.mjs
```

> ⚠️ 端口被占用时新进程会静默失败并打到**旧进程**（它持有已删除库的 inode），
> 表现为计数全部对不上。改端口或先 `kill` 占用进程，确认 `/health` 的 `uptime` 是新值。

幂等用例**刻意不传 `order_sn`**（`createBegBuyOrder` / `sell` / `openboxone` 的请求体
均只有前端真实会传的字段），复现「重复点击」的真实场景——
传 `order_sn` 的旧用例无法发现本轮修复的缺陷。

`utils/decimal.js` 是自实现的定点十进制（项目依赖锁定 3 个，不引decimal.js）：
`d.subtractAll('15','0.75','0.00').toFixed()` → `'14.2500'`；
`d.of('1.005').round(2)` → `1.01`（float 会给 1.00）。

## 待前端确认的问题（未擅自改动 `src/`）

- `src/api/index.js` L254-264 **已存在** `ARCHITECTURE.md` §10 所列的 11 个转发函数
  （`rebateInfo` / `masterRank` / `chatMessages` / `klineInfo` 等），设计稿 §10「前端补丁清单」已过时。
- `src/api/index.js` L35-114 的 `MOCK_MAP` 仍登记脏键 `/addons_diypage_index`
  （误登记的 mock 文件名，真路径是 `/addons/diypage/index`）。`verify_paths.py` 已豁免，但建议前端清理。
