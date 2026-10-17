'use strict'

/**
 * 我的藏品域 service：我的盲盒 / 开盒记录。
 * 开盒写接口（openbox / openboxone）本轮不实现，仅返回 TODO 响应。
 */
const env = require('../config/env')
const collectionRepo = require('../repositories/collection.repository')
const productRepo = require('../repositories/product.repository')
const { pagination } = require('../utils/validate')

/**
 * 我的盲盒（myBox，style D）。
 *
 * user_collections 中 blind_box_id 非空的那条不挂 product_id，
 * 故名称/图片借 product_pool_items 所属产品补齐；取不到则为 null，不编造。
 */
async function myBox(userId) {
  const row = await collectionRepo.findMyBlindBox(userId)
  if (!row) return null
  const pool = row.product_id ? await productRepo.listPoolItems(row.product_id) : []
  return {
    id: row.blind_box_id,
    name: row.p_name,
    num: row.count,
    listimg: row.p_listimg,
    main_image: row.p_main_image,
    rarity_icon: pool.length ? pool[0].rarity_icon : null,
    product_id: row.product_id,
    user_collection_id: row.id,
  }
}

/** 开盒记录（openlog，style A） */
async function openlog(userId, params) {
  const page = pagination(params, env)
  const { items } = await collectionRepo.listBlindBoxRecords(userId, page)
  const out = []
  for (const r of items) {
    const pool = r.product_id ? await productRepo.listPoolItems(r.product_id) : []
    out.push({
      id: r.id,
      listimg: r.p_listimg,
      name: r.p_name,
      collection_code: r.collection_code,
      rarity_icon: pool.length ? pool[0].rarity_icon : null,
      createtime: r.createtime,
      // 库中无「盲盒 → 藏品」归属列，box_name 无从定位——返回 null，不编造
      box_name: null,
    })
  }
  return out
}

module.exports = { myBox, openlog }