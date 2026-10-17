'use strict'

/**
 * 积分商城 controller。
 */
const service = require('../services/shop.service')
const responder = require('../middleware/respond')
const { currentUid } = require('../middleware/auth')
const { NotFoundError } = require('../errors')

async function crystalList(req, res) {
  responder.single(res, await service.shopList(currentUid(req)))
}

async function goodsDetail(req, res) {
  const data = await service.shopGoodsDetail(currentUid(req), req.input)
  if (!data) throw new NotFoundError('商品不存在')
  responder.single(res, data)
}

// boxDetail / collectionDetail / goodsDetail 三者源站响应形状完全一致，
// 均按 id 取商品（缺省取首行）；不按 goods_type 分流——库中 goods_type=2 的商品
// 没有 pool_items，按类型分流会得到与源站不一致的空概率池。
async function boxDetail(req, res) {
  const data = await service.shopGoodsDetail(currentUid(req), req.input)
  if (!data) throw new NotFoundError('商品不存在')
  responder.single(res, data)
}

async function collectionDetail(req, res) {
  const data = await service.shopGoodsDetail(currentUid(req), req.input)
  if (!data) throw new NotFoundError('商品不存在')
  responder.single(res, data)
}

async function exchangeRecord(req, res) {
  responder.bareList(res, await service.exchangeRecord(currentUid(req), req.input))
}

async function crystalDetail(req, res) {
  responder.bareList(res, await service.crystalDetail(currentUid(req), req.input))
}

module.exports = { crystalList, goodsDetail, boxDetail, collectionDetail, exchangeRecord, crystalDetail }