'use strict'

/**
 * 交易写操作的响应组装（从 trade-write.service 拆出，控文件长度）。
 *
 * 单独成文件的原因：组装逻辑（尤其分账四字段的出参）是资金相关代码，
 * 与业务编排分离后便于单独核对「落库值 = 出参值」这条不变式。
 *
 * 金额一律经 decimal 定点格式化为两位小数字符串，禁止 float 与裸toFixed。
 */

const decimal = require('../utils/decimal')

/** E-PAY-WAY 实测唯一值 → 支付渠道全称（orderDetail.pay_name = 「汇付天下」） */
const PAY_NAME = '汇付天下'

/** entrust_orders 行 → 响应。字段名对齐 orderDetail.json / entrustList.json */
function entrustShape(r) {
  return {
    id: r.id,
    order_sn: r.order_sn,
    order_status: r.order_status,
    goods_id: r.product_id,
    goods_name: r.goods_name,
    listimg: r.cover_image,
    collection_code: r.collection_code,
    user_hash_text: '',
    pay_way: r.pay_way,
    pay_name: PAY_NAME,
    number: r.number === null ? r.num : r.number,
    num: r.num === null ? r.number : r.num,
    sale_number: r.sale_number === null ? 0 : r.sale_number,
    price: fmt(r.price),
    total_price: fmt(r.total_price),
    order_amount: fmt(r.total_price),
    discount_amount: '0.00',
    pay_price: fmt(r.total_price),
    remark: '',
    createtime: r.beg_time,
    updatetime: r.update_time,
    card: [],
    goods_type: null,
  }
}

/**
 * 出售响应：挂单 + 藏品 + 分账明细。
 * 分账四字段必须原样出参——调用方要能拿返回值与market_listings 落库值逐字核对。
 */
function sellShape(listing, collection, entrustSn) {
  return {
    id: listing ? listing.id : null,
    order_sn: listing ? listing.order_sn : null,
    status: listing ? listing.status : null,
    goods_name: listing ? listing.name : '',
    listimg: listing ? listing.cover_image : '',
    collection_code: collection ? collection.collection_code : '',
    user_collection_id: collection ? collection.id : null,
    price: listing ? fmt(listing.price) : null,
    entrust_order_sn: entrustSn || null,
    pay_platform_service_rate: listing ? fmt(listing.pay_platform_service_rate) : null,
    platform_service_price: listing ? fmt(listing.platform_service_price) : null,
    creator_service_price: listing ? fmt(listing.creator_service_price) : null,
    real_income: listing ? fmt(listing.real_income) : null,
    pay_way: listing ? listing.pay_way : '',
    createtime: listing ? listing.listing_time : null,
    updatetime: listing ? listing.update_time : null,
  }
}

/** 金额 → 两位小数字符串。空值保持 null（不转成 '0.00' 冒充有值） */
function fmt(v) {
  if (v === null || v === undefined) return null
  return decimal.of(v).toFixed(2)
}

module.exports = { entrustShape, sellShape, fmt, PAY_NAME }