'use strict'

/**
 * 我的藏品 / 流转 / 成交价 tick 数据访问。
 */
const db = require('../db')

/**
 * 藏品名/图：优先取 user_collections 上源站直取的列，JOIN 出的 products 值仅作兜底。
 * 依据：源站 myCollectionList 8 条为「赛博铁牛/青川山水/赛博之神/赛博黑猫/天狗/赛博猫」，
 * 而 products.name 恒为「赛博铁牛盲盒」——此前只 JOIN products，导致列表名字全错。
 */
const UC_NAME_COLS =
  'COALESCE(NULLIF(c.name, \'\'), p.name) AS name, ' +
  'COALESCE(NULLIF(c.listimg, \'\'), p.listimg) AS listimg, ' +
  'COALESCE(NULLIF(c.main_image, \'\'), p.main_image) AS main_image, '

const UC_COLS =
  'id, product_id, user_id, collection_code, collection_code_num, serial_num, series_total, user_hash, ' +
  'user_hash_text, rz_code, status, is_lock, weither_regift, weither_resale, can_compose, price, min_price, ' +
  'today_volume, has_sold, count, flux, total_num, zuzhao_info_id, task_id, blind_box_id, createtime'

const UC_WITH_PRODUCT =
  'SELECT c.id, c.product_id, c.user_id, c.collection_code, c.collection_code_num, c.serial_num, c.series_total, ' +
  'c.user_hash, c.user_hash_text, c.rz_code, c.status, c.is_lock, c.weither_regift, c.weither_resale, ' +
  'c.can_compose, c.price, c.min_price, c.today_volume, c.has_sold, c.count, c.flux, c.total_num, ' +
  'c.zuzhao_info_id, c.task_id, c.blind_box_id, c.createtime, ' +
  UC_NAME_COLS +
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
/**
 * 开盒记录（openlog）。
 *
 * 【数据源修正】改读 B5b user_blind_box_records（开盒流水表），不再从
 * user_collections 里挑 blind_box_id 非空的行。
 * 依据：源站 blindBoxOpenRecord.json 实测 5 条，而 user_collections 中
 * blind_box_id 非空的只有 1 行——旧实现恒返回 1 条，与源站不符。
 * 开盒记录是历史流水事件，与「当前持有状态」语义不同，不可互相派生。
 */
function listBlindBoxRecords(userId, page) {
  const w = userId ? ' WHERE r.user_id = ?' : ''
  const params = userId ? [userId] : []
  const total = db.count(`SELECT COUNT(*) AS c FROM user_blind_box_records r${w}`, params)
  const items = db.query(
    `SELECT r.id, r.listimg, r.name, r.collection_code, r.rarity_icon,
            r.box_name, r.createtime, p.name AS p_name
     FROM user_blind_box_records r
     LEFT JOIN products p ON p.id = r.product_id${w}
     ORDER BY r.createtime DESC, r.id DESC` + db.dialect.limit(page.pageSize, page.offset),
    params
  )
  return { items, total }
}

/**
 * 我的页藏品聚合列表（antMycollection）。
 *
 * 源站契约（pages-my-my.0e9b7c94.js 实测）：
 *   - tab 与 types 映射：藏品=2 / 盲盒=1 / 已售=3（我的藏品页另有 已赠送=4）；
 *     绘画/卡牌/建模/卡券/元素 5 个 tab types=null，源站永不发请求。
 *   - 响应 data[] 每项 = {collection:{id,name,listimg,main_image}, num, min_price,
 *     floor_price, price, change_rate, market_fluctuate_new}，即**按藏品分组**的持有汇总；
 *     点击项进 getDetail 看单实例明细（collection.id 作为 collection_id 传参）。 *   - types=1/2 额外带 current_count（当前持有总数）/ current_consignment（寄售中数）。
 *
 * 类型过滤语义（源站账号已清空无从实测，按 E-COLLECTION-STATUS 与本项目
 * 既有 MyCollection.vue 口径裁决并在此锁定）：
 *   - types=2 藏品：status IN (1,2) 且 has_sold=0 且 count>0 —— 当前仍持有
 *     （含寄售中；源站弹窗 statusText 对 types=2 的实例会显示「寄售中/未寄售」，
 *     证明寄售中藏品属于藏品 tab）
 *   - types=1 盲盒：blind_box_id 非空（盲盒开出）且 count>0
 *   - types=3 已售：has_sold = 1（myCollectionList 独有字段）
 *   - types=4 已赠送：has_sold = 2
 *   count>0 与 name 非空两个条件同时兜底：灌库时 marketDetail/blindBoxMyBox 等
 *   快照会产生 count=0、name='' 的关联行（如 55012/5712041），不能当持有展示。
 *
 * 【has_sold 裁决】has_sold 是服务端过滤键（前端 bundle 零引用），观测值
 * 0/1/2 且仅 6003(青川山水)=1、6006(天狗)=2 两行非零。「已售数量」的读法
 * 在 6006 上自爆（count=1 却已售 2），故按枚举裁决：1=已售出 / 2=已赠送，
 * 分别对应 myCollection 页的 已售出(types=3) / 已赠送(types=4) 两个 tab。
 * 由此 types=2 排除 has_sold≠0：已售出/已赠送的藏品不再是「当前持有」，
 * 且四个 tab 互斥不双计（青川山水在藏品 tab 只计 6008 的 2 个，已售 tab
 * 计 6003 的 8 个）。源站服务端过滤 SQL 不可见，此裁决已登记
 * docs/decisions/OPEN-DECISIONS.md。
 *
 * 分组键用 name 而非 product_id：源站 myCollectionList 的 collection_id 才是
 * product_id，且 products 缺 210（青川山水/天狗所属发行体）导致 3 行 product_id
 * 为 NULL——按 product_id 分组会把同一藏品拆散。name 是源站直取列，最贴近
 * 「一个藏品」的展示语义。
 */
function listMyCollectionGroups(userId, { types, keyword = null, page }) {
  const where = ['c.user_id = ?']
  const params = [userId]
  if (types === 2) {
    // 藏品 = 当前仍持有（含寄售中）；E-COLLECTION-STATUS 1=持有中 2=寄售中；
    // has_sold≠0（已售出/已赠送）不再是持有，排除以保证 tab 互斥不双计
    where.push('c.status IN (1, 2)', 'c.has_sold = 0')
  } else if (types === 1) {
    where.push('c.blind_box_id IS NOT NULL')
  } else if (types === 3) {
    where.push('c.has_sold = 1')
  } else if (types === 4) {
    where.push('c.has_sold = 2')
  } else {
    // 未识别 types：返回空而非全量（源站 null types 的 tab 根本不发请求）
    where.push('1 = 0')
  }
  // 持有汇总只统计真实持有：count>0 且藏品名非空
  where.push('c.count > 0')
  where.push("COALESCE(c.name, '') <> ''")
  if (keyword) {
    where.push('(c.name LIKE ? OR c.collection_code LIKE ?)')
    params.push(`%${keyword}%`, `%${keyword}%`)
  }
  const w = ` WHERE ${where.join(' AND ')}`

  // 先分组计数（分页作用于分组），再取组内汇总。
  // 注意：pms 按 product_id 可能有多日快照行，直接左连会把 user_collections
  // 行**扇出**（SUM(count) 翻倍）——故 pms 先按 product_id 聚合成派生表再连。
  const total = db.count(
    `SELECT COUNT(*) AS c FROM (SELECT 1 FROM user_collections c${w} GROUP BY c.name)`,
    params
  )
  const items = db.query(
    `SELECT
       c.name AS name,
       MAX(c.listimg) AS listimg,
       MAX(c.main_image) AS main_image,
       SUM(c.count) AS num,
       MAX(c.price) AS price,
       NULLIF(MAX(c.min_price), 0) AS min_price,
       COALESCE(MAX(c.product_id), MAX(c.id)) AS collection_id,
       MAX(pms.min_price) AS floor_price,
       MAX(pms.market_fluctuate) AS change_rate,
       MAX(pms.market_fluctuate_new) AS market_fluctuate_new
     FROM user_collections c
     LEFT JOIN (
       SELECT product_id, MAX(min_price) AS min_price, MAX(market_fluctuate) AS market_fluctuate,
              MAX(market_fluctuate_new) AS market_fluctuate_new
       FROM product_market_stats GROUP BY product_id
     ) pms ON pms.product_id = c.product_id${w}
     GROUP BY c.name
     ORDER BY MIN(c.id) ASC` + db.dialect.limit(page.pageSize, page.offset),
    params
  )
  return { items, total }
}

/**
 * 当前持有总数 / 寄售中数（antMycollection 的 current_count / current_consignment）。
 *
 * 口径与 listMyCollectionGroups 的 types=2 对齐（E-COLLECTION-STATUS）：
 *   current_count = status IN (1,2) 且 has_sold=0 的 SUM(count)（持有中 + 寄售中）
 *   current_consignment = status = 2 且 has_sold=0 的 SUM(count)（寄售中）
 * count>0 兜底与列表一致，排除灌库 count=0 的行。
 */
function countHoldings(userId) {
  const row = db.queryOne(
    `SELECT
       COALESCE(SUM(CASE WHEN c.status IN (1, 2) AND c.has_sold = 0 THEN c.count ELSE 0 END), 0) AS current_count,
       COALESCE(SUM(CASE WHEN c.status = 2 AND c.has_sold = 0 THEN c.count ELSE 0 END), 0) AS current_consignment
     FROM user_collections c WHERE c.user_id = ? AND c.count > 0`,
    [userId]
  )
  return {
    current_count: Number(row && row.current_count) || 0,
    current_consignment: Number(row && row.current_consignment) || 0,
  }
}

/**
 * 持有详情弹窗（getDetail）的锚点解析。
 *
 * collection_id 语义有二（源站同理）：my 页列表项传的是**藏品分组 id**
 * （= product_id，如 226），而盲盒/无 product 的行只能退到 user_collections.id。
 * 故先按 product_id 查，miss 再按 c.id 查；两条都 miss 返回 null（不编造）。
 */
function findCollectionAnchor(userId, collectionId) {
  if (!collectionId) return null
  return (
    db.queryOne(
      `${UC_WITH_PRODUCT} WHERE c.user_id = ? AND c.product_id = ? ORDER BY c.id ASC LIMIT 1`,
      [userId, collectionId]
    ) ||
    db.queryOne(`${UC_WITH_PRODUCT} WHERE c.user_id = ? AND c.id = ?`, [userId, collectionId]) ||
    null
  )
}

/**
 * 持有明细实例列表（getDetail 的 list）。
 * 与外层分组同口径：按 name 归属同组 + types 过滤 + count>0。
 * per_page 源站固定 1000（实测 getDetail 响应），此处沿用调用方传入的 pageSize。
 */
function listCollectionInstances(userId, anchor, { types, page }) {
  if (!anchor) return { items: [], total: 0 }
  const where = ['c.user_id = ?', 'c.name = ?']
  const params = [userId, anchor.name || '']
  // 与外层分组同口径：types=2 含寄售中、排除已售出/已赠送；types=3 已售用 has_sold=1
  if (types === 2) where.push('c.status IN (1, 2)', 'c.has_sold = 0')
  else if (types === 1) where.push('c.blind_box_id IS NOT NULL')
  else if (types === 3) where.push('c.has_sold = 1')
  else if (types === 4) where.push('c.has_sold = 2')
  where.push('c.count > 0')
  const w = ` WHERE ${where.join(' AND ')}`
  const total = db.count(`SELECT COUNT(*) AS c FROM user_collections c${w}`, params)
  const items = db.query(
    `SELECT c.id, c.collection_code, c.status, c.is_lock, c.can_compose, c.price,
            c.blind_box_id, c.createtime, ${UC_NAME_COLS} p.name AS p_name
     FROM user_collections c LEFT JOIN products p ON p.id = c.product_id${w}
     ORDER BY c.id ASC` + db.dialect.limit(page.pageSize, page.offset),
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
  listMyCollectionGroups,
  countHoldings,
  findCollectionAnchor,
  listCollectionInstances,
  listFlowRecords,
  listPriceTicks,
  todayQuote,
  findKline,
  UC_COLS,
}
