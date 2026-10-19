'use strict'

/**
 * 市场与行情 controller。
 */
const service = require('../services/market.service')
const tradeWrite = require('../services/trade-write.service')
const responder = require('../middleware/respond')
const { requireId, optionalId, routeId } = require('../utils/validate')
const { currentUid } = require('../middleware/auth')
const { NotFoundError } = require('../errors')

async function getMarketList(req, res) {
  responder.bareList(res, await service.marketList(req.input))
}

async function marketDetail(req, res) {
  const data = await service.marketDetail(requireId(routeId(req), 'id'))
  if (!data) throw new NotFoundError('挂单不存在')
  responder.single(res, data)
}

async function seriesGoodsList(req, res) {
  responder.nested(res, await service.seriesGoodsList(req.input))
}

async function collectionDetail(req, res) {
  const data = await service.collectionDetail({
    id: optionalId(routeId(req), 'id'),
    product_id: optionalId(req.input.product_id, 'product_id'),
  })
  if (!data) throw new NotFoundError('藏品行情不存在')
  responder.single(res, data)
}

async function klineInfo(req, res) {
  const data = await service.klineInfo(optionalId(routeId(req), 'id'))
  if (!data) throw new NotFoundError('K线数据不存在')
  responder.single(res, data)
}

/**
 * 一键下架（batchchangeMarketGoods）。popDetails 弹窗按钮，
 * 入参 collection_id；响应体源站不消费，出参附受影响挂单数。
 */
async function batchOffCollections(req, res) {
  responder.single(res, await tradeWrite.batchOffCollections(currentUid(req), req.input), '下架成功')
}

module.exports = {
  getMarketList,
  marketDetail,
  seriesGoodsList,
  collectionDetail,
  klineInfo,
  batchOffCollections,
}