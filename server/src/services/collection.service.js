'use strict'

/**
 * 我的藏品域 service：我的盲盒 / 开盒记录。
 * 开盒写接口（openbox / openboxone）已实现，见 blindbox-write.service.js。
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
    // name/listimg 已在 SQL 层 COALESCE：优先源站直取列，products 值兜底
    name: row.name,
    num: row.count,
    listimg: row.listimg,
    main_image: row.main_image,
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
    out.push({
      id: r.id,
      listimg: r.listimg,
      // 新表直接存源站的藏品名；products 关联命中时以关联名为准（同源，仅作保险）
      name: r.name || r.p_name || '',
      collection_code: r.collection_code,
      // 源站本快照中 rarity_icon 与 listimg 同值，原样返回不臆造
      rarity_icon: r.rarity_icon || null,
      createtime: r.createtime,
      // 新表已承载 box_name（源站直取），不再返回 null
      box_name: r.box_name || null,
    })
  }
  return out
}

module.exports = { myBox, openlog }