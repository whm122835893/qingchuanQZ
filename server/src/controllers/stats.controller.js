'use strict'

/**
 * 统计分销 controller：返利 / 榜单 / 市值排行 / 转赠记录。
 */
const service = require('../services/stats.service')
const responder = require('../middleware/respond')
const { currentUid } = require('../middleware/auth')

async function rebateIndex(req, res) {
  responder.single(res, await service.rebateIndex(currentUid(req)))
}

async function rebateLeaderboard(req, res) {
  responder.bareList(res, await service.rebateLeaderboard())
}

async function rebateInviteDetail(req, res) {
  responder.bareList(res, await service.rebateInviteDetail(currentUid(req)))
}

async function masterRank(req, res) {
  responder.bareList(res, await service.masterRank())
}

async function userBuyRank(req, res) {
  responder.bareList(res, await service.userBuyRank())
}

async function leaderboardGoods(req, res) {
  responder.bareList(res, await service.leaderboardGoods())
}

async function leaderboardUser(req, res) {
  responder.single(res, await service.leaderboardUser(currentUid(req)))
}

async function marketCapRanking(req, res) {
  responder.single(res, await service.marketCapRanking())
}

async function regiftRecord(req, res) {
  responder.bareList(res, await service.regiftRecord(currentUid(req), req.input))
}

module.exports = {
  rebateIndex,
  rebateLeaderboard,
  rebateInviteDetail,
  masterRank,
  userBuyRank,
  leaderboardGoods,
  leaderboardUser,
  marketCapRanking,
  regiftRecord,
}