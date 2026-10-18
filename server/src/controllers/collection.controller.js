'use strict'

/**
 * 我的藏品 controller：我的盲盒 / 开盒记录 / 开盒（写，已实现）。
 */
const service = require('../services/collection.service')
const writeService = require('../services/blindbox-write.service')
const responder = require('../middleware/respond')
const { currentUid } = require('../middleware/auth')
const { NotFoundError } = require('../errors')

async function myBox(req, res) {
  const data = await service.myBox(currentUid(req))
  if (!data) throw new NotFoundError('暂无盲盒')
  responder.single(res, data)
}

async function openlog(req, res) {
  responder.bareList(res, await service.openlog(currentUid(req), req.input))
}

async function openbox(req, res) {
  responder.bareList(res, await writeService.openbox(currentUid(req), req.input.blind_box_id))
}

async function openboxone(req, res) {
  const data = await writeService.openboxone(currentUid(req), req.input.blind_box_id)
  if (!data) throw new NotFoundError('开盒未产出藏品')
  responder.single(res, data)
}

module.exports = { myBox, openlog, openbox, openboxone }