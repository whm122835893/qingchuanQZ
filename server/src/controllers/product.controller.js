'use strict'

/**
 * 藏品与系列 controller：产品详情 / 申购规则 / 盲盒列表。
 */
const service = require('../services/product.service')
const responder = require('../middleware/respond')
const { requireId, routeId } = require('../utils/validate')
const { NotFoundError } = require('../errors')

async function productDetail(req, res) {
  const data = await service.productDetail(requireId(routeId(req), 'id'))
  if (!data) throw new NotFoundError('藏品不存在')
  responder.single(res, data)
}

async function productRule(req, res) {
  const data = await service.productRule(requireId(routeId(req), 'id'))
  if (!data) throw new NotFoundError('申购规则不存在')
  responder.single(res, data)
}

async function blindBoxList(req, res) {
  responder.bareList(res, await service.blindBoxList())
}

module.exports = { productDetail, productRule, blindBoxList }