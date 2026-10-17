'use strict'

/**
 * 社区 controller：社区墙详情 / 聊天消息。
 */
const service = require('../services/community.service')
const responder = require('../middleware/respond')
const { optionalId, routeId } = require('../utils/validate')
const { NotFoundError } = require('../errors')

async function rumorInfo(req, res) {
  const data = await service.rumorInfo(optionalId(routeId(req), 'id'))
  if (!data) throw new NotFoundError('帖子不存在')
  responder.single(res, data)
}

async function chatMessages(req, res) {
  responder.bareList(res, await service.chatMessages(req.input.session_id))
}

module.exports = { rumorInfo, chatMessages }