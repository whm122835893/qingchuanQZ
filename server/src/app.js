'use strict'

/**
 * Express 实例与中间件链组装（ARCHITECTURE §9）。
 * 本文件只装配，不含业务逻辑。
 */
const express = require('express')
const env = require('./config/env')
const db = require('./db')
const responder = require('./middleware/respond')
const { attach } = require('./middleware/auth')
const requestLogger = require('./middleware/requestLog')
const cors = require('./middleware/cors')
const { errorHandler, notFoundHandler } = require('./middleware/error')
const routes = require('./routes')

const app = express()

app.disable('x-powered-by')
app.use(express.json({ limit: '256kb' }))
app.use(express.urlencoded({ extended: false }))
// CORS 必须最先挂：早于 auth，否则预检请求会先撞鉴权返回 401（ARCHITECTURE §9）
app.use(cors)
app.use(attach)
app.use(requestLogger)

/** 存活探针：不查库（进程活着即活） */
app.get('/health', (_req, res) => {
  responder.single(res, { status: 'ok', uptime: Math.round(process.uptime()), driver: env.driver })
})

/** 就绪探针：查库 + 关键表 */
app.get('/health/ready', (_req, res) => {
  const started = Date.now()
  const ping = db.ping()
  responder.single(res, {
    status: ping.ok ? 'ready' : 'degraded',
    driver: env.driver,
    latency_ms: Date.now() - started,
  })
})

/** 元信息：版本 / 启动时长 / 各表行数（核对 48 表 / 341 行） */
app.get('/health/meta', (_req, res) => {
  const meta = db.tableCounts()
  responder.single(res, {
    version: require('../package.json').version,
    driver: env.driver,
    node: process.version,
    uptime: Math.round(process.uptime()),
    table_count: meta.tableCount,
    row_count: meta.rowCount,
    tables: meta.tables,
  })
})

app.use(routes)

app.use(notFoundHandler)
app.use(errorHandler)

module.exports = app