'use strict'

/** 盲盒 路由。openbox / openboxone 已实现（开盒扣余量 + 幂等重放） */
const express = require('express')
const { wrap } = require('../middleware/wrap')
const { requireAuth } = require('../middleware/auth')
const c = require('../controllers/collection.controller')

const router = express.Router()

router.post('/box/blind_box/myBox', requireAuth, wrap(c.myBox))
router.post('/box/blind_box/openlog', requireAuth, wrap(c.openlog))
router.post('/user_collection/user_collection/openbox', requireAuth, wrap(c.openbox))
router.post('/user_collection/user_collection/openboxone', requireAuth, wrap(c.openboxone))

module.exports = router
