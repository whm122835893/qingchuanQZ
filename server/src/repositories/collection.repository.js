'use strict'

/**
 * 我的藏品 / 流转 / 成交价 tick 数据访问。
 */
const db = require('../db')

const UC_COLS =
  'id, product_id, user_id, collection_code, collection_code_num, serial_num, series_total, user_hash, ' +
  'user_hash_text, rz_code, status, is_lock, weither_regift, weither_resale, can_compose, price, min_price, ' +
  'today_volume, has_sold, count, flux, total_num, zuzhao_info_id, task_id, blind_box_id, createtime'

const UC_WITH_PRODUCT =
  'SELECT c.id, c.product_id, c.user_id, c.collection_code, c.collection_code_num, c.serial_num, c.series_total, ' +
  'c.user_hash, c.user_hash_text, c.rz_code, c.status, c.is_lock, c.weither_regift, c.weither_resale, ' +
  'c.can_compose, c.price, c.min_price, c.today_volume, c.has_sold, c.count, c.flux, c.total_num, ' +
  'c.zuzhao_info_id, c.task_id, c.blind_box_id, c.createtime, ' +
  'p.name AS p_name, p.listimg AS p_listimg, p.main_image AS p_main_image, p.goods_type AS p_goods_type, ' +
  'p.total_num AS p_total_num, p.flux AS p_flux, p.sale_total_num AS p_sale_total_num, ' +
  'p.is_lock AS p_is_lock, p.weither_regift AS p_weither_regift, p.weither_resale AS p_weither_resale, ' +
  'p.can_compose AS p_can_compose, p.series_id AS p_series_id, p.publisher_name AS p_publisher_name ' +
  'FROM user_collections c LEFT JOIN products p ON p.id = c.product_id'

/** 我的藏品列表（分页 + 关键词）。关键词由后端过滤，前端 utils L136-145 也会再过滤一次 */
function listUserCollections(userId, { keyword = null, page }) {
  const where = ['c.user_id = ?']
  const params = [userId]
  if (keyword) {
    where.push('(p.name LIKE ? OR c.collection_code LIKE ?)')
    params.push(`%${keyword}%`, `%${keyword}%`)
  }
  const w = ` WHERE ${where.join(' AND ')}`
  const total = db.count(
    `SELECT COUNT(*) AS c FROM user_collections c LEFT JOIN products p ON p.id = c.product_id${w}`,
    params
  )
  const items = db.query(
    `${UC_WITH_PRODUCT}${w} ORDER BY c.id ASC` + db.dialect.limit(page.pageSize, page.offset),
    params
  )
  return { items, total }
}

/**
 * 单个藏品详情。id 语义有两个：user_collections.id（页面传 226 时命中不到），
 * 故先按 id 查，miss 再按 product_id 查——保证页面默认 id=226 也能出数据。
 */
function findUserCollection(id) {
  const byId = db.queryOne(`${UC_WITH_PRODUCT} WHERE c.id = ?`, [id])
  if (byId) return byId
  return db.queryOne(`${UC_WITH_PRODUCT} WHERE c.product_id = ? ORDER BY c.id ASC LIMIT 1`, [id])
}

function findUserCollectionByCode(code) {
  if (!code) return null
  return db.queryOne(`${UC_WITH_PRODUCT} WHERE c.collection_code = ? LIMIT 1`, [code])
}

/** 可出售藏品（getSellCollectionInfo）：持有中且未锁定 */
function listSellableCollections(userId) {
  return db.query(
    `${UC_WITH_PRODUCT} WHERE c.user_id = ? AND c.status = 1 AND c.is_lock = 0 AND c.count > 0 ` +
      'ORDER BY c.id ASC',
    [userId]
  )
}

/** 我的盲盒：有 blind_box_id 的藏品记录 */
function findMyBlindBox(userId) {
  return db.queryOne(
    `${UC_WITH_PRODUCT} WHERE c.user_id = ? AND c.blind_box_id IS NOT NULL ORDER BY c.id ASC LIMIT 1`,
    [userId]
  )
}

/** 开盒记录：盲盒来源的藏品 */
function listBlindBoxRecords(userId, page) {
  const w = ' WHERE c.user_id = ? AND c.blind_box_id IS NOT NULL'
  const params = [userId]
  const total = db.count(`SELECT COUNT(*) AS c FROM user_collections c${w}`, params)
  const items = db.query(
    `${UC_WITH_PRODUCT}${w} ORDER BY c.createtime DESC, c.id DESC` +
      db.dialect.limit(page.pageSize, page.offset),
    params
  )
  return { items, total }
}

/** 藏品流转记录 */
function listFlowRecords(userId, page) {
  const w = ' WHERE user_id = ?'
  const params = [userId]
  const total = db.count(`SELECT COUNT(*) AS c FROM collection_flow_records${w}`, params)
  const items = db.query(
    'SELECT id, collection_code, user_id, nickname, flow_time, source_type FROM collection_flow_records' +
      `${w} ORDER BY flow_time DESC, id DESC` + db.dialect.limit(page.pageSize, page.offset),
    params
  )
  return { items, total }
}

/**
 * 成交价 tick（sellInfo 的 list 与今日行情）。
 * sale_type=1 为成交明细，sale_type=2 为行情快照。
 */
function listPriceTicks(productId) {
  if (!productId) return []
  return db.query(
    'SELECT id, product_id, collection_code, price, num, total_num, tick_time, sale_type ' +
      'FROM collection_price_ticks WHERE product_id = ? ORDER BY tick_time DESC, id DESC',
    [productId]
  )
}

/** 今日行情：最高 / 最低 / 成交量由 tick 聚合（DATE(tick_time)=当天；无当日数据则取全量最新一段） */
function todayQuote(productId) {
  if (!productId) return null
  const row = db.queryOne(
    'SELECT MAX(price) AS highest, MIN(price) AS lowest, SUM(num) AS volume, COUNT(*) AS cnt ' +
      "FROM collection_price_ticks WHERE product_id = ? AND sale_type = 1 AND DATE(tick_time) = DATE('now', 'localtime')",
    [productId]
  )
  if (row && row.cnt > 0) return row
  return db.queryOne(
    'SELECT MAX(price) AS highest, MIN(price) AS lowest, SUM(num) AS volume, COUNT(*) AS cnt ' +
      'FROM collection_price_ticks WHERE product_id = ? AND sale_type = 1',
    [productId]
  )
}

/** K线快照（唯一动态路径的公开接口，参数 id 待前端确认，按 product_id 匹配） */
function findKline(productId) {
  if (!productId) {
    return db.queryOne(
      'SELECT id, product_id, product_name, series_name, price, change, increase, flux, deal_5min, deal_1h, ' +
        'deal_today, high_24h, low_24h, asks, bids, deals, snapshot_time FROM kline_snapshots ORDER BY id DESC LIMIT 1'
    )
  }
  return db.queryOne(
    'SELECT id, product_id, product_name, series_name, price, change, increase, flux, deal_5min, deal_1h, ' +
      'deal_today, high_24h, low_24h, asks, bids, deals, snapshot_time FROM kline_snapshots ' +
      'WHERE product_id = ? ORDER BY id DESC LIMIT 1',
    [productId]
  )
}

module.exports = {
  listUserCollections,
  findUserCollection,
  findUserCollectionByCode,
  listSellableCollections,
  findMyBlindBox,
  listBlindBoxRecords,
  listFlowRecords,
  listPriceTicks,
  todayQuote,
  findKline,
  UC_COLS,
}
