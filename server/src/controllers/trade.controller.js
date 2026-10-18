'use strict'

/**
 * 交易 controller：买单 / 寄售 / 委托求购 / 我的藏品 / 流转。
 * 写接口（createBegBuyOrder / sell）已实现，见 services/trade-write.service.js。
 */
const service = require('../services/trade.service')
const writeService = require('../services/trade-write.service')
const responder = require('../middleware/respond')
const { currentUid } = require('../middleware/auth')
const { requireId, routeId } = require('../utils/validate')
const { NotFoundError, ForbiddenError } = require('../errors')

async function orderList(req, res) {
  responder.standardPagination(res, await service.orderList(currentUid(req), req.input))
}

async function saleMarketOrderDetail(req, res) {
  const data = await service.orderDetail(currentUid(req), requireId(routeId(req), 'id'))
  if (!data) throw new NotFoundError('订单不存在')
  responder.single(res, data)
}

async function myConsignment(req, res) {
  responder.slimPagination(res, await service.myConsignment(currentUid(req), req.input))
}

async function begBuyOrderList(req, res) {
  responder.slimPagination(res, await service.begBuyOrderList(currentUid(req), req.input))
}

async function begBuyOrderInfo(req, res) {
  const data = await service.orderDetail(currentUid(req), requireId(routeId(req), 'id'))
  if (!data) throw new NotFoundError('委托单不存在')
  responder.single(res, data)
}

async function createBegBuyOrder(req, res) {
  responder.single(res, await writeService.createBegBuyOrder(currentUid(req), req.input))
}

async function sell(req, res) {
  responder.single(res, await writeService.sell(currentUid(req), req.input))
}

async function getSellCollectionInfo(req, res) {
  responder.single(res, await service.sellCollectionInfo(currentUid(req)))
}

async function userCollectionList(req, res) {
  const page = await service.userCollectionList(currentUid(req), req.input)
  responder.slimPagination(res, page, 'ok', { withPageMeta: true })
}

async function collectionInfo(req, res) {
  const data = await service.collectionInfo(requireId(routeId(req), 'id'), currentUid(req))
  if (!data) throw new NotFoundError('藏品不存在')
  responder.single(res, data)
}

async function flowDoc(req, res) {
  responder.bareList(res, await service.flowDoc(currentUid(req), req.input))
}

module.exports = {
  orderList,
  saleMarketOrderDetail,
  myConsignment,
  begBuyOrderList,
  begBuyOrderInfo,
  createBegBuyOrder,
  sell,
  getSellCollectionInfo,
  userCollectionList,
  collectionInfo,
  flowDoc,
}