'use strict'

/** 返利 / 榜单 / 市值 / 转赠 路由 */
const express = require('express')
const { wrap } = require('../middleware/wrap')
const { requireAuth } = require('../middleware/auth')
const c = require('../controllers/stats.controller')

const router = express.Router()

router.post('/rebate/rebate/index', requireAuth, wrap(c.rebateIndex))
router.post('/rebate/rebate/leaderboard', requireAuth, wrap(c.rebateLeaderboard))
router.post('/rebate/rebate/inviteDetail', requireAuth, wrap(c.rebateInviteDetail))
router.post('/rank/masterRank/list', wrap(c.masterRank))
router.post('/rank/userBuy/list', wrap(c.userBuyRank))
router.post('/leaderboard/leaderboard/goods', wrap(c.leaderboardGoods))
router.post('/leaderboard/leaderboard/user', requireAuth, wrap(c.leaderboardUser))
router.post('/marketCapRanking/marketCapRanking/list', wrap(c.marketCapRanking))
router.post('/regift/record/list', requireAuth, wrap(c.regiftRecord))

module.exports = router
