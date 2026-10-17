'use strict'

/**
 * 藏品与系列域 service：产品详情 / 申购规则 / 盲盒列表。
 */
const productRepo = require('../repositories/product.repository')
const { money, money2 } = require('../utils/pick')
const { publisherBrief } = require('./product-shape')

/**
 * 产品详情（productDetail，style D）。
 * shengou / count_down / sale_status 在源站是申购活动派生值，
 * DB 中无对应列——由 products.release_time 与 product_sale_rules 推导，缺失则为 null。
 */
async function productDetail(id) {
  const product = await productRepo.findProduct(id)
  if (!product) return null
  const rule = await productRepo.findSaleRule(product.id)
  const series = product.series_id ? await productRepo.findSeries(product.series_id) : null
  const pool = await productRepo.listPoolItems(product.id)

  return {
    id: product.id,
    goods_type: product.goods_type,
    name: product.name,
    price: money2(product.price),
    sale_status: saleStatus(product, !!rule),
    is_shengou: rule ? 1 : 0,
    is_sub: product.is_sub === null ? 0 : product.is_sub,
    shengou: {
      num: product.total_num,
      user_num: product.sale_total_num === null ? 0 : product.sale_total_num,
      start_time: product.release_time === null ? 0 : product.release_time,
      end_time: product.release_time === null ? 0 : product.release_time,
    },
    count_down: product.release_time === null ? 0 : product.release_time * 1000,
    introduce: product.introduce || '',
    product: {
      id: product.id,
      name: product.name,
      goods_type: product.goods_type,
      listimg: product.listimg,
      main_image: product.main_image,
      total_num: product.total_num,
      sale_total_num: product.sale_total_num === null ? 0 : product.sale_total_num,
      flux: product.flux === null ? 0 : product.flux,
      is_like: product.is_like === null ? 0 : product.is_like,
      is_sub: product.is_sub === null ? 0 : product.is_sub,
      collectionlist: pool.map((i) => ({
        id: i.id,
        name: i.name,
        probability: i.probability,
        show_total_num: i.show_total_num,
        listimg: i.listimg,
        rarity_icon: i.rarity_icon,
        is_out: i.is_out === null ? 0 : i.is_out,
      })),
      publisher: publisherBrief(product),
      series: series ? { id: series.id, name: series.name } : null,
    },
  }
}

/**
 * 申购状态：1=可申购 / 2=已结束。
 * 库中 products.release_time 全为 0（未采集该字段），无法按时间判定；
 * 改用「存在 product_sale_rules 记录 = 曾开放申购 = 已结束」推导。
 * 两者皆无依据时返回 null，不臆造。
 */
function saleStatus(product, hasRule) {
  if (product.release_time) return product.release_time > Math.floor(Date.now() / 1000) ? 1 : 2
  return hasRule ? 2 : null
}

/** 申购规则（productRule，style D）：rules 为 JSON TEXT 原样解析 */
async function productRule(id) {
  const rule = await productRepo.findSaleRule(id)
  if (!rule) return null
  return {
    id: rule.id,
    name: rule.name,
    price: money2(rule.price),
    total_num: rule.total_num,
    sale_num: rule.sale_num,
    rule_updated: rule.rule_updated || '',
    rules: parseRules(rule.rules),
  }
}

function parseRules(raw) {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

/** 盲盒列表（blindBoxList，style A）：products.goods_type=1 即盲盒（E-GOODS-TYPE-COLLECTION） */
async function blindBoxList() {
  return await productRepo.listBlindBoxProducts().map((p) => ({
    id: p.id,
    name: p.name,
    num: p.total_num,
    listimg: p.listimg,
    main_image: p.main_image,
    price: money(p.price),
    total_num: p.total_num,
    sale_total_num: p.sale_total_num === null ? 0 : p.sale_total_num,
  }))
}

module.exports = { productDetail, productRule, blindBoxList }
