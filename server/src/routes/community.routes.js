'use strict'

/** 社区墙 / 聊天 路由 */
const express = require('express')
const { wrap } = require('../middleware/wrap')
const c = require('../controllers/community.controller')

const router = express.Router()

router.post('/shequ/rumor/info', wrap(c.rumorInfo))
router.post('/community/chat/messageList', wrap(c.chatMessages))

module.exports = router
