'use strict'

/**
 * 用户与账户 controller。
 * 登录 / 注册本轮不实现，返回契约形状的 TODO 响应（见 todo.js）。
 */
const service = require('../services/user.service')
const responder = require('../middleware/respond')
const { currentUid } = require('../middleware/auth')
const { TODO_MSG, todoShape } = require('./todo')

async function getUserInfo(req, res) {
  const token = req.headers.token ? String(req.headers.token) : ''
  const data = await service.userInfo(token)
  responder.single(res, data || todoShape('login'), data ? 'ok' : TODO_MSG)
}

function login(req, res) {
  responder.single(res, todoShape('login'), TODO_MSG)
}

function register(req, res) {
  responder.single(res, todoShape('register'), TODO_MSG)
}

async function addressList(req, res) {
  responder.bareList(res, await service.addressList(currentUid(req)))
}

async function invitationInfo(req, res) {
  responder.single(res, await service.invitationInfo(currentUid(req)))
}

async function invitationRecord(req, res) {
  const page = await service.invitationRecord(currentUid(req), req.input)
  responder.slimPagination(res, page, 'ok', { listKey: 'list' })
}

module.exports = { getUserInfo, login, register, addressList, invitationInfo, invitationRecord }