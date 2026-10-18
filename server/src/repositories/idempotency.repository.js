'use strict'

/**
 * 业务级幂等查重数据访问。
 *
 * 为什么单独成文件：幂等查重是**跨 6 个写接口的横切关注点**，
 * 混入 trade-write.repository 会把该文件推过 300 行门禁，
 * 且幂等查询的口径（时间窗、终态判定）需要集中一处便于统一审计。
 *
 * 口径铁律（三条，缺一不可）：
 *  1. 查重必须在**调用方的事务内**执行——本文件所有函数都不开事务，
 *     事务边界由 service 决定。事务外查重 = 并发下仍可插两行。
 *  2. 必须带「终态」条件（order_status=2 / status=1），否则已成交的历史单
 *     会把新提交永久挡住。
 *  3. 必须带时间戳下界，否则用户隔天改价重试会被历史单误拦。
 *
 * 金额列price 为 SQLite NUMERIC 亲和类型，与十进制字符串比较时会转数值比较，
 * 故 '88.0000' 与 88 等值（已实测验证，见 write_checks 金额用例）。
 */

const db = require('../db')

/**
 * 在途同参数求购单（幂等键：user_id + product_id + price + number）。
 * @param {number} userId
 * @param {number} productId
 * @param {string} price 十进制字符串（定点，非float）
 * @param {number} number
 * @param {number} sinceTs 时间窗下界（unix 秒），排除窗口外的历史单
 */
function findInFlightEntrust(userId, productId, price, number, sinceTs) {
  if (!userId || !productId || !price || !number) return null
  return db.queryOne(
    'SELECT id, order_sn, order_status, user_id, product_id, goods_name, cover_image, collection_code, ' +
      'number, num, sale_number, price, total_price, pay_way, beg_time, update_time ' +
      'FROM entrust_orders ' +
      'WHERE user_id = ? AND product_id = ? AND price = ? AND number = ? ' +
      'AND order_status = ? AND beg_time >= ? ' +
      'ORDER BY id DESC LIMIT 1',
    [userId, productId, price, number, 2, sinceTs]
  )
}

/**
 * 该藏品是否已有在寄售中的挂单（幂等键：user_id + collection_id）。
 *
 * 无时间窗：只要挂单还在寄售中（status=1），该藏品就处于「已被占用」状态，
 * 重复提交必然是重试而非新意图。加时间窗反而会漏——
 * 用户手动下架后想重新挂单时，旧挂单可能已终结，键自然失效，无需时间窗兜。
 */
function findActiveListingByCollection(saleUserId, collectionId) {
  if (!saleUserId || !collectionId) return null
  return db.queryOne(
    'SELECT * FROM market_listings WHERE sale_user_id = ? AND collection_id = ? AND status = ? LIMIT 1',
    [saleUserId, collectionId, 1]
  )
}

/**
 * 该盲盒最近一次开盒的产出藏品（幂等键：user_id + blind_box_id）。
 *
 * 产出行与盲盒行本身同属 user_collections 且 blind_box_id 相同，
 * 故必须用 id <> ? 排除盲盒行本身，否则会把「未开的盒子」当成产出返回。
 *
 * 关联 products 取展示字段：产出行只落了 product_id，
 * 响应需要的 name / listimg / main_image 需回查。
 *
 * 已知局限（非缺陷，已核实库结构）：产出行落的是**盲盒产品 id**，
 * 池内各变体共用同一 product_id，故「抽中哪一款」未落库。
 * 幂等重放返回的是产品级名称（如「赛博铁牛盲盒」），
 * 而首次开盒返回池级名称（如「赛博铁牛」），二者可能不同。
 * 彻底解决需给user_collections 增加池条目 id 列（属schema 变更，超出本轮范围）。
 */
function findLatestOpenedCollections(userId, blindBoxId, boxRowId, sinceTs) {
  if (!userId || !blindBoxId) return []
  // 只回查 products，不 join 概率池：
  // 产出行落的是盲盒产品 id（池内各变体共用同一 product_id），
  // 池条目身份未落库，故无法还原「抽中哪一款」。
  // 用 listimg 反查池条目是错的：多款可共用同一图（库中 5101 与产品 226 同图），
  // 无论抽中哪款都会匹配到同一行，返回错误变体名——宁可返回产品级信息，不伪造。
  return db.query(
    'SELECT c.id, c.product_id, c.collection_code, ' +
      'p.name, p.listimg, p.main_image ' +
      'FROM user_collections c LEFT JOIN products p ON p.id = c.product_id ' +
      'WHERE c.user_id = ? AND c.blind_box_id = ? AND c.id <> ? AND c.createtime >= ? ' +
      'ORDER BY c.id DESC LIMIT 5',
    [userId, blindBoxId, boxRowId, sinceTs]
  )
}

module.exports = {
  findInFlightEntrust,
  findActiveListingByCollection,
  findLatestOpenedCollections,
}