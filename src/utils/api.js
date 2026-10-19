/**
 * 数据读取层（纯本地）
 *
 * 本项目为独立项目，所有数据来自 public/mock/*.json，
 * 字段与原站 API 响应 1:1 对齐。运行时不访问任何外部域名。
 *
 * 如需接回自己的后端：设置 .env 的 VITE_API_BASE，
 * 上层 api/index.js 会自动切换为远程模式，这里也会随之走远程。
 */
import { api, readMock, IS_REMOTE } from '@/api'

const asset = (p) => import.meta.env.BASE_URL + p.replace(/^\//, '')

/**
 * 读取数据：远程模式下打接口，本地模式下读 mock
 * @param {Function} call   api.xxx 调用
 * @param {string} mockName 本地 mock 文件名
 * @param {Function} pick   从响应中提取数据
 */
/**
 * 远程失败/降级计数：只用于可观测性，不影响回落行为。
 * 挂在 window 上供回归脚本与人工排查读取（window.__QC_FALLBACK__）。
 */
const fallbackLog = []
if (typeof window !== 'undefined') window.__QC_FALLBACK__ = fallbackLog

async function load(call, mockName, pick) {
  if (IS_REMOTE) {
    try {
      const res = await call()
      if (res && res.code === 1) return pick ? pick(res) : res
      // 后端连通但业务码非 1：同样会回落 mock。
      // 此前此处完全静默，导致「页面看着正常、其实每个接口都在回落」的假绿，
      // 真实问题（CORS 缺失、路径 404、参数语义错配）全部被吞掉。
      noteFallback(mockName, `业务码非 1：code=${res && res.code} msg=${res && res.msg}`)
    } catch (e) {
      noteFallback(mockName, `请求异常：${(e && e.message) || e}`)
    }
  }
  const json = await readMock(mockName)
  return pick ? pick(json) : json
}

/** 记录一次回落。DEV 下打到控制台（可见），生产仅入数组不刷屏 */
function noteFallback(mockName, reason) {
  fallbackLog.push({ mockName, reason, at: Date.now() })
  if (import.meta.env.DEV) {
    console.warn(`[api] 远程失败已回落本地 mock：${mockName} —— ${reason}`)
  }
}

/** 列表类提取：兼容 data 直接是数组 或 data.data 是数组 */
const listOf = (j) => {
  const d = j && j.data
  if (Array.isArray(d)) return d
  if (d && Array.isArray(d.data)) return d.data
  return []
}

/* ===== 首页 ===== */

export const fetchAfficheList = (params = {}) =>
  load(() => api.afficheList(params), 'afficheList.json', listOf)

export const fetchAfficheTypeList = () =>
  load(() => api.affichetypelist(), 'affichetypelist.json', (j) => j.data || [])

export const fetchMarketList = (data = {}) =>
  load(() => api.getMarketList(data), 'marketList.json', listOf)

export const fetchSeries = (param = {}) =>
  load(() => api.getSeries(param), 'series-10.json', (j) => j.data || [])

export const fetchSeriesPid = (param = {}) =>
  load(() => api.getSeries(param), 'series-10-pid.json', (j) => j.data || [])

export const fetchConfig = () => load(() => api.getConfig({}), 'getConfig.json', (j) => j.data || {})

export const fetchBanner = () =>
  load(() => api.getBanner(), 'banner_show_getBanner.json', (j) => j.data || [])

/* ===== 交易链路 ===== */

/** 藏品详情 */
export const fetchMarketDetail = (id) =>
  load(() => api.getMarketDetails(id), 'marketDetail.json', (j) => j.data || null)

/** 我的订单列表 */
export const fetchOrderList = (data = {}) =>
  load(() => api.orderList(data), 'orderList.json', listOf)

/** 订单详情（常规/市场/转赠/委托/求购 共用） */
export const fetchOrderDetail = (data = {}) =>
  load(() => api.orderDetail(data), 'orderDetail.json', (j) => j.data || {})

/** 寄售列表（原站 /order/order/myConsignment） */
export const fetchConsignList = (data = {}) =>
  load(() => api.consignList(data), 'myConsignment.json', listOf)

/** 我的寄售（含搜索） */
export const fetchMyConsignment = (data = {}) =>
  load(() => api.myConsignment(data), 'myConsignment.json', listOf)

/** 我的委托 / 我的求购 */
export const fetchEntrustList = (data = {}) =>
  load(() => api.entrustList(data), 'entrustList.json', listOf)

export const fetchBegList = (data = {}) =>
  load(() => api.begList(data), 'begList.json', listOf)

/** 我的藏品（待售藏品列表） */
export const fetchUserCollectionList = () =>
  load(() => api.userCollectionList({}), 'userCollectionList.json', (j) => j.data || { user_collection_list: [] })

/** 寄售/委托/求购 页面基础信息（藏品名、参考价、地板价等） */
export const fetchTradeBaseInfo = (data = {}) =>
  load(() => api.getMarketDetails(data.id || 226), 'tradeBaseInfo.json', (j) => j.data || {})

/** 寄售详情：今日行情 + 成交记录 */
export const fetchSellInfo = (data = {}) =>
  load(() => api.marketTradeRecord(data), 'sellInfo.json', (j) => j.data || {})

/** 分类管理（我的分类 / 其他分类） */
export const fetchCategoryManager = () =>
  load(() => api.seriesList({ type: 10 }), 'categoryManager.json', (j) => j.data || { self_series: [], platform_series: [] })

/** 赠送记录 */
export const fetchGiftRecord = () =>
  load(() => api.consignList({ type: 'gift' }), 'giftRecord.json', listOf)

/** GM 工会 */
export const fetchTradeUnion = () =>
  load(() => api.getConfig({}), 'getConfig.json', (j) => (j.data && j.data.trade_union) || {})

/** 用户信息 */
export const fetchUserInfo = () => load(() => api.getUserInfo(), 'user.json', (j) => (j.data && j.data.userinfo) || {})

/* ===== 公告模块 ===== */

/** 官方公告详情（含富文本正文 + 关联藏品） */
export const fetchAfficheDetail = (data = {}) =>
  load(() => api.afficheDetail(data), 'noticeDetails.json', (j) => j.data || {})

/** 潮玩有话说详情 */
export const fetchNewsDetail = (data = {}) =>
  load(() => api.newsDetail(data), 'newsDetails.json', (j) => j.data || {})

/** 社区/墙 动态详情（含评论列表） */
export const fetchRumorInfo = (data = {}) =>
  load(() => api.rumorInfo(data), 'wallDetails.json', (j) => j.data || {})

/* ===== 我的藏品 ===== */

/** 我的藏品列表（支持关键词过滤） */
export const fetchMyCollectionList = async (data = {}) => {
  const all = await load(() => api.myCollectionList(data), 'myCollectionList.json', listOf)
  const kw = (data.keyword || '').trim()
  if (!kw) return all
  return all.filter(
    (x) =>
      (x.name || '').includes(kw) ||
      (x.collection_code || '').toUpperCase().includes(kw.toUpperCase())
  )
}

/** 单个藏品详情（编号 / 总序号 / 当前售价 / 链上凭证） */
export const fetchCollectionInfo = (data = {}) =>
  load(() => api.collectionInfo(data), 'myCollectionDetail.json', (j) => j.data || {})

/* ===== 我的页藏品聚合（antMycollection / getDetail） ===== */

/**
 * 我的页藏品聚合列表。
 * types 语义（源站 pages-my-my.0e9b7c94.js 实测）：
 *   藏品=2 / 盲盒=1 / 已售=3（我的藏品页另有 已赠送=4）；
 *   绘画/卡牌/建模/卡券/元素 5 个 tab types=null，源站**永不发请求**，
 *   故这些 tab 由页面直接走空态，不经过本函数。
 * 响应：{total,per_page,current_page,last_page,data:[{collection,num,min_price,
 *        floor_price,price,market_fluctuate_new}], current_count,current_consignment}
 * （current_count/current_consignment 仅 types=1/2 有）
 */
export const fetchAntMyCollection = (data = {}) =>
  load(() => api.antMycollection(data), 'antMycollection.json', (j) =>
    j.data || { total: 0, per_page: 15, current_page: 1, last_page: 0, data: [] }
  )

/**
 * 持有详情弹窗（getDetail）：点击聚合列表项后按 collection_id + types 拉实例明细。
 * 响应：{list:{total,per_page:1000,current_page,last_page,data:[实例],current_count,
 *          current_consignment}, collection:{...}}
 * 实例字段：id/collection_code/status/is_lock/can_compose/price/blind_box_id/createtime。
 * 源站实测 per_page 固定 1000（一次拉全量），page 参数仅为兼容保留。
 */
export const fetchCollectionDetail = (data = {}) =>
  load(() => api.collectionGetDetail(data), 'getDetail.json', (j) => j.data || null)

/** 一键开启（openBoxs）：popDetails 弹窗按钮，入参 openid，响应为开盒结果数组 */
export const fetchOpenBoxs = (data = {}) =>
  load(() => api.openBoxs(data), 'blindBoxResult.json', listOf)

/** 逐个拆开（openBox）：popDetails 弹窗按钮，入参 openid，响应为单个开盒结果对象 */
export const fetchOpenBox = (data = {}) =>
  load(() => api.openBox(data), 'blindBoxResultOne.json', objOf)

/** 一键下架（batchchangeMarketGoods）：popDetails 弹窗按钮，入参 collection_id */
export const fetchBatchOff = (data = {}) =>
  load(() => api.batchchangeMarketGoods(data), 'batchOff.json', (j) => j.data || null)

/* ===== 商品 / 系列 ===== */

/** 某系列下的商品列表（含系列信息与成交统计） */
export const fetchSeriesGoodsList = (data = {}) =>
  load(() => api.seriesGoodsList(data), 'marketGoodsList.json', (j) => j.data || {})

/** 商品详情（盲盒 / 藏品通用） */
export const fetchProductDetail = (data = {}) =>
  load(() => api.productDetail(data), 'productDetail.json', (j) => j.data || {})

/** 申购 / 购买规则 */
export const fetchProductRule = (data = {}) =>
  load(() => api.productRule(data), 'productRule.json', (j) => j.data || {})

/* ===== 我的 · 地址 ===== */

/** 收货地址列表（原站 /user/addressList） */
export const fetchAddressList = () => load(() => api.addressList(), 'addressList.json', listOf)

/** 藏品流转记录（原站 my/flowDoc） */
export const fetchFlowDoc = () => load(() => api.flowDoc(), 'flowDoc.json', listOf)

/* ===== 返利 / 榜单 / 转赠 / 聊天 / 行情 ===== */

/** 返利中心（邀请码 + 返佣数据 + 说明） */
export const fetchRebateInfo = () => load(() => api.rebateInfo(), 'rebate.json', (j) => j.data || {})

/** 邀请排行榜 */
export const fetchRebateLeaderboard = () =>
  load(() => api.rebateLeaderboard(), 'rebateLeaderboard.json', listOf)

/** 被邀请人清单 */
export const fetchRebateInviteDetail = () =>
  load(() => api.rebateInviteDetail(), 'rebateInviteDetail.json', listOf)

/** 大师动态 */
export const fetchMasterRank = () => load(() => api.masterRank(), 'masterRank.json', listOf)

/** 用户购买榜 */
export const fetchUserBuyRank = () => load(() => api.userBuyRank(), 'userBuyRank.json', listOf)

/** 转赠记录 */
export const fetchRegiftRecord = () => load(() => api.regiftRecord(), 'regiftRecord.json', listOf)

/** 藏品综合榜 */
export const fetchLeaderboardGoods = () =>
  load(() => api.leaderboardGoods(), 'leaderboard.json', listOf)

/** 用户榜单（含我的排名） */
export const fetchLeaderboardUser = () =>
  load(() => api.leaderboardUser(), 'leaderboardUser.json', (j) => j.data || { list: [], my: {} })

/** 市值排行榜（榜单 + 排行说明） */
export const fetchMarketCapRanking = () =>
  load(() => api.marketCapRanking(), 'marketCapRanking.json', (j) => j.data || { info: {}, list: [] })

/** 聊天消息列表（原站为长连接，本项目读本地 mock） */
export const fetchChatMessages = () =>
  load(() => api.chatMessages(), 'chatMessages.json', listOf)

/** K线详情（买卖盘 + 成交明细） */
export const fetchKlineInfo = () => load(() => api.klineInfo(), 'klineInfo.json', (j) => j.data || {})

export { asset }

/* ===== 活动类页面（积分商城 / 盲盒 / 合成 / 转盘 / 签到 / 邀请 / 抽签） ===== */

/** 取 data 对象（详情类） */
const objOf = (j) => (j && j.data) || {}

/** 取 data 列表（列表类） */
export const fetchShopList = (data = {}) =>
  load(() => api.shopList(data), 'shopList.json', objOf)

export const fetchShopGoodsDetail = (data = {}) =>
  load(() => api.shopGoodsDetail(data), 'shopGoodsDetail.json', objOf)

export const fetchShopBoxDetail = (data = {}) =>
  load(() => api.shopBoxDetail(data), 'shopBoxDetail.json', objOf)

export const fetchShopCollectionDetail = (data = {}) =>
  load(() => api.shopCollectionDetail(data), 'shopCollectionDetail.json', objOf)

export const fetchShopExchangeRecord = (data = {}) =>
  load(() => api.shopExchangeRecord(data), 'shopExchangeRecord.json', listOf)

export const fetchShopCrystalDetail = (data = {}) =>
  load(() => api.shopCrystalDetail(data), 'shopCrystalDetail.json', listOf)

export const fetchBlindBoxMyBox = () =>
  load(() => api.blindBoxMyBox({}), 'blindBoxMyBox.json', objOf)

export const fetchBlindBoxOpenRecord = (data = {}) =>
  load(() => api.blindBoxOpenRecord(data), 'blindBoxOpenRecord.json', listOf)

/** 开盒结果（多格）：源站 blindBox/result ← openBoxs(openid)，响应 data 为数组 */
export const fetchBlindBoxResult = (data = {}) =>
  load(() => api.blindBoxOpenResult(data), 'blindBoxResult.json', listOf)

/** 开盒结果（单格）：源站 blindBox/result2 ← openBox(openid)，响应 data 为单对象 */
export const fetchBlindBoxResultOne = (data = {}) =>
  load(() => api.blindBoxOpenResultOne(data), 'blindBoxResultOne.json', objOf)

export const fetchCompoundList = (data = {}) =>
  load(() => api.compoundList(data), 'compoundList.json', listOf)

export const fetchCompoundRecord = (data = {}) =>
  load(() => api.compoundRecord(data), 'compoundRecord.json', listOf)

export const fetchCompoundResult = (data = {}) =>
  load(() => api.compoundResult(data), 'compoundResult.json', objOf)

export const fetchCompoundScheme = (data = {}) =>
  load(() => api.compoundScheme(data), 'compoundScheme.json', objOf)

export const fetchLotteryInfo = (data = {}) =>
  load(() => api.lotteryInfo(data), 'lotteryInfo.json', objOf)

export const fetchLotteryRecord = (data = {}) =>
  load(() => api.lotteryRecord(data), 'lotteryRecord.json', listOf)

export const fetchLotteryRule = (data = {}) =>
  load(() => api.lotteryRule(data), 'lotteryRule.json', objOf)

export const fetchSignInfo = (data = {}) =>
  load(() => api.signInfo(data), 'signInfo.json', objOf)

export const fetchInvitationInfo = (data = {}) =>
  load(() => api.invitationInfo(data), 'invitationInfo.json', objOf)

export const fetchInvitationRecord = (data = {}) =>
  load(() => api.invitationRecord(data), 'invitationRecord.json', objOf)

export const fetchActivityDraw = (data = {}) =>
  load(() => api.activityDrawInfo(data), 'activityDraw.json', objOf)

export const fetchActivityRecord = (data = {}) =>
  load(() => api.activityDrawRecord(data), 'activityRecord.json', listOf)

export const fetchDrawResult = (data = {}) =>
  load(() => api.drawResult(data), 'drawResult.json', objOf)

export const fetchDrawLeaderboard = (data = {}) =>
  load(() => api.drawLeaderboard(data), 'drawLeaderboard.json', objOf)

export const fetchCommunityShare = (data = {}) =>
  load(() => api.communityShareInfo(data), 'communityShare.json', objOf)

export const fetchInvitationAssist = (data = {}) =>
  load(() => api.invitationAssistInfo(data), 'invitationAssist.json', objOf)

export const fetchActiveSelectedList = (data = {}) =>
  load(() => api.activeSelectedList(data), 'activeSelectedList.json', listOf)
