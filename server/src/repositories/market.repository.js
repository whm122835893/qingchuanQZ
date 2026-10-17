'use strict'

/**
 * 市场域数据访问：market_listings / product_market_stats / kline_snapshots。
 *
 * DB 列名对齐：market_listings 用 name / cover_image，
 * 不是源站响应里的 goods_name / goods_cover_image（别名由 service 层映射）。
 */
const db = require('../db')

/* ────────────── product_market_stats ────────────── */

/** 市场列表左连 products：products 缺失时 p_* 各字段为 null（弱引用，接口不崩） */
const MARKET_LIST_SELECT =
  'SELECT s.id AS sid, s.product_id, s.name, s.listimg, s.series_id, s.goods_type, s.total_num, s.flux, ' +
  's.min_price, s.deal_num, s.market_value, s.market_fluctuate, s.market_fluctuate_new, s.reprice_limit, ' +
  's.is_out, s.flag, s.select_status, s.collection_level, s.openresale_time, s.new_time, ' +
  'p.id AS p_id, p.name AS p_name, p.listimg AS p_listimg, p.total_num AS p_total_num, p.is_like AS p_is_like ' +
  'FROM product_market_stats s LEFT JOIN products p ON p.id = s.product_id'

function listMarketItems({ seriesId = null, goodsType = null, page }) {
  const where = []
  const params = []
  if (seriesId) {
    where.push('(s.series_id = ? OR s.series_id_raw = ?)')
    params.push(seriesId, String(seriesId))
  }
  if (goodsType) {
    where.push('(s.goods_type = ? OR s.goods_type IS NULL)')
    params.push(goodsType)
  }
  const w = where.length ? ` WHERE ${where.join(' AND ')}` : ''
  const total = db.count(`SELECT COUNT(*) AS c FROM product_market_stats s${w}`, params)
  const items = db.query(
    `${MARKET_LIST_SELECT}${w} ORDER BY s.id ASC` + db.dialect.limit(page.pageSize, page.offset),
    params
  )
  return { items, total }
}

/** 单个 series 的行情统计（MarketDetail / productDetail 的行情段） */
function findMarketStat(productId) {
  if (!productId) return null
  return db.queryOne(
    'SELECT s.id, s.product_id, s.name, s.listimg, s.series_id, s.goods_type, s.total_num, s.flux, s.min_price, ' +
      's.deal_num, s.market_value, s.market_fluctuate, s.market_fluctuate_new, s.reprice_limit, s.is_out, ' +
      's.flag, s.select_status, s.collection_level, s.openresale_time, s.new_time, s.stat_date ' +
      'FROM product_market_stats s WHERE s.product_id = ? LIMIT 1',
    [productId]
  )
}

/** 藏品综合榜/ 市值榜：均以 product_market_stats 为源（orderBy 由 service 白名单传入） */
function listMarketRank({ orderBy = 'flux DESC', limit = 20 }) {
  return db.query(
    'SELECT s.product_id, s.name, s.listimg, s.total_num, s.flux, s.min_price, s.market_value, ' +
      's.market_fluctuate, s.collection_level, p.is_like ' +
      'FROM product_market_stats s LEFT JOIN products p ON p.id = s.product_id ' +
      `ORDER BY ${orderBy} LIMIT ${Number(limit)}`
  )
}

/* ────────────── market_listings ────────────── */

/** 挂单列（统一 m. 前缀：与 user_collections 连表后 id/product_id 等列同名，不加前缀会歧义） */
const LISTING_COLS = [
  'm.id', 'm.product_id', 'm.series_id', 'm.collection_id', 'm.sale_user_id', 'm.sale_user_nickname',
  'm.buy_user_id', 'm.name', 'm.cover_image', 'm.series_name', 'm.price', 'm.min_price', 'm.status',
  'm.goods_type', 'm.income_type', 'm.income_type_raw', 'm.pay_way', 'm.order_sn', 'm.sale_time',
  'm.listing_time', 'm.update_time', 'm.rush_status', 'm.pay_platform_service_rate',
  'm.platform_service_price', 'm.creator_service_price', 'm.real_income', 'm.buy_version',
  'm.is_deleted', 'm.pay_text', 'm.img', 'm.name_ext',
].join(', ')

/**
 * 挂单查询统一 SELECT：market_listings 左连 user_collections。
 * collection_code（编号）在 user_collections 上，挂单表只有 collection_id，
 * 不连表则编号字段无处可取（曾导致 seriesGoodsList/myConsignment 缺 collection_code）。
 * 悬空引用时c.* 各列为 null，接口不崩。
 */
const LISTING_SELECT =
  `SELECT ${LISTING_COLS}, uc.collection_code, uc.collection_code_num ` +
  'FROM market_listings m LEFT JOIN user_collections uc ON uc.id = m.collection_id'

function findListing(id) {
  if (!id) return null
  return db.queryOne(`${LISTING_SELECT} WHERE m.id = ?`, [id])
}

/** 某系列下的挂单列表（seriesGoodsList） */
function listListingsBySeries(seriesId, goodsType, page) {
  const where = ['(m.series_id = ? OR m.series_id_raw = ?)']
  const params = [seriesId, String(seriesId)]
  if (goodsType) {
    where.push('(m.goods_type = ? OR m.goods_type IS NULL)')
    params.push(goodsType)
  }
  const w = ` WHERE ${where.join(' AND ')}`
  const total = db.count(`SELECT COUNT(*) AS c FROM market_listings m${w}`, params)
  const items = db.query(
    `${LISTING_SELECT}${w} ORDER BY m.id ASC` +
      db.dialect.limit(page.pageSize, page.offset),
    params
  )
  return { items, total }
}

/** 我的寄售：按挂单人过滤；sale_user_id 为空的悬空行也返回（返回能返回的部分） */
function listListingsByUser(userId, page) {
  const w = ' WHERE m.sale_user_id = ? OR m.sale_user_id IS NULL'
  const total = db.count(`SELECT COUNT(*) AS c FROM market_listings m${w}`, [userId])
  const items = db.query(
    `${LISTING_SELECT}${w} ORDER BY m.listing_time DESC, m.id DESC` +
      db.dialect.limit(page.pageSize, page.offset),
    [userId]
  )
  return { items, total }
}

/** 某系列最新在售价（collectionDetail 的 price / floor_price） */
function latestListingPrice(productId) {
  if (!productId) return null
  return db.queryOne(
    `${LISTING_SELECT} WHERE m.product_id = ? AND m.status = 1 ORDER BY m.listing_time DESC, m.id DESC LIMIT 1`,
    [productId]
  )
}

/** 地板价：在售挂单最低价 */
function floorPrice(productId) {
  if (!productId) return null
  const row = db.queryOne(
    'SELECT MIN(price) AS floor FROM market_listings WHERE product_id = ? AND status = 1 AND price > 0',
    [productId]
  )
  return row && row.floor !== null ? row.floor : null
}

module.exports = {
  LISTING_COLS,
  listMarketItems,
  findMarketStat,
  listMarketRank,
  findListing,
  listListingsBySeries,
  listListingsByUser,
  latestListingPrice,
  floorPrice,
}