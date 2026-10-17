'use strict'

/**
 * 积分商城域数据访问：shop_goods / user_shop_exchanges / user_crystal_logs。
 * goods_type 语义见 DATABASE.md §4：1=数字藏品 / 2=盲盒 / 3=合集（E-GOODS-TYPE-SHOP）。
 */
const db = require('../db')

const SHOP_COLS =
  'id, name, list_image, crystal_price, exchange_status, total_num, exchange_num, goods_type, end_time, ' +
  'max_count, is_sub, count_down, shop_type, details, crystal_type, pool_items'

/** 商城列表（crystalList） */
function listShopGoods() {
  return db.query(`SELECT ${SHOP_COLS} FROM shop_goods ORDER BY id ASC`)
}

/** 单个商品；id 缺省取首行（前端 goodsDetail 未必传 id） */
function findShopGoods(id) {
  if (!id) return db.queryOne(`SELECT ${SHOP_COLS} FROM shop_goods ORDER BY id ASC LIMIT 1`)
  return db.queryOne(`SELECT ${SHOP_COLS} FROM shop_goods WHERE id = ?`, [id])
}

/** 按 goods_type 取首个（boxDetail / collectionDetail / crystalDetail 均按 type 分流） */
function findShopGoodsByType(goodsType) {
  if (!goodsType) return null
  return db.queryOne(
    `SELECT ${SHOP_COLS} FROM shop_goods WHERE goods_type = ? ORDER BY id ASC LIMIT 1`,
    [goodsType]
  )
}

/** 我的兑换记录 */
function listExchanges(userId, page) {
  const w = ' WHERE user_id = ?'
  const params = [userId]
  const total = db.count(`SELECT COUNT(*) AS c FROM user_shop_exchanges${w}`, params)
  const items = db.query(
    'SELECT id, user_id, order_id, goods_name, list_image, crystal_number, crystal_type, create_time ' +
      `FROM user_shop_exchanges${w} ORDER BY create_time DESC, id DESC` +
      db.dialect.limit(page.pageSize, page.offset),
    params
  )
  return { items, total }
}

/** 积分流水 */
function listCrystalLogs(userId, model, page) {
  const where = ['user_id = ?']
  const params = [userId]
  if (model) {
    where.push('model = ?')
    params.push(Number(model))
  }
  const w = ` WHERE ${where.join(' AND ')}`
  const total = db.count(`SELECT COUNT(*) AS c FROM user_crystal_logs${w}`, params)
  const items = db.query(
    'SELECT id, user_id, model, memo, crystal, log_time FROM user_crystal_logs' +
      `${w} ORDER BY log_time DESC, id DESC` + db.dialect.limit(page.pageSize, page.offset),
    params
  )
  return { items, total }
}

module.exports = { listShopGoods, findShopGoods, findShopGoodsByType, listExchanges, listCrystalLogs }