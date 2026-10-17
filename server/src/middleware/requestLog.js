'use strict'

/**
 * 结构化访问日志（ARCHITECTURE §8.2）。
 * 每请求一行：ts, method, path, status, duration_ms, code, uid, ip
 *
 * 刻意不打 request body —— /user/login 的 body 含密码，原始日志记全量 body
 * 是密码泄露最常见的途径。只在 LOG_LEVEL=debug 时记，且必须走白名单脱敏。
 */
const env = require('../config/env')

const DEBUG_SAFE_FIELDS = ['id', 'page', 'limit', 'list_rows', 'type', 'status', 'series_id', 'goods_type']

const LEVELS = { debug: 10, info: 20, warn: 30, error: 40 }

function requestLogger(req, res, next) {
  const start = process.hrtime.bigint()
  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1e6
    const entry = {
      ts: new Date().toISOString(),
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      duration_ms: Math.round(durationMs * 100) / 100,
      code: res.locals && res.locals.respCode !== undefined ? res.locals.respCode : null,
      uid: (req.auth && req.auth.uid) || null,
      ip: req.clientIp || '',
      version: req.clientVersion || null,
    }
    if (env.logLevel === 'debug' && req.params && typeof req.params === 'object') {
      const safe = {}
      for (const k of DEBUG_SAFE_FIELDS) {
        if (req.params[k] !== undefined) safe[k] = req.params[k]
      }
      entry.params = safe
    }
    const line = JSON.stringify(entry)
    if (res.statusCode >= 500) console.error(line)
    else if ((LEVELS[env.logLevel] || 20) >= LEVELS.info) console.log(line)
  })
  next()
}

module.exports = requestLogger
