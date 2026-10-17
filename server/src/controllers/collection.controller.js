'use strict'

/**
 * 我的藏品 controller：我的盲盒 / 开盒记录 / 开盒（写，本轮 TODO）。
 */
const service = require('../services/collection.service')
const responder = require('../middleware/respond')
const { currentUid } = require('../middleware/auth')
const { TODO_MSG, todoShape } = require('./todo')
const { NotFoundError } = require('../errors')

async function myBox(req, res) {
  const data = await service.myBox(currentUid(req))
  if (!data) throw new NotFoundError('暂无盲盒')
  responder.single(res, data)
}

async function openlog(req, res) {
  responder.bareList(res, await service.openlog(currentUid(req), req.input))
}

function openbox(req, res) {
  responder.bareList(res, todoShape('openbox'), TODO_MSG)
}

function openboxone(req, res) {
  responder.single(res, todoShape('openboxone'), TODO_MSG)
}

module.exports = { myBox, openlog, openbox, openboxone }