'use strict'

/**
 * 统计分销域 service：返利、榜单、市值排行、转赠记录。
 */
const env = require('../config/env')
const statsRepo = require('../repositories/stats.repository')
const marketRepo = require('../repositories/market.repository')
const userRepo = require('../repositories/user.repository')
const configRepo = require('../repositories/config.repository')
const orderRepo = require('../repositories/order.repository')
const productRepo = require('../repositories/product.repository')
const { pagination } = require('../utils/validate')
const { money, money2 } = require('../utils/pick')

/** 返利首页（rebate/index，style D） */
async function rebateIndex(userId) {
  const user = await userRepo.findUser(userId)
  const profile = await statsRepo.findRebateProfile(userId)
  const inviteBase = await configRepo.groupValue('basic', 'h5_invite_url') || ''
  return {
    c_info: {
      avatar: user ? user.avatar : '',
      nickname: user ? user.nickname : '',
      inviter_code: user ? user.inviter_code || '' : '',
      all_commision: money2(profile ? profile.all_commision : 0),
      yesterday_commision: money2(profile ? profile.yesterday_commision : 0),
      user_transaction: money2(profile ? profile.user_transaction : 0),
      mingxia_commision: money2(profile ? profile.mingxia_commision : 0),
      yao_counts: profile && profile.yao_counts !== null ? String(profile.yao_counts) : '0',
      you_yao_counts: profile && profile.you_yao_counts !== null ? String(profile.you_yao_counts) : '0',
    },
    h5_invite_url: inviteBase,
    comm_desc: (await configRepo.groupValue('basic', 'rebate_desc')) || '',
  }
}

/** 返利榜单（style A）。com_price 用 all_commision 两位小数 */
async function rebateLeaderboard() {
  return await statsRepo.listRebateProfiles(20).map((r, i) => ({
    id: i + 1,
    nickname: r.nickname || '',
    com_price: money2(r.all_commision),
  }))
}

/** 邀请明细（inviteDetail，style A） */
async function rebateInviteDetail(userId) {
  return await statsRepo.listRebateInvites(userId).map((r) => ({
    id: r.id,
    nickname: r.nickname || '',
    jointime: r.join_time || '',
    first_transaction_time: r.first_transaction_time || '',
    user_transaction: money2(r.user_transaction),
    month_transaction: money2(r.month_transaction),
  }))
}

/** 大师榜（masterRank/list，style A）：rank_type='master' */
async function masterRank() {
  const rows = await statsRepo.listRankSnapshots({
    rankType: 'master',
    orderBy: 'score DESC',
    limit: 20,
  })
  //逐条需再查 products（榜单快照只存 product_id），故串行 await——20 条量级可接受
  const out = []
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i]
    out.push({
      id: i + 1,
      avatar: r.avatar || '',
      nickname: r.nickname || '',
      createtime: r.event_time || '',
      goods_cover_image: await goodsCoverOf(r),
      goods_name: await goodsNameOf(r),
      num: r.score === null ? 0 : r.score,
    })
  }
  return out
}

/** 购买榜（userBuy/list，style A）：rank_type='user_buy'，按产品维度 */
async function userBuyRank() {
  const rows = await statsRepo.listRankSnapshots({
    rankType: 'user_buy',
    orderBy: 'score DESC',
    limit: 20,
  })
  const out = []
  for (const r of rows) {
    out.push({
      id: r.product_id === null ? r.id : r.product_id,
      goods_cover_image: await goodsCoverOf(r),
      goods_name: await goodsNameOf(r),
      total_price: money2(r.secondary_score),
      num: r.score === null ? 0 : r.score,
      createtime: r.event_time || '',
      count: r.count === null ? 0 : r.count,
    })
  }
  return out
}

async function productOf(r) {
  if (!r || r.product_id === null || r.product_id === undefined) return null
  return await productRepo.findProduct(r.product_id)
}

async function goodsCoverOf(r) {
  const p = await productOf(r)
  return p ? p.listimg : ''
}

async function goodsNameOf(r) {
  const p = await productOf(r)
  return p ? p.name : ''
}

/** 藏品榜（leaderboard/goods，style A）：以 product_market_stats.flux 排序 */
async function leaderboardGoods() {
  const rows = await marketRepo.listMarketRank({ orderBy: 's.flux DESC', limit: 20 })
  return rows.map((r) => ({
    id: r.product_id,
    name: r.name,
    listimg: r.listimg,
    total_num: r.total_num,
    flux: r.flux === null ? '' : String(r.flux),
    min_price: money2(r.min_price),
    is_like: r.is_like === null ? 0 : r.is_like,
  }))
}

/** 用户榜（leaderboard/user，style D：list + my） */
async function leaderboardUser(userId) {
  const rows = await statsRepo.listRankSnapshots({
    rankType: 'user_buy',
    orderBy: 'score DESC',
    limit: 20,
  })
  const list = rows.map((r, i) => ({
    id: i + 1,
    avatar: r.avatar || '',
    nickname: r.nickname || '',
    yao_count: r.score === null ? '0' : String(r.score),
    buy_collection_total_price: money(r.secondary_score),
  }))
  const user = await userRepo.findUser(userId)
  const spent = await totalSpent(userId)
  return {
    list,
    my: {
      order_num: spent.orderNum,
      mobile: maskMobile(user ? user.mobile : ''),
      avatar: user ? user.avatar : '',
      yao_count: user && user.yao_count !== null ? String(user.yao_count) : '0',
      buy_collection_total_price: money2(spent.total),
    },
  }
}

/** 累计成交：本用户订单金额合计（source 为 orders，权威可算） */
async function totalSpent(userId) {
  const rows = await orderRepo
    .listOrders(userId, { type: 1, status: null, page: { pageSize: 100, offset: 0 } })
  const total = rows.items.reduce((sum, r) => sum + Number(r.total_price || 0), 0)
  return { total, orderNum: rows.total }
}

function maskMobile(mobile) {
  if (!mobile || mobile.length < 7) return mobile || ''
  return `${mobile.slice(0, 3)}****${mobile.slice(-4)}`
}

/** 市值排行（marketCapRanking/list，style D）。market_desc 为静态说明文案，取配置无值时留空 */
async function marketCapRanking() {
  const rows = await marketRepo.listMarketRank({ orderBy: 's.market_value DESC', limit: 20 })
  const list = rows.map((r) => ({
    id: r.product_id,
    name: r.name,
    listimg: r.listimg,
    min_price: r.min_price === null ? '' : String(r.min_price),
    market_value: r.market_value,
    market_fluctuate: r.market_fluctuate,
    total_num: r.total_num,
    flux: r.flux === null ? '' : String(r.flux),
  }))
  return {
    info: {
      update_time: (await configRepo.activityConfigValue('market_cap', 'update_time')) || '',
      market_desc: (await configRepo.activityConfigValue('market_cap', 'market_desc')) || '',
    },
    list,
  }
}

/** 转赠记录（regift/record/list，style A） */
async function regiftRecord(userId, params) {
  const page = pagination(params, env)
  const { items } = await statsRepo.listRegiftRecords(userId, page)
  return items.map((r) => ({
    id: r.id,
    goods_cover_image: r.cover_image || '',
    goods_name: r.product_name || '',
    collection_code: r.collection_code || '',
    status: r.status === null ? 0 : r.status,
    status_text: r.status_text || '',
    from_user: r.from_user_nickname || '',
    create_time: r.create_time_str || '',
    back_time: r.back_time || '',
    order_no: r.order_no || '',
  }))
}

module.exports = {
  rebateIndex,
  rebateLeaderboard,
  rebateInviteDetail,
  masterRank,
  userBuyRank,
  leaderboardGoods,
  leaderboardUser,
  marketCapRanking,
  regiftRecord,
}