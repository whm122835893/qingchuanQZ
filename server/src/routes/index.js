'use strict'

/** 汇总挂载各域路由。只做装配，不含业务逻辑。 */
const express = require('express')
const indexRoutes = require('./index.routes')
const marketRoutes = require('./market.routes')
const tradeRoutes = require('./trade.routes')
const userRoutes = require('./user.routes')
const collectionRoutes = require('./collection.routes')
const activityRoutes = require('./activity.routes')
const shopRoutes = require('./shop.routes')
const communityRoutes = require('./community.routes')
const statsRoutes = require('./stats.routes')

const router = express.Router()

router.use(indexRoutes)
router.use(marketRoutes)
router.use(tradeRoutes)
router.use(userRoutes)
router.use(collectionRoutes)
router.use(activityRoutes)
router.use(shopRoutes)
router.use(communityRoutes)
router.use(statsRoutes)

module.exports = router
