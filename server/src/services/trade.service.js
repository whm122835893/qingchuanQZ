'use strict'

/**
 * 交易域 service：买单列表/详情、我的寄售、委托求购、可售藏品、我的藏品、流转记录。
 */
const env = require('../config/env')
const orderRepo = require('../repositories/order.repository')
const marketRepo = require('../repositories/market.repository')
const collectionRepo = require('../repositories/collection.repository')
const productRepo = require('../repositories/product.repository')
const { pagination, pageMeta, optionalEnum } = require('../utils/validate')
const { ForbiddenError } = require('../errors')
const { money2 } = require('../utils/pick')
const { publisherBrief } = require('./product-shape')

/** 买单列表（orderList，style B）。order_status 枚举见 DATABASE.md §4 */
async function orderList(userId, params) {
  const page = pagination(params, env)
  const { items, total } = await orderRepo.listOrders(userId, {
    type: params.type || null,
    status: optionalEnum(params.status, [0, 1, 2, 3, 4]),
    page,
  })
  const meta = pageMeta(total, page.page, page.pageSize)
  return { total, page: page.page, pageSize: page.pageSize, lastPage: meta.lastPage, items: items.map(orderRow) }
}

function orderRow(r) {
  return {
    id: r.id,
    order_sn: r.order_sn,
    order_status: r.order_status,
    goods_id: r.product_id,
    goods_name: r.product_name,
    listimg: r.cover_image,
    number: r.number === null ? r.num : r.number,
    sale_number: r.sale_number === null ? 0 : r.sale_number,
    price: money2(r.price),
    total_price: money2(r.total_price),
    income_type: r.income_type,
    createtime: r.order_time,
    updatetime: r.update_time,
    collection_code: r.collection_code,
    user_hash_text: r.user_hash_text || '',
  }
}

/** 买单详情（saleMarketOrderDetail / begBuyOrderInfo，style D） */
async function orderDetail(userId, id) {
  const order = await orderRepo.findOrder(userId, id)
  if (!order) return null
  const cards = await orderRepo.listOrderCards(order.id)
  return {
    id: order.id,
    order_sn: order.order_sn,
    order_status: order.order_status,
    goods_id: order.product_id,
    goods_name: order.product_name,
    listimg: order.cover_image,
    collection_code: order.collection_code,
    user_hash_text: order.user_hash_text || '',
    pay_way: order.pay_way,
    pay_name: order.pay_name || '',
    number: order.number === null ? order.num : order.number,
    num: order.num === null ? order.number : order.num,
    sale_number: order.sale_number === null ? 0 : order.sale_number,
    price: money2(order.price),
    total_price: money2(order.total_price),
    order_amount: money2(order.order_amount),
    discount_amount: money2(order.discount_amount),
    pay_price: money2(order.pay_price),
    remark: order.remark || '',
    createtime: order.order_time,
    updatetime: order.update_time,
    card: cards.map((c) => ({ id: c.id, card_no: c.card_no, bank: c.bank, amount: money2(c.amount) })),
    goods_type: order.goods_type,
  }
}

/**
 * 我的寄售（myConsignment，style C）。
 *
 * 数据源为 market_listings（挂单人 = 当前用户），不是 orders：
 * orders 表只有 order_type=1（买入）4 行，order_type=2 为 0 行，
 * 而 mock 的三条寄售记录（id 7001-7003）与 market_listings 完全对应。
 */
async function myConsignment(userId, params) {
  const page = pagination(params, env)
  const { items, total } = await marketRepo.listListingsByUser(userId, page)
  return {
    total,
    page: page.page,
    pageSize: page.pageSize,
    lastPage: pageMeta(total, page.page, page.pageSize).lastPage,
    items: items.map((r) => ({
      id: r.id,
      goods_name: r.name,
      listimg: r.cover_image,
      collection_code: r.collection_code,
      status: r.status,
      price: money2(r.price),
      pay_way: r.pay_way || '',
      createtime: r.listing_time,
      updatetime: r.update_time,
    })),
  }
}

/** 委托求购列表（begBuyOrderList，style C）。order_status：2 委托中 / 3 已成交 / 4 已取消 */
async function begBuyOrderList(userId, params) {
  const page = pagination(params, env)
  const { items, total } = await orderRepo.listEntrustOrders(userId, {
    status: optionalEnum(params.status, [2, 3, 4]),
    page,
  })
  return {
    total,
    page: page.page,
    pageSize: page.pageSize,
    lastPage: pageMeta(total, page.page, page.pageSize).lastPage,
    items: items.map((r) => ({
      id: r.id,
      order_sn: r.order_sn,
      order_status: r.order_status,
      goods_name: r.goods_name,
      listimg: r.cover_image,
      collection_code: r.collection_code,
      number: r.number === null ? r.num : r.number,
      num: r.num === null ? r.number : r.num,
      sale_number: r.sale_number === null ? 0 : r.sale_number,
      price: money2(r.price),
      total_price: money2(r.total_price),
      pay_way: r.pay_way || '',
      createtime: r.beg_time,
      updatetime: r.update_time,
    })),
  }
}

/** 可售藏品（getSellCollectionInfo，style D：user_collection_list） */
async function sellCollectionInfo(userId) {
  const rows = await collectionRepo.listSellableCollections(userId)
  // pay_way 需借 market_listings 推导，逐条 await 串行会退化成 N+1，故一次性并发
  const items = await Promise.all(
    rows.map(async (r) => ({
      id: r.product_id === null ? r.id : r.product_id,
      user_collection_id: r.id,
      // 优先 user_collections 上源站直取的 name（SQL 层已 COALESCE），
      // products.name 仅兜底：源站列表实为「赛博铁牛/青川山水…」而非「赛博铁牛盲盒」
      name: r.name,
      collection_code: r.collection_code,
      total_num: r.total_num,
      count: r.count,
      price: money2(r.price),
      // user_collections 无支付方式列，取该系列最新挂单的 pay_way；无挂单则为 null
      pay_way: await payWayOf(r.product_id),
      main_image: r.main_image || r.listimg || r.p_main_image || r.p_listimg,
    }))
  )
  return { user_collection_list: items }
}

/** 我的藏品列表（userCollectionList，style C + 页码变体） */
async function userCollectionList(userId, params) {
  const page = pagination(params, env)
  const { items, total } = await collectionRepo.listUserCollections(userId, {
    keyword: params.keyword || params.key || null,
    page,
  })
  return {
    total,
    page: page.page,
    pageSize: page.pageSize,
    lastPage: pageMeta(total, page.page, page.pageSize).lastPage,
    items: items.map(myCollectionRow),
  }
}

/** 支付方式：借 market_listings 最新挂单的 pay_way（E-PAY-WAY：huifu / yibao） */
async function payWayOf(productId) {
  const listing = await marketLatest(productId)
  return listing && listing.pay_way ? listing.pay_way : null
}

async function marketLatest(productId) {
  if (!productId) return null
  return await marketRepo.latestListingPrice(productId)
}

/**
 * 源站 userCollectionList 行字段（逐字对齐 myCollectionList.json）：
 * id=藏品记录 id，collection_id=产品 id，另含 has_sold / count / total_num / flux / createtime。
 */
function myCollectionRow(r) {
  return {
    id: r.id,
    collection_id: r.product_id,
    collection_code: r.collection_code,
    name: r.name,
    listimg: r.listimg,
    main_image: r.main_image,
    status: r.status === null ? 0 : r.status,
    has_sold: r.has_sold === null ? 0 : r.has_sold,
    price: money2(r.price),
    count: r.count === null ? 0 : r.count,
    total_num: r.total_num === null ? 0 : r.total_num,
    flux: r.flux === null ? 0 : r.flux,
    createtime: r.createtime,
  }
}

/**
 * 我的藏品详情（collectionInfo，style D）。
 * 归属校验：他人在 uid 非空且与藏品持有者不一致时按 403 处理，不泄露他人藏品。
 */
async function collectionInfo(id, uid) {
  const row = await collectionRepo.findUserCollection(id)
  if (!row) return null
  if (uid !== null && uid !== undefined && row.user_id !== uid) {
    throw new ForbiddenError('无权查看该藏品')
  }
  const product = row.product_id ? await productRepo.findProduct(row.product_id) : null
  const series = product && product.series_id ? await productRepo.findSeries(product.series_id) : null
  // 概率池（盲盒详情 w-product-box 的 collectionlist）：仅盲盒商品(goods_type=1)有池数据，
  // 非盲盒按空数组返回，前端 v-show collectionlist.length 自然隐藏该盒。
  const poolItems =
    product && product.goods_type === 1 ? await productRepo.listPoolItems(product.id) : []
  // 源站 getUserCollectionDetails 的 tech 第三行「认证时间」取 product.createtime；
  // 本地 products 表无该源列（仅 created_at 灌库审计列），按实例登记时间取别名，
  // 保持前端字段路径 product.createtime 与源站 render 一致。
  const createtime = row.createtime === null || row.createtime === undefined ? 0 : row.createtime
  // 取消寄售（changeMarketGoods）入参为 market_goods.id：寄售中(2)的实例必有在售挂单
  const listing = row.status === 2 ? await marketRepo.findListingByCollection(row.id) : null
  return {
    id: row.id,
    collection_code: row.collection_code,
    serial_num: row.serial_num === null ? 0 : row.serial_num,
    series_total: row.series_total === null ? 0 : row.series_total,
    user_hash: row.user_hash || '',
    user_hash_text: row.user_hash_text || '',
    rz_code: row.rz_code === null ? '' : String(row.rz_code),
    createtime,
    status: row.status,
    is_lock: row.is_lock === null ? 0 : row.is_lock,
    weither_regift: row.weither_regift === null ? 0 : row.weither_regift,
    weither_resale: row.weither_resale === null ? 0 : row.weither_resale,
    can_compose: row.can_compose === null ? 0 : row.can_compose,
    price: money2(row.price),
    min_price: money2(row.min_price),
    today_volume: row.today_volume === null ? 0 : row.today_volume,
    market_goods: listing
      ? {
          id: listing.id,
          price: money2(listing.price),
          status: listing.status,
          order_sn: listing.order_sn || '',
        }
      : null,
    product: product
      ? {
          id: product.id,
          name: product.name,
          goods_type: product.goods_type,
          listimg: product.listimg,
          main_image: product.main_image,
          total_num: product.total_num,
          flux: product.flux === null ? 0 : product.flux,
          sale_total_num: product.sale_total_num === null ? 0 : product.sale_total_num,
          is_lock: product.is_lock === null ? 0 : product.is_lock,
          weither_regift: product.weither_regift === null ? 0 : product.weither_regift,
          weither_resale: product.weither_resale === null ? 0 : product.weither_resale,
          can_compose: product.can_compose === null ? 0 : product.can_compose,
          createtime,
          // 源站 render 读 product.introduce_image（u-parse 富文本）；本地 products 表该列全空，
          // 真实 HTML 落在 introduce 列——按 createtime 同款别名模式暴露，保持前端字段路径一致。
          introduce_image: product.introduce || '',
          collectionlist: poolItems.map((p) => ({
            id: p.id,
            name: p.name,
            probability: p.probability,
            show_total_num: p.show_total_num === null ? 0 : p.show_total_num,
            listimg: p.listimg,
            rarity_icon: p.rarity_icon,
          })),
          series: series ? { id: series.id, name: series.name } : null,
          publisher: publisherBrief(product),
        }
      : null,
  }
}

/** 藏品流转记录（flowDoc，style A）。createtime 源站是字符串化的 unix 秒 */
async function flowDoc(userId, params) {
  const page = pagination(params, env)
  const { items } = await collectionRepo.listFlowRecords(userId, page)
  return items.map((r) => ({
    id: r.id,
    nickname: r.nickname || '',
    createtime: String(r.flow_time),
    source_type: r.source_type,
    collection_name: productNameOf(r.collection_code),
    collection_code: r.collection_code,
  }))
}

function productNameOf() {
  // 库中 collection_flow_records 无产品名列，名称无法定位到 products——按约定返回空串而非编造
  return ''
}

module.exports = {
  orderList,
  orderDetail,
  myConsignment,
  begBuyOrderList,
  sellCollectionInfo,
  userCollectionList,
  collectionInfo,
  flowDoc,
}