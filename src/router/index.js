import { createRouter, createWebHashHistory } from 'vue-router'

// 与原站一致的路由结构（hash 模式）
const routes = [
  { path: '/', name: 'home', component: () => import('@/pages/index/Index.vue'), meta: { title: '青川' } },
  { path: '/pages/index/index', redirect: '/' },
  { path: '/pages/index/empty', name: 'empty', component: () => import('@/pages/index/Empty.vue'), meta: { title: '敬请期待' } },
  // 市场
  { path: '/pages/market/market', name: 'market', component: () => import('@/pages/market/Market.vue'), meta: { title: '市场' } },
  { path: '/pages/market/detail', name: 'marketDetail', component: () => import('@/pages/market/Detail.vue'), meta: { title: '藏品详情' } },
  { path: '/pages/market/batchPay', name: 'batchPay', component: () => import('@/pages/market/BatchPay.vue'), meta: { title: '批量购买' } },
  // 交易链路 · 寄售详情
  { path: '/pages/market/sellInfo', name: 'sellInfo', component: () => import('@/pages/market/SellInfo.vue'), meta: { title: '寄售详情' } },
  { path: '/pages/market/sellBegBuy', name: 'sellBegBuy', component: () => import('@/pages/market/SellBegBuy.vue'), meta: { title: '以求购价出售' } },
  { path: '/pages/market/submitBegBuy', name: 'submitBegBuy', component: () => import('@/pages/market/SubmitBegBuy.vue'), meta: { title: '发起求购' } },
  { path: '/pages/market/submitEntrust', name: 'submitEntrust', component: () => import('@/pages/market/SubmitEntrust.vue'), meta: { title: '发起委托' } },
  { path: '/pages/market/categoryManager', name: 'categoryManager', component: () => import('@/pages/market/CategoryManager.vue'), meta: { title: '分类管理' } },
  { path: '/pages/market/giftRecord', name: 'giftRecord', component: () => import('@/pages/market/GiftRecord.vue'), meta: { title: '赠送记录' } },
  { path: '/pages/market/tradeUnion', name: 'tradeUnion', component: () => import('@/pages/market/TradeUnion.vue'), meta: { title: 'GM工会' } },
  // 交易链路 · 寄售
  { path: '/pages/consignments/consignments', name: 'consignments', component: () => import('@/pages/consignments/Consignments.vue'), meta: { title: '寄售藏品' } },
  { path: '/pages/consignments/myConsignment', name: 'myConsignment', component: () => import('@/pages/consignments/MyConsignment.vue'), meta: { title: '我的寄售' } },
  { path: '/pages/consignments/search', name: 'consignSearch', component: () => import('@/pages/consignments/Search.vue'), meta: { title: '寄售搜索' } },
  // 交易链路 · 委托 / 求购
  { path: '/pages/order/entrust/list', name: 'entrustList', component: () => import('@/pages/order/OrderFilterList.vue'), meta: { title: '我的委托' } },
  { path: '/pages/order/entrust/info', name: 'entrustInfo', component: () => import('@/pages/order/OrderDetail.vue'), meta: { title: '委托详情' } },
  { path: '/pages/order/beg/list', name: 'begList', component: () => import('@/pages/order/OrderFilterList.vue'), meta: { title: '我的求购' } },
  { path: '/pages/order/beg/info', name: 'begInfo', component: () => import('@/pages/order/OrderDetail.vue'), meta: { title: '求购详情' } },
  // 交易链路 · 订单详情
  { path: '/pages/order/defaultDetail', name: 'orderDefaultDetail', component: () => import('@/pages/order/OrderDetail.vue'), meta: { title: '订单详情' } },
  { path: '/pages/order/marketDetail', name: 'orderMarketDetail', component: () => import('@/pages/order/OrderDetail.vue'), meta: { title: '订单详情' } },
  { path: '/pages/order/regiftDetail', name: 'orderRegiftDetail', component: () => import('@/pages/order/OrderDetail.vue'), meta: { title: '转赠详情' } },
  // K线
  { path: '/pages/kline/buy', name: 'klineBuy', component: () => import('@/pages/kline/Buy.vue'), meta: { title: '购买' } },
  { path: '/pages/market/search', name: 'marketSearch', component: () => import('@/pages/market/Search.vue'), meta: { title: '搜索' } },
  { path: '/pages/market/marketGoodsList', name: 'marketGoodsList', component: () => import('@/pages/market/MarketGoodsList.vue'), meta: { title: '专辑列表' } },
  // 盲盒
  { path: '/pages/blindBox/index', name: 'blindBox', component: () => import('@/pages/blindBox/Index.vue'), meta: { title: '我的盲盒' } },
  { path: '/pages/blindBox/blindBoxDetails', name: 'blindBoxDetails', component: () => import('@/pages/blindBox/BlindBoxDetails.vue'), meta: { title: '藏品详情' } },
  { path: '/pages/blindBox/openRecord', name: 'blindBoxOpenRecord', component: () => import('@/pages/blindBox/OpenRecord.vue'), meta: { title: '开盒记录' } },
  { path: '/pages/blindBox/result', name: 'blindBoxResult', component: () => import('@/pages/blindBox/Result.vue'), meta: { title: '开盒结果' } },
  { path: '/pages/blindBox/result2', name: 'blindBoxResult2', component: () => import('@/pages/blindBox/Result2.vue'), meta: { title: '开盒结果' } },
  // 公告
  { path: '/pages/notice/notice', name: 'notice', component: () => import('@/pages/notice/Notice.vue'), meta: { title: '公告' } },
  { path: '/pages/notice/noticeDetails', name: 'noticeDetails', component: () => import('@/pages/notice/NoticeDetails.vue'), meta: { title: '公告详情' } },
  { path: '/pages/notice/newsDetails', name: 'newsDetails', component: () => import('@/pages/notice/NewsDetails.vue'), meta: { title: '潮玩有话说' } },
  { path: '/pages/notice/search', name: 'noticeSearch', component: () => import('@/pages/notice/Search.vue'), meta: { title: '公告搜索' } },
  { path: '/pages/notice/sendRumor', name: 'sendRumor', component: () => import('@/pages/notice/SendRumor.vue'), meta: { title: '发表' } },
  { path: '/pages/notice/wallDetails', name: 'wallDetails', component: () => import('@/pages/notice/WallDetails.vue'), meta: { title: '社区详情' } },
  // 社区
  { path: '/pages/community/community', name: 'community', component: () => import('@/pages/community/Community.vue'), meta: { title: '社区' } },
  // 登录
  { path: '/pages/login/login', name: 'login', component: () => import('@/pages/login/Login.vue'), meta: { title: '登录' } },
  { path: '/pages/login/register', name: 'register', component: () => import('@/pages/login/Register.vue'), meta: { title: '注册' } },
  { path: '/pages/login/forgetPwd', name: 'forgetPwd', component: () => import('@/pages/login/ForgetPwd.vue'), meta: { title: '找回密码' } },
  { path: '/pages/login/verification', name: 'loginVerification', component: () => import('@/pages/login/Verification.vue'), meta: { title: '验证码登录' } },
  { path: '/pages/login/setPwd', name: 'loginSetPwd', component: () => import('@/pages/login/SetPwd.vue'), meta: { title: '设置密码' } },
  // 邀请返利
  { path: '/pages/rebate/rebate', name: 'rebate', component: () => import('@/pages/rebate/Rebate.vue'), meta: { title: '邀请返利' } },
  { path: '/pages/rebate/leaderboard', name: 'rebateLeaderboard', component: () => import('@/pages/rebate/Leaderboard.vue'), meta: { title: '邀请排行榜' } },
  { path: '/pages/rebate/rebateInviteDetail', name: 'rebateInviteDetail', component: () => import('@/pages/rebate/InviteDetail.vue'), meta: { title: '被邀请人清单' } },
  // 榜单
  { path: '/pages/rank/masterRank', name: 'masterRank', component: () => import('@/pages/rank/MasterRank.vue'), meta: { title: '大师动态' } },
  { path: '/pages/rank/userBuy', name: 'userBuyRank', component: () => import('@/pages/rank/UserBuy.vue'), meta: { title: '用户购买榜' } },
  { path: '/pages/leaderboard/leaderboard', name: 'leaderboard', component: () => import('@/pages/leaderboard/Leaderboard.vue'), meta: { title: '排行榜' } },
  { path: '/pages/marketCapRanking/marketCapRanking', name: 'marketCapRanking', component: () => import('@/pages/marketCapRanking/MarketCapRanking.vue'), meta: { title: '市值排行榜' } },
  // 转赠
  { path: '/pages/regift/regift', name: 'regift', component: () => import('@/pages/regift/Regift.vue'), meta: { title: '转赠' } },
  { path: '/pages/regift/record', name: 'regiftRecord', component: () => import('@/pages/regift/Record.vue'), meta: { title: '转赠记录' } },
  // 实名认证
  { path: '/pages/certification/certification', name: 'certification', component: () => import('@/pages/certification/Certification.vue'), meta: { title: '实名认证' } },
  { path: '/pages/certification/certificationStatus', name: 'certificationStatus', component: () => import('@/pages/certification/CertificationStatus.vue'), meta: { title: '认证结果' } },
  // 社区 / 规则 / webview / 下载 / 空状态 / K线
  { path: '/pages/community/chat', name: 'communityChat', component: () => import('@/pages/community/Chat.vue'), meta: { title: '聊天' } },
  { path: '/pages/rules/rules', name: 'rules', component: () => import('@/pages/rules/Rules.vue'), meta: { title: '规则中心' } },
  { path: '/pages/webview/webview', name: 'webview', component: () => import('@/pages/webview/Webview.vue'), meta: { title: '详情' } },
  { path: '/pages/webview/webview-storage', name: 'webviewStorage', component: () => import('@/pages/webview/WebviewStorage.vue'), meta: { title: '隐私政策' } },
  { path: '/pages/index/downloadApp', name: 'downloadApp', component: () => import('@/pages/index/DownloadApp.vue'), meta: { title: '下载APP' } },
  { path: '/pages/kline/info', name: 'klineInfo', component: () => import('@/pages/kline/Info.vue'), meta: { title: '行情详情' } },
  // 我的
  { path: '/pages/my/my', name: 'my', component: () => import('@/pages/my/My.vue'), meta: { title: '我的' } },
  { path: '/pages/my/info', name: 'myInfo', component: () => import('@/pages/my/Info.vue'), meta: { title: '个人资料' } },
  { path: '/pages/my/setting', name: 'mySetting', component: () => import('@/pages/my/Setting.vue'), meta: { title: '设置' } },
  { path: '/pages/my/about', name: 'about', component: () => import('@/pages/my/About.vue'), meta: { title: '关于我们' } },
  { path: '/pages/my/privacy', name: 'myPrivacy', component: () => import('@/pages/my/Privacy.vue'), meta: { title: '隐私设置' } },
  { path: '/pages/my/service', name: 'myService', component: () => import('@/pages/my/Service.vue'), meta: { title: '加入社群' } },
  { path: '/pages/my/vip', name: 'myVip', component: () => import('@/pages/my/Vip.vue'), meta: { title: 'VIP权益中心' } },
  { path: '/pages/my/join', name: 'myJoin', component: () => import('@/pages/my/Join.vue'), meta: { title: '加入社群' } },
  { path: '/pages/my/cancellation', name: 'myCancellation', component: () => import('@/pages/my/Cancellation.vue'), meta: { title: '注销账号申请' } },
  { path: '/pages/my/depositinquiry', name: 'myDepositInquiry', component: () => import('@/pages/my/DepositInquiry.vue'), meta: { title: '充值查询' } },
  { path: '/pages/my/enablingcenter', name: 'myEnablingCenter', component: () => import('@/pages/my/EnablingCenter.vue'), meta: { title: '赋能中心' } },
  { path: '/pages/my/flowDoc', name: 'myFlowDoc', component: () => import('@/pages/my/FlowDoc.vue'), meta: { title: '流转记录' } },
  { path: '/pages/my/actionPwd/getCode', name: 'myActionPwdGetCode', component: () => import('@/pages/my/ActionPwdGetCode.vue'), meta: { title: '找回操作密码' } },
  { path: '/pages/my/actionPwd/setPwd', name: 'myActionPwdSetPwd', component: () => import('@/pages/my/ActionPwdSetPwd.vue'), meta: { title: '设置操作密码' } },
  { path: '/pages/my/address/list', name: 'addressList', component: () => import('@/pages/my/AddressList.vue'), meta: { title: '收货地址' } },
  { path: '/pages/my/address/edit', name: 'addressEdit', component: () => import('@/pages/my/AddressEdit.vue'), meta: { title: '收货地址' } },
  { path: '/pages/wallet/wallet', name: 'wallet', component: () => import('@/pages/wallet/Wallet.vue'), meta: { title: '我的钱包' } },
  { path: '/pages/order/list', name: 'orderList', component: () => import('@/pages/order/OrderList.vue'), meta: { title: '我的订单' } },
  { path: '/pages/order/orderSubmit', name: 'orderSubmit', component: () => import('@/pages/order/OrderSubmit.vue'), meta: { title: '确认订单' } },
  { path: '/pages/myCollection/myCollection', name: 'myCollection', component: () => import('@/pages/myCollection/MyCollection.vue'), meta: { title: '我的藏品' } },
  { path: '/pages/myCollection/collectionDetails', name: 'collectionDetails', component: () => import('@/pages/myCollection/CollectionDetails.vue'), meta: { title: '藏品详情' } },
  { path: '/pages/myCollection/search', name: 'myCollectionSearch', component: () => import('@/pages/myCollection/Search.vue'), meta: { title: '搜索藏品' } },
  // 活动类页面 · 积分商城
  { path: '/pages/shop/shop', name: 'shop', component: () => import('@/pages/shop/Shop.vue'), meta: { title: '积分商城' } },
  { path: '/pages/shop/detailList', name: 'shopDetailList', component: () => import('@/pages/shop/DetailList.vue'), meta: { title: '龙晶明细' } },
  { path: '/pages/shop/detail/goods', name: 'shopGoodsDetail', component: () => import('@/pages/shop/GoodsDetail.vue'), meta: { title: '商品详情' } },
  { path: '/pages/shop/detail/box', name: 'shopBoxDetail', component: () => import('@/pages/shop/BoxDetail.vue'), meta: { title: '盲盒商品详情' } },
  { path: '/pages/shop/detail/collection', name: 'shopCollectionDetail', component: () => import('@/pages/shop/CollectionDetail.vue'), meta: { title: '藏品商品详情' } },
  { path: '/pages/shop/exchange', name: 'shopExchange', component: () => import('@/pages/shop/Exchange.vue'), meta: { title: '确认兑换' } },
  { path: '/pages/shop/record', name: 'shopRecord', component: () => import('@/pages/shop/Record.vue'), meta: { title: '兑换记录' } },
  // 活动类页面 · 藏品合成
  { path: '/pages/compound/compound', name: 'compound', component: () => import('@/pages/compound/Compound.vue'), meta: { title: '藏品合成' } },
  { path: '/pages/compound/record', name: 'compoundRecord', component: () => import('@/pages/compound/Record.vue'), meta: { title: '合成记录' } },
  { path: '/pages/compound/result', name: 'compoundResult', component: () => import('@/pages/compound/Result.vue'), meta: { title: '合成结果' } },
  { path: '/pages/compound/schemeDetails', name: 'compoundSchemeDetails', component: () => import('@/pages/compound/SchemeDetails.vue'), meta: { title: '合成方案' } },
  // 活动类页面 · 抽奖转盘
  { path: '/pages/lottery/lottery', name: 'lottery', component: () => import('@/pages/lottery/Lottery.vue'), meta: { title: '抽奖转盘' } },
  { path: '/pages/lottery/record', name: 'lotteryRecord', component: () => import('@/pages/lottery/Record.vue'), meta: { title: '中奖记录' } },
  { path: '/pages/lottery/rule', name: 'lotteryRule', component: () => import('@/pages/lottery/Rule.vue'), meta: { title: '活动规则' } },
  // 活动类页面 · 抽签
  { path: '/pages/draw/drawResult/drawResult', name: 'drawResult', component: () => import('@/pages/draw/DrawResult.vue'), meta: { title: '抽签结果' } },
  { path: '/pages/draw/Leaderboard/Leaderboard', name: 'drawLeaderboard', component: () => import('@/pages/draw/DrawLeaderboard.vue'), meta: { title: '抽签排行榜' } },
  { path: '/pages/draw/communityShare/communityShare', name: 'drawCommunityShare', component: () => import('@/pages/draw/CommunityShare.vue'), meta: { title: '分享社群' } },
  { path: '/pages/draw/InvitationFriendAssist/InvitationFriendAssist', name: 'drawInvitationAssist', component: () => import('@/pages/draw/InvitationAssist.vue'), meta: { title: '好友助力' } },
  { path: '/pages/activeSelected/activeSelected', name: 'activeSelected', component: () => import('@/pages/draw/ActiveSelected.vue'), meta: { title: '活动中心' } },
  // 活动类页面 · 签到 / 邀请 / 活动抽签
  { path: '/pages/sign/index', name: 'sign', component: () => import('@/pages/sign/Sign.vue'), meta: { title: '签到有礼' } },
  { path: '/pages/invitation/invitation', name: 'invitation', component: () => import('@/pages/invitation/Invitation.vue'), meta: { title: '邀请好友' } },
  { path: '/pages/invitation/invitationrecord', name: 'invitationRecord', component: () => import('@/pages/invitation/InvitationRecord.vue'), meta: { title: '邀请记录' } },
  { path: '/pages/activity/draw', name: 'activityDraw', component: () => import('@/pages/activity/ActivityDraw.vue'), meta: { title: '活动抽签' } },
  { path: '/pages/activity/record', name: 'activityRecord', component: () => import('@/pages/activity/ActivityRecord.vue'), meta: { title: '中签记录' } },
  { path: '/pages/product/box', name: 'productBox', component: () => import('@/pages/product/Box.vue'), meta: { title: '盲盒详情' } },
  { path: '/pages/product/collection', name: 'productCollection', component: () => import('@/pages/product/Collection.vue'), meta: { title: '藏品商品' } },
  { path: '/pages/product/ruleDetail', name: 'productRuleDetail', component: () => import('@/pages/product/RuleDetail.vue'), meta: { title: '购买规则' } },
  // 本地协议页（独立项目内置正文，不跳外站）
  { path: '/pages/agreement/agreement', name: 'agreement', component: () => import('@/pages/agreement/Agreement.vue'), meta: { title: '协议' } },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  },
})

router.afterEach((to) => {
  const title = to.meta && to.meta.title
  if (title) document.title = title
})

export default router
