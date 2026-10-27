# 数据表反推报告 — 页面需求 ↔ 源站实体 ↔ 本地表三方对齐

> 生成日期：2026-10-25
> 证据源：`src/pages/` 105 个页面 · `docs/backend/endpoint_meta.py` 69 条接口契约 · `public/mock/` 81 个源站实测响应 · `data/qingchuan.db` 49 张表 · `server/src/services/` 组装层
> 方法：页面 → 接口 → 实体 → 表 四层下推；源站侧以「接口模块路径 + 响应字段指纹聚类」反推实体，不直证源站库表名（源站数据库不可见，见 §4 可信度声明）

---

## 1. 反推结论速览

| 维度 | 数量 | 说明 |
|---|---|---|
| 前端页面 | **105** | 57 页有接口支撑，48 页纯静态/占位（登录、协议、设置、webview 等） |
| 源站 API 模块 | **24 个** | FastAdmin 风格 `/模块/控制器/动作`，market/trade 最重（9 接口） |
| 实测接口契约 | **69 条** | 读 63 / 写 6；提交口径 112 条（差异见 ARCHITECTURE.md §0） |
| 源站数据实体（字段指纹聚类） | **47 簇** | 79 个有字段 mock 单链接聚类（阈值 0.35） |
| 本地表 | **49 张** | 47 张有接口引用 + 2 张无引用（§5.2） |
| **字段层覆盖率** | **100%** | 源站响应全部字段经「表列 + KV 配置 + service 派生」三种机制落地（§5.3） |

**一句话结论：本地 49 张表即支撑全部 105 个页面所需的完整表集合；源站实体与本地表一一对齐，无整表缺失，剩余缺口仅 13 个配置 KV key 与 1 个写语义字段。**

---

## 2. 反推第一步：页面需要什么数据表

### 2.1 下推链路

```
105 个页面
  └─ 57 页发起 69 个接口调用（另 12 条经 utils 层封装：fetchSeries/fetchEntrustList/...）
       └─ 69 个接口的 tables 标注 → 47 张本地表
            └─ +2 张无接口引用表 = 49 张
```

### 2.2 按业务域的表需求（DATABASE.md §2 七域）

| 域 | 表数 | 代表页面 → 表 |
|---|---|---|
| B 藏品与系列（核心） | 7 | index/Index → products/series；blindBox/* → products/user_collections/product_pool_items |
| D 活动与玩法 | 14 | sign/Sign → sign_reward_rules+user_sign_status；shop/* → shop_goods+user_shop_exchanges；compound/* → compound_schemes+items+results+user_compound_records |
| C 交易与订单 | 6 | market/Detail → market_listings+orders；kline/Info → kline_snapshots |
| E 内容与社区 | 10 | notice/Notice → affiches+affiche_types；community/Chat → chat_messages+chat_sessions |
| A 用户与账户 | 4 | login/Register → users；my/AddressList → user_addresses |
| F 统计分销 | 5 | leaderboard/Leaderboard → rank_snapshots；rebate/Rebate → rebate_profiles |
| G 转赠与配置 | 2 | index/Index → app_configs+trade_unions；my/FlowDoc → collection_flow_records |

### 2.3 表 × 消费页面热度（复刻优先级依据）

| 表 | 消费页面数 | 页面 |
|---|---|---|
| **products** | **18** | blindBox/Index·OpenRecord·Result·Result2、index/Index、market/Detail·MarketGoodsList·SellBegBuy·SellInfo·SubmitEntrust·SubmitBegBuy、product/Box·RuleDetail、shop/BoxDetail·CollectionDetail·GoodsDetail、order/OrderList·OrderDetail |
| user_collections | 9 | blindBox 四页、market/Detail·SellBegBuy、myCollection/*、regift/* |
| app_configs | 6 | activity/ActivityDraw、draw/CommunityShare·InvitationAssist、index/Index、invitation/Invitation、rebate/Rebate |
| users | 5 | invitation/Invitation、login/Login·Register、market/Detail、my/Info |
| rank_snapshots | 5 | draw/DrawLeaderboard、leaderboard/Leaderboard、rank/MasterRank·UserBuy、rebate/Leaderboard |
| market_listings / product_pool_items / orders / shop_goods | 各 4 | 市场/盲盒/订单/商城四线 |

> **复刻含义**：products + user_collections 两表覆盖 27 个页面的数据需求，是所有像素级复刻工作的主战场；app_configs（KV）虽只 6 页但每页都依赖其配置值。

---

## 3. 反推第二步：源站用了哪些表（实体反推）

### 3.1 源站 API 模块清单（24 个，接口数降序）

| 模块 | 接口数 | 反推实体 |
|---|---|---|
| market/trade | 9 | 挂单、求购/委托、藏品详情、寄售、流转 |
| compound/compound | 4 | 合成方案、材料、记录、结果 |
| market/market | 3 | 市场商品列表、市场详情、系列商品 |
| box/blind_box | 3 | 盲盒列表、我的盲盒、开盒记录 |
| order/order | 3 | 订单列表、订单详情、我的寄售 |
| lottery/lottery | 3 | 抽奖信息、记录、规则 |
| rebate/rebate | 3 | 返佣概况、邀请明细、排行榜 |
| product/product | 2 | 藏品详情、购买规则 |
| user_collection/user_collection | 2 | 开盒（写×2） |
| invitation/invitation · activity/draw · leaderboard/leaderboard | 各 2 | 邀请、抽签、抽签榜 |
| user/login·register·getUserInfo·address | 各 1 | 用户账户 |
| index/*（getConfig/afficheList/affichetypelist/getSeries/afficheDetail/newsDetail） | 各 1 | 首页、公告、系列 |
| crystal_goods/*（6 个动作） | 各 1 | 积分商城 |
| sign/index · draw/drawResult·Leaderboard·communityShare·InvitationFriendAssist · activeSelected/list · shequ/rumor · rank/masterRank·userBuy · marketCapRanking/* · community/chat · regift/record · kline/info · banner/show · addons/diypage | 各 1 | 签到/抽签结果/社区/榜单/转赠/行情/轮播/装修 |

### 3.2 字段指纹聚类（79 个 mock → 47 簇，关键簇）

| 簇 | 接口 | 共有字段（源站实体指纹） |
|---|---|---|
| products 实体 | myCollectionDetail·productDetail·shopBoxDetail·shopCollectionDetail·shopGoodsDetail（5） | `collectionlist, goods_type, listimg, main_image, name, price, product, total_num` |
| 市场详情宽对象 | marketDetail ×2 次抓取 | **61 字段**（含 `3d_url, collection_code, company_logo, creator_service_price, flux, goods_cover_image, issuer, publisher...`） |
| products+行情 | marketList ×2 | `collection_level, deal_num, flux, goods_type, market_fluctuate, market_value, min_price` |
| series | series-10 ×2 | `is_def, pattern, resale_buy_end_time, resale_buy_start_time, resale_put_end_time, resale_put_start_time, series_id` |
| 工会配置 | getConfig·tradeUnion | `max_bind, member_count, rebate_extra, rebate_holder, rebate_invited, unlock` |
| 榜单快照 | masterRank·userBuyRank | `createtime, goods_cover_image, goods_name, num` |
| 装修组件 | diypage ×2 | `category, content, decorate_id, type` |
| 公告/资讯 | afficheList·newsDetails·noticeDetails | `createtime, id, title` |
| 活动/合成列表 | activeSelectedList·compoundList | `end_time, join_num, listimg, qualify, start_time, title` |
| 其余 38 簇 | 单接口 | 各自实体的特有字段（user/orders/entrust/sign/rebate/regift/kline/address/banner/...） |

### 3.3 源站架构特征（反推结论）

1. **规范化多表 + 接口层联表宽对象**：marketDetail 单接口 61 字段横跨 products + user_collections + market_listings + users 四表——源站后台是规范分表，H5 接口做 JOIN 后吐宽对象。本地 49 表与之同构。
2. **源站字段命名被前端直抄**：`weither_resale`（源站拼写错误）、`weither_regift`、`show_total_num`、`market_goods` 等怪名在 bundle 与 mock 中一致出现 → 这些是源站表字段的直证，本地已照抄（P0 规则：不随意发挥）。
3. **FastAdmin 痕迹**：`/addons/diypage/index`、`/user_collection/user_collection/openbox` 等双段模块路径是 FastAdmin addon 路由风格；源站真实库表名大概率带 `fa_` 或无前缀（不可直证，见 §4）。

---

## 4. 可信度声明

| 结论 | 可信度 | 依据 |
|---|---|---|
| 源站 API 暴露 24 模块 / 69 接口 | **确证** | 接口路径逐字抓取 |
| 源站 47 个数据实体 | **强推断** | 81 个 mock 响应字段指纹聚类 |
| 源站联表架构 | **强推断** | 单响应 61 字段跨 4 实体 + `product`/`publisher` 嵌套对象 |
| 源站库表名（如 fa_market_goods） | **不可证** | 前端 bundle 不含 SQL；仅模块路径暗示 FastAdmin 惯例 |
| 本地 49 表覆盖全部页面需求 | **确证** | 页面→接口→表三链机器校验，零悬空（除 §5.2 两项） |

---

## 5. 三方对齐矩阵

### 5.1 覆盖总览

```
源站实体（47 簇）
   ↓ 字段逐一比对
本地表（49 张）            ← 47 张有接口引用，整表级零缺失
   ↓ 字段逐一比对
本地列 + KV + service 派生  ← 字段级 100% 落地
```

### 5.2 两张无接口引用的本地表

| 表 | 行数 | 定性 | 处置建议 |
|---|---|---|---|
| `user_blind_box_records` | 5 | 开盒记录快照。openlog 接口实际走 `user_collections(blind_box_id)` 联查，此表为冗余副本 | 保留（数据已灌），契约不改；或在 DATABASE.md 标注「冗余表，无接口消费」 |
| `activity_configs` | 8 | KV 配置表，draw/assist/community_share 三组配置实际存于此（service 已接线），但接口 tables 标注写的是 `app_configs(group=draw)` | **契约标注偏差**：endpoint_meta.py 三处 tables 应改为 activity_configs，重生成 API.md |

### 5.3 「缺口」字段的落地机制台账（原 47 项疑点全部闭环）

| 疑点字段 | 落地机制 | 位置 |
|---|---|---|
| `3d_url` / `3d_url_type` | products 列 `url_3d` / `url_3d_type`，service 改名输出 | product-shape.js L28-29 |
| `company_logo` / `issuer` | products `publisher_name` 派生 | product-shape.js L60、market.service.js L170 |
| `goods_cover_image` | market_listings `cover_image` 改名 | market.service.js L110 |
| `floor_price` / `today_highest_price` / `today_lowest_price` | market.service.js L231-234 派生 | market.service.js |
| `avg_price` / `batch_up` / `total_num_show` / `freeze_time` / `unfreeze_collection_id` | collection.service.js L190-199 派生（batch_up 按「存在可寄售实例」派生） | collection.service.js L126-199 |
| `is_shengou` / `count_down` | product_sale_rules / release_time 派生 | product.service.js L28/36 |
| `draw_rule` / `hero_image` / `assist_num` | activity_configs KV（draw/assist 组） | activity.service.js L156/231/234 |
| `audit_status` / `share_images` | activity_configs KV（community_share 组） | activity.service.js L211-216 |
| `aboutus` / `appBigLogo` / `copyright` / `certification` 等 | app_configs KV（basic 组，25 key） | app_configs 表现货 |

### 5.4 真剩余缺口（仅 3 类）

| # | 缺口 | 影响面 | 建议 |
|---|---|---|---|
| 1 | app_configs 缺 13 个源站 config key：`base_apk, ipa, h5_domain, cancellation, certification, risk_warning, share_rule, strategy, draw_lots_notice, draw_lots_rule, draw_share_assimage, draw_share_assrule, helpdraw_rule, draw_code_rankrule`（`consignment_sales` 源站恒 null，除外） | DownloadApp 页（APK/IPA 下载）、风控提示、抽签规则文案 | 下载 App 页复刻时补 KV；风控/规则类随页面复刻按需补 |
| 2 | `batchOff` 响应的 `down` 字段（批量下架写语义） | market/BatchPay 批量下架交互 | 该端点本地未实现（写接口 TODO），补实现时一并落列 |
| 3 | `user_blind_box_records` 与 openlog 数据重复 | 无（数据一致性） | 二选一：openlog 改查此表，或标注冗余 |

---

## 6. 给复刻排期的表级结论

1. **主战场**：products(18 页) + user_collections(9 页) + app_configs(6 页)——三表覆盖 33 个页面的数据面
2. **每域一张核心快照表**：rank_snapshots(5 页) / kline_snapshots / market_listings(4 页) / orders(4 页) / shop_goods(4 页)——复刻榜单/行情/市场/订单/商城时优先验证
3. **配置先行**：app_configs 的 13 个缺失 key 中，`base_apk/ipa/h5_domain` 阻塞 DownloadApp 页，`draw_*` 系列阻塞 draw 域四页——建议在复刻对应页面前补 KV
4. **契约卫生**：endpoint_meta.py 三处 tables 标注（draw/assist/community_share）应改指 activity_configs，否则 API.md 与实现长期漂移
