'use strict'

/** 首页 / 内容社区 路由。路径逐字照 endpoint_meta.py */
const express = require('express')
const { wrap } = require('../middleware/wrap')
const c = require('../controllers/index.controller')

const router = express.Router()

router.post('/index/getConfig', wrap(c.getConfig))
router.post('/banner/show/getBanner', wrap(c.getBanner))
router.post('/index/afficheList', wrap(c.afficheList))
router.post('/index/affichetypelist', wrap(c.afficheTypeList))
router.post('/index/getSeries', wrap(c.getSeries))
router.post('/index/afficheDetail', wrap(c.afficheDetail))
router.post('/index/newsDetail', wrap(c.newsDetail))
router.post('/addons/diypage/index', wrap(c.diypage))

module.exports = router