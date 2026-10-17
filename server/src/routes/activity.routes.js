'use strict'

/** 合成 / 转盘 / 签到 / 抽签 / 精选活动 路由 */
const express = require('express')
const { wrap } = require('../middleware/wrap')
const { requireAuth } = require('../middleware/auth')
const c = require('../controllers/activity.controller')

const router = express.Router()

router.post('/compound/compound/list', wrap(c.compoundList))
router.post('/compound/compound/scheme', wrap(c.compoundScheme))
router.post('/compound/compound/record', requireAuth, wrap(c.compoundRecord))
router.post('/compound/compound/result', requireAuth, wrap(c.compoundResult))
router.post('/lottery/lottery/info', wrap(c.lotteryInfo))
router.post('/lottery/lottery/record', requireAuth, wrap(c.lotteryRecord))
router.post('/lottery/lottery/rule', wrap(c.lotteryRule))
router.post('/sign/index/info', requireAuth, wrap(c.signInfo))
router.post('/activity/draw/info', wrap(c.activityDrawInfo))
router.post('/activity/draw/record', requireAuth, wrap(c.activityRecord))
router.post('/draw/drawResult/result', requireAuth, wrap(c.drawResult))
router.post('/draw/Leaderboard/list', requireAuth, wrap(c.drawLeaderboard))
router.post('/draw/communityShare/info', requireAuth, wrap(c.communityShare))
router.post('/draw/InvitationFriendAssist/info', requireAuth, wrap(c.invitationAssist))
router.post('/activeSelected/list', wrap(c.activeSelectedList))

module.exports = router
