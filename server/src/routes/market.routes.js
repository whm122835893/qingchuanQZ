'use strict'

/** 市场 / 行情 路由。batchchangeMarketGoods 为「我的」页持有弹窗的一键下架（写，需登录）；
 * changeMarketGoods 为藏品详情页的单条取消寄售（写，需登录，源站无滑块验证） */
const express = require('express')
const { wrap } = require('../middleware/wrap')
const { requireAuth } = require('../middleware/auth')
const c = require('../controllers/market.controller')
const p = require('../controllers/product.controller')

const router = express.Router()

router.post('/market/market/getMarketList', wrap(c.getMarketList))
router.post('/market/market/MarketDetail/ids/:id', wrap(c.marketDetail))
router.post('/market/market/seriesGoodsList', wrap(c.seriesGoodsList))
router.post('/market/market/batchchangeMarketGoods', requireAuth, wrap(c.batchOffCollections))
router.post('/market/market/changeMarketGoods', requireAuth, wrap(c.cancelListing))
router.post('/market/trade/collectionDetail', wrap(c.collectionDetail))
router.post('/kline/info/detail', wrap(c.klineInfo))
router.post('/product/product/detail', wrap(p.productDetail))
router.post('/product/product/rule', wrap(p.productRule))
router.post('/box/blind_box/list', wrap(p.blindBoxList))

module.exports = router
