'use strict'

/** 市场 / 行情 路由 */
const express = require('express')
const { wrap } = require('../middleware/wrap')
const c = require('../controllers/market.controller')
const p = require('../controllers/product.controller')

const router = express.Router()

router.post('/market/market/getMarketList', wrap(c.getMarketList))
router.post('/market/market/MarketDetail/ids/:id', wrap(c.marketDetail))
router.post('/market/market/seriesGoodsList', wrap(c.seriesGoodsList))
router.post('/market/trade/collectionDetail', wrap(c.collectionDetail))
router.post('/kline/info/detail', wrap(c.klineInfo))
router.post('/product/product/detail', wrap(p.productDetail))
router.post('/product/product/rule', wrap(p.productRule))
router.post('/box/blind_box/list', wrap(p.blindBoxList))

module.exports = router
