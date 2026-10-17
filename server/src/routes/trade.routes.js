'use strict'

/** 订单 / 寄售 / 委托求购 / 我的藏品 路由。写接口已注册但返回 TODO 响应 */
const express = require('express')
const { wrap } = require('../middleware/wrap')
const { requireAuth } = require('../middleware/auth')
const c = require('../controllers/trade.controller')

const router = express.Router()

router.post('/order/order/orderList', requireAuth, wrap(c.orderList))
router.post('/order/order/saleMarketOrderDetail', requireAuth, wrap(c.saleMarketOrderDetail))
router.post('/order/order/myConsignment', requireAuth, wrap(c.myConsignment))
router.post('/market/trade/begBuyOrderList', requireAuth, wrap(c.begBuyOrderList))
router.post('/market/trade/begBuyOrderInfo', requireAuth, wrap(c.begBuyOrderInfo))
router.post('/market/trade/createBegBuyOrder', requireAuth, wrap(c.createBegBuyOrder))
router.post('/market/trade/sell', requireAuth, wrap(c.sell))
router.post('/market/trade/getSellCollectionInfo', requireAuth, wrap(c.getSellCollectionInfo))
router.post('/market/trade/userCollectionList', requireAuth, wrap(c.userCollectionList))
router.post('/market/trade/collectionInfo', requireAuth, wrap(c.collectionInfo))
router.post('/market/trade/flowDoc', requireAuth, wrap(c.flowDoc))

module.exports = router
