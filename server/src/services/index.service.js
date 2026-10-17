'use strict'

/**
 * 首页 / 内容社区域 service。
 * 只做「DB 行 → 源站响应字段」映射，不含 SQL（SQL 只在 repositories）。
 */
const env = require('../config/env')
const configRepo = require('../repositories/config.repository')
const contentRepo = require('../repositories/content.repository')
const productRepo = require('../repositories/product.repository')
const { pagination, pageMeta } = require('../utils/validate')
const { pick, money, bool, jsonArray } = require('../utils/pick')

/** getConfig：应用名/Logo 取 trade 组（DB 中 trade 组即交易端配置），费率等取同组键 */
async function getConfig() {
  const trade = await configRepo.groupAsObject('trade')
  const union = await configRepo.firstTradeUnion()
  return {
    appName: trade.appName || null,
    appLogo: trade.appLogo || null,
    trade_union: union
      ? {
          unlock: bool(union.unlock),
          member_count: union.member_count === null ? 0 : union.member_count,
          rebate_holder: money(union.rebate_holder),
          rebate_invited: money(union.rebate_invited),
          rebate_extra: money(union.rebate_extra),
          max_bind: union.max_bind === null ? 0 : union.max_bind,
        }
      : { unlock: false, member_count: 0, rebate_holder: null, rebate_invited: null, rebate_extra: null, max_bind: 0 },
    trade_rule: trade.trade_rule || '',
    // DATABASE.md §9：consignment_sales 恒为 null，不编造
    consignment_sales: null,
    rate: trade.rate || null,
    share_proportion_rate: trade.share_proportion_rate || null,
  }
}

async function bannerList(params) {
  const page = pagination(params, env)
  const { items, total } = await contentRepo.listBanners(page)
  return pagePayload(page, total, items.map(bannerItem))
}

function bannerItem(r) {
  return pick(r, ['id', 'image', 'url', 'url_type', 'is_show'])
}

/** 公告列表。源站 afficheList.per_page 是字符串 "15"（其余分页接口是 int），此处保留源站形态 */
async function afficheList(params) {
  const page = pagination(params, env)
  const { items, total } = await contentRepo.listAffiches({ type: params.type, page })
  const payload = pagePayload(page, total, items.map(afficheItem))
  // 源站此接口 per_page 是字符串 "15"，其余分页接口是数字——按 mock 保留源站形态
  payload.perPage = String(page.pageSize)
  return payload
}

function afficheItem(r) {
  return {
    id: r.id,
    image: r.image || '',
    title: r.title,
    createtime: r.publish_time_ts,
    type: r.type === null ? '' : String(r.type),
    url: r.url || '',
    view_count: r.view_count === null ? 0 : r.view_count,
    affiche_type: r.affiche_type || '',
  }
}

async function afficheTypeList() {
  return await contentRepo.listAfficheTypes().map((t) => ({ id: t.id, name: t.name }))
}

/** 系列列表：源站字段名为 series_name / series_id（DB 为 name / id） */
async function seriesList(params) {
  const type = params.type === undefined || params.type === '' ? null : params.type
  const pid = params.pid === undefined || params.pid === '' ? null : params.pid
  return await productRepo.listSeries(type, pid).map((r) => ({
    series_name: r.name,
    series_id: r.id,
    is_def: r.is_def,
    flag: r.flag,
    pattern: r.pattern,
    resale_put_start_time: r.resale_put_start_time || '',
    resale_put_end_time: r.resale_put_end_time || '',
    resale_buy_start_time: r.resale_buy_start_time || '',
    resale_buy_end_time: r.resale_buy_end_time || '',
  }))
}

/** 公告详情：collection 段来自 affiches.related_products（JSON TEXT） */
async function afficheDetail(id) {
  const row = await contentRepo.findAffiche(id)
  if (!row) return null
  return {
    id: row.id,
    title: row.title,
    affiche_type: row.affiche_type || '',
    publish_time: row.publish_time || '',
    createtime: row.publish_time_ts,
    view_count: row.view_count === null ? 0 : row.view_count,
    content: row.content || '',
    collection: jsonArray(row.related_products).map((p) => ({
      id: p.id,
      name: p.name,
      listimg: p.listimg,
      price: p.price === undefined ? null : money(p.price),
    })),
  }
}

/** 潮玩有话说详情 */
async function newsDetail(id) {
  const row = id ? await contentRepo.findNews(id) : await contentRepo.latestNews()
  if (!row) return null
  return {
    id: row.id,
    title: row.title,
    createtime: row.publish_time,
    content: row.content || '',
  }
}

/** 装修组件：content 为 JSON TEXT，源站原样返回字符串 */
async function diypageList(params) {
  return await contentRepo.listDiypage(params.category).map((r) =>
    pick(r, ['id', 'type', 'category', 'name', 'content', 'decorate_id'])
  )
}

/** 统一分页载荷：交给 responder 输出，controller 不再拼 JSON */
function pagePayload(page, total, items) {
  const meta = pageMeta(total, page.page, page.pageSize)
  return { total, page: page.page, pageSize: page.pageSize, lastPage: meta.lastPage, items }
}

module.exports = {
  getConfig,
  bannerList,
  afficheList,
  afficheTypeList,
  seriesList,
  afficheDetail,
  newsDetail,
  diypageList,
}