'use strict'

/**
 * 活动与玩法 controller：合成 / 转盘 / 签到 / 抽签 / 精选活动。
 */
const service = require('../services/activity.service')
const compoundWrite = require('../services/compound-write.service')
const responder = require('../middleware/respond')
const { currentUid } = require('../middleware/auth')
const { NotFoundError } = require('../errors')

async function compoundList(req, res) {
  responder.bareList(res, await service.compoundList())
}

async function compoundScheme(req, res) {
  const data = await service.compoundScheme(req.input)
  if (!data) throw new NotFoundError('合成方案不存在')
  responder.single(res, data)
}

async function compoundRecord(req, res) {
  responder.bareList(res, await service.compoundRecord(currentUid(req), req.input))
}

async function compoundResult(req, res) {
  responder.single(res, await compoundWrite.compoundResult(currentUid(req), req.input))
}

async function lotteryInfo(req, res) {
  const data = await service.lotteryInfo()
  if (!data) throw new NotFoundError('转盘活动不存在')
  responder.single(res, data)
}

async function lotteryRecord(req, res) {
  responder.bareList(res, await service.lotteryRecord(currentUid(req), req.input))
}

async function lotteryRule(req, res) {
  responder.single(res, await service.lotteryRule())
}

async function signInfo(req, res) {
  responder.single(res, await service.signInfo(currentUid(req)))
}

async function activityDrawInfo(req, res) {
  responder.single(res, await service.activityDrawInfo(currentUid(req)))
}

async function activityRecord(req, res) {
  responder.bareList(res, await service.activityRecord(currentUid(req), req.input))
}

async function drawResult(req, res) {
  responder.single(res, await service.drawResult(currentUid(req)))
}

async function drawLeaderboard(req, res) {
  responder.single(res, await service.drawLeaderboard(currentUid(req)))
}

async function communityShare(req, res) {
  responder.single(res, await service.communityShare())
}

async function invitationAssist(req, res) {
  responder.single(res, await service.invitationAssist(currentUid(req), req.input))
}

async function activeSelectedList(req, res) {
  responder.bareList(res, await service.activeSelectedList())
}

module.exports = {
  compoundList,
  compoundScheme,
  compoundRecord,
  compoundResult,
  lotteryInfo,
  lotteryRecord,
  lotteryRule,
  signInfo,
  activityDrawInfo,
  activityRecord,
  drawResult,
  drawLeaderboard,
  communityShare,
  invitationAssist,
  activeSelectedList,
}