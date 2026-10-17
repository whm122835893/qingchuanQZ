'use strict'

/**
 * 积分商城域 service：商城列表 / 商品详情 / 兑换记录 / 积分流水。
 * goods_type 语义见 DATABASE.md §4 E-GOODS-TYPE-SHOP：1=数字藏品 2=盲盒 3=合集。
 */
const env = require('../config/env')
const shopRepo = require('../repositories/shop.repository')
const userRepo = require('../repositories/user.repository')
const { pagination } = require('../utils/validate')
const { jsonArray, bool } = require('../utils/pick')

/** 商城列表（crystalList，style D） */
async function shopList(userId) {
  const user = await userRepo.findUser(userId)
  const goods = await shopRepo.listShopGoods()
  return {
    crystal_number: await userRepo.crystalNumber(userId),
    crystal_type: goods.length ? goods[0].crystal_type || 0 : 0,
    user_info: user ? { nickname: user.nickname, avatar: user.avatar } : { nickname: '', avatar: '' },
    list: goods.map((g) => ({
      goods_id: g.id,
      goods_name: g.name,
      list_image: g.list_image,
      crystal_price: g.crystal_price,
      exchange_status: g.exchange_status,
      total_num: g.total_num,
      exchange_num: g.exchange_num,
      goods_type: g.goods_type,
      end_time: g.end_time,
    })),
  }
}

/**
 * 商品详情（goodsDetail / boxDetail / collectionDetail，style D）。
 * info.type 取 shop_goods.shop_type；collectionlist 取 pool_items（JSON TEXT）。
 */
async function shopGoodsDetail(userId, params) {
  const goods = await pickGoods(params)
  if (!goods) return null
  return {
    info: {
      id: goods.id,
      crystal_number: await userRepo.crystalNumber(userId),
      crystal_type: goods.crystal_type === null ? 0 : goods.crystal_type,
      crystal_price: goods.crystal_price,
      exchange_status: goods.exchange_status,
      max_count: goods.max_count === null ? 0 : goods.max_count,
      is_sub: bool(goods.is_sub),
      count_down: goods.count_down === null ? 0 : goods.count_down,
      type: goods.shop_type === null ? 0 : goods.shop_type,
      details: goods.details || '',
    },
    product: {
      id: goods.id,
      name: goods.name,
      listimg: goods.list_image,
      main_image: goods.list_image,
      goods_type: goods.goods_type,
      // shop_goods 无 price 列，用龙晶价作为展示价（源站形如 "1200.00"）
      price: goods.crystal_price === null ? null : Number(goods.crystal_price).toFixed(2),
      total_num: goods.total_num,
      details: goods.details || '',
      // shop_goods 无发行方列，且库中不存在与 shop_goods.id 同 id 的 products 行，
      // 故 publisher 无数据来源，返回 null（不编造），并在 diff 报告标注
      publisher: null,
      collectionlist: jsonArray(goods.pool_items).map((p) => ({
        id: p.id,
        name: p.name,
        probability: p.probability === undefined ? null : String(p.probability),
        show_total_num: p.show_total_num === undefined ? null : String(p.show_total_num),
        listimg: p.listimg,
        rarity_icon: p.rarity_icon,
      })),
    },
  }
}

async function pickGoods(params) {
  return shopRepo.findShopGoods(params.id || params.goods_id)
}

/** 兑换记录（exchangeRecord，style A） */
async function exchangeRecord(userId, params) {
  const page = pagination(params, env)
  const { items } = await shopRepo.listExchanges(userId, page)
  return items.map((r) => ({
    id: r.id,
    order_id: r.order_id,
    goods_name: r.goods_name,
    list_image: r.list_image,
    crystal_number: r.crystal_number,
    crystal_type: r.crystal_type,
    create_time: r.create_time,
  }))
}

/** 积分流水（crystalDetail，style A）。源站字段名为 createtime，库中为 log_time */
async function crystalDetail(userId, params) {
  const page = pagination(params, env)
  const { items } = await shopRepo.listCrystalLogs(userId, params.model, page)
  return items.map((r) => ({
    id: r.id,
    model: r.model,
    memo: r.memo || '',
    crystal: r.crystal,
    createtime: r.log_time,
  }))
}

module.exports = { shopList, shopGoodsDetail, exchangeRecord, crystalDetail }