'use strict'

/**
 * 用户与账户 controller。
 * 登录 / 注册为写接口，已真实实现（见 services/auth.service.js）。
 * 注意：登录不校验密码（users 表无 password_hash 列，方案 A）。
 */
const service = require('../services/user.service')
const authService = require('../services/auth.service')
const responder = require('../middleware/respond')
const { currentUid } = require('../middleware/auth')
const { NotFoundError } = require('../errors')

async function getUserInfo(req, res) {
  const token = req.headers.token ? String(req.headers.token) : ''
  const data = await service.userInfo(currentUid(req), token)
  if (!data) throw new NotFoundError('用户不存在')
  responder.single(res, data)
}

async function login(req, res) {
  responder.single(res, await authService.login(req.input), authService.LOGIN_MSG)
}

async function register(req, res) {
  responder.single(res, await authService.register(req.input), authService.LOGIN_MSG)
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