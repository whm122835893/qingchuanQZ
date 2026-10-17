'use strict'

/** 积分商城 路由 */
const express = require('express')
const { wrap } = require('../middleware/wrap')
const { requireAuth } = require('../middleware/auth')
const c = require('../controllers/shop.controller')

const router = express.Router()

router.post('/crystal_goods/crystalList', requireAuth, wrap(c.crystalList))
router.post('/crystal_goods/goodsDetail', requireAuth, wrap(c.goodsDetail))
router.post('/crystal_goods/boxDetail', requireAuth, wrap(c.boxDetail))
router.post('/crystal_goods/collectionDetail', requireAuth, wrap(c.collectionDetail))
router.post('/crystal_goods/exchangeRecord', requireAuth, wrap(c.exchangeRecord))
router.post('/crystal_goods/crystalDetail', requireAuth, wrap(c.crystalDetail))

module.exports = router
