'use strict'

/**
 * 藏品与系列域数据访问：series / products / product_pool_items / product_sale_rules。
 * 市场行情与挂单在 market.repository.js。
 */
const db = require('../db')

/* ─────────────── series ─────────────── */

const SERIES_COLS =
  'id, name, is_def, flag, pattern, category_group, resale_put_start_time, resale_put_end_time, resale_buy_start_time, resale_buy_end_time'

/**
 * 系列列表。`type` / `pid` 均走query string（前端 api 对象用 param）。
 *
 * 语义以源站两份快照为准（series 表已有 pid 列，构成明确的父子关系）：
 *   - `type=10`（不带 pid） → 顶级系列：`WHERE pid IS NULL AND pattern = 1`
 *     实测得series-10.json = [10「2026」, 11「光」]
 *   - `type=10&pid=10`     → 该系列的子系列：`WHERE pid = ?`
 *     实测得 series-10-pid.json = [15「赛博」]，父系列 10 自身必须被排除
 *   - 都不带 → 全部系列（保持原行为）
 *
 * `type` 实测恒为 10，但它是源站真实存在的入参，未来可能扩展，故保留其参与判断：
 * `10` → pattern=1 的系列组；其他非空 type → 沿用 pattern=1 的既有语义。
 */
function listSeries(type = null, pid = null) {
  const hasType = type !== null && type !== undefined && String(type) !== ''
  if (pid !== null && pid !== undefined && String(pid) !== '') {
    // 有 pid → 取该系列的子系列。注意是 pid 列匹配，不是把 pid 当主键。
    return db.query(
      `SELECT ${SERIES_COLS} FROM series WHERE pid = ? ORDER BY id ASC`,
      [pid]
    )
  }
  if (hasType) {
    // 无 pid → 只返回顶级系列（pid IS NULL），避免把子系列一并带出
    return db.query(
      `SELECT ${SERIES_COLS} FROM series WHERE pid IS NULL AND pattern = 1 ORDER BY id ASC`
    )
  }
  return db.query(`SELECT ${SERIES_COLS} FROM series ORDER BY id ASC`)
}

function findSeries(id) {
  return db.queryOne(`SELECT ${SERIES_COLS} FROM series WHERE id = ?`, [id])
}

/* ─────────────── products ─────────────── */

const PRODUCT_COLS =
  'id, series_id, name, goods_type, listimg, main_image, introduce_image, introduce, total_num, flux, sale_total_num, ' +
  'price, batch, collection_level, issuer_id, creator_id, publisher_name, publisher_logo, compound_num, release_time, ' +
  'types, url_3d_type, url_3d, purchase_information, is_img_diff, is_lock, weither_regift, weither_resale, can_compose, is_like, is_sub'

function findProduct(id) {
  if (!id) return null
  return db.queryOne(`SELECT ${PRODUCT_COLS} FROM products WHERE id = ?`, [id])
}

function findProductByRawId(rawId) {
  if (!rawId) return null
  return db.queryOne(`SELECT ${PRODUCT_COLS} FROM products WHERE series_id_raw = ? LIMIT 1`, [rawId])
}

/** 概率池（盲盒） */
function listPoolItems(productId) {
  if (!productId) return []
  return db.query(
    'SELECT id, product_id, name, probability, show_total_num, listimg, rarity_icon, is_out ' +
      'FROM product_pool_items WHERE product_id = ? ORDER BY id ASC',
    [productId]
  )
}

function findSaleRule(productId) {
  if (!productId) return null
  return db.queryOne(
    'SELECT id, product_id, name, price, total_num, sale_num, rule_updated, rules ' +
      'FROM product_sale_rules WHERE product_id = ? LIMIT 1',
    [productId]
  )
}

/** 盲盒商品：goods_type=1（E-GOODS-TYPE-COLLECTION，勿与 shop 的枚举混用） */
function listBlindBoxProducts() {
  return db.query(
    'SELECT id, name, listimg, main_image, total_num, price, sale_total_num FROM products ' +
      'WHERE goods_type = 1 ORDER BY id ASC'
  )
}

/** 某系列下的首个产品（seriesGoodsList 的 product 段回落用） */
function findProductBySeriesId(seriesId) {
  if (!seriesId) return null
  return db.queryOne(`SELECT ${PRODUCT_COLS} FROM products WHERE series_id = ? ORDER BY id ASC LIMIT 1`, [
    seriesId,
  ])
}

/** 存在申购规则的产品 id（sale_status 派生用） */
function listSaleRuleProductIds() {
  return db.query('SELECT DISTINCT product_id FROM product_sale_rules WHERE product_id IS NOT NULL')
}

module.exports = {
  listSaleRuleProductIds,
  findProductBySeriesId,
  listBlindBoxProducts,
  listSeries,
  findSeries,
  findProduct,
  findProductByRawId,
  listPoolItems,
  findSaleRule,
}
