'use strict'

/** 账户 / 地址 / 邀请 路由。login / register 已注册但返回 TODO 响应 */
const express = require('express')
const { wrap } = require('../middleware/wrap')
const { requireAuth } = require('../middleware/auth')
const c = require('../controllers/user.controller')

const router = express.Router()

router.post('/user/login', wrap(c.login))
router.post('/user/register', wrap(c.register))
router.post('/user/getUserInfo', requireAuth, wrap(c.getUserInfo))
router.post('/user/address/lists', requireAuth, wrap(c.addressList))
router.post('/invitation/invitation/info', requireAuth, wrap(c.invitationInfo))
router.post('/invitation/invitation/record', requireAuth, wrap(c.invitationRecord))

module.exports = router
