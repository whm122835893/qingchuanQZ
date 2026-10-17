# 青川数字艺术 H5 平台 · API 契约文档

> 版本：v1.0 · 生成日期：2026-10-18
> **本文件由 `docs/backend/gen_api_docs.py` 从 `endpoint_meta.py` 生成，请勿手工编辑**
> 路径唯一事实源：`src/api/index.js`，由 `verify_paths.py` 机器校验
> 字段依据：`public/mock/*.json` 实测 + `src/pages/` 实测实参 + `docs/DATABASE.md` v1.2

---

## 0. 范围与口径

| 指标 | 数量 |
|---|---|
| 本文档覆盖路径 | **69** |
| 其中活跃（有 api 函数调用） | 58 |
| 其中仅 MOCK_MAP 登记（无函数调用） | 11 |
| 读接口 | 62 |
| 写接口（本轮 TODO） | 7 |

> **提交口径为 112 个接口，实测为 69 条**。差异根因与证据见 `ARCHITECTURE.md` §0。
> 简单说：65 次 `request()` 调用去重后 58 条活跃路径，加上 MOCK_MAP 已登记但当前无函数调用的 12 条，构成 69 条并集。

### 0.1 路径复用（源站存在多函数指向同一路径）

源站有 5 组函数指向同一路径，**后端按路径实现一份即可**，但需按下表区分参数语义：

| 路径 | 复用函数 | 差异 |
|---|---|---|
| `/order/order/myConsignment` | `consignList` / `myConsignment` / `consignSearch` / `cancelConsignment` | **4 个函数**。前三者读列表，`cancelConsignment` 是取消动作（写语义）却复用读路径 —— 本轮按读实现，取消逻辑标 TODO |
| `/market/trade/begBuyOrderList` | `entrustList` / `begList` | 委托列表 / 求购列表，**靠参数区分**，参数名待确认 |
| `/market/trade/begBuyOrderInfo` | `entrustInfo` / `begInfo` | 委托详情 / 求购详情 |
| `/market/trade/createBegBuyOrder` | `submitEntrust` / `submitBegBuy` | 发起委托 / 发起求购 |
| `/index/getSeries` | `getSeries` / `seriesList` | 均取系列列表，`seriesList` 额外传 `{type:10}` |

**动态路径 1 条**：`/market/market/MarketDetail/ids/{id}` —— Express 注册为 `:id`。

### 0.2 未覆盖路径

- `/addons_diypage_index`

---

## 1. 接口总览表

| # | 路径 | 方法 | 域 | 读/写 | 状态 | 封装 | 鉴权 | 调用状态 | mock |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `/draw/InvitationFriendAssist/info` | POST | A 用户与账户 | 读 | ✅ 已设计 | D. 单对象 | 是 | 活跃 | `invitationAssist.json` |
| 2 | `/invitation/invitation/info` | POST | A 用户与账户 | 读 | ✅ 已设计 | D. 单对象 | 是 | 活跃 | `invitationInfo.json` |
| 3 | `/invitation/invitation/record` | POST | A 用户与账户 | 读 | ✅ 已设计 | C. 精简分页 | 是 | 活跃 | `invitationRecord.json` |
| 4 | `/user/address/lists` | POST | A 用户与账户 | 读 | ✅ 已设计 | A. 裸数组 | 是 | 活跃 | `addressList.json` |
| 5 | `/user/getUserInfo` | POST | A 用户与账户 | 读 | ✅ 已设计 | D. 单对象 | 是 | 活跃 | `user.json` |
| 6 | `/user/login` | POST | A 用户与账户 | 写 | ⚠️ TODO 待实现 | D. 单对象 | 否 | 活跃 | `user.json（与getUserInfo 共用）` |
| 7 | `/user/register` | POST | A 用户与账户 | 写 | ⚠️ TODO 待实现 | D. 单对象 | 否 | 活跃 | `user.json` |
| 8 | `/index/getSeries` | POST | B 藏品与系列 | 读 | ✅ 已设计 | A. 裸数组 | 否 | 活跃 | `series-10.json（pid 变体：series-10-pid.json）` |
| 9 | `/market/market/seriesGoodsList` | POST | B 藏品与系列 | 读 | ✅ 已设计 | E. 嵌套混合 | 否 | 活跃 | `marketGoodsList.json` |
| 10 | `/market/trade/collectionInfo` | POST | B 藏品与系列 | 读 | ✅ 已设计 | D. 单对象 | 是 | 活跃 | `myCollectionDetail.json` |
| 11 | `/market/trade/userCollectionList` | POST | B 藏品与系列 | 读 | ✅ 已设计 | C. 精简分页 | 是 | 活跃 | `myCollectionList.json` |
| 12 | `/product/product/detail` | POST | B 藏品与系列 | 读 | ✅ 已设计 | D. 单对象 | 否 | 活跃 | `productDetail.json` |
| 13 | `/product/product/rule` | POST | B 藏品与系列 | 读 | ✅ 已设计 | D. 单对象 | 否 | 活跃 | `productRule.json` |
| 14 | `/kline/info/detail` | POST | C 交易与订单 | 读 | ✅ 已设计 | D. 单对象 | 否 | **仅登记** | `klineInfo.json` |
| 15 | `/market/market/MarketDetail/ids/{id}` | POST | C 交易与订单 | 读 | ✅ 已设计 | D. 单对象 | 否 | 活跃 | `marketDetail.json` |
| 16 | `/market/market/getMarketList` | POST | C 交易与订单 | 读 | ✅ 已设计 | A. 裸数组 | 否 | 活跃 | `marketList.json` |
| 17 | `/market/trade/begBuyOrderInfo` | POST | C 交易与订单 | 读 | ✅ 已设计 | D. 单对象 | 是 | 活跃 | `orderDetail.json` |
| 18 | `/market/trade/begBuyOrderList` | POST | C 交易与订单 | 读 | ✅ 已设计 | C. 精简分页 | 是 | 活跃 | `entrustList.json` |
| 19 | `/market/trade/collectionDetail` | POST | C 交易与订单 | 读 | ✅ 已设计 | D. 单对象 | 否 | 活跃 | `sellInfo.json` |
| 20 | `/market/trade/createBegBuyOrder` | POST | C 交易与订单 | 写 | ⚠️ TODO 待实现 | D. 单对象 | 是 | 活跃 | `（无）` |
| 21 | `/market/trade/getSellCollectionInfo` | POST | C 交易与订单 | 读 | ✅ 已设计 | D. 单对象 | 是 | 活跃 | `userCollectionList.json` |
| 22 | `/market/trade/sell` | POST | C 交易与订单 | 写 | ⚠️ TODO 待实现 | D. 单对象 | 是 | 活跃 | `（无）` |
| 23 | `/order/order/myConsignment` | POST | C 交易与订单 | 读 | ✅ 已设计 | C. 精简分页 | 是 | 活跃 | `myConsignment.json` |
| 24 | `/order/order/orderList` | POST | C 交易与订单 | 读 | ✅ 已设计 | B. 标准分页 | 是 | 活跃 | `orderList.json` |
| 25 | `/order/order/saleMarketOrderDetail` | POST | C 交易与订单 | 读 | ✅ 已设计 | D. 单对象 | 是 | 活跃 | `orderDetail.json（与 begBuyOrderInfo 共用同一文件）` |
| 26 | `/activeSelected/list` | POST | D 活动与玩法 | 读 | ✅ 已设计 | A. 裸数组 | 否 | 活跃 | `activeSelectedList.json` |
| 27 | `/activity/draw/info` | POST | D 活动与玩法 | 读 | ✅ 已设计 | D. 单对象 | 否 | 活跃 | `activityDraw.json` |
| 28 | `/activity/draw/record` | POST | D 活动与玩法 | 读 | ✅ 已设计 | A. 裸数组 | 是 | 活跃 | `activityRecord.json` |
| 29 | `/box/blind_box/list` | POST | D 活动与玩法 | 读 | ✅ 已设计 | A. 裸数组 | 否 | 活跃 | `blindBoxList.json` |
| 30 | `/box/blind_box/myBox` | POST | D 活动与玩法 | 读 | ✅ 已设计 | D. 单对象 | 是 | 活跃 | `blindBoxMyBox.json` |
| 31 | `/box/blind_box/openlog` | POST | D 活动与玩法 | 读 | ✅ 已设计 | A. 裸数组 | 是 | 活跃 | `blindBoxOpenRecord.json` |
| 32 | `/compound/compound/list` | POST | D 活动与玩法 | 读 | ✅ 已设计 | A. 裸数组 | 否 | 活跃 | `compoundList.json` |
| 33 | `/compound/compound/record` | POST | D 活动与玩法 | 读 | ✅ 已设计 | A. 裸数组 | 是 | 活跃 | `compoundRecord.json` |
| 34 | `/compound/compound/result` | POST | D 活动与玩法 | 写 | ⚠️ TODO 待实现 | D. 单对象 | 是 | 活跃 | `compoundResult.json` |
| 35 | `/compound/compound/scheme` | POST | D 活动与玩法 | 读 | ✅ 已设计 | D. 单对象 | 否 | 活跃 | `compoundScheme.json` |
| 36 | `/crystal_goods/boxDetail` | POST | D 活动与玩法 | 读 | ✅ 已设计 | D. 单对象 | 是 | 活跃 | `shopBoxDetail.json` |
| 37 | `/crystal_goods/collectionDetail` | POST | D 活动与玩法 | 读 | ✅ 已设计 | D. 单对象 | 是 | 活跃 | `shopCollectionDetail.json` |
| 38 | `/crystal_goods/crystalDetail` | POST | D 活动与玩法 | 读 | ✅ 已设计 | A. 裸数组 | 是 | 活跃 | `shopCrystalDetail.json` |
| 39 | `/crystal_goods/crystalList` | POST | D 活动与玩法 | 读 | ✅ 已设计 | D. 单对象 | 是 | 活跃 | `shopList.json` |
| 40 | `/crystal_goods/exchangeRecord` | POST | D 活动与玩法 | 读 | ✅ 已设计 | A. 裸数组 | 是 | 活跃 | `shopExchangeRecord.json` |
| 41 | `/crystal_goods/goodsDetail` | POST | D 活动与玩法 | 读 | ✅ 已设计 | D. 单对象 | 是 | 活跃 | `shopGoodsDetail.json` |
| 42 | `/draw/Leaderboard/list` | POST | D 活动与玩法 | 读 | ✅ 已设计 | D. 单对象 | 是 | 活跃 | `drawLeaderboard.json` |
| 43 | `/draw/communityShare/info` | POST | D 活动与玩法 | 读 | ✅ 已设计 | D. 单对象 | 是 | 活跃 | `communityShare.json` |
| 44 | `/draw/drawResult/result` | POST | D 活动与玩法 | 读 | ✅ 已设计 | D. 单对象 | 是 | 活跃 | `drawResult.json` |
| 45 | `/lottery/lottery/info` | POST | D 活动与玩法 | 读 | ✅ 已设计 | D. 单对象 | 否 | 活跃 | `lotteryInfo.json` |
| 46 | `/lottery/lottery/record` | POST | D 活动与玩法 | 读 | ✅ 已设计 | A. 裸数组 | 是 | 活跃 | `lotteryRecord.json` |
| 47 | `/lottery/lottery/rule` | POST | D 活动与玩法 | 读 | ✅ 已设计 | D. 单对象 | 否 | 活跃 | `lotteryRule.json` |
| 48 | `/sign/index/info` | POST | D 活动与玩法 | 读 | ✅ 已设计 | D. 单对象 | 是 | 活跃 | `signInfo.json` |
| 49 | `/user_collection/user_collection/openbox` | POST | D 活动与玩法 | 写 | ⚠️ TODO 待实现 | A. 裸数组 | 是 | 活跃 | `blindBoxResult.json` |
| 50 | `/user_collection/user_collection/openboxone` | POST | D 活动与玩法 | 写 | ⚠️ TODO 待实现 | D. 单对象 | 是 | 活跃 | `blindBoxResultOne.json` |
| 51 | `/addons/diypage/index` | POST | E 内容社区 | 读 | ✅ 已设计 | A. 裸数组 | 否 | 活跃 | `diypage.json` |
| 52 | `/banner/show/getBanner` | POST | E 内容社区 | 读 | ✅ 已设计 | B. 标准分页 | 否 | 活跃 | `banner_show_getBanner.json` |
| 53 | `/community/chat/messageList` | POST | E 内容社区 | 读 | ✅ 已设计 | A. 裸数组 | 否 | **仅登记** | `chatMessages.json` |
| 54 | `/index/afficheDetail` | POST | E 内容社区 | 读 | ✅ 已设计 | D. 单对象 | 否 | 活跃 | `noticeDetails.json` |
| 55 | `/index/afficheList` | POST | E 内容社区 | 读 | ✅ 已设计 | B. 标准分页 | 否 | 活跃 | `afficheList.json` |
| 56 | `/index/affichetypelist` | POST | E 内容社区 | 读 | ✅ 已设计 | A. 裸数组 | 否 | 活跃 | `affichetypelist.json` |
| 57 | `/index/getConfig` | POST | E 内容社区 | 读 | ✅ 已设计 | D. 单对象 | 否 | 活跃 | `getConfig.json` |
| 58 | `/index/newsDetail` | POST | E 内容社区 | 读 | ✅ 已设计 | D. 单对象 | 否 | 活跃 | `newsDetails.json` |
| 59 | `/shequ/rumor/info` | POST | E 内容社区 | 读 | ✅ 已设计 | D. 单对象 | 否 | 活跃 | `wallDetails.json` |
| 60 | `/leaderboard/leaderboard/goods` | POST | F 统计分销 | 读 | ✅ 已设计 | A. 裸数组 | 否 | **仅登记** | `leaderboard.json` |
| 61 | `/leaderboard/leaderboard/user` | POST | F 统计分销 | 读 | ✅ 已设计 | D. 单对象 | 是 | **仅登记** | `leaderboardUser.json` |
| 62 | `/marketCapRanking/marketCapRanking/list` | POST | F 统计分销 | 读 | ✅ 已设计 | D. 单对象 | 否 | **仅登记** | `marketCapRanking.json` |
| 63 | `/rank/masterRank/list` | POST | F 统计分销 | 读 | ✅ 已设计 | A. 裸数组 | 否 | **仅登记** | `masterRank.json` |
| 64 | `/rank/userBuy/list` | POST | F 统计分销 | 读 | ✅ 已设计 | A. 裸数组 | 否 | **仅登记** | `userBuyRank.json` |
| 65 | `/rebate/rebate/index` | POST | F 统计分销 | 读 | ✅ 已设计 | D. 单对象 | 是 | **仅登记** | `rebate.json` |
| 66 | `/rebate/rebate/inviteDetail` | POST | F 统计分销 | 读 | ✅ 已设计 | A. 裸数组 | 是 | **仅登记** | `rebateInviteDetail.json` |
| 67 | `/rebate/rebate/leaderboard` | POST | F 统计分销 | 读 | ✅ 已设计 | A. 裸数组 | 是 | **仅登记** | `rebateLeaderboard.json` |
| 68 | `/market/trade/flowDoc` | POST | G 转赠与配置 | 读 | ✅ 已设计 | A. 裸数组 | 是 | 活跃 | `flowDoc.json` |
| 69 | `/regift/record/list` | POST | G 转赠与配置 | 读 | ✅ 已设计 | A. 裸数组 | 是 | **仅登记** | `regiftRecord.json` |

---

## 2. 接口详情

## 域：A 用户与账户

### /draw/InvitationFriendAssist/info `/draw/InvitationFriendAssist/info`

- **方法**：`POST`
- **用途**：邀请好友助力
- **业务域**：A 用户与账户
- **读/写**：读
- **鉴权**：需登录（token 请求头）
- **响应封装**：D. 单对象（`data:{...}`）
- **数据来源表**：user_invitation_assists, app_configs(group=assist)
- **mock 文件**：`invitationAssist.json`
- **实现状态**：✅ 已设计

**消费页面**（`src/pages/` 实测）：draw/InvitationAssist.vue:70（传空对象）

**请求参数**

| 来源 | 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|---|
| `data` | `code` | string | 否 | **待确认**：助力码，响应含 code 字段，疑似回传 |

> `param` 拼 query string，`data` 作为 JSON body。前端 `remoteRequest` 对 GET 会忽略 body，故本项目接口统一 POST。

**响应结构**（`{code, msg, data, time}`，`code=1` 为成功）

| 字段 | 类型 | 说明 |
|---|---|---|
| `assist_num` | integer | 已助力人数 |
| `need_num` | integer | 需要人数 |
| `code` | string | 助力码 |
| `hero_image` | string | 主图 |
| `records` | array | `[{id,nickname,avatar,create_time,is_new_user,is_real}]`；is_real 见 §4 E-INVITE-STATUS |
| `assist_tip` | string | 助力提示 |

### /invitation/invitation/info `/invitation/invitation/info`

- **方法**：`POST`
- **用途**：邀请信息（邀请码/邀请人数）
- **业务域**：A 用户与账户
- **读/写**：读
- **鉴权**：需登录（token 请求头）
- **响应封装**：D. 单对象（`data:{...}`）
- **数据来源表**：users(invite_code→inviter_code), app_configs
- **mock 文件**：`invitationInfo.json`
- **实现状态**：✅ 已设计

**消费页面**（`src/pages/` 实测）：invitation/Invitation.vue:128（与 fetchInvitationRecord 同处）

**请求参数**

| 来源 | 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|---|
| `data` | `无` | - | 否 | 用户身份来自 token |

> `param` 拼 query string，`data` 作为 JSON body。前端 `remoteRequest` 对 GET 会忽略 body，故本项目接口统一 POST。

**响应结构**（`{code, msg, data, time}`，`code=1` 为成功）

| 字段 | 类型 | 说明 |
|---|---|---|
| `invite_code` | string | 本人邀请码 |
| `invite_num` | integer | 已邀请人数 |
| `invite_path` | string | 邀请路径 |
| `app_download_path` | string | 下载路径 |
| `crystal_number` | integer | 积分余额 |

### /invitation/invitation/record `/invitation/invitation/record`

- **方法**：`POST`
- **用途**：邀请记录
- **业务域**：A 用户与账户
- **读/写**：读
- **鉴权**：需登录（token 请求头）
- **响应封装**：C. 精简分页（`{total,data[]}`）
- **数据来源表**：user_invitations
- **mock 文件**：`invitationRecord.json`
- **实现状态**：✅ 已设计

**消费页面**（`src/pages/` 实测）：invitation/Invitation.vue:128, invitation/InvitationRecord.vue:55

**请求参数**

| 来源 | 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|---|
| `data` | `page` | integer | 否 | **待确认** |
| `data` | `limit` | integer | 否 | **待确认** |

> `param` 拼 query string，`data` 作为 JSON body。前端 `remoteRequest` 对 GET 会忽略 body，故本项目接口统一 POST。

**响应结构**（`{code, msg, data, time}`，`code=1` 为成功）

| 字段 | 类型 | 说明 |
|---|---|---|
| `total` | integer | 总数 |
| `list` | array | `{id,mobile,create_time,status,remark}`；status 见 §4 E-INVITE-STATUS |

> **说明**：风格 C 但列表键为 `list`（非 `data`），与 myConsignment 的 `data` 不同。**响应键名必须严格区分**。

### /user/address/lists `/user/address/lists`

- **方法**：`POST`
- **用途**：收货地址列表
- **业务域**：A 用户与账户
- **读/写**：读
- **鉴权**：需登录（token 请求头）
- **响应封装**：A. 裸数组（`data: []`）
- **数据来源表**：user_addresses
- **mock 文件**：`addressList.json`
- **实现状态**：✅ 已设计

**消费页面**（`src/pages/` 实测）：my/AddressList.vue:75（`api.addressList()` 固定 `data:{}`）

**请求参数**

| 来源 | 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|---|
| `data` | `无` | - | 否 | 用户身份来自 token |

> `param` 拼 query string，`data` 作为 JSON body。前端 `remoteRequest` 对 GET 会忽略 body，故本项目接口统一 POST。

**响应结构**（`{code, msg, data, time}`，`code=1` 为成功）

| 字段 | 类型 | 说明 |
|---|---|---|
| `[]` | array | `{address_id,name,mobile,province,city,area,address,is_default}` |

### /user/getUserInfo `/user/getUserInfo`

- **方法**：`POST`
- **用途**：当前登录用户信息
- **业务域**：A 用户与账户
- **读/写**：读
- **鉴权**：需登录（token 请求头）
- **响应封装**：D. 单对象（`data:{...}`）
- **数据来源表**：users, user_sign_status(crystal_number)
- **mock 文件**：`user.json`
- **实现状态**：✅ 已设计

**消费页面**（`src/pages/` 实测）：my/Info.vue:92, my/Vip.vue:112, certification/Certification.vue:115, my/ActionPwdGetCode.vue:125

**请求参数**

| 来源 | 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|---|
| `data` | `无` | - | 否 | 用户身份全部来自 token |

> `param` 拼 query string，`data` 作为 JSON body。前端 `remoteRequest` 对 GET 会忽略 body，故本项目接口统一 POST。

**响应结构**（`{code, msg, data, time}`，`code=1` 为成功）

| 字段 | 类型 | 说明 |
|---|---|---|
| `userinfo` | object | 同 /user/login；**本接口不应返回 token**（DATABASE.md §9） |

### /user/login `/user/login`

- **方法**：`POST`
- **用途**：登录
- **业务域**：A 用户与账户
- **读/写**：写
- **鉴权**：公开
- **响应封装**：D. 单对象（`data:{...}`）
- **数据来源表**：users（token 不入库，DATABASE.md §9）
- **mock 文件**：`user.json（与getUserInfo 共用）`
- **实现状态**：⚠️ **TODO 写操作，本轮只出契约不实现**

**消费页面**（`src/pages/` 实测）：login/Login.vue:85（`{account, password}`）

**请求参数**

| 来源 | 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|---|
| `data` | `account` | string | 是 | 账号（手机号或用户名），Login.vue 表单字段 |
| `data` | `password` | string | 是 | 密码（明文传输，须 HTTPS） |

> `param` 拼 query string，`data` 作为 JSON body。前端 `remoteRequest` 对 GET 会忽略 body，故本项目接口统一 POST。

**响应结构**（`{code, msg, data, time}`，`code=1` 为成功）

| 字段 | 类型 | 说明 |
|---|---|---|
| `userinfo` | object | `{id,username,nickname,mobile,avatar,score,inviter_code,yao_count,huifu_service_charge,sandpay_service_charge,token}` |

> **说明**：**TODO 写操作**。本轮返回含真实 JWT 的成功响应，不校验密码。token 字段是前端唯一凭证来源，必须真实可用（见 impl 说明）。

### /user/register `/user/register`

- **方法**：`POST`
- **用途**：注册
- **业务域**：A 用户与账户
- **读/写**：写
- **鉴权**：公开
- **响应封装**：D. 单对象（`data:{...}`）
- **数据来源表**：users
- **mock 文件**：`user.json`
- **实现状态**：⚠️ **TODO 写操作，本轮只出契约不实现**

**消费页面**（`src/pages/` 实测）：login/Register.vue（实参待确认）

**请求参数**

| 来源 | 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|---|
| `data` | `mobile` | string | 否 | **待确认**：Register.vue 表单字段未逐项核 |
| `data` | `password` | string | 否 | **待确认** |
| `data` | `code` | string | 否 | **待确认**：短信验证码 |

> `param` 拼 query string，`data` 作为 JSON body。前端 `remoteRequest` 对 GET 会忽略 body，故本项目接口统一 POST。

**响应结构**（`{code, msg, data, time}`，`code=1` 为成功）

| 字段 | 类型 | 说明 |
|---|---|---|
| `userinfo` | object | 同 /user/login |

> **说明**：**TODO 写操作**。参数需前端补 Register.vue 实参后确认。

## 域：B 藏品与系列

### /index/getSeries `/index/getSeries`

- **方法**：`POST`
- **用途**：系列列表（支持 pid 查子系列）
- **业务域**：B 藏品与系列
- **读/写**：读
- **鉴权**：公开
- **响应封装**：A. 裸数组（`data: []`）
- **数据来源表**：series
- **mock 文件**：`series-10.json（pid 变体：series-10-pid.json）`
- **实现状态**：✅ 已设计

**消费页面**（`src/pages/` 实测）：market/Market.vue:262(`{type:10}`) /263(`{type:10,pid:10}`); utils fetchSeries/fetchSeriesPid

**请求参数**

| 来源 | 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|---|
| `param` | `type` | integer | 是 | 系列类型，实测恒 10；走 query string（api 对象用 param） |
| `param` | `pid` | integer | 否 | 父系列 id，缺省取顶级系列 |

> `param` 拼 query string，`data` 作为 JSON body。前端 `remoteRequest` 对 GET 会忽略 body，故本项目接口统一 POST。

**响应结构**（`{code, msg, data, time}`，`code=1` 为成功）

| 字段 | 类型 | 说明 |
|---|---|---|
| `[]` | array | `{series_name,series_id,is_def,flag,pattern,resale_put_start_time,resale_put_end_time,resale_buy_start_time,resale_buy_end_time}` |

### /market/market/seriesGoodsList `/market/market/seriesGoodsList`

- **方法**：`POST`
- **用途**：某系列下的商品列表
- **业务域**：B 藏品与系列
- **读/写**：读
- **鉴权**：公开
- **响应封装**：E. 嵌套混合（`data:{product:{},...分页}`）
- **数据来源表**：market_listings, products, product_pool_items
- **mock 文件**：`marketGoodsList.json`
- **实现状态**：✅ 已设计

**消费页面**（`src/pages/` 实测）：market/MarketGoodsList.vue:202（`{id, type: route.query.goodsType || 2}`）

**请求参数**

| 来源 | 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|---|
| `data` | `id` | integer | 是 | 系列 id（页面实参 `id` 来自路由/选中系列） |
| `data` | `type` | integer | 否 | 商品类型：1=盲盒 2=单品，默认 2 |

> `param` 拼 query string，`data` 作为 JSON body。前端 `remoteRequest` 对 GET 会忽略 body，故本项目接口统一 POST。

**响应结构**（`{code, msg, data, time}`，`code=1` 为成功）

| 字段 | 类型 | 说明 |
|---|---|---|
| `product` | object | `{id,name,total_num,flux,is_like,batch_pay,collection_level,listimg,issuer,introduce_image}` |
| `total` | integer | 总数 |
| `current_page` | integer | 当前页 |
| `last_page` | integer | 总页数 |
| `data` | array | `{id,name,collection_code,min_price,status,income_type,createtime,listimg}`；income_type 为数组形态（§6.2） |

> **说明**：风格 E：product 对象与 data 列表并存。参数名 `id` 指系列 id 而非商品 id，易误读，已按页面实参记录。

### /market/trade/collectionInfo `/market/trade/collectionInfo`

- **方法**：`POST`
- **用途**：单个藏品详情
- **业务域**：B 藏品与系列
- **读/写**：读
- **鉴权**：需登录（token 请求头）
- **响应封装**：D. 单对象（`data:{...}`）
- **数据来源表**：user_collections, products
- **mock 文件**：`myCollectionDetail.json`
- **实现状态**：✅ 已设计

**消费页面**（`src/pages/` 实测）：myCollection/CollectionDetails.vue:176（`{id: route.query.id || 226}`）

**请求参数**

| 来源 | 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|---|
| `data` | `id` | integer | 是 | 藏品 id，默认 226 |

> `param` 拼 query string，`data` 作为 JSON body。前端 `remoteRequest` 对 GET 会忽略 body，故本项目接口统一 POST。

**响应结构**（`{code, msg, data, time}`，`code=1` 为成功）

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | integer | id |
| `collection_code` | string | 藏品编号 |
| `serial_num` | integer | 总序号 |
| `series_total` | integer | 系列内序号 |
| `user_hash` | string | 用户哈希（可能已脱敏，§6.3） |
| `user_hash_text` | string | 脱敏哈希 |
| `rz_code` | string | 认证码 |
| `createtime` | integer | 创建时间 |
| `status` | integer | §4 E-COLLECTION-STATUS |
| `is_lock` | integer | 是否锁定 |
| `weither_regift` | integer | 是否可转赠 |
| `weither_resale` | integer | 是否可转售 |
| `can_compose` | integer | 是否可合成 |
| `price` | string | 售价 |
| `min_price` | string | 最低价 |
| `today_volume` | integer | 今日成交量 |
| `product` | object | `{id,name,goods_type,listimg,main_image,total_num,flux,sale_total_num,is_lock,weither_regift,weither_resale,can_compose,series{id,name},publisher{name,user}}` |

### /market/trade/userCollectionList `/market/trade/userCollectionList`

- **方法**：`POST`
- **用途**：我的藏品列表（分页）
- **业务域**：B 藏品与系列
- **读/写**：读
- **鉴权**：需登录（token 请求头）
- **响应封装**：C. 精简分页（`{total,data[]}`）
- **数据来源表**：user_collections, products
- **mock 文件**：`myCollectionList.json`
- **实现状态**：✅ 已设计

**消费页面**（`src/pages/` 实测）：myCollection/MyCollection.vue:179(`{}`), myCollection/Search.vue:94(`{}`)

**请求参数**

| 来源 | 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|---|
| `data` | `page` | integer | 否 | 页码；**待确认**：页面传空对象，分页由滚动触发 |
| `data` | `limit` | integer | 否 | **待确认** |
| `data` | `keyword` | string | 否 | 搜索关键词——**utils L140 明确消费 `data.keyword`**，用于前端本地过滤 |

> `param` 拼 query string，`data` 作为 JSON body。前端 `remoteRequest` 对 GET 会忽略 body，故本项目接口统一 POST。

**响应结构**（`{code, msg, data, time}`，`code=1` 为成功）

| 字段 | 类型 | 说明 |
|---|---|---|
| `total` | integer | 总数 |
| `current_page` | integer | 当前页 |
| `last_page` | integer | 总页数 |
| `data` | array | `{id,collection_id,collection_code,name,listimg,main_image,status,has_sold,price,count,total_num,flux,createtime}`；status 见 §4 E-COLLECTION-STATUS |

> **说明**：utils L136-145 在前端对结果做 keyword 过滤，故keyword 可由后端过滤，也可仅传参与前端过滤（当前实现为前端过滤）。

### /product/product/detail `/product/product/detail`

- **方法**：`POST`
- **用途**：商品详情（盲盒/藏品通用）
- **业务域**：B 藏品与系列
- **读/写**：读
- **鉴权**：公开
- **响应封装**：D. 单对象（`data:{...}`）
- **数据来源表**：products, product_pool_items
- **mock 文件**：`productDetail.json`
- **实现状态**：✅ 已设计

**消费页面**（`src/pages/` 实测）：product/Box.vue:142(`{id: route.query.id || 226}`), product/Collection.vue:77（同）

**请求参数**

| 来源 | 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|---|
| `data` | `id` | integer | 是 | 商品 id，页面默认 226 |

> `param` 拼 query string，`data` 作为 JSON body。前端 `remoteRequest` 对 GET 会忽略 body，故本项目接口统一 POST。

**响应结构**（`{code, msg, data, time}`，`code=1` 为成功）

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | integer | id |
| `goods_type` | integer | 1=盲盒 2=单品 |
| `name` | string | 名称 |
| `price` | string | 价格 |
| `sale_status` | integer | 销售状态 |
| `is_shengou` | integer | 是否申购 |
| `is_sub` | integer | 是否订阅 |
| `shengou` | object | 申购配置 `{num,user_num,start_time,end_time}` |
| `count_down` | integer | 倒计时 |
| `introduce` | string | 介绍 |
| `product` | object | `{id,name,goods_type,listimg,main_image,total_num,sale_total_num,flux,is_like,is_sub,collectionlist[],publisher{name,user},series{id,name}}` |

### /product/product/rule `/product/product/rule`

- **方法**：`POST`
- **用途**：申购/购买规则
- **业务域**：B 藏品与系列
- **读/写**：读
- **鉴权**：公开
- **响应封装**：D. 单对象（`data:{...}`）
- **数据来源表**：product_sale_rules, products
- **mock 文件**：`productRule.json`
- **实现状态**：✅ 已设计

**消费页面**（`src/pages/` 实测）：product/RuleDetail.vue:95（`{id: route.query.id || 226}`）

**请求参数**

| 来源 | 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|---|
| `data` | `id` | integer | 是 | 商品 id，默认 226 |

> `param` 拼 query string，`data` 作为 JSON body。前端 `remoteRequest` 对 GET 会忽略 body，故本项目接口统一 POST。

**响应结构**（`{code, msg, data, time}`，`code=1` 为成功）

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | integer | id |
| `name` | string | 名称 |
| `price` | string | 价格 |
| `total_num` | integer | 总量 |
| `sale_num` | integer | 已售 |
| `rule_updated` | string | 规则更新时间 |
| `rules` | array | `[{icon,title,lines[]}]` |

## 域：C 交易与订单

### /kline/info/detail `/kline/info/detail`

- **方法**：`POST`
- **用途**：K线详情：买卖盘 + 成交明细
- **业务域**：C 交易与订单
- **读/写**：读
- **鉴权**：公开
- **响应封装**：D. 单对象（`data:{...}`）
- **数据来源表**：kline_snapshots
- **mock 文件**：`klineInfo.json`
- **实现状态**：✅ 已设计

**消费页面**（`src/pages/` 实测）：kline/Info.vue:131（经 fetchKlineInfo）

**请求参数**

| 来源 | 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|---|
| `data` | `待确认` | - | 否 | **待确认**：kline/Info.vue L131 实参未逐项核 |
| `data` | `id` | integer | 否 | 藏品 id（**待确认**，按语义推断） |

> `param` 拼 query string，`data` 作为 JSON body。前端 `remoteRequest` 对 GET 会忽略 body，故本项目接口统一 POST。

**响应结构**（`{code, msg, data, time}`，`code=1` 为成功）

| 字段 | 类型 | 说明 |
|---|---|---|
| `name` | string | 藏品名 |
| `series_name` | string | 系列名 |
| `price` | string | 当前价 |
| `change` | string | 涨跌幅，**含百分号**如 `"-0.53%"`（DATABASE.md §9），格式化在前端做 |
| `increase` | boolean | 是否上涨 |
| `num` | object | 统计 `{flux,deal_5min,high_24h,deal_1h,low_24h,deal_today}` |
| `asks` | array | 卖盘 `[{price,num,total}]` |
| `bids` | array | 买盘 `[{price,num,total}]` |
| `deals` | array | 成交明细 `[{time,price,num,total}]` |

> **说明**：**路径修正**：ARCHITECTURE §11 P2。真实路径为 `/kline/info/detail`（MOCK_MAP L80），不存在 `/market/kline/info/detail`。本接口是 11 个缺失方法之一（`api.klineInfo`），前端需补转发。

### /market/market/MarketDetail/ids/{id} `/market/market/MarketDetail/ids/{id}`

- **方法**：`POST`
- **用途**：藏品/市场详情
- **业务域**：C 交易与订单
- **读/写**：读
- **鉴权**：公开
- **响应封装**：D. 单对象（`data:{...}`）
- **数据来源表**：market_listings, products, user_collections, users
- **mock 文件**：`marketDetail.json`
- **实现状态**：✅ 已设计

**消费页面**（`src/pages/` 实测）：market/Detail.vue:257, market/BatchPay.vue:178, order/OrderSubmit.vue:206, utils fetchTradeBaseInfo（默认 id=226）

**请求参数**

| 来源 | 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|---|
| `path` | `id` | integer | 是 | 藏品 id，嵌在路径中（`/ids/{id}`）；`api.getMarketDetails(id)` 用模板字符串拼接 |

> `param` 拼 query string，`data` 作为 JSON body。前端 `remoteRequest` 对 GET 会忽略 body，故本项目接口统一 POST。

**响应结构**（`{code, msg, data, time}`，`code=1` 为成功）

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | integer | id |
| `name` | string | 藏品名 |
| `goods_type` | integer | 商品类型 |
| `price` | string | 当前售价（字符串金额，DATABASE.md §6.4） |
| `listimg` | string | 列表图 |
| `product` | object | `{id,name,listimg,total_num,publisher{name,user},collectionlist[],imageinfo[],issuer}`；imageinfo/issuer 恒空（§9） |
| `user_collection` | object | 持有者信息，含 `user_hash`（可能为脱敏值，§6.3） |

> **说明**：唯一动态路径。Express 路由注册为 `/market/market/MarketDetail/ids/:id`。localRequest 用正则匹配此路径。

### /market/market/getMarketList `/market/market/getMarketList`

- **方法**：`POST`
- **用途**：市场藏品列表
- **业务域**：C 交易与订单
- **读/写**：读
- **鉴权**：公开
- **响应封装**：A. 裸数组（`data: []`）
- **数据来源表**：product_market_stats, products
- **mock 文件**：`marketList.json`
- **实现状态**：✅ 已设计

**消费页面**（`src/pages/` 实测）：index/Index.vue:317(`{page:1,list_rows:1,goods_type:2}`), market/Market.vue:237(`{page:1,list_rows:20,series_id}`), market/Search.vue:120(`{}`)

**请求参数**

| 来源 | 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|---|
| `data` | `page` | integer | 是 | 页码，从 1 起 |
| `data` | `list_rows` | integer | 否 | 每页条数；亦接受 `limit` |
| `data` | `series_id` | integer | 否 | 按系列筛选，Market.vue 传当前选中系列 |
| `data` | `goods_type` | integer | 否 | 商品类型：1=盲盒 2=单品（DATABASE.md §4 E-GOODS-TYPE-COLLECTION） |

> `param` 拼 query string，`data` 作为 JSON body。前端 `remoteRequest` 对 GET 会忽略 body，故本项目接口统一 POST。

**响应结构**（`{code, msg, data, time}`，`code=1` 为成功）

| 字段 | 类型 | 说明 |
|---|---|---|
| `[]` | array | `{name,series_id,id,listimg,total_num,reprice_limit,collection_level,openresale_time,flag,select_status,deal_num,flux,is_like,market_fluctuate_new,market_value,market_fluctuate,min_price,is_out,new_time,goods_type,product{id,name,listimg,total_num}}`；goods_type 为字符串形态（DATABASE.md §6.2 脏数据） |

### /market/trade/begBuyOrderInfo `/market/trade/begBuyOrderInfo`

- **方法**：`POST`
- **用途**：委托 / 求购订单详情
- **业务域**：C 交易与订单
- **读/写**：读
- **鉴权**：需登录（token 请求头）
- **响应封装**：D. 单对象（`data:{...}`）
- **数据来源表**：entrust_orders, order_cards(空)
- **mock 文件**：`orderDetail.json`
- **实现状态**：✅ 已设计

**消费页面**（`src/pages/` 实测）：utils fetchEntrustInfo / fetchBegInfo（OrderDetail.vue）

**请求参数**

| 来源 | 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|---|
| `data` | `id` | integer | 是 | **待确认**：订单 id 字段名，实参照saleMarketOrderDetail 的 `id`，但需前端确认 |

> `param` 拼 query string，`data` 作为 JSON body。前端 `remoteRequest` 对 GET 会忽略 body，故本项目接口统一 POST。

**响应结构**（`{code, msg, data, time}`，`code=1` 为成功）

| 字段 | 类型 | 说明 |
|---|---|---|
| `结构同` | - | `/order/order/saleMarketOrderDetail`（mock 为同一文件 orderDetail.json） |

> **说明**：2 个函数复用（entrustInfo/begInfo）。

### /market/trade/begBuyOrderList `/market/trade/begBuyOrderList`

- **方法**：`POST`
- **用途**：我的委托 / 我的求购列表
- **业务域**：C 交易与订单
- **读/写**：读
- **鉴权**：需登录（token 请求头）
- **响应封装**：C. 精简分页（`{total,data[]}`）
- **数据来源表**：entrust_orders
- **mock 文件**：`entrustList.json`
- **实现状态**：✅ 已设计

**消费页面**（`src/pages/` 实测）：utils fetchEntrustList / fetchBegList（OrderFilterList.vue）

**请求参数**

| 来源 | 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|---|
| `data` | `page` | integer | 否 | **待确认**：OrderFilterList.vue 实参未逐项核 |
| `data` | `limit` | integer | 否 | **待确认** |
| `data` | `type` | integer | 否 | **待确认**：区分委托(1)/求购(2) 的字段名待确认 |

> `param` 拼 query string，`data` 作为 JSON body。前端 `remoteRequest` 对 GET 会忽略 body，故本项目接口统一 POST。

**响应结构**（`{code, msg, data, time}`，`code=1` 为成功）

| 字段 | 类型 | 说明 |
|---|---|---|
| `total` | integer | 总数 |
| `data` | array | `{id,order_sn,order_status,goods_name,listimg,collection_code,number,num,sale_number,price,total_price,pay_way,createtime,updatetime}`；order_status 见 §4 E-ENTRUST-STATUS |

> **说明**：2 个函数复用（entrustList/begList）。begList.json 与 entrustList.json 字节完全相同（DATABASE.md §8 第 30 项）。

### /market/trade/collectionDetail `/market/trade/collectionDetail`

- **方法**：`POST`
- **用途**：寄售详情：今日行情 + 成交记录
- **业务域**：C 交易与订单
- **读/写**：读
- **鉴权**：公开
- **响应封装**：D. 单对象（`data:{...}`）
- **数据来源表**：collection_price_ticks, products
- **mock 文件**：`sellInfo.json`
- **实现状态**：✅ 已设计

**消费页面**（`src/pages/` 实测）：market/SellInfo.vue:102（`{id: route.query.id || 226}`，经 fetchSellInfo）

**请求参数**

| 来源 | 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|---|
| `data` | `id` | integer | 是 | 藏品 id，默认 226 |

> `param` 拼 query string，`data` 作为 JSON body。前端 `remoteRequest` 对 GET 会忽略 body，故本项目接口统一 POST。

**响应结构**（`{code, msg, data, time}`，`code=1` 为成功）

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | integer | id |
| `goods_type` | integer | 商品类型 |
| `price` | number | 当前价 |
| `name` | string | 名称 |
| `series_name` | string | 系列名 |
| `status` | integer | §4 E-LISTING-STATUS |
| `today_highest_price` | string | 今日最高价 |
| `today_volume` | string | 今日成交量 |
| `today_lowest_price` | string | 今日最低价 |
| `floor_price` | string | 地板价 |
| `product` | object | `{id,name,main_image,listimg,collection_code,batch,publisher}` |
| `list` | array | 成交记录 `[{collection_code,total_num,price,num,time}]` |

> **说明**：`price` 实测为 number（其他金额字段多为 string），属源站类型不一致，**按原样保留不做归一**。

### /market/trade/createBegBuyOrder `/market/trade/createBegBuyOrder`

- **方法**：`POST`
- **用途**：发起委托 / 发起求购
- **业务域**：C 交易与订单
- **读/写**：写
- **鉴权**：需登录（token 请求头）
- **响应封装**：D. 单对象（`data:{...}`）
- **数据来源表**：entrust_orders
- **mock 文件**：`（无）`
- **实现状态**：⚠️ **TODO 写操作，本轮只出契约不实现**

**消费页面**（`src/pages/` 实测）：market/SubmitEntrust.vue, market/SubmitBegBuy.vue（经 utils fetchTradeBaseInfo 拿基础信息后提交）

**请求参数**

| 来源 | 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|---|
| `data` | `goods_id` | integer | 否 | **待确认**：提交表单字段需读 SubmitBegBuy.vue 提交逻辑 |
| `data` | `price` | string | 否 | **待确认**：委托/求购价（字符串金额） |
| `data` | `number` | integer | 否 | **待确认**：数量 |
| `data` | `type` | integer | 否 | **待确认**：委托/求购区分 |

> `param` 拼 query string，`data` 作为 JSON body。前端 `remoteRequest` 对 GET 会忽略 body，故本项目接口统一 POST。

**响应结构**（`{code, msg, data, time}`，`code=1` 为成功）

| 字段 | 类型 | 说明 |
|---|---|---|
| `待确认` | - | **TODO**：源站返回结构无 mock 快照（未登记 MOCK_MAP），需前端确认页面消费方式 |

> **说明**：**TODO 写操作**。2 函数复用（submitEntrust/submitBegBuy）。MOCK_MAP 未登记→ 本地模式返回空数组兜底，故无响应结构依据。

### /market/trade/getSellCollectionInfo `/market/trade/getSellCollectionInfo`

- **方法**：`POST`
- **用途**：可出售藏品列表（待售）
- **业务域**：C 交易与订单
- **读/写**：读
- **鉴权**：需登录（token 请求头）
- **响应封装**：D. 单对象（`data:{...}`）
- **数据来源表**：user_collections, products
- **mock 文件**：`userCollectionList.json`
- **实现状态**：✅ 已设计

**消费页面**（`src/pages/` 实测）：utils fetchUserCollectionList；market/SellBegBuy.vue:266, regift/Regift.vue:111

**请求参数**

| 来源 | 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|---|
| `data` | `无` | - | 否 | utils 层固定传 `{}` |

> `param` 拼 query string，`data` 作为 JSON body。前端 `remoteRequest` 对 GET 会忽略 body，故本项目接口统一 POST。

**响应结构**（`{code, msg, data, time}`，`code=1` 为成功）

| 字段 | 类型 | 说明 |
|---|---|---|
| `user_collection_list` | array | `{id,user_collection_id,name,collection_code,total_num,count,price,pay_way,main_image}` |

> **说明**：utils 层 pick 为 `{user_collection_list:[]}` 默认值，故响应键名必须严格一致。

### /market/trade/sell `/market/trade/sell`

- **方法**：`POST`
- **用途**：以求购价出售
- **业务域**：C 交易与订单
- **读/写**：写
- **鉴权**：需登录（token 请求头）
- **响应封装**：D. 单对象（`data:{...}`）
- **数据来源表**：market_listings, orders
- **mock 文件**：`（无）`
- **实现状态**：⚠️ **TODO 写操作，本轮只出契约不实现**

**消费页面**（`src/pages/` 实测）：market/SellBegBuy.vue（提交动作）

**请求参数**

| 来源 | 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|---|
| `data` | `待确认` | - | 否 | **待确认**：SellBegBuy.vue 提交字段未逐项核 |

> `param` 拼 query string，`data` 作为 JSON body。前端 `remoteRequest` 对 GET 会忽略 body，故本项目接口统一 POST。

**响应结构**（`{code, msg, data, time}`，`code=1` 为成功）

| 字段 | 类型 | 说明 |
|---|---|---|
| `待确认` | - | **TODO**：无 mock 快照依据 |

> **说明**：**TODO 写操作**。MOCK_MAP 未登记。

### /order/order/myConsignment `/order/order/myConsignment`

- **方法**：`POST`
- **用途**：我的寄售列表（也被赠送记录复用）
- **业务域**：C 交易与订单
- **读/写**：读
- **鉴权**：需登录（token 请求头）
- **响应封装**：C. 精简分页（`{total,data[]}`）
- **数据来源表**：market_listings
- **mock 文件**：`myConsignment.json`
- **实现状态**：✅ 已设计

**消费页面**（`src/pages/` 实测）：order/OrderList.vue:470(`{page:1,limit:15}`), consignments/MyConsignment.vue:129(`{page:1}`), consignments/Search.vue:130/147(`{page:1}`), market/GiftRecord.vue:54(经 fetchGiftRecord 传 `{type:"gift"}`)

**请求参数**

| 来源 | 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|---|
| `data` | `page` | integer | 是 | 页码，从 1 起 |
| `data` | `limit` | integer | 否 | 每页条数 |
| `data` | `type` | string | 否 | **复用参数**：`gift` 表示赠送记录（GiftRecord.vue 实参），缺省为寄售列表 |
| `data` | `keyword` | string | 否 | **待确认**：Search.vue 传 `{page:1}`，搜索关键词字段名未实测 |

> `param` 拼 query string，`data` 作为 JSON body。前端 `remoteRequest` 对 GET 会忽略 body，故本项目接口统一 POST。

**响应结构**（`{code, msg, data, time}`，`code=1` 为成功）

| 字段 | 类型 | 说明 |
|---|---|---|
| `total` | integer | 总数 |
| `data` | array | `{id,goods_name,listimg,collection_code,status,price,pay_way,createtime,updatetime}`；status 枚举见 §4 E-LISTING-STATUS |

> **说明**：**4 个函数复用同一路径**（consignList/myConsignment/consignSearch/cancelConsignment）。其中 `cancelConsignment` 是**写语义**（取消寄售）却复用读路径——本轮按读实现并返回成功响应，取消动作标TODO。

### /order/order/orderList `/order/order/orderList`

- **方法**：`POST`
- **用途**：我的订单列表（分页）
- **业务域**：C 交易与订单
- **读/写**：读
- **鉴权**：需登录（token 请求头）
- **响应封装**：B. 标准分页（`{total,per_page,current_page,last_page,data[]}`）
- **数据来源表**：orders(order_type=1), products
- **mock 文件**：`orderList.json`
- **实现状态**：✅ 已设计

**消费页面**（`src/pages/` 实测）：order/OrderList.vue:469（`{page:1, limit:15, type:1, status:0}`）

**请求参数**

| 来源 | 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|---|
| `data` | `page` | integer | 是 | 页码，从 1 起 |
| `data` | `limit` | integer | 否 | 每页条数，实参 15；本接口用 `limit` 而非 `list_rows` |
| `data` | `type` | integer | 否 | 订单类型：实测 1=普通买单（DATABASE.md §8第 27 项 order_type=1） |
| `data` | `status` | integer | 否 | 订单状态，枚举见 §4 E-ORDER-STATUS-BUY；实参 0 |

> `param` 拼 query string，`data` 作为 JSON body。前端 `remoteRequest` 对 GET 会忽略 body，故本项目接口统一 POST。

**响应结构**（`{code, msg, data, time}`，`code=1` 为成功）

| 字段 | 类型 | 说明 |
|---|---|---|
| `total` | integer | 总数 |
| `per_page` | integer | 每页数 |
| `current_page` | integer | 当前页 |
| `last_page` | integer | 总页数 |
| `data` | array | `{id,order_sn,order_status,goods_id,goods_name,listimg,number,sale_number,price,total_price,income_type,createtime,updatetime,collection_code,user_hash_text}` |

### /order/order/saleMarketOrderDetail `/order/order/saleMarketOrderDetail`

- **方法**：`POST`
- **用途**：订单详情（常规/市场/转赠/委托/求购共用）
- **业务域**：C 交易与订单
- **读/写**：读
- **鉴权**：需登录（token 请求头）
- **响应封装**：D. 单对象（`data:{...}`）
- **数据来源表**：orders, order_cards(空)
- **mock 文件**：`orderDetail.json（与 begBuyOrderInfo 共用同一文件）`
- **实现状态**：✅ 已设计

**消费页面**（`src/pages/` 实测）：order/OrderDetail.vue:348（`{id: route.query.id || 9001}`）

**请求参数**

| 来源 | 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|---|
| `data` | `id` | integer | 是 | 订单 id，默认 9001 |

> `param` 拼 query string，`data` 作为 JSON body。前端 `remoteRequest` 对 GET 会忽略 body，故本项目接口统一 POST。

**响应结构**（`{code, msg, data, time}`，`code=1` 为成功）

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | integer | id |
| `order_sn` | string | 订单号 |
| `order_status` | integer | 订单状态 |
| `goods_id` | integer | 商品 id |
| `goods_name` | string | 商品名 |
| `listimg` | string | 图 |
| `collection_code` | string | 藏品编号（可能为数字字符串，§6.1 三套编码体系） |
| `user_hash_text` | string | 用户哈希（脱敏） |
| `pay_way` | string | 支付方式，§4 E-PAY-WAY |
| `pay_name` | string | 支付名称 |
| `number` | integer | 数量 |
| `num` | integer | 数量 |
| `sale_number` | integer | 已售数量 |
| `price` | string | 单价 |
| `total_price` | string | 总价 |
| `order_amount` | string | 订单金额 |
| `discount_amount` | string | 优惠金额 |
| `pay_price` | string | 应付金额 |
| `remark` | string | 备注 |
| `createtime` | integer | 创建时间 |
| `updatetime` | integer | 更新时间 |
| `card` | array | **实测恒为空数组**，字段名无从得知（DATABASE.md §10 遗留项） |
| `goods_type` | integer | 商品类型 |

## 域：D 活动与玩法

### /activeSelected/list `/activeSelected/list`

- **方法**：`POST`
- **用途**：精选活动列表
- **业务域**：D 活动与玩法
- **读/写**：读
- **鉴权**：公开
- **响应封装**：A. 裸数组（`data: []`）
- **数据来源表**：activities
- **mock 文件**：`activeSelectedList.json`
- **实现状态**：✅ 已设计

**消费页面**（`src/pages/` 实测）：draw/ActiveSelected.vue:78（传空对象）

**请求参数**

| 来源 | 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|---|
| `data` | `无` | - | 否 | 页面传空对象 |

> `param` 拼 query string，`data` 作为 JSON body。前端 `remoteRequest` 对 GET 会忽略 body，故本项目接口统一 POST。

**响应结构**（`{code, msg, data, time}`，`code=1` 为成功）

| 字段 | 类型 | 说明 |
|---|---|---|
| `[]` | array | `{id,title,listimg,type,start_time,end_time,join_num,status,qualify,route}`；type 见 §4 E-ACTIVITY-TYPE |

### /activity/draw/info `/activity/draw/info`

- **方法**：`POST`
- **用途**：活动抽签信息
- **业务域**：D 活动与玩法
- **读/写**：读
- **鉴权**：公开
- **响应封装**：D. 单对象（`data:{...}`）
- **数据来源表**：draw_codes, app_configs(group=draw)
- **mock 文件**：`activityDraw.json`
- **实现状态**：✅ 已设计

**消费页面**（`src/pages/` 实测）：activity/ActivityDraw.vue:85（传空对象）

**请求参数**

| 来源 | 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|---|
| `data` | `无` | - | 否 | 页面传空对象 |

> `param` 拼 query string，`data` 作为 JSON body。前端 `remoteRequest` 对 GET 会忽略 body，故本项目接口统一 POST。

**响应结构**（`{code, msg, data, time}`，`code=1` 为成功）

| 字段 | 类型 | 说明 |
|---|---|---|
| `activity` | object | `{title,listimg,start_time,draw_time,open_time,end_time}` |
| `draw_code` | string | 本人抽签码 |
| `win_code` | string | 中奖码 |
| `code_list` | array | 全部抽签码 `[{id,code,create_time}]` |
| `win_code_list` | array | 中奖码列表 `[{id,code,create_time}]` |
| `draw_rule` | string | 规则 |

### /activity/draw/record `/activity/draw/record`

- **方法**：`POST`
- **用途**：活动抽签记录
- **业务域**：D 活动与玩法
- **读/写**：读
- **鉴权**：需登录（token 请求头）
- **响应封装**：A. 裸数组（`data: []`）
- **数据来源表**：user_draw_records
- **mock 文件**：`activityRecord.json`
- **实现状态**：✅ 已设计

**消费页面**（`src/pages/` 实测）：activity/ActivityRecord.vue:41（传空对象）

**请求参数**

| 来源 | 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|---|
| `data` | `page` | integer | 否 | **待确认** |
| `data` | `limit` | integer | 否 | **待确认** |

> `param` 拼 query string，`data` 作为 JSON body。前端 `remoteRequest` 对 GET 会忽略 body，故本项目接口统一 POST。

**响应结构**（`{code, msg, data, time}`，`code=1` 为成功）

| 字段 | 类型 | 说明 |
|---|---|---|
| `[]` | array | `{id,draw_sn,draw_time,status}`；status 见 §4 E-DRAW-STATUS |

### /box/blind_box/list `/box/blind_box/list`

- **方法**：`POST`
- **用途**：盲盒发售日历
- **业务域**：D 活动与玩法
- **读/写**：读
- **鉴权**：公开
- **响应封装**：A. 裸数组（`data: []`）
- **数据来源表**：（无数据，不入库）
- **mock 文件**：`blindBoxList.json`
- **实现状态**：✅ 已设计

**消费页面**（`src/pages/` 实测）：index/Index.vue:347（`api.blindBoxList(params)`，params 内容待确认）

**请求参数**

| 来源 | 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|---|
| `data` | `待确认` | - | 否 | Index.vue L347 传 `params` 变量，其定义需读 L340 附近；字段未在 api 层固定 |

> `param` 拼 query string，`data` 作为 JSON body。前端 `remoteRequest` 对 GET 会忽略 body，故本项目接口统一 POST。

**响应结构**（`{code, msg, data, time}`，`code=1` 为成功）

| 字段 | 类型 | 说明 |
|---|---|---|
| `[]` | array | **实测为空数组**，无字段可列举（DATABASE.md §8 第 77/78 项） |

> **说明**：mock 为空数组，响应字段结构**无mock 依据**，标待确认。实现时需按盲盒业务补齐或保持空数组。

### /box/blind_box/myBox `/box/blind_box/myBox`

- **方法**：`POST`
- **用途**：我的盲盒
- **业务域**：D 活动与玩法
- **读/写**：读
- **鉴权**：需登录（token 请求头）
- **响应封装**：D. 单对象（`data:{...}`）
- **数据来源表**：user_collections(blind_box_id), products
- **mock 文件**：`blindBoxMyBox.json`
- **实现状态**：✅ 已设计

**消费页面**（`src/pages/` 实测）：blindBox/Index.vue:54（`{}`）

**请求参数**

| 来源 | 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|---|
| `data` | `无` | - | 否 | utils 层固定传 `{}` |

> `param` 拼 query string，`data` 作为 JSON body。前端 `remoteRequest` 对 GET 会忽略 body，故本项目接口统一 POST。

**响应结构**（`{code, msg, data, time}`，`code=1` 为成功）

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | integer | id |
| `name` | string | 盲盒名 |
| `num` | integer | 数量 |
| `listimg` | string | 列表图 |
| `main_image` | string | 主图 |
| `rarity_icon` | string | 稀有度图标 |
| `product_id` | integer | 商品 id |
| `user_collection_id` | integer | 用户藏品 id |

### /box/blind_box/openlog `/box/blind_box/openlog`

- **方法**：`POST`
- **用途**：开盒记录
- **业务域**：D 活动与玩法
- **读/写**：读
- **鉴权**：需登录（token 请求头）
- **响应封装**：A. 裸数组（`data: []`）
- **数据来源表**：user_collections, products
- **mock 文件**：`blindBoxOpenRecord.json`
- **实现状态**：✅ 已设计

**消费页面**（`src/pages/` 实测）：blindBox/OpenRecord.vue:47（传空对象）

**请求参数**

| 来源 | 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|---|
| `data` | `page` | integer | 否 | **待确认** |
| `data` | `limit` | integer | 否 | **待确认** |

> `param` 拼 query string，`data` 作为 JSON body。前端 `remoteRequest` 对 GET 会忽略 body，故本项目接口统一 POST。

**响应结构**（`{code, msg, data, time}`，`code=1` 为成功）

| 字段 | 类型 | 说明 |
|---|---|---|
| `[]` | array | `{id,listimg,name,collection_code,rarity_icon,createtime,box_name}`；**createtime 为 integer时间戳**（源站少数时间戳字段之一，§6.5） |

### /compound/compound/list `/compound/compound/list`

- **方法**：`POST`
- **用途**：合成玩法列表
- **业务域**：D 活动与玩法
- **读/写**：读
- **鉴权**：公开
- **响应封装**：A. 裸数组（`data: []`）
- **数据来源表**：compound_schemes
- **mock 文件**：`compoundList.json`
- **实现状态**：✅ 已设计

**消费页面**（`src/pages/` 实测）：compound/Compound.vue:78（传空对象）

**请求参数**

| 来源 | 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|---|
| `data` | `无` | - | 否 | 页面传空对象 |

> `param` 拼 query string，`data` 作为 JSON body。前端 `remoteRequest` 对 GET 会忽略 body，故本项目接口统一 POST。

**响应结构**（`{code, msg, data, time}`，`code=1` 为成功）

| 字段 | 类型 | 说明 |
|---|---|---|
| `[]` | array | `{id,play_id,title,listimg,start_time,end_time,join_num,qualify,rule_url}`；start_time/end_time 为 **integer 时间戳** |

### /compound/compound/record `/compound/compound/record`

- **方法**：`POST`
- **用途**：我的合成记录
- **业务域**：D 活动与玩法
- **读/写**：读
- **鉴权**：需登录（token 请求头）
- **响应封装**：A. 裸数组（`data: []`）
- **数据来源表**：user_compound_records
- **mock 文件**：`compoundRecord.json`
- **实现状态**：✅ 已设计

**消费页面**（`src/pages/` 实测）：compound/Record.vue:91（传空对象）

**请求参数**

| 来源 | 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|---|
| `data` | `page` | integer | 否 | **待确认** |
| `data` | `limit` | integer | 否 | **待确认** |

> `param` 拼 query string，`data` 作为 JSON body。前端 `remoteRequest` 对 GET 会忽略 body，故本项目接口统一 POST。

**响应结构**（`{code, msg, data, time}`，`code=1` 为成功）

| 字段 | 类型 | 说明 |
|---|---|---|
| `[]` | array | `{id,create_time,title,listimg,materials,method,consume[]}`；create_time 为 integer；consume 存 JSON（DATABASE.md §8 第 36 项） |

### /compound/compound/result `/compound/compound/result`

- **方法**：`POST`
- **用途**：合成结果
- **业务域**：D 活动与玩法
- **读/写**：写
- **鉴权**：需登录（token 请求头）
- **响应封装**：D. 单对象（`data:{...}`）
- **数据来源表**：compound_results
- **mock 文件**：`compoundResult.json`
- **实现状态**：⚠️ **TODO 写操作，本轮只出契约不实现**

**消费页面**（`src/pages/` 实测）：compound/Result.vue:70, compound/SchemeDetails.vue:129（均传空对象）

**请求参数**

| 来源 | 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|---|
| `data` | `play_id` | integer | 否 | **待确认** |

> `param` 拼 query string，`data` 作为 JSON body。前端 `remoteRequest` 对 GET 会忽略 body，故本项目接口统一 POST。

**响应结构**（`{code, msg, data, time}`，`code=1` 为成功）

| 字段 | 类型 | 说明 |
|---|---|---|
| `result` | array | `[{type,name,user_collection_code,total_num}]`；type 见 §4 E-COMPOUND-RESULT |

> **说明**：**TODO 写操作**。

### /compound/compound/scheme `/compound/compound/scheme`

- **方法**：`POST`
- **用途**：合成方案详情
- **业务域**：D 活动与玩法
- **读/写**：读
- **鉴权**：公开
- **响应封装**：D. 单对象（`data:{...}`）
- **数据来源表**：compound_schemes(rule_text), compound_scheme_items
- **mock 文件**：`compoundScheme.json`
- **实现状态**：✅ 已设计

**消费页面**（`src/pages/` 实测）：compound/SchemeDetails.vue:102（传空对象）

**请求参数**

| 来源 | 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|---|
| `data` | `play_id` | integer | 否 | **待确认**：方案 id 字段名，疑似 play_id |
| `data` | `id` | integer | 否 | **待确认** |

> `param` 拼 query string，`data` 作为 JSON body。前端 `remoteRequest` 对 GET 会忽略 body，故本项目接口统一 POST。

**响应结构**（`{code, msg, data, time}`，`code=1` 为成功）

| 字段 | 类型 | 说明 |
|---|---|---|
| `play_id` | integer | 玩法 id |
| `title` | string | 标题 |
| `target_img` | string | 目标图 |
| `rule_text` | array | 所需材料 `[{name,number,collectionList[]}]` |

> **说明**：**字段名大小写陷阱**：`collectionList` 首字母大写，与项目其他 snake_case 字段不一致。**必须原样返回**，前端按此解析。

### /crystal_goods/boxDetail `/crystal_goods/boxDetail`

- **方法**：`POST`
- **用途**：商城盲盒详情
- **业务域**：D 活动与玩法
- **读/写**：读
- **鉴权**：需登录（token 请求头）
- **响应封装**：D. 单对象（`data:{...}`）
- **数据来源表**：shop_goods, products, product_pool_items
- **mock 文件**：`shopBoxDetail.json`
- **实现状态**：✅ 已设计

**消费页面**（`src/pages/` 实测）：shop/BoxDetail.vue:105, blindBox/BlindBoxDetails.vue:109（均传空对象）

**请求参数**

| 来源 | 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|---|
| `data` | `id` | integer | 否 | **待确认**：同goodsDetail |

> `param` 拼 query string，`data` 作为 JSON body。前端 `remoteRequest` 对 GET 会忽略 body，故本项目接口统一 POST。

**响应结构**（`{code, msg, data, time}`，`code=1` 为成功）

| 字段 | 类型 | 说明 |
|---|---|---|
| `info` | object | 同 goodsDetail 的 info |
| `product` | object | `{id,name,listimg,main_image,goods_type,price,total_num,details,publisher,collectionlist[]}`；**实测 collectionlist 有 4 条**（概率池），与 goodsDetail 的空数组构成对比 |

### /crystal_goods/collectionDetail `/crystal_goods/collectionDetail`

- **方法**：`POST`
- **用途**：商城藏品详情
- **业务域**：D 活动与玩法
- **读/写**：读
- **鉴权**：需登录（token 请求头）
- **响应封装**：D. 单对象（`data:{...}`）
- **数据来源表**：shop_goods, products, product_pool_items
- **mock 文件**：`shopCollectionDetail.json`
- **实现状态**：✅ 已设计

**消费页面**（`src/pages/` 实测）：shop/CollectionDetail.vue:110（传空对象）

**请求参数**

| 来源 | 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|---|
| `data` | `id` | integer | 否 | **待确认** |

> `param` 拼 query string，`data` 作为 JSON body。前端 `remoteRequest` 对 GET 会忽略 body，故本项目接口统一 POST。

**响应结构**（`{code, msg, data, time}`，`code=1` 为成功）

| 字段 | 类型 | 说明 |
|---|---|---|
| `info` | object | 同 goodsDetail 的 info |
| `product` | object | `{id,name,listimg,main_image,goods_type,price,total_num,details,publisher,collectionlist[]}`；实测 collectionlist 有 2 条 |

### /crystal_goods/crystalDetail `/crystal_goods/crystalDetail`

- **方法**：`POST`
- **用途**：积分明细流水
- **业务域**：D 活动与玩法
- **读/写**：读
- **鉴权**：需登录（token 请求头）
- **响应封装**：A. 裸数组（`data: []`）
- **数据来源表**：user_crystal_logs
- **mock 文件**：`shopCrystalDetail.json`
- **实现状态**：✅ 已设计

**消费页面**（`src/pages/` 实测）：shop/DetailList.vue:86（传空对象）

**请求参数**

| 来源 | 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|---|
| `data` | `model` | integer | 否 | **待确认**：响应含 model 字段，疑似筛选参数 |

> `param` 拼 query string，`data` 作为 JSON body。前端 `remoteRequest` 对 GET 会忽略 body，故本项目接口统一 POST。

**响应结构**（`{code, msg, data, time}`，`code=1` 为成功）

| 字段 | 类型 | 说明 |
|---|---|---|
| `[]` | array | `{id,model,memo,crystal,createtime}`；model 枚举**无 mock 依据，待确认** |

### /crystal_goods/crystalList `/crystal_goods/crystalList`

- **方法**：`POST`
- **用途**：积分商城商品列表
- **业务域**：D 活动与玩法
- **读/写**：读
- **鉴权**：需登录（token 请求头）
- **响应封装**：D. 单对象（`data:{...}`）
- **数据来源表**：shop_goods, user_sign_status(crystal_number)
- **mock 文件**：`shopList.json`
- **实现状态**：✅ 已设计

**消费页面**（`src/pages/` 实测）：shop/Shop.vue:75（`{}`）

**请求参数**

| 来源 | 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|---|
| `data` | `无` | - | 否 | 页面传空对象 |

> `param` 拼 query string，`data` 作为 JSON body。前端 `remoteRequest` 对 GET 会忽略 body，故本项目接口统一 POST。

**响应结构**（`{code, msg, data, time}`，`code=1` 为成功）

| 字段 | 类型 | 说明 |
|---|---|---|
| `crystal_number` | integer | 当前积分余额 |
| `crystal_type` | integer | 积分类型 |
| `user_info` | object | `{nickname,avatar}` |
| `list` | array | `{goods_id,goods_name,list_image,crystal_price,exchange_status,total_num,exchange_num,goods_type,end_time}`；exchange_status 见 §4 E-EXCHANGE-STATUS |

> **说明**：鉴权判定：返回 `user_info` 与积分余额，属用户私有数据，故白名单归为需鉴权。

### /crystal_goods/exchangeRecord `/crystal_goods/exchangeRecord`

- **方法**：`POST`
- **用途**：我的兑换记录
- **业务域**：D 活动与玩法
- **读/写**：读
- **鉴权**：需登录（token 请求头）
- **响应封装**：A. 裸数组（`data: []`）
- **数据来源表**：user_shop_exchanges, orders(order_id)
- **mock 文件**：`shopExchangeRecord.json`
- **实现状态**：✅ 已设计

**消费页面**（`src/pages/` 实测）：shop/Record.vue:46（传空对象）

**请求参数**

| 来源 | 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|---|
| `data` | `page` | integer | 否 | **待确认** |
| `data` | `limit` | integer | 否 | **待确认** |

> `param` 拼 query string，`data` 作为 JSON body。前端 `remoteRequest` 对 GET 会忽略 body，故本项目接口统一 POST。

**响应结构**（`{code, msg, data, time}`，`code=1` 为成功）

| 字段 | 类型 | 说明 |
|---|---|---|
| `[]` | array | `{id,order_id,goods_name,list_image,crystal_number,crystal_type,create_time}` |

### /crystal_goods/goodsDetail `/crystal_goods/goodsDetail`

- **方法**：`POST`
- **用途**：商城商品详情（单品）
- **业务域**：D 活动与玩法
- **读/写**：读
- **鉴权**：需登录（token 请求头）
- **响应封装**：D. 单对象（`data:{...}`）
- **数据来源表**：shop_goods, products
- **mock 文件**：`shopGoodsDetail.json`
- **实现状态**：✅ 已设计

**消费页面**（`src/pages/` 实测）：shop/GoodsDetail.vue:91, shop/Exchange.vue:132（均传空对象）

**请求参数**

| 来源 | 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|---|
| `data` | `id` | integer | 否 | **待确认**：页面传空对象，id疑似来自 route.query |

> `param` 拼 query string，`data` 作为 JSON body。前端 `remoteRequest` 对 GET 会忽略 body，故本项目接口统一 POST。

**响应结构**（`{code, msg, data, time}`，`code=1` 为成功）

| 字段 | 类型 | 说明 |
|---|---|---|
| `info` | object | `{id,crystal_number,crystal_type,crystal_price,exchange_status,max_count,is_sub,count_down,type,details}` |
| `product` | object | `{id,name,listimg,main_image,goods_type,price,total_num,details,publisher{name,user},collectionlist}`；**实测 collectionlist 为空数组**（§9） |

> **说明**：`is_sub` 是**布尔类型**（源站少数真实布尔字段之一）。

### /draw/Leaderboard/list `/draw/Leaderboard/list`

- **方法**：`POST`
- **用途**：抽签排行榜
- **业务域**：D 活动与玩法
- **读/写**：读
- **鉴权**：需登录（token 请求头）
- **响应封装**：D. 单对象（`data:{...}`）
- **数据来源表**：rank_snapshots(rank_type=draw)
- **mock 文件**：`drawLeaderboard.json`
- **实现状态**：✅ 已设计

**消费页面**（`src/pages/` 实测）：draw/DrawLeaderboard.vue:73（传空对象）

**请求参数**

| 来源 | 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|---|
| `data` | `无` | - | 否 | 页面传空对象 |

> `param` 拼 query string，`data` 作为 JSON body。前端 `remoteRequest` 对 GET 会忽略 body，故本项目接口统一 POST。

**响应结构**（`{code, msg, data, time}`，`code=1` 为成功）

| 字段 | 类型 | 说明 |
|---|---|---|
| `myrank` | object | 我的排名 `{rank_num,nums}` |
| `list` | array | 榜单 `[{id,nickname,avatar,nums}]` |
| `rank_rule` | string | 榜单规则 |

> **说明**：因含`myrank`（我的排名），故定为鉴权接口。

### /draw/communityShare/info `/draw/communityShare/info`

- **方法**：`POST`
- **用途**：抽签社区分享信息
- **业务域**：D 活动与玩法
- **读/写**：读
- **鉴权**：需登录（token 请求头）
- **响应封装**：D. 单对象（`data:{...}`）
- **数据来源表**：community_share_records, app_configs(group=community_share)
- **mock 文件**：`communityShare.json`
- **实现状态**：✅ 已设计

**消费页面**（`src/pages/` 实测）：draw/CommunityShare.vue:100（传空对象）

**请求参数**

| 来源 | 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|---|
| `data` | `无` | - | 否 | 页面传空对象 |

> `param` 拼 query string，`data` 作为 JSON body。前端 `remoteRequest` 对 GET 会忽略 body，故本项目接口统一 POST。

**响应结构**（`{code, msg, data, time}`，`code=1` 为成功）

| 字段 | 类型 | 说明 |
|---|---|---|
| `share_images` | array | 分享图 URL 数组 |
| `audit_status` | integer | 审核状态 |
| `audit_text` | string | 审核文案 |
| `share_records` | array | `[{id,community,create_time}]` |

### /draw/drawResult/result `/draw/drawResult/result`

- **方法**：`POST`
- **用途**：全民抽签结果
- **业务域**：D 活动与玩法
- **读/写**：读
- **鉴权**：需登录（token 请求头）
- **响应封装**：D. 单对象（`data:{...}`）
- **数据来源表**：draw_codes（派生，不独立入库，§8 第 43 项）
- **mock 文件**：`drawResult.json`
- **实现状态**：✅ 已设计

**消费页面**（`src/pages/` 实测）：draw/DrawResult.vue:49（传空对象）

**请求参数**

| 来源 | 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|---|
| `data` | `无` | - | 否 | 页面传空对象 |

> `param` 拼 query string，`data` 作为 JSON body。前端 `remoteRequest` 对 GET 会忽略 body，故本项目接口统一 POST。

**响应结构**（`{code, msg, data, time}`，`code=1` 为成功）

| 字段 | 类型 | 说明 |
|---|---|---|
| `draw_complete` | integer | 是否完成 |
| `success_code` | string | 成功码 |
| `success_list` | array | `[{id,code}]` |

### /lottery/lottery/info `/lottery/lottery/info`

- **方法**：`POST`
- **用途**：转盘活动信息
- **业务域**：D 活动与玩法
- **读/写**：读
- **鉴权**：公开
- **响应封装**：D. 单对象（`data:{...}`）
- **数据来源表**：lottery_rounds(prizes/consume 存 JSON，§8 第 38 项)
- **mock 文件**：`lotteryInfo.json`
- **实现状态**：✅ 已设计

**消费页面**（`src/pages/` 实测）：lottery/Lottery.vue:93（传空对象）

**请求参数**

| 来源 | 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|---|
| `data` | `无` | - | 否 | 页面传空对象 |

> `param` 拼 query string，`data` 作为 JSON body。前端 `remoteRequest` 对 GET 会忽略 body，故本项目接口统一 POST。

**响应结构**（`{code, msg, data, time}`，`code=1` 为成功）

| 字段 | 类型 | 说明 |
|---|---|---|
| `prizeList` | array | 奖品 `[{id,name,lottery_image}]` |
| `consume` | array | 消耗藏品 `[{id,name,collection_code,total_num,image,number}]` |
| `end_time` | integer | 结束时间戳 |

### /lottery/lottery/record `/lottery/lottery/record`

- **方法**：`POST`
- **用途**：我的抽奖记录
- **业务域**：D 活动与玩法
- **读/写**：读
- **鉴权**：需登录（token 请求头）
- **响应封装**：A. 裸数组（`data: []`）
- **数据来源表**：user_lottery_records
- **mock 文件**：`lotteryRecord.json`
- **实现状态**：✅ 已设计

**消费页面**（`src/pages/` 实测）：lottery/Record.vue:39（传空对象）

**请求参数**

| 来源 | 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|---|
| `data` | `page` | integer | 否 | **待确认** |
| `data` | `limit` | integer | 否 | **待确认** |

> `param` 拼 query string，`data` 作为 JSON body。前端 `remoteRequest` 对 GET 会忽略 body，故本项目接口统一 POST。

**响应结构**（`{code, msg, data, time}`，`code=1` 为成功）

| 字段 | 类型 | 说明 |
|---|---|---|
| `[]` | array | `{id,name,listimg,create_time}`；create_time 为 integer |

### /lottery/lottery/rule `/lottery/lottery/rule`

- **方法**：`POST`
- **用途**：转盘活动规则
- **业务域**：D 活动与玩法
- **读/写**：读
- **鉴权**：公开
- **响应封装**：D. 单对象（`data:{...}`）
- **数据来源表**：lottery_rounds.rule
- **mock 文件**：`lotteryRule.json`
- **实现状态**：✅ 已设计

**消费页面**（`src/pages/` 实测）：lottery/Rule.vue:30（传空对象）

**请求参数**

| 来源 | 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|---|
| `data` | `无` | - | 否 | 页面传空对象 |

> `param` 拼 query string，`data` 作为 JSON body。前端 `remoteRequest` 对 GET 会忽略 body，故本项目接口统一 POST。

**响应结构**（`{code, msg, data, time}`，`code=1` 为成功）

| 字段 | 类型 | 说明 |
|---|---|---|
| `rule` | string | 规则文本 |

### /sign/index/info `/sign/index/info`

- **方法**：`POST`
- **用途**：签到信息
- **业务域**：D 活动与玩法
- **读/写**：读
- **鉴权**：需登录（token 请求头）
- **响应封装**：D. 单对象（`data:{...}`）
- **数据来源表**：sign_reward_rules, user_sign_status
- **mock 文件**：`signInfo.json`
- **实现状态**：✅ 已设计

**消费页面**（`src/pages/` 实测）：sign/Sign.vue:83（传空对象）

**请求参数**

| 来源 | 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|---|
| `data` | `无` | - | 否 | 用户身份来自 token |

> `param` 拼 query string，`data` 作为 JSON body。前端 `remoteRequest` 对 GET 会忽略 body，故本项目接口统一 POST。

**响应结构**（`{code, msg, data, time}`，`code=1` 为成功）

| 字段 | 类型 | 说明 |
|---|---|---|
| `user_info` | object | `{nickname,avatar,id}` |
| `continuous_days` | integer | 连续签到天数 |
| `sign_days` | array | 已签到日期数组 |
| `sign_status` | integer | 今日签到状态 |
| `crystal_number` | integer | 积分余额 |
| `sign_rule` | string | 签到规则 |
| `reward_list` | array | 7 日奖励 `[{day,crystal}]` |

### /user_collection/user_collection/openbox `/user_collection/user_collection/openbox`

- **方法**：`POST`
- **用途**：开盒结果（批量）
- **业务域**：D 活动与玩法
- **读/写**：写
- **鉴权**：需登录（token 请求头）
- **响应封装**：A. 裸数组（`data: []`）
- **数据来源表**：user_collections, products
- **mock 文件**：`blindBoxResult.json`
- **实现状态**：⚠️ **TODO 写操作，本轮只出契约不实现**

**消费页面**（`src/pages/` 实测）：blindBox/Result.vue:55（传空对象）

**请求参数**

| 来源 | 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|---|
| `data` | `blind_box_id` | integer | 否 | **待确认**：开盒动作参数 |

> `param` 拼 query string，`data` 作为 JSON body。前端 `remoteRequest` 对 GET 会忽略 body，故本项目接口统一 POST。

**响应结构**（`{code, msg, data, time}`，`code=1` 为成功）

| 字段 | 类型 | 说明 |
|---|---|---|
| `[]` | array | `{id,listimg,name,collection_code,rarity_icon}` |

> **说明**：**TODO 写操作**。本轮返回 mock 结构成功响应，不实际生成藏品。

### /user_collection/user_collection/openboxone `/user_collection/user_collection/openboxone`

- **方法**：`POST`
- **用途**：开盒结果（单个）
- **业务域**：D 活动与玩法
- **读/写**：写
- **鉴权**：需登录（token 请求头）
- **响应封装**：D. 单对象（`data:{...}`）
- **数据来源表**：user_collections, products
- **mock 文件**：`blindBoxResultOne.json`
- **实现状态**：⚠️ **TODO 写操作，本轮只出契约不实现**

**消费页面**（`src/pages/` 实测）：blindBox/Result2.vue:47（传空对象）

**请求参数**

| 来源 | 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|---|
| `data` | `blind_box_id` | integer | 否 | **待确认** |

> `param` 拼 query string，`data` 作为 JSON body。前端 `remoteRequest` 对 GET 会忽略 body，故本项目接口统一 POST。

**响应结构**（`{code, msg, data, time}`，`code=1` 为成功）

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | integer | id |
| `name` | string | 名称 |
| `collection_code` | string | 藏品编号 |
| `listimg` | string | 列表图 |
| `main_image` | string | 主图 |
| `rarity_icon` | string | 稀有度图标 |

> **说明**：**TODO 写操作**。

## 域：E 内容社区

### /addons/diypage/index `/addons/diypage/index`

- **方法**：`POST`
- **用途**：装修页组件配置
- **业务域**：E 内容社区
- **读/写**：读
- **鉴权**：公开
- **响应封装**：A. 裸数组（`data: []`）
- **数据来源表**：diypage_components
- **mock 文件**：`diypage.json`
- **实现状态**：✅ 已设计

**消费页面**（`src/pages/` 实测）：index/Index.vue:364（`api.diypage()`）

**请求参数**

| 来源 | 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|---|
| `data` | `无` | - | 否 | `api.diypage()` 固定传 `data:{}` |

> `param` 拼 query string，`data` 作为 JSON body。前端 `remoteRequest` 对 GET 会忽略 body，故本项目接口统一 POST。

**响应结构**（`{code, msg, data, time}`，`code=1` 为成功）

| 字段 | 类型 | 说明 |
|---|---|---|
| `[]` | array | `{id,type,category,name,content,decorate_id}`；content 为前端布局 DSL，须原样存 TEXT（DATABASE.md §1） |

> **说明**：MOCK_MAP 中另有脏键 `/addons_diypage_index`（误登记文件名，非路径），须清理。见 ARCHITECTURE §10。

### /banner/show/getBanner `/banner/show/getBanner`

- **方法**：`POST`
- **用途**：首页轮播图
- **业务域**：E 内容社区
- **读/写**：读
- **鉴权**：公开
- **响应封装**：B. 标准分页（`{total,per_page,current_page,last_page,data[]}`）
- **数据来源表**：banners
- **mock 文件**：`banner_show_getBanner.json`
- **实现状态**：✅ 已设计

**消费页面**（`src/pages/` 实测）：index/Index.vue:308(经 utils fetchBanner)

**请求参数**

| 来源 | 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|---|
| `data` | `type` | integer | 否 | Index.vue L310 传 `{type:1}`；utils 层不传 |

> `param` 拼 query string，`data` 作为 JSON body。前端 `remoteRequest` 对 GET 会忽略 body，故本项目接口统一 POST。

**响应结构**（`{code, msg, data, time}`，`code=1` 为成功）

| 字段 | 类型 | 说明 |
|---|---|---|
| `total` | integer | 总数 |
| `per_page` | integer | 每页数 |
| `current_page` | integer | 当前页 |
| `last_page` | integer | 总页数 |
| `data` | array | `{id,image,url,url_type,is_show}`；url_type 枚举待确认 |

### /community/chat/messageList `/community/chat/messageList`

- **方法**：`POST`
- **用途**：聊天消息列表
- **业务域**：E 内容社区
- **读/写**：读
- **鉴权**：公开
- **响应封装**：A. 裸数组（`data: []`）
- **数据来源表**：chat_messages, chat_sessions
- **mock 文件**：`chatMessages.json`
- **实现状态**：✅ 已设计

**消费页面**（`src/pages/` 实测）：community/Chat.vue:118（`api.chatMessages()` **不存在**）

**请求参数**

| 来源 | 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|---|
| `data` | `session_id` | integer | 否 | **待确认**：聊天会话 id |

> `param` 拼 query string，`data` 作为 JSON body。前端 `remoteRequest` 对 GET 会忽略 body，故本项目接口统一 POST。

**响应结构**（`{code, msg, data, time}`，`code=1` 为成功）

| 字段 | 类型 | 说明 |
|---|---|---|
| `[]` | array | `{id,is_self,nickname,content,avatar,show_date,date_text}`；**is_self / show_date 为 boolean** |

> **说明**：**缺失方法 #9**。当前定公开（mock 为静态演示数据，7 条），但 `is_self` 说明天然属用户私有数据，**真实落地时须改为鉴权**。源站为长连接，本项目以 HTTP 拉取模拟。

### /index/afficheDetail `/index/afficheDetail`

- **方法**：`POST`
- **用途**：公告详情（含关联藏品）
- **业务域**：E 内容社区
- **读/写**：读
- **鉴权**：公开
- **响应封装**：D. 单对象（`data:{...}`）
- **数据来源表**：affiches
- **mock 文件**：`noticeDetails.json`
- **实现状态**：✅ 已设计

**消费页面**（`src/pages/` 实测）：notice/NoticeDetails.vue:77（实参 `{}`）

**请求参数**

| 来源 | 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|---|
| `data` | `id` | integer | 否 | **待确认**：页面传空对象，实际经路由 query 传入；见 note |

> `param` 拼 query string，`data` 作为 JSON body。前端 `remoteRequest` 对 GET 会忽略 body，故本项目接口统一 POST。

**响应结构**（`{code, msg, data, time}`，`code=1` 为成功）

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | integer | 公告 id |
| `title` | string | 标题 |
| `affiche_type` | string | 类型 |
| `publish_time` | string | 发布时间 |
| `createtime` | integer | 时间戳 |
| `view_count` | integer | 浏览量（仅详情接口有真实值） |
| `content` | string | 富文本正文 |
| `collection` | array | 关联藏品 `[{id,name,listimg,price}]` |

> **说明**：页面 L77 传 `{}`，但 NoticeDetails 为路由页，id 应来自 `route.query.id`。参数名与传递方式待前端确认。

### /index/afficheList `/index/afficheList`

- **方法**：`POST`
- **用途**：公告列表（分页）
- **业务域**：E 内容社区
- **读/写**：读
- **鉴权**：公开
- **响应封装**：B. 标准分页（`{total,per_page,current_page,last_page,data[]}`）
- **数据来源表**：affiches, affiche_types
- **mock 文件**：`afficheList.json`
- **实现状态**：✅ 已设计

**消费页面**（`src/pages/` 实测）：notice/Notice.vue:138, notice/Search.vue:120/141, market/MarketGoodsList.vue:203

**请求参数**

| 来源 | 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|---|
| `data` | `page` | integer | 是 | 页码，实参 `page:1`，从 1 起 |
| `data` | `list_rows` | integer | 否 | 每页条数，实参 `list_rows:30/15`；亦接受 `limit`（见 ARCHITECTURE §6.3） |
| `data` | `type` | string | 否 | 公告类型，对应 affichetypelist 的 type；Search.vue 经 params 透传 |

> `param` 拼 query string，`data` 作为 JSON body。前端 `remoteRequest` 对 GET 会忽略 body，故本项目接口统一 POST。

**响应结构**（`{code, msg, data, time}`，`code=1` 为成功）

| 字段 | 类型 | 说明 |
|---|---|---|
| `total` | integer | 总数 |
| `per_page` | string | 每页数（源站为字符串，保留） |
| `current_page` | integer | 当前页 |
| `last_page` | integer | 总页数 |
| `data` | array | `{id,image,title,createtime,type,url,view_count,affiche_type}`；view_count 列表接口恒 0（DATABASE.md §9） |

### /index/affichetypelist `/index/affichetypelist`

- **方法**：`POST`
- **用途**：公告类型列表
- **业务域**：E 内容社区
- **读/写**：读
- **鉴权**：公开
- **响应封装**：A. 裸数组（`data: []`）
- **数据来源表**：affiche_types
- **mock 文件**：`affichetypelist.json`
- **实现状态**：✅ 已设计

**消费页面**（`src/pages/` 实测）：notice/Notice.vue:134/154

**请求参数**

| 来源 | 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|---|
| `data` | `无` | - | 否 | 页面无实参 |

> `param` 拼 query string，`data` 作为 JSON body。前端 `remoteRequest` 对 GET 会忽略 body，故本项目接口统一 POST。

**响应结构**（`{code, msg, data, time}`，`code=1` 为成功）

| 字段 | 类型 | 说明 |
|---|---|---|
| `[]` | array | `{id,name}`，实测 7 条 |

### /index/getConfig `/index/getConfig`

- **方法**：`POST`
- **用途**：全局配置（应用名/Logo/GM工会/费率）
- **业务域**：E 内容社区
- **读/写**：读
- **鉴权**：公开
- **响应封装**：D. 单对象（`data:{...}`）
- **数据来源表**：app_configs(config_group=trade/basic), trade_unions
- **mock 文件**：`getConfig.json`
- **实现状态**：✅ 已设计

**消费页面**（`src/pages/` 实测）：index/Index.vue:364, market/TradeUnion.vue:91

**请求参数**

| 来源 | 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|---|
| `data` | `无` | - | 否 | 页面调用 `api.getConfig({})`，无业务参数 |

> `param` 拼 query string，`data` 作为 JSON body。前端 `remoteRequest` 对 GET 会忽略 body，故本项目接口统一 POST。

**响应结构**（`{code, msg, data, time}`，`code=1` 为成功）

| 字段 | 类型 | 说明 |
|---|---|---|
| `appName` | string | 应用名 |
| `appLogo` | string | Logo URL |
| `trade_union` | object | GM工会入口 `{unlock,member_count,rebate_holder,rebate_invited,rebate_extra,max_bind}` |
| `trade_rule` | string | 交易规则富文本 |
| `consignment_sales` | null | 恒为 null（DATABASE.md §9） |
| `rate` | string | 费率 |
| `share_proportion_rate` | string | 分成比例 |

### /index/newsDetail `/index/newsDetail`

- **方法**：`POST`
- **用途**：潮玩有话说详情
- **业务域**：E 内容社区
- **读/写**：读
- **鉴权**：公开
- **响应封装**：D. 单对象（`data:{...}`）
- **数据来源表**：news_articles
- **mock 文件**：`newsDetails.json`
- **实现状态**：✅ 已设计

**消费页面**（`src/pages/` 实测）：notice/NewsDetails.vue:58（实参 `{}`）

**请求参数**

| 来源 | 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|---|
| `data` | `id` | integer | 否 | **待确认**：同/afficheDetail |

> `param` 拼 query string，`data` 作为 JSON body。前端 `remoteRequest` 对 GET 会忽略 body，故本项目接口统一 POST。

**响应结构**（`{code, msg, data, time}`，`code=1` 为成功）

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | integer | id |
| `title` | string | 标题 |
| `createtime` | integer | 时间戳 |
| `content` | string | 正文 |

> **说明**：页面传空对象，id 疑似来自 route.query，待确认。

### /shequ/rumor/info `/shequ/rumor/info`

- **方法**：`POST`
- **用途**：社区墙动态详情（含两级评论）
- **业务域**：E 内容社区
- **读/写**：读
- **鉴权**：公开
- **响应封装**：D. 单对象（`data:{...}`）
- **数据来源表**：community_posts, community_comments(两级)
- **mock 文件**：`wallDetails.json`
- **实现状态**：✅ 已设计

**消费页面**（`src/pages/` 实测）：notice/WallDetails.vue:115（传空对象，SendRumor.vue 为发布页）

**请求参数**

| 来源 | 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|---|
| `data` | `id` | integer | 否 | **待确认**：页面传空对象，id 疑似来自 route.query |

> `param` 拼 query string，`data` 作为 JSON body。前端 `remoteRequest` 对 GET 会忽略 body，故本项目接口统一 POST。

**响应结构**（`{code, msg, data, time}`，`code=1` 为成功）

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | integer | id |
| `create_time` | string | **缺年份**，如 `"10-16 09:24"`（DATABASE.md §10裁决 E：保持字符串不补全） |
| `content` | string | 正文 |
| `profile` | object | `{nickname,avatar}` |
| `images` | array | 图片 URL 数组 |
| `comment_list` | array | `[{id,create_time,content,reply_id,profile,reply_profile,reply[],has_more}]`；**has_more 为 boolean** |

## 域：F 统计分销

### /leaderboard/leaderboard/goods `/leaderboard/leaderboard/goods`

- **方法**：`POST`
- **用途**：藏品综合榜
- **业务域**：F 统计分销
- **读/写**：读
- **鉴权**：公开
- **响应封装**：A. 裸数组（`data: []`）
- **数据来源表**：product_market_stats（可由 flux 派生，§9 建议不重复入库）
- **mock 文件**：`leaderboard.json`
- **实现状态**：✅ 已设计

**消费页面**（`src/pages/` 实测）：leaderboard/Leaderboard.vue:114（`api.leaderboardGoods()` **不存在**）

**请求参数**

| 来源 | 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|---|
| `data` | `无` | - | 否 | utils 层无参 |

> `param` 拼 query string，`data` 作为 JSON body。前端 `remoteRequest` 对 GET 会忽略 body，故本项目接口统一 POST。

**响应结构**（`{code, msg, data, time}`，`code=1` 为成功）

| 字段 | 类型 | 说明 |
|---|---|---|
| `[]` | array | `{id,name,listimg,total_num,flux,min_price,is_like}`；flux/min_price 为**字符串金额** |

> **说明**：**缺失方法 #6**。

### /leaderboard/leaderboard/user `/leaderboard/leaderboard/user`

- **方法**：`POST`
- **用途**：用户榜单（含我的排名）
- **业务域**：F 统计分销
- **读/写**：读
- **鉴权**：需登录（token 请求头）
- **响应封装**：D. 单对象（`data:{...}`）
- **数据来源表**：rank_snapshots(rank_type=user_buy)
- **mock 文件**：`leaderboardUser.json`
- **实现状态**：✅ 已设计

**消费页面**（`src/pages/` 实测）：leaderboard/Leaderboard.vue:115（`api.leaderboardUser()` **不存在**）

**请求参数**

| 来源 | 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|---|
| `data` | `无` | - | 否 | utils 层无参 |

> `param` 拼 query string，`data` 作为 JSON body。前端 `remoteRequest` 对 GET 会忽略 body，故本项目接口统一 POST。

**响应结构**（`{code, msg, data, time}`，`code=1` 为成功）

| 字段 | 类型 | 说明 |
|---|---|---|
| `list` | array | `{id,avatar,nickname,yao_count,buy_collection_total_price}` |
| `my` | object | `{order_num,mobile,avatar,yao_count,buy_collection_total_price}` |

> **说明**：**缺失方法 #7**。含 `my`（我的数据，含 mobile）→ 鉴权接口。

### /marketCapRanking/marketCapRanking/list `/marketCapRanking/marketCapRanking/list`

- **方法**：`POST`
- **用途**：市值排行榜
- **业务域**：F 统计分销
- **读/写**：读
- **鉴权**：公开
- **响应封装**：D. 单对象（`data:{...}`）
- **数据来源表**：product_market_stats
- **mock 文件**：`marketCapRanking.json`
- **实现状态**：✅ 已设计

**消费页面**（`src/pages/` 实测）：marketCapRanking/MarketCapRanking.vue:100（`api.marketCapRanking()` **不存在**）

**请求参数**

| 来源 | 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|---|
| `data` | `无` | - | 否 | utils 层无参 |

> `param` 拼 query string，`data` 作为 JSON body。前端 `remoteRequest` 对 GET 会忽略 body，故本项目接口统一 POST。

**响应结构**（`{code, msg, data, time}`，`code=1` 为成功）

| 字段 | 类型 | 说明 |
|---|---|---|
| `info` | object | `{update_time,market_desc}` |
| `list` | array | `{id,name,listimg,min_price,market_value,market_fluctuate,total_num,flux}` |

> **说明**：**缺失方法 #8**。响应无 `my` 字段 → 不鉴权。

### /rank/masterRank/list `/rank/masterRank/list`

- **方法**：`POST`
- **用途**：大师动态榜
- **业务域**：F 统计分销
- **读/写**：读
- **鉴权**：公开
- **响应封装**：A. 裸数组（`data: []`）
- **数据来源表**：rank_snapshots(rank_type=master)
- **mock 文件**：`masterRank.json`
- **实现状态**：✅ 已设计

**消费页面**（`src/pages/` 实测）：rank/MasterRank.vue:78（`api.masterRank()` **不存在**）

**请求参数**

| 来源 | 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|---|
| `data` | `无` | - | 否 | utils 层无参 |

> `param` 拼 query string，`data` 作为 JSON body。前端 `remoteRequest` 对 GET 会忽略 body，故本项目接口统一 POST。

**响应结构**（`{code, msg, data, time}`，`code=1` 为成功）

| 字段 | 类型 | 说明 |
|---|---|---|
| `[]` | array | `{id,avatar,nickname,createtime,goods_cover_image,goods_name,num}` |

> **说明**：**缺失方法 #4**。榜单为公开数据，故不鉴权。

### /rank/userBuy/list `/rank/userBuy/list`

- **方法**：`POST`
- **用途**：用户购买榜
- **业务域**：F 统计分销
- **读/写**：读
- **鉴权**：公开
- **响应封装**：A. 裸数组（`data: []`）
- **数据来源表**：rank_snapshots(rank_type=product_buy)
- **mock 文件**：`userBuyRank.json`
- **实现状态**：✅ 已设计

**消费页面**（`src/pages/` 实测）：rank/UserBuy.vue:67（`api.userBuyRank()` **不存在**）

**请求参数**

| 来源 | 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|---|
| `data` | `无` | - | 否 | utils 层无参 |

> `param` 拼 query string，`data` 作为 JSON body。前端 `remoteRequest` 对 GET 会忽略 body，故本项目接口统一 POST。

**响应结构**（`{code, msg, data, time}`，`code=1` 为成功）

| 字段 | 类型 | 说明 |
|---|---|---|
| `[]` | array | `{id,goods_cover_image,goods_name,total_price,num,createtime,count}` |

> **说明**：**缺失方法 #5**。

### /rebate/rebate/index `/rebate/rebate/index`

- **方法**：`POST`
- **用途**：返利中心
- **业务域**：F 统计分销
- **读/写**：读
- **鉴权**：需登录（token 请求头）
- **响应封装**：D. 单对象（`data:{...}`）
- **数据来源表**：rebate_profiles, app_configs(h5_invite_url, comm_desc)
- **mock 文件**：`rebate.json`
- **实现状态**：✅ 已设计

**消费页面**（`src/pages/` 实测）：rebate/Rebate.vue:145（`fetchRebateInfo` → `api.rebateInfo()` **该方法不存在**）

**请求参数**

| 来源 | 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|---|
| `data` | `无` | - | 否 | utils 层无参 |

> `param` 拼 query string，`data` 作为 JSON body。前端 `remoteRequest` 对 GET 会忽略 body，故本项目接口统一 POST。

**响应结构**（`{code, msg, data, time}`，`code=1` 为成功）

| 字段 | 类型 | 说明 |
|---|---|---|
| `c_info` | object | `{avatar,nickname,inviter_code,all_commision,yesterday_commision,user_transaction,mingxia_commision,yao_counts,you_yao_counts}`；**注意字段拼写 `commision`（源站少一个 s），必须原样返回** |
| `h5_invite_url` | string | 邀请链接 |
| `comm_desc` | string | 返佣说明 |

> **说明**：**缺失方法 #1**（11 个之一）。前端需补 `rebateInfo: () => request("/rebate/rebate/index", { data: {} })`。

### /rebate/rebate/inviteDetail `/rebate/rebate/inviteDetail`

- **方法**：`POST`
- **用途**：被邀请人清单
- **业务域**：F 统计分销
- **读/写**：读
- **鉴权**：需登录（token 请求头）
- **响应封装**：A. 裸数组（`data: []`）
- **数据来源表**：rebate_invites
- **mock 文件**：`rebateInviteDetail.json`
- **实现状态**：✅ 已设计

**消费页面**（`src/pages/` 实测）：rebate/InviteDetail.vue:41（`api.rebateInviteDetail()` **不存在**）

**请求参数**

| 来源 | 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|---|
| `data` | `page` | integer | 否 | **待确认** |
| `data` | `limit` | integer | 否 | **待确认** |

> `param` 拼 query string，`data` 作为 JSON body。前端 `remoteRequest` 对 GET 会忽略 body，故本项目接口统一 POST。

**响应结构**（`{code, msg, data, time}`，`code=1` 为成功）

| 字段 | 类型 | 说明 |
|---|---|---|
| `[]` | array | `{id,nickname,jointime,first_transaction_time,user_transaction,month_transaction}` |

> **说明**：**缺失方法 #3**。

### /rebate/rebate/leaderboard `/rebate/rebate/leaderboard`

- **方法**：`POST`
- **用途**：邀请排行榜
- **业务域**：F 统计分销
- **读/写**：读
- **鉴权**：需登录（token 请求头）
- **响应封装**：A. 裸数组（`data: []`）
- **数据来源表**：rank_snapshots(rank_type=rebate)
- **mock 文件**：`rebateLeaderboard.json`
- **实现状态**：✅ 已设计

**消费页面**（`src/pages/` 实测）：rebate/Leaderboard.vue:86（`api.rebateLeaderboard()` **不存在**）

**请求参数**

| 来源 | 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|---|
| `data` | `无` | - | 否 | utils 层无参 |

> `param` 拼 query string，`data` 作为 JSON body。前端 `remoteRequest` 对 GET 会忽略 body，故本项目接口统一 POST。

**响应结构**（`{code, msg, data, time}`，`code=1` 为成功）

| 字段 | 类型 | 说明 |
|---|---|---|
| `[]` | array | `{id,nickname,com_price}` |

> **说明**：**缺失方法 #2**。

## 域：G 转赠与配置

### /market/trade/flowDoc `/market/trade/flowDoc`

- **方法**：`POST`
- **用途**：藏品流转记录
- **业务域**：G 转赠与配置
- **读/写**：读
- **鉴权**：需登录（token 请求头）
- **响应封装**：A. 裸数组（`data: []`）
- **数据来源表**：collection_flow_records
- **mock 文件**：`flowDoc.json`
- **实现状态**：✅ 已设计

**消费页面**（`src/pages/` 实测）：my/FlowDoc.vue:40（`api.flowDoc()` 固定 `data:{}`）

**请求参数**

| 来源 | 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|---|
| `data` | `无` | - | 否 | utils 层固定传 `{}` |

> `param` 拼 query string，`data` 作为 JSON body。前端 `remoteRequest` 对 GET 会忽略 body，故本项目接口统一 POST。

**响应结构**（`{code, msg, data, time}`，`code=1` 为成功）

| 字段 | 类型 | 说明 |
|---|---|---|
| `[]` | array | `{id,nickname,createtime,source_type,collection_name,collection_code}`；source_type 实测 1~6 且与 id 同步，疑为递增 ID 而非类型枚举（DATABASE.md §10 遗留项，**不建枚举约束**） |

### /regift/record/list `/regift/record/list`

- **方法**：`POST`
- **用途**：转赠记录
- **业务域**：G 转赠与配置
- **读/写**：读
- **鉴权**：需登录（token 请求头）
- **响应封装**：A. 裸数组（`data: []`）
- **数据来源表**：regift_records
- **mock 文件**：`regiftRecord.json`
- **实现状态**：✅ 已设计

**消费页面**（`src/pages/` 实测）：regift/Record.vue:63（`api.regiftRecord()` **不存在**）

**请求参数**

| 来源 | 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|---|
| `data` | `page` | integer | 否 | **待确认** |
| `data` | `limit` | integer | 否 | **待确认** |

> `param` 拼 query string，`data` 作为 JSON body。前端 `remoteRequest` 对 GET 会忽略 body，故本项目接口统一 POST。

**响应结构**（`{code, msg, data, time}`，`code=1` 为成功）

| 字段 | 类型 | 说明 |
|---|---|---|
| `[]` | array | `{id,goods_cover_image,goods_name,collection_code,status,status_text,from_user,create_time,back_time,order_no}`；status 见 §4 E-REGIFT-STATUS；collection_code 实测链上凭证形态 `PBCE/2000000000000001`（§6.1 第三套编码） |

> **说明**：**缺失方法 #10**。

---

## 3. 通用约定

### 3.1 请求头

| 头 | 值 | 说明 |
|---|---|---|
| `Content-Type` | `application/json` | 前端硬编码 |
| `version` | `1.0.1` | 前端硬编码，服务端仅记录日志 |
| `token` | JWT | **仅登录后存在**；缺失/无效/过期返回 `code=401`，前端据此清token |

### 3.2 响应封装

```json
{ "code": 1, "msg": "ok", "data": {}, "time": "2026-10-18T10:00:00Z" }
```

`data` 的形状按接口取 §1 总览表的 5 种风格之一，**由 controller 层 responder 还原**，
改动前必须确认前端 `utils/api.js` 的 `listOf` / `objOf` 解析方式未被破坏。

### 3.3 错误码

| code | 语义 | 前端行为 |
|---|---|---|
| `1` | **成功** | `utils/api.js` L24 只认 1 |
| `400` | 参数校验失败 | 视为失败 |
| `401` | 未登录 / token 失效 | **前端清空 token** |
| `403` | 无权限 | 视为失败 |
| `404` | 资源不存在 | 视为失败 |
| `409` | 状态冲突 | 视为失败 |
| `422` | 业务规则不通过 | 视为失败 |
| `500` | 系统内部错误 | 视为失败 |
| `503` | 数据源不可用 | 视为失败 |

### 3.4 分页参数（两套命名，后端必须都接受）

| 参数名 | 使用接口 |
|---|---|
| `page` + `limit` | `orderList` `consignList` |
| `page` + `list_rows` | `afficheList` `getMarketList` |

后端优先级：`limit` > `list_rows` > 默认 15；`page` 从 1 起；
`pageSize` 上限 100（`PAGE_SIZE_MAX`）。理由见 `ARCHITECTURE.md` §6.3。

---

## 4. 待确认项汇总

以下参数**无 mock 或页面实参依据**，实现前需前端/产品确认，**已在各接口中逐条标注**：

1. `/index/afficheDetail` → `id`：**待确认**：页面传空对象，实际经路由 query 传入；见 note
2. `/index/newsDetail` → `id`：**待确认**：同/afficheDetail
3. `/user/register` → `mobile`：**待确认**：Register.vue 表单字段未逐项核
4. `/user/register` → `password`：**待确认**
5. `/user/register` → `code`：**待确认**：短信验证码
6. `/order/order/myConsignment` → `keyword`：**待确认**：Search.vue 传 `{page:1}`，搜索关键词字段名未实测
7. `/market/trade/begBuyOrderList` → `page`：**待确认**：OrderFilterList.vue 实参未逐项核
8. `/market/trade/begBuyOrderList` → `limit`：**待确认**
9. `/market/trade/begBuyOrderList` → `type`：**待确认**：区分委托(1)/求购(2) 的字段名待确认
10. `/market/trade/begBuyOrderInfo` → `id`：**待确认**：订单 id 字段名，实参照saleMarketOrderDetail 的 `id`，但需前端确认
11. `/market/trade/createBegBuyOrder` → `goods_id`：**待确认**：提交表单字段需读 SubmitBegBuy.vue 提交逻辑
12. `/market/trade/createBegBuyOrder` → `price`：**待确认**：委托/求购价（字符串金额）
13. `/market/trade/createBegBuyOrder` → `number`：**待确认**：数量
14. `/market/trade/createBegBuyOrder` → `type`：**待确认**：委托/求购区分
15. `/market/trade/sell` → `待确认`：**待确认**：SellBegBuy.vue 提交字段未逐项核
16. `/market/trade/userCollectionList` → `page`：页码；**待确认**：页面传空对象，分页由滚动触发
17. `/market/trade/userCollectionList` → `limit`：**待确认**
18. `/kline/info/detail` → `待确认`：**待确认**：kline/Info.vue L131 实参未逐项核
19. `/kline/info/detail` → `id`：藏品 id（**待确认**，按语义推断）
20. `/crystal_goods/goodsDetail` → `id`：**待确认**：页面传空对象，id疑似来自 route.query
21. `/crystal_goods/boxDetail` → `id`：**待确认**：同goodsDetail
22. `/crystal_goods/collectionDetail` → `id`：**待确认**
23. `/crystal_goods/exchangeRecord` → `page`：**待确认**
24. `/crystal_goods/exchangeRecord` → `limit`：**待确认**
25. `/crystal_goods/crystalDetail` → `model`：**待确认**：响应含 model 字段，疑似筛选参数
26. `/box/blind_box/openlog` → `page`：**待确认**
27. `/box/blind_box/openlog` → `limit`：**待确认**
28. `/user_collection/user_collection/openbox` → `blind_box_id`：**待确认**：开盒动作参数
29. `/user_collection/user_collection/openboxone` → `blind_box_id`：**待确认**
30. `/compound/compound/scheme` → `play_id`：**待确认**：方案 id 字段名，疑似 play_id
31. `/compound/compound/scheme` → `id`：**待确认**
32. `/compound/compound/record` → `page`：**待确认**
33. `/compound/compound/record` → `limit`：**待确认**
34. `/compound/compound/result` → `play_id`：**待确认**
35. `/lottery/lottery/record` → `page`：**待确认**
36. `/lottery/lottery/record` → `limit`：**待确认**
37. `/invitation/invitation/record` → `page`：**待确认**
38. `/invitation/invitation/record` → `limit`：**待确认**
39. `/activity/draw/record` → `page`：**待确认**
40. `/activity/draw/record` → `limit`：**待确认**
41. `/draw/InvitationFriendAssist/info` → `code`：**待确认**：助力码，响应含 code 字段，疑似回传
42. `/shequ/rumor/info` → `id`：**待确认**：页面传空对象，id 疑似来自 route.query
43. `/rebate/rebate/inviteDetail` → `page`：**待确认**
44. `/rebate/rebate/inviteDetail` → `limit`：**待确认**
45. `/community/chat/messageList` → `session_id`：**待确认**：聊天会话 id
46. `/regift/record/list` → `page`：**待确认**
47. `/regift/record/list` → `limit`：**待确认**

共**47 项**。其中影响面最大的是各列表接口的 `page`/`limit` 字段名 —— mock 是静态快照，分页元数据不入库（DATABASE.md §9），故无法从 mock 反推页面真实传参。

---

## 5. 前端阻塞项

`utils/api.js` 调用了 11 个 `api/index.js` 中**不存在**的方法，远程模式下必然抛 `TypeError` 并被静默 catch 吞掉、回落本地 mock。
后端已按路径实现，**前端需补 11 个转发函数**（清单见 `ARCHITECTURE.md` §10）。

| 路径 | 待新增方法 |
|---|---|
| `/rebate/rebate/index` | `rebateInfo` |
| `/rebate/rebate/leaderboard` | `rebateLeaderboard` |
| `/rebate/rebate/inviteDetail` | `rebateInviteDetail` |
| `/rank/masterRank/list` | `masterRank` |
| `/rank/userBuy/list` | `userBuyRank` |
| `/regift/record/list` | `regiftRecord` |
| `/leaderboard/leaderboard/goods` | `leaderboardGoods` |
| `/leaderboard/leaderboard/user` | `leaderboardUser` |
| `/marketCapRanking/marketCapRanking/list` | `marketCapRanking` |
| `/community/chat/messageList` | `chatMessages` |
| `/kline/info/detail` | `klineInfo` |

