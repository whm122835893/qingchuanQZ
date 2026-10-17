'use strict'

/**
 * 首页 / 内容社区 controller。
 * 只做「取参 → 调 service → 用 responder 输出」，不含业务判断、不拼 JSON。
 */
const service = require('../services/index.service')
const responder = require('../middleware/respond')
const { requireId, optionalId, routeId } = require('../utils/validate')
const { NotFoundError } = require('../errors')

async function getConfig(req, res) {
  responder.single(res, await service.getConfig())
}

async function getBanner(req, res) {
  const page = await service.bannerList(req.input)
  responder.standardPagination(res, page)
}

async function afficheList(req, res) {
  // perPage 为字符串是源站形态，responder 支持 perPage 覆盖
  responder.standardPagination(res, await service.afficheList(req.input))
}

async function afficheTypeList(req, res) {
  responder.bareList(res, await service.afficheTypeList())
}

async function getSeries(req, res) {
  responder.bareList(res, await service.seriesList(req.input))
}

async function afficheDetail(req, res) {
  const data = await service.afficheDetail(requireId(routeId(req), 'id'))
  if (!data) throw new NotFoundError('公告不存在')
  responder.single(res, data)
}

async function newsDetail(req, res) {
  const data = await service.newsDetail(optionalId(routeId(req), 'id'))
  if (!data) throw new NotFoundError('文章不存在')
  responder.single(res, data)
}

async function diypage(req, res) {
  responder.bareList(res, await service.diypageList(req.input))
}

module.exports = { getConfig, getBanner, afficheList, afficheTypeList, getSeries, afficheDetail, newsDetail, diypage }