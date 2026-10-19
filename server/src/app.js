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

/**
 * 鉴权诊断（仅 DEBUG_AUTH=1 时挂载）：定位「token 有效却全 401」类问题。
 * 只暴露不可逆指纹与错误名，绝不返回 secret 或 token 原文。
 */
if (process.env.DEBUG_AUTH === '1') {
  const jwt = require('jsonwebtoken')
  const crypto = require('node:crypto')
  app.post('/health/auth-debug', (req, res) => {
    const raw = req.headers.authorization || req.headers.token || ''
    const tok = String(raw).replace(/^Bearer\s+/i, '').trim()
    const out = {
      has_authorization: !!req.headers.authorization,
      has_token_header: !!req.headers.token,
      token_len: tok.length,
      secret_fp: crypto.createHash('sha256').update(String(env.jwtSecret)).digest('hex').slice(0, 12),
      secret_len: String(env.jwtSecret).length,
      headers_seen: Object.keys(req.headers).sort(),
    }
    try {
      out.decode = jwt.decode(tok)
      out.verify_ok = true
      jwt.verify(tok, env.jwtSecret)
    } catch (e) {
      out.verify_ok = false
      out.verify_error = e.name + ': ' + e.message
    }
    responder.single(res, out)
  })
}

app.use(routes)

/**
 * 同源托管前端构建产物（单端口部署用）。
 *
 * 由开关 STATIC_DIR 控制，缺省关闭——纯 API 模式不受影响。
 * 置为 dist 目录后，前端可与 API 同域，VITE_API_BASE 填 "." 走相对路径，
 * 既省掉 CORS 预检，也不需要在构建期写死线上域名。
 *
 * 挂载位置必须在 API 路由之后、404 之前：API 先命中，
 * 未命中的路径才回落到 SPA 的 index.html（hash 路由由前端接管）。
 */
const staticDir = process.env.STATIC_DIR
if (staticDir) {
  const path = require('node:path')
  const fs = require('node:fs')
  const root = path.resolve(process.cwd(), staticDir)
  if (!fs.existsSync(path.join(root, 'index.html'))) {
    console.error(JSON.stringify({ ts: new Date().toISOString(), level: 'error', msg: 'STATIC_DIR 下无 index.html', root }))
  } else {
    app.use(express.static(root, { index: false, maxAge: '1h' }))
    // SPA 兜底：/mock/*.json 缺失不吞（本地落库数据不在 dist），其余回落 index.html
    app.get(/^\/(?!mock\/).*/, (_req, res) => {
      res.sendFile(path.join(root, 'index.html'))
    })
  }
}

app.use(notFoundHandler)
app.use(errorHandler)

module.exports = app