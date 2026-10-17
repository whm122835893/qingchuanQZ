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

### 写接口 7 条 — 已注册路由，返回 TODO 响应

`/user/login`、`/user/register`、`/market/trade/createBegBuyOrder`、`/market/trade/sell`、
`/user_collection/user_collection/openbox`、`/user_collection/user_collection/openboxone`、
`/compound/compound/result`

响应 `code=1`、`msg="TODO: 未实现"`，`data` 为与源站同构的空壳（字段名逐字对齐，值为 null/[]）。
选`code=1` 而非错误码，是因为前端 `utils/api.js` 遇非 1 会静默回落本地 mock——那正好是我们想要的行为：
页面用 mock 数据正常渲染，后端不返回 404 让它崩页。形状声明在 `controllers/todo.js`。

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

## 已知未实现 / 降级项

- **7 个写接口**未实现（登录、注册、下单、寄售、取消、卖出、求购）。登录未实现意味着
  **线上没有任何签发 token 的入口**，需鉴权的 39 个接口目前只能用 `npm run token` 生成的调试 token 访问。
- **`/box/blind_box/list` 无字段基准**：源站 mock 是空数组，无法比对字段形状。
- **`regift_records.collection_id`、`orders.collection_code` 等列在库中大面积为 NULL**，
  相关字段统一返回 null。若后续补数据，无需改代码。

## 待前端确认的问题（未擅自改动 `src/`）

- `src/api/index.js` L254-264 **已存在** `ARCHITECTURE.md` §10 所列的 11 个转发函数
  （`rebateInfo` / `masterRank` / `chatMessages` / `klineInfo` 等），设计稿 §10「前端补丁清单」已过时。
- `src/api/index.js` L35-114 的 `MOCK_MAP` 仍登记脏键 `/addons_diypage_index`
  （误登记的 mock 文件名，真路径是 `/addons/diypage/index`）。`verify_paths.py` 已豁免，但建议前端清理。
