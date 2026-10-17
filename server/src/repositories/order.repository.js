'use strict'

/**
 * 订单 / 委托求购 数据访问。
 */
const db = require('../db')

const ORDER_COLS =
  'id, order_sn, order_status, order_type, product_id, product_name, cover_image, collection_code, ' +
  'collection_code_raw, user_hash_text, number, num, sale_number, price, total_price, order_amount, ' +
  'discount_amount, pay_price, pay_way, pay_name, income_type, income_type_raw, goods_type, remark, card, ' +
  'order_time, update_time, user_id'

const ENTRUST_COLS =
  'id, order_sn, order_status, user_id, product_id, goods_name, cover_image, collection_code, number, num, ' +
  'sale_number, price, total_price, pay_way, beg_time, update_time'

/** 我的买单列表（order_type=1） */
function listOrders(userId, { type = null, status = null, page }) {
  const where = ['user_id = ?']
  const params = [userId]
  where.push(type ? 'order_type = ?' : 'order_type = 1')
  if (type) params.push(type)
  if (status !== null && status !== undefined && status !== '') {
    where.push('order_status = ?')
    params.push(Number(status))
  }
  const w = ` WHERE ${where.join(' AND ')}`
  const total = db.count(`SELECT COUNT(*) AS c FROM orders${w}`, params)
  const items = db.query(
    `SELECT ${ORDER_COLS} FROM orders${w} ORDER BY order_time DESC, id DESC` +
      db.dialect.limit(page.pageSize, page.offset),
    params
  )
  return { items, total }
}

/** 订单详情。同时校验归属：非本人订单返回 null（service 层决定 403/404） */
function findOrder(userId, id) {
  if (!id) return null
  return db.queryOne(`SELECT ${ORDER_COLS} FROM orders WHERE id = ? AND user_id = ?`, [id, userId])
}

/** 银行卡卡片：order_cards 表实测 0 行，恒返回空数组 */
function listOrderCards(orderId) {
  if (!orderId) return []
  return db.query(
    'SELECT id, order_id, card_no, bank, amount FROM order_cards WHERE order_id = ? ORDER BY id ASC',
    [orderId]
  )
}

/** 我的委托 / 求购列表 */
function listEntrustOrders(userId, { status = null, page }) {
  const where = ['user_id = ?']
  const params = [userId]
  if (status !== null && status !== undefined && status !== '') {
    where.push('order_status = ?')
    params.push(Number(status))
  }
  const w = ` WHERE ${where.join(' AND ')}`
  const total = db.count(`SELECT COUNT(*) AS c FROM entrust_orders${w}`, params)
  const items = db.query(
    `SELECT ${ENTRUST_COLS} FROM entrust_orders${w} ORDER BY beg_time DESC, id DESC` +
      db.dialect.limit(page.pageSize, page.offset),
    params
  )
  return { items, total }
}

function findEntrustOrder(userId, id) {
  if (!id) return null
  return db.queryOne(`SELECT ${ENTRUST_COLS} FROM entrust_orders WHERE id = ? AND user_id = ?`, [id, userId])
}

module.exports = {
  listOrders,
  findOrder,
  listOrderCards,
  listEntrustOrders,
  findEntrustOrder,
}
