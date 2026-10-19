/**
 * API 层（本地数据源版）
 *
 * 设计原则：本项目为独立项目，运行时不依赖原站。
 * - 全部数据从 public/mock/*.json 读取（字段与原站响应 1:1 对齐）
 * - 不发起任何跨域请求，源站关停 / 断网 / 被墙均不影响本页
 * - 如需接回自己的后端，把 .env 的 VITE_API_BASE 设为后端地址即可，
 *   代码无需改动（会自动切换为远程模式）
 */
const TOKEN_KEY = 'token'

/** 远程后端地址；为空字符串 = 本地 mock 模式（默认） */
const REMOTE_BASE = (import.meta.env.VITE_API_BASE || '').replace(/\/$/, '')
const IS_REMOTE = !!REMOTE_BASE

/** 本地资源前缀 */
const LOCAL_BASE = import.meta.env.BASE_URL.replace(/\/$/, '')

function getToken() {
  return localStorage.getItem(TOKEN_KEY) || ''
}
function setToken(t) {
  if (t) localStorage.setItem(TOKEN_KEY, t)
  else localStorage.removeItem(TOKEN_KEY)
}

/** 读取本地 mock */
async function readMock(name) {
  const res = await fetch(LOCAL_BASE + '/mock/' + name)
  if (!res.ok) throw new Error('mock 404: ' + name)
  return res.json()
}

/** mock 文件名映射：请求路径 -> 本地数据文件 */
const MOCK_MAP = {
  '/index/getConfig': 'getConfig.json',
  '/banner/show/getBanner': 'banner_show_getBanner.json',
  '/index/afficheList': 'afficheList.json',
  '/index/affichetypelist': 'affichetypelist.json',
  '/index/getSeries': 'series-10.json',
  '/market/market/getMarketList': 'marketList.json',
  '/box/blind_box/list': 'blindBoxList.json',
  '/addons_diypage_index': 'diypage.json',
  '/user/login': 'user.json',
  '/user/register': 'user.json',
  '/user/getUserInfo': 'user.json',
  '/order/order/orderList': 'orderList.json',
  '/order/order/saleMarketOrderDetail': 'orderDetail.json',
  '/order/order/myConsignment': 'myConsignment.json',
  '/market/trade/begBuyOrderList': 'entrustList.json',
  '/market/trade/begBuyOrderInfo': 'orderDetail.json',
  '/market/trade/getSellCollectionInfo': 'userCollectionList.json',
  '/market/trade/collectionDetail': 'sellInfo.json',
  '/addons/diypage/index': 'diypage.json',
  // 公告模块
  '/index/afficheDetail': 'noticeDetails.json',
  '/index/newsDetail': 'newsDetails.json',
  '/shequ/rumor/info': 'wallDetails.json',
  // 我的藏品
  '/market/trade/userCollectionList': 'myCollectionList.json',
  '/market/trade/collectionInfo': 'myCollectionDetail.json',
  // 商品 / 系列
  '/market/market/seriesGoodsList': 'marketGoodsList.json',
  '/product/product/detail': 'productDetail.json',
  '/product/product/rule': 'productRule.json',
  // 我的 · 地址
  '/user/address/lists': 'addressList.json',
  '/market/trade/flowDoc': 'flowDoc.json',
  // ── 以下 2 条写接口**故意不登记** ──────────────────────────────
  // /market/trade/createBegBuyOrder、/market/trade/sell 在源站需人机验证（滑块），
  // 无成功响应快照可依据。前端 SubmitBegBuy.vue:206 / SellBegBuy.vue:253 只弹 toast
  // （「原站求购需人机验证」）而**从不调用**这两个接口，故本地模式走到
  // localRequest 的未命中分支（code:1 + data:[]）无任何可见影响。
  // 不编造 mock 快照——真实结果由后端写接口提供（已实现，见 server/）。
  // 返利 / 榜单 / 转赠 / 聊天 / 行情
  '/rebate/rebate/index': 'rebate.json',
  '/rebate/rebate/leaderboard': 'rebateLeaderboard.json',
  '/rebate/rebate/inviteDetail': 'rebateInviteDetail.json',
  '/rank/masterRank/list': 'masterRank.json',
  '/rank/userBuy/list': 'userBuyRank.json',
  '/regift/record/list': 'regiftRecord.json',
  '/leaderboard/leaderboard/goods': 'leaderboard.json',
  '/leaderboard/leaderboard/user': 'leaderboardUser.json',
  '/marketCapRanking/marketCapRanking/list': 'marketCapRanking.json',
  '/community/chat/messageList': 'chatMessages.json',
  '/kline/info/detail': 'klineInfo.json',
  // 积分商城
  '/crystal_goods/crystalList': 'shopList.json',
  '/crystal_goods/goodsDetail': 'shopGoodsDetail.json',
  '/crystal_goods/boxDetail': 'shopBoxDetail.json',
  '/crystal_goods/collectionDetail': 'shopCollectionDetail.json',
  '/crystal_goods/exchangeRecord': 'shopExchangeRecord.json',
  '/crystal_goods/crystalDetail': 'shopCrystalDetail.json',
  // 盲盒（我的盲盒 / 开盒记录 / 开盒结果）
  // 源站契约（模块 9bd5 实证）：
  //   openBox(openid)  → /user_collection/user_collection/openbox  响应 data 为【单对象】（result2 / popDetails.takeApart）
  //   openBoxs(openid) → /user_collection/user_collection/openBoxs 响应 data 为【数组】（result / popDetails.openAll）
  // 源站无 openboxone 端点；早期映射已按此修正。
  '/box/blind_box/myBox': 'blindBoxMyBox.json',
  '/box/blind_box/openlog': 'blindBoxOpenRecord.json',
  '/user_collection/user_collection/openbox': 'blindBoxResultOne.json',
  '/user_collection/user_collection/openBoxs': 'blindBoxResult.json',
  // 我的页藏品聚合 / 持有详情弹窗 / 一键开启 / 一键下架
  // antMycollection.json 与 getDetail.json 为源站真实抓包快照（账号空态），
  // openBoxs 与 openbox 同形状（data 为开盒结果数组），batchOff 无源站快照（写接口），
  // 本地回落仅为形状占位，真实结果由后端写接口提供（已实现，见 server/）。
  '/user_collection/user_collection/antMycollection': 'antMycollection.json',
  '/user_collection/user_collection/getDetail': 'getDetail.json',
  '/user_collection/user_collection/openBoxs': 'blindBoxResult.json',
  '/market/market/batchchangeMarketGoods': 'batchOff.json',
  // 藏品合成
  '/compound/compound/list': 'compoundList.json',
  '/compound/compound/record': 'compoundRecord.json',
  '/compound/compound/result': 'compoundResult.json',
  '/compound/compound/scheme': 'compoundScheme.json',
  // 抽奖转盘
  '/lottery/lottery/info': 'lotteryInfo.json',
  '/lottery/lottery/record': 'lotteryRecord.json',
  '/lottery/lottery/rule': 'lotteryRule.json',
  // 签到 / 邀请 / 活动抽签
  '/sign/index/info': 'signInfo.json',
  '/invitation/invitation/info': 'invitationInfo.json',
  '/invitation/invitation/record': 'invitationRecord.json',
  '/activity/draw/info': 'activityDraw.json',
  '/activity/draw/record': 'activityRecord.json',
  // 全民抽签
  '/draw/drawResult/result': 'drawResult.json',
  '/draw/Leaderboard/list': 'drawLeaderboard.json',
  '/draw/communityShare/info': 'communityShare.json',
  '/draw/InvitationFriendAssist/info': 'invitationAssist.json',
  '/activeSelected/list': 'activeSelectedList.json',
}

/**
 * 统一请求入口
 * @param {string} url  路径，如 '/order/order/orderList'
 * @param {object} opts data / param / method
 */
async function request(url, { method = 'POST', data = {}, param = {} } = {}) {
  if (IS_REMOTE) {
    return remoteRequest(url, { method, data, param })
  }
  return localRequest(url)
}

/** 远程模式（仅当配置了 VITE_API_BASE 时启用） */
async function remoteRequest(url, { method, data, param }) {
  let fullUrl = REMOTE_BASE + url
  const keys = Object.keys(param)
  if (keys.length) fullUrl += '?' + keys.map((k) => `${k}=${param[k]}`).join('&')
  const headers = { 'Content-Type': 'application/json', version: '1.0.1' }
  const token = getToken()
  // 三个通道同时发：
  //   body.token      —— 发布环境唯一可靠（网关会覆盖 Authorization、剥离自定义头）
  //   Authorization   —— 直连/本地可用
  //   token 头        —— 源站约定
  // 实测依据：线上部署后仅靠头传递时，Authorization 被网关替换成平台令牌
  // （iss=cloudstudio.net），token 头被剥离，导致「登录成功但之后全部 401」。
  const body = method === 'GET' ? undefined : JSON.stringify(token ? { ...data, token } : data)
  if (token) {
    headers.Authorization = 'Bearer ' + token
    headers[TOKEN_KEY] = token
  }
  // GET 无 body，改走查询串携带 token（同样绕开被网关处理的请求头）
  const finalUrl = token && method === 'GET'
    ? fullUrl + (fullUrl.includes('?') ? '&' : '?') + 'token=' + encodeURIComponent(token)
    : fullUrl

  const res = await fetch(finalUrl, { method, headers, body })
  const json = await res.json()
  if (json.code === 401) setToken('')
  return json
}

/** 本地模式：从 mock 读取 */
async function localRequest(url) {
  // 带 id 的详情接口
  const detailMatch = url.match(/^\/market\/market\/MarketDetail\/ids\/(.+)$/)
  if (detailMatch) {
    const json = await readMock('marketDetail.json')
    return json
  }
  const file = MOCK_MAP[url]
  if (!file) {
    // 未登记的接口返回空数据，避免整页报错
    return { code: 1, msg: 'ok', data: [] }
  }
  return readMock(file)
}

/** 各模块 API（函数签名保持不变，页面无需改动） */
export const api = {
  // 首页
  getConfig: (data) => request('/index/getConfig', { data }),
  getBanner: () => request('/banner/show/getBanner'),
  afficheList: (data) => request('/index/afficheList', { data }),
  affichetypelist: () => request('/index/affichetypelist'),
  getSeries: (param) => request('/index/getSeries', { param }),
  diypage: () => request('/addons/diypage/index', { data: {} }),
  // 市场
  getMarketList: (data) => request('/market/market/getMarketList', { data }),
  getMarketDetails: (id) => request(`/market/market/MarketDetail/ids/${id}`, {}),
  // 盲盒
  blindBoxList: (data) => request('/box/blind_box/list', { data }),
  // 用户
  login: async (data) => {
    if (IS_REMOTE) return request('/user/login', { data })
    const json = await readMock('user.json')
    setToken(json.data.userinfo.token)
    return json
  },
  register: (data) => request('/user/register', { data }),
  getUserInfo: () => request('/user/getUserInfo', {}),
  // 交易链路
  orderList: (data) => request('/order/order/orderList', { data }),
  orderDetail: (data) => request('/order/order/saleMarketOrderDetail', { data }),
  consignList: (data) => request('/order/order/myConsignment', { data }),
  myConsignment: (data) => request('/order/order/myConsignment', { data }),
  consignSearch: (data) => request('/order/order/myConsignment', { data }),
  userCollectionList: (data) => request('/market/trade/getSellCollectionInfo', { data }),
  entrustList: (data) => request('/market/trade/begBuyOrderList', { data }),
  entrustInfo: (data) => request('/market/trade/begBuyOrderInfo', { data }),
  begList: (data) => request('/market/trade/begBuyOrderList', { data }),
  begInfo: (data) => request('/market/trade/begBuyOrderInfo', { data }),
  submitEntrust: (data) => request('/market/trade/createBegBuyOrder', { data }),
  submitBegBuy: (data) => request('/market/trade/createBegBuyOrder', { data }),
  sellBegBuy: (data) => request('/market/trade/sell', { data }),
  cancelConsignment: (data) => request('/order/order/myConsignment', { data }),
  marketTradeRecord: (data) => request('/market/trade/collectionDetail', { data }),
  seriesList: (data) => request('/index/getSeries', { data }),
  // 公告模块
  afficheDetail: (data) => request('/index/afficheDetail', { data }),
  newsDetail: (data) => request('/index/newsDetail', { data }),
  rumorInfo: (data) => request('/shequ/rumor/info', { data }),
  // 我的藏品
  myCollectionList: (data) => request('/market/trade/userCollectionList', { data }),
  collectionInfo: (data) => request('/market/trade/collectionInfo', { data }),
  // 商品 / 系列
  seriesGoodsList: (data) => request('/market/market/seriesGoodsList', { data }),
  productDetail: (data) => request('/product/product/detail', { data }),
  productRule: (data) => request('/product/product/rule', { data }),
  // 我的 · 地址
  addressList: () => request('/user/address/lists', { data: {} }),
  flowDoc: () => request('/market/trade/flowDoc', { data: {} }),
  // 积分商城
  shopList: (data) => request('/crystal_goods/crystalList', { data }),
  shopGoodsDetail: (data) => request('/crystal_goods/goodsDetail', { data }),
  shopBoxDetail: (data) => request('/crystal_goods/boxDetail', { data }),
  shopCollectionDetail: (data) => request('/crystal_goods/collectionDetail', { data }),
  shopExchangeRecord: (data) => request('/crystal_goods/exchangeRecord', { data }),
  shopCrystalDetail: (data) => request('/crystal_goods/crystalDetail', { data }),
  // 盲盒
  blindBoxMyBox: (data) => request('/box/blind_box/myBox', { data }),
  blindBoxOpenRecord: (data) => request('/box/blind_box/openlog', { data }),
  // 开盒结果：多格走 openBoxs（数组）；单格走 openbox（单对象）——源站 9bd5 契约
  blindBoxOpenResult: (data) => request('/user_collection/user_collection/openBoxs', { data }),
  blindBoxOpenResultOne: (data) => request('/user_collection/user_collection/openbox', { data }),
  // 我的页藏品聚合（tab：藏品 types=2 / 盲盒 types=1 / 已售 types=3；
  // 源站 openBox/openBoxs 契约入参名均为 openid，响应分别为单对象/数组）
  antMycollection: (data) => request('/user_collection/user_collection/antMycollection', { data }),
  collectionGetDetail: (data) => request('/user_collection/user_collection/getDetail', { data }),
  openBoxs: (data) => request('/user_collection/user_collection/openBoxs', { data }),
  openBox: (data) => request('/user_collection/user_collection/openbox', { data }),
  batchchangeMarketGoods: (data) => request('/market/market/batchchangeMarketGoods', { data }),
  // 合成
  compoundList: (data) => request('/compound/compound/list', { data }),
  compoundRecord: (data) => request('/compound/compound/record', { data }),
  compoundResult: (data) => request('/compound/compound/result', { data }),
  compoundScheme: (data) => request('/compound/compound/scheme', { data }),
  // 转盘
  lotteryInfo: (data) => request('/lottery/lottery/info', { data }),
  lotteryRecord: (data) => request('/lottery/lottery/record', { data }),
  lotteryRule: (data) => request('/lottery/lottery/rule', { data }),
  // 签到 / 邀请 / 活动抽签
  signInfo: (data) => request('/sign/index/info', { data }),
  invitationInfo: (data) => request('/invitation/invitation/info', { data }),
  invitationRecord: (data) => request('/invitation/invitation/record', { data }),
  activityDrawInfo: (data) => request('/activity/draw/info', { data }),
  activityDrawRecord: (data) => request('/activity/draw/record', { data }),
  // 全民抽签
  drawResult: (data) => request('/draw/drawResult/result', { data }),
  drawLeaderboard: (data) => request('/draw/Leaderboard/list', { data }),
  communityShareInfo: (data) => request('/draw/communityShare/info', { data }),
  invitationAssistInfo: (data) => request('/draw/InvitationFriendAssist/info', { data }),
  activeSelectedList: (data) => request('/activeSelected/list', { data }),
  // 返利 / 榜单 / 转赠 / 聊天 / 行情
  // 说明：以下 11 个转发函数为补齐历史遗漏 —— 页面一直在调用，但本文件此前未导出，
  // 导致远程模式下抛 TypeError 被 utils/api.js 的空 catch 静默吞掉后回落 mock，
  // 使返利/榜单/转赠/聊天/K线 5 个域拿不到真实数据且无任何报错。转发目标见 MOCK_MAP。
  rebateInfo: (data) => request('/rebate/rebate/index', { data }),
  rebateLeaderboard: (data) => request('/rebate/rebate/leaderboard', { data }),
  rebateInviteDetail: (data) => request('/rebate/rebate/inviteDetail', { data }),
  masterRank: (data) => request('/rank/masterRank/list', { data }),
  userBuyRank: (data) => request('/rank/userBuy/list', { data }),
  leaderboardGoods: (data) => request('/leaderboard/leaderboard/goods', { data }),
  leaderboardUser: (data) => request('/leaderboard/leaderboard/user', { data }),
  marketCapRanking: (data) => request('/marketCapRanking/marketCapRanking/list', { data }),
  regiftRecord: (data) => request('/regift/record/list', { data }),
  chatMessages: (data) => request('/community/chat/messageList', { data }),
  klineInfo: (data) => request('/kline/info/detail', { data }),
}

export { getToken, setToken, readMock, IS_REMOTE }

/* ============ 图片处理：全部本地化，不依赖源站 ============ */

/** 已下载到 public/static/uploads 的原站藏品图 */
const LOCAL_UPLOADS = [
  '/uploads/20260923/bcc1d99e1f84f820ab90b13824691086.jpg',
  '/uploads/20261003/cf898a87337ccc59b005b05ebaa32d1b.jpg',
  '/uploads/20261004/a8baf1aa410c4dae7b62cc269ba98f8f.jpg',
  '/uploads/20261007/88fefb48724be865bf2d4fec12e89c4d.jpg',
  '/uploads/20261008/a72fad0b03a98ca892c592e299b9ed47.jpg',
  '/uploads/20261010/032c2e9a8d70d4b60dc05126354d6676.jpg',
  '/uploads/20261012/2bf53a1d6e5ada30bc88d8e88e424a6b.jpg',
  '/uploads/20261012/6bc830cb1b1ab8bc87b46cf1f9b61779.jpg',
  '/uploads/20261013/2d46cca956612f79f3df0ab527fecb7b.jpg',
  '/uploads/20261013/2f31fa297ffe32131904ee666c6a3728.jpg',
  '/uploads/20261013/7379274089052cc6e3228027936b0e83.jpg',
  '/uploads/20261013/ea4dc2e4402607854ffa25599ee1ffa1.jpg',
  '/uploads/20261014/14445f260c3d2923e8db81267030e806.jpg',
  '/uploads/20261014/803cdb4d235463160e98862bb77cf630.jpg',
  '/uploads/20261014/863cd0a4f37a0c23f746fdff01bd6bc7.jpg',
  '/uploads/20261014/ea65d8aff9b71747498819acc2c28e74.jpg',
  '/uploads/20261015/8ddb3381accb0c438fc6a97fd706aad8.jpg',
  '/uploads/20261015/a6271cd4e2445223e3f3be195c32e82e.jpg',
  '/uploads/20261015/d594694a777c2ef7fc745cc0c7603fa7.jpg',
  '/uploads/20261015/ee04d7f83208f39915a9c0feed06d1b8.jpg',
]
const LOCAL_IMG = new Set(LOCAL_UPLOADS)

/** 本地兜底占位图（避免任何图片 404） */
const PLACEHOLDER = LOCAL_BASE + '/static/collection/top_bg.png'

/** 从文件名反查本地副本（兼容 mock 中同一图带不同 query 的情况） */
const BY_BASENAME = new Map(
  LOCAL_UPLOADS.map((p) => [p.split('/').pop(), LOCAL_BASE + '/static' + p])
)

/**
 * 图片地址解析：命中本地清单返回本地，否则返回占位图。
 * 完全不访问外部域名。
 */
export function ossImg(path) {
  if (!path) return PLACEHOLDER
  if (path.startsWith('data:')) return path
  // 已是本项目绝对地址（http(s) 或协议相对）
  if (/^(https?:)?\/\//.test(path)) return path
  // 本项目静态目录
  if (path.startsWith('/static/') || path.startsWith('static/')) {
    return LOCAL_BASE + '/' + path.replace(/^\//, '')
  }

  const clean = path.split('?')[0]
  if (LOCAL_IMG.has(clean)) return LOCAL_BASE + '/static' + clean

  const base = clean.split('/').pop()
  if (base && BY_BASENAME.has(base)) return BY_BASENAME.get(base)

  // 本地无副本 -> 占位图（不回落外网）
  return PLACEHOLDER
}

export default request
