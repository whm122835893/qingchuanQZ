'use strict'

/**
 * 交易写操作数据访问：entrust_orders / market_listings / orders 写入。
 *
 * 与读 repository（order.repository / market.repository）分文件的原因：
 * 读路径的 SELECT 列白名单与写路径的 INSERT 列集合不同，混在一起会互相污染。
 *
 * 幂等性依赖 DB 唯一约束：
 *   entrust_orders.uk_entrust_sn (order_sn)
 *   orders.uk_orders_sn(order_sn)
 *   market_listings.uk_ml_order_sn(order_sn)
 * service 层先查后插 + 唯一约束兜底，双保险。
 */

const db = require('../db')

const now = () => Math.floor(Date.now() / 1000)

/* ────────────── entrust_orders ────────────── */

/** 按 order_sn 查（幂等键） */
function findEntrustBySn(orderSn) {
  if (!orderSn) return null
  return db.queryOne(
    'SELECT id, order_sn, order_status, user_id, product_id, goods_name, cover_image, collection_code, ' +
      'number, num, sale_number, price, total_price, pay_way, beg_time, update_time ' +
      'FROM entrust_orders WHERE order_sn = ? LIMIT 1',
    [orderSn]
  )
}

function insertEntrustOrder(data) {
  const ts = now()
  const row = {
    order_sn: data.order_sn,
    order_status: data.order_status,
    user_id: data.user_id,
    product_id: data.product_id === undefined ? null : data.product_id,
    product_id_raw: data.product_id_raw === undefined ? null : data.product_id_raw,
    goods_name: data.goods_name || '',
    cover_image: data.cover_image || '',
    collection_code: data.collection_code || '',
    number: data.number,
    num: data.number,
    sale_number: 0,
    price: data.price,
    total_price: data.total_price,
    pay_way: data.pay_way || '',
    beg_time: ts,
    update_time: ts,
    created_at: ts,
    updated_at: ts,
  }
  return insert('entrust_orders', row)
}

/* ────────────── orders ────────────── */

function findOrderBySn(orderSn) {
  if (!orderSn) return null
  return db.queryOne('SELECT * FROM orders WHERE order_sn = ? LIMIT 1', [orderSn])
}

function insertOrder(data) {
  const ts = now()
  const row = {
    order_sn: data.order_sn,
    order_status: data.order_status,
    order_type: data.order_type === undefined ? 1 : data.order_type,
    product_id: data.product_id === undefined ? null : data.product_id,
    product_id_raw: data.product_id_raw === undefined ? null : data.product_id_raw,
    product_name: data.product_name || '',
    cover_image: data.cover_image || '',
    collection_code: data.collection_code || '',
    collection_code_raw: data.collection_code_raw === undefined ? null : data.collection_code_raw,
    user_hash_text: data.user_hash_text || '',
    number: data.number,
    num: data.number,
    sale_number: data.sale_number === undefined ? 0 : data.sale_number,
    price: data.price,
    total_price: data.total_price,
    order_amount: data.total_price,
    discount_amount: '0.0000',
    pay_price: data.total_price,
    pay_way: data.pay_way || '',
    pay_name: data.pay_name || '',
    income_type: data.income_type === undefined ? null : data.income_type,
    income_type_raw: data.income_type_raw === undefined ? null : data.income_type_raw,
    goods_type: data.goods_type === undefined ? null : data.goods_type,
    remark: data.remark || '',
    card: JSON.stringify([]),
    order_time: ts,
    update_time: ts,
    created_at: ts,
    updated_at: ts,
    user_id: data.user_id === undefined ? null : data.user_id,
  }
  return insert('orders', row)
}

/* ────────────── market_listings ────────────── */

function findListingBySn(orderSn) {
  if (!orderSn) return null
  return db.queryOne('SELECT * FROM market_listings WHERE order_sn = ? LIMIT 1', [orderSn])
}

function insertListing(data) {
  const ts = now()
  const row = {
    product_id: data.product_id === undefined ? null : data.product_id,
    product_id_raw: data.product_id_raw === undefined ? null : data.product_id_raw,
    series_id: data.series_id === undefined ? null : data.series_id,
    series_id_raw: data.series_id_raw === undefined ? null : data.series_id_raw,
    collection_id: data.collection_id === undefined ? null : data.collection_id,
    sale_user_id: data.sale_user_id === undefined ? null : data.sale_user_id,
    sale_user_nickname: data.sale_user_nickname || '',
    buy_user_id: 0,
    buy_user_id_raw: '0',
    name: data.name || '',
    cover_image: data.cover_image || '',
    series_name: data.series_name || '',
    price: data.price,
    min_price: data.min_price === undefined ? data.price : data.min_price,
    status: data.status,
    goods_type: data.goods_type === undefined ? null : data.goods_type,
    income_type: data.income_type === undefined ? null : data.income_type,
    income_type_raw: data.income_type_raw === undefined ? null : data.income_type_raw,
    pay_way: data.pay_way || '',
    order_sn: data.order_sn,
    sale_time: data.sale_time === undefined ? null : data.sale_time,
    listing_time: ts,
    update_time: ts,
    rush_status: 0,
    pay_platform_service_rate: data.pay_platform_service_rate,
    platform_service_price: data.platform_service_price,
    creator_service_price: data.creator_service_price,
    real_income: data.real_income,
    buy_version: 1,
    is_deleted: 0,
    pay_text: 0,
    img: data.img || '',
    name_ext: '',
    created_at: ts,
    updated_at: ts,
  }
  return insert('market_listings', row)
}

/** 挂单状态流转（乐观锁：buy_version 递增 + status 条件） */
function markListingSold(listingId, buyerId, buyerNickname, saleTime) {
  const ts = now()
  return db.run(
    'UPDATE market_listings SET status = 2, buy_user_id = ?, buy_user_id_raw = ?, sale_user_nickname = ?, ' +
      'sale_time = ?, update_time = ?, updated_at = ?, buy_version = buy_version + 1 ' +
      'WHERE id = ? AND status = 1',
    [buyerId, String(buyerId), buyerNickname || '', saleTime, ts, ts, listingId]
  ).changes
}

/* ────────────── user_collections（开盒 / 出售占用） ────────────── */

/** 藏品实例状态流转：status 条件写在 WHERE 里做乐观锁，避免并发重复占用 */
function updateCollectionStatus(collectionId, fromStatus, toStatus) {
  return db.run(
    'UPDATE user_collections SET status = ?, updated_at = ? WHERE id = ? AND status = ?',
    [toStatus, now(), collectionId, fromStatus]
  ).changes
}

function findCollectionForUpdate(id) {
  return db.queryOne(
    'SELECT id, product_id, user_id, collection_code, status, count, is_lock, price FROM user_collections WHERE id = ?',
    [id]
  )
}

/** 盲盒行（含 blind_box_id，开盒专用） */
function findBoxForUpdate(id) {
  return db.queryOne(
    'SELECT id, product_id, user_id, collection_code, status, count, is_lock, price, blind_box_id ' +
      'FROM user_collections WHERE id = ?',
    [id]
  )
}

/**
 * 按 blind_box_id 归属查盲盒行（openBoxs 的 openid 契约）。
 *
 * 源站实证（pages-my-my popDetails.blindOpenId）：
 *   list.find(a => a.blind_box_id)?.blind_box_id || collection.blind_box_id || collection.id
 * 即 openid 传的是 blind_box_id（如 101），不是 user_collections.id（如 55012）。
 * 不要求 count>0：已耗尽的盒也要能定位，由上层 listOpenableBoxes 决定「有没有可开的」。
 */
function findBoxByBlindBoxId(userId, blindBoxId) {
  return db.queryOne(
    'SELECT id, product_id, user_id, collection_code, status, count, is_lock, price, blind_box_id ' +
      'FROM user_collections WHERE user_id = ? AND blind_box_id = ? ORDER BY id ASC LIMIT 1',
    [userId, blindBoxId]
  )
}

/**
 * 开盒：扣减盲盒余量并置为已开盒状态。
 * count > 0 是写入前提，保证不会把余量开成负数。
 */
function consumeBlindBox(boxRowId) {
  return db.run(
    'UPDATE user_collections SET count = count - 1, updated_at = ? WHERE id = ? AND count > 0',
    [now(), boxRowId]
  ).changes
}

/**
 * 同类型待开盲盒（openBoxs 批量开盒）。
 * 同胞盒按 blind_box_id 归并；count>0 才是还能开的；
 * limit 即源站弹窗提示的「一次最多打开10个盲盒」。
 */
function listOpenableBoxes(userId, blindBoxId, limit) {
  return db.query(
    'SELECT id, product_id, user_id, collection_code, status, count, is_lock, price, blind_box_id ' +
      'FROM user_collections WHERE user_id = ? AND blind_box_id = ? AND count > 0 ' +
      'ORDER BY id ASC' + db.dialect.limit(limit, 0),
    [userId, blindBoxId]
  )
}

/**
 * 一键下架（batchchangeMarketGoods）：把该用户在某藏品下的在售挂单
 * 全部置为已取消（E-LISTING-STATUS 3）。返回受影响行数。
 * 藏品无 product_id（如青川山水，products 缺 210）时无挂单可匹配，返回 0。
 */
function downSelfListingsByProduct(userId, productId) {
  if (!productId) return 0
  return db.run(
    'UPDATE market_listings SET status = 3, update_time = ? WHERE sale_user_id = ? AND product_id = ? AND status = 1',
    [now(), userId, productId]
  ).changes
}

/**
 * 一键下架的藏品侧回退：寄售中（status=2）的持有实例回到持有中（status=1）。
 *
 * 与 sell() 的 updateCollectionStatus(1→2) 互为逆操作：下架后弹窗
 * statusText 对这些实例显示「未寄售/可合成」而非「寄售中」，
 * 与源站 getDetailsRefresh 后的展示一致。
 * product_id 为空（如青川山水）时无挂单可下，也就无可回退实例，返回 0。
 */
function restoreListedCollectionsByProduct(userId, productId) {
  if (!productId) return 0
  return db.run(
    'UPDATE user_collections SET status = 1, updated_at = ? WHERE user_id = ? AND product_id = ? AND status = 2',
    [now(), userId, productId]
  ).changes
}

/** 开盒产出的藏品实例落库 */
function insertCollection(data) {
  const ts = now()
  const row = {
    product_id: data.product_id === undefined ? null : data.product_id,
    product_id_raw: data.product_id_raw === undefined ? null : data.product_id_raw,
    user_id: data.user_id === undefined ? null : data.user_id,
    collection_code: data.collection_code,
    collection_code_num: data.collection_code_num === undefined ? null : data.collection_code_num,
    serial_num: data.serial_num === undefined ? 0 : data.serial_num,
    series_total: data.series_total === undefined ? 0 : data.series_total,
    user_hash: data.user_hash || '',
    user_hash_text: data.user_hash_text || '',
    rz_code: data.rz_code === undefined ? '' : data.rz_code,
    status: data.status === undefined ? 1 : data.status,
    is_lock: 0,
    weither_regift: 0,
    weither_resale: 0,
    can_compose: 0,
    price: data.price === undefined ? '0.0000' : data.price,
    min_price: data.min_price === undefined ? '0.0000' : data.min_price,
    today_volume: 0,
    has_sold: 0,
    count: data.count === undefined ? 1 : data.count,
    flux: data.flux === undefined ? 0 : data.flux,
    total_num: data.total_num === undefined ? 0 : data.total_num,
    zuzhao_info_id: null,
    task_id: '',
    blind_box_id: data.blind_box_id === undefined ? null : data.blind_box_id,
    createtime: ts,
    created_at: ts,
    updated_at: ts,
  }
  return insert('user_collections', row)
}

/** 藏品编号是否已存在（uk_uc_code 是 (collection_code, collection_code_num) 复合唯一） */
function existsCollectionCode(code, codeNum = null) {
  if (!code) return null
  if (codeNum === null) {
    return db.queryOne(
      'SELECT id FROM user_collections WHERE collection_code = ? AND collection_code_num IS NULL LIMIT 1',
      [code]
    )
  }
  return db.queryOne('SELECT id FROM user_collections WHERE collection_code = ? AND collection_code_num = ? LIMIT 1', [
    code,
    codeNum,
  ])
}

/* ────────────── compound_results ────────────── */

function insertCompoundResult(data) {
  const ts = now()
  return insert('compound_results', {
    record_id: data.record_id === undefined ? null : data.record_id,
    result_type: data.result_type,
    name: data.name || '',
    user_collection_code: data.user_collection_code === undefined ? null : data.user_collection_code,
    total_num: data.total_num === undefined ? 0 : data.total_num,
    number: data.number === undefined ? 0 : data.number,
    crystal_type: data.crystal_type === undefined ? 0 : data.crystal_type,
    single_quantity: data.single_quantity === undefined ? 0 : data.single_quantity,
    created_at: ts,
    updated_at: ts,
  })
}

/** 通用 INSERT：列名由本文件内部固定字面量拼装，不接受外部输入 */
function insert(table, row) {
  const cols = Object.keys(row)
  const info = db.run(
    `INSERT INTO ${table} (${cols.join(', ')}) VALUES (${db.dialect.inPlaceholders(cols.length)})`,
    cols.map((c) => row[c])
  )
  return { id: db.dialect.insertAndGetId(info), changes: info.changes }
}

module.exports = {
  findEntrustBySn,
  insertEntrustOrder,
  findOrderBySn,
  insertOrder,
  findListingBySn,
  insertListing,
  markListingSold,
  updateCollectionStatus,
  findCollectionForUpdate,
  findBoxForUpdate,
  findBoxByBlindBoxId,
  consumeBlindBox,
  listOpenableBoxes,
  downSelfListingsByProduct,
  restoreListedCollectionsByProduct,
  insertCollection,
  existsCollectionCode,
  insertCompoundResult,
}