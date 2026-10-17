'use strict'

/**
 * 源站 product 对象形状映射（marketDetail / productDetail / collectionInfo / collectionDetail 共用）。
 *
 * 独立成文件的原因：market.service.js 触到 300 行门禁，且这段映射有独立的形态规则
 * —— publisher 在不同接口下形状不同（§6.6），挤在市场 service 里会让两件事缠在一起。
 */
const configRepo = require('../repositories/config.repository')
const { money } = require('../utils/pick')

/** products → 源站 product 对象 */
function productBrief(p, publisherStyle = 'user') {
  return {
    id: p.id,
    series_id: p.series_id,
    issuer_id: p.issuer_id === null ? 0 : p.issuer_id,
    flux: p.flux === null ? 0 : p.flux,
    price: money(p.price),
    name: p.name,
    main_image: p.main_image,
    introduce_image: p.introduce_image,
    total_num: p.total_num,
    types: p.types === null ? 0 : p.types,
    compound_num: p.compound_num === null ? 0 : p.compound_num,
    release_time: p.release_time === null ? 0 : p.release_time,
    sale_total_num: p.sale_total_num === null ? 0 : p.sale_total_num,
    // DB 列名为 url_3d_type / url_3d；源站响应键是 "3d_url_type" / "3d_url"（数字开头必须保留字面量）
    '3d_url_type': p.url_3d_type,
    '3d_url': p.url_3d,
    purchase_information: p.purchase_information,
    listimg: p.listimg,
    creator_id: p.creator_id === null ? 0 : p.creator_id,
    is_img_diff: p.is_img_diff === null ? 0 : p.is_img_diff,
    is_like: p.is_like === null ? 0 : p.is_like,
    publisher: publisherShape(p, publisherStyle),
    imageinfo: [],
    issuer: null,
  }
}

/**
 * publisher 的源站形态不统一（DATABASE.md §9脏字段）：
 *  - marketDetail：{name, company_logo, user: []}
 *  - 其余：{name, user: {nickname}}
 * 用显式参数区分，不静默统一。
 */
let bigLogoCache = null

/** 全局 appBigLogo（products.publisher_logo 全库为空，源站该字段实为全局 Logo） */
function appBigLogo() {
  if (bigLogoCache === null) bigLogoCache = configRepo.groupValue('basic', 'appBigLogo') || ''
  return bigLogoCache
}

function publisherShape(p, style) {
  if (!p.publisher_name) return null
  if (style === 'company') {
    const logo = p.publisher_logo || appBigLogo()
    return { name: p.publisher_name, company_logo: logo || null, user: [] }
  }
  return { name: p.publisher_name, user: { nickname: p.publisher_name } }
}

/** 系列挂单列表（seriesGoodsList，style E：product + 分页） */
/** 简版publisher（productDetail / collectionInfo 用）：{name, user:{nickname}} */
function publisherBrief(p) {
  return publisherShape(p, 'user')
}

module.exports = { productBrief, publisherBrief }
