'use strict'

/**
 * 盲盒 / 我的藏品 路由。
 * openbox / openboxone 已实现（开盒扣余量 + 幂等重放）；
 * openBoxs 为持有弹窗的一键开启（批量，同胞盒归并，逐个走幂等窗口）；
 * antMycollection / getDetail 为「我的」页 8 tab 与持有详情弹窗的数据源。
 */
const express = require('express')
const { wrap } = require('../middleware/wrap')
const { requireAuth } = require('../middleware/auth')
const c = require('../controllers/collection.controller')

const router = express.Router()

router.post('/box/blind_box/myBox', requireAuth, wrap(c.myBox))
router.post('/box/blind_box/openlog', requireAuth, wrap(c.openlog))
// 我的页藏品聚合（tab：藏品 types=2 / 盲盒 types=1 / 已售 types=3；我的藏品页另有 已赠送 types=4）
router.post('/user_collection/user_collection/antMycollection', requireAuth, wrap(c.myCollections))
// 持有详情弹窗（点击聚合列表项后按 collection_id + types 拉单实例明细）
router.post('/user_collection/user_collection/getDetail', requireAuth, wrap(c.collectionDetail))
router.post('/user_collection/user_collection/openbox', requireAuth, wrap(c.openbox))
router.post('/user_collection/user_collection/openboxone', requireAuth, wrap(c.openboxone))
// 一键开启（popDetails.openAll）：入参 openid，响应裸数组
router.post('/user_collection/user_collection/openBoxs', requireAuth, wrap(c.openBoxs))

module.exports = router
