'use strict'

/**
 * CORS 跨域中间件（手写，不引 `cors` 包）。
 *
 * 为什么手写：
 * 1) 本项目依赖被刻意锁在 3 个（express / better-sqlite3 / jsonwebtoken），
 *    `cors` 唯一能力就是设几个响应头 + 拦 OPTIONS，引入第 4 个依赖不划算；
 * 2) 需要「白名单外来源不返回 CORS 头但请求照常处理」这一非标准行为，
 *    `cors` 的 origin 回调只能返回 false（= 不设头，行为其实一致），
 *    但要拿到 Allow-Headers 里的 token 白名单仍得自己配，整体半自定义不如写全；
 * 3) 60 行内可控，无隐藏行为，便于 code review 与安全审计。
 *
 * 关键约束（前端 utils/api.js remoteRequest 硬编码）：
 *   - 请求头固定带 content-type / version / token → Allow-Headers 必须含这三项；
 *   - 携带自定义头会触发预检 → OPTIONS 必须尽早结束，不能落进路由；
 *   - 不用 `*`（前端可能后续开 credentials，且 `*` 不允许与凭证共用）。
 */
const env = require('../config/env')

/** 默认白名单：前端 vite dev server 端口 */
const DEFAULT_ORIGINS = ['http://localhost:5173']

/** 允许的方法：覆盖前端 remoteRequest 用的 POST/GET/PUT/DELETE + 预检自身 */
const ALLOW_METHODS = 'GET,POST,PUT,PATCH,DELETE,OPTIONS'

/** 允许的请求头：前三项为前端硬编码，后两项为通用补充 */
const ALLOW_HEADERS = 'Content-Type,Version,Token,Authorization,X-Requested-With'

/** 预检结果缓存秒数，减少重复 OPTIONS */
const MAX_AGE = '86400'

/** 从 CORS_ORIGINS 读取逗号分隔白名单；未配置则用默认本地 dev server */
function allowedOrigins() {
  const raw = env.corsOrigins
  const list = String(raw && raw.length ? raw : DEFAULT_ORIGINS.join(','))
    .split(',')
    .map((o) => o.trim().replace(/\/$/, ''))
    .filter(Boolean)
  return new Set(list)
}

const whitelist = allowedOrigins()

/** 是否命中白名单；未命中返回 null（调用方据此跳过 CORS 头） */
function matchOrigin(origin) {
  if (!origin) return null
  const normalized = String(origin).trim().replace(/\/$/, '')
  return whitelist.has(normalized) ? normalized : null
}

function cors(req, res, next) {
  const origin = matchOrigin(req.headers.origin)

  // 命中白名单才写 CORS 头；未命中则一个头都不写，
  // 由浏览器自行拦截 —— 服务端不替浏览器做拒绝判断，仍正常处理请求。
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Access-Control-Allow-Methods', ALLOW_METHODS)
    res.setHeader('Access-Control-Allow-Headers', ALLOW_HEADERS)
    res.setHeader('Access-Control-Max-Age', MAX_AGE)
    res.setHeader('Vary', 'Origin')
  }

  // 预检：立即结束，绝不进入路由与鉴权（否则会先撞 auth 返回 401）
  if (req.method === 'OPTIONS') {
    res.setHeader('Content-Length', '0')
    return res.sendStatus(origin ? 204 : 200)
  }

  return next()
}

module.exports = cors
module.exports.whitelist = whitelist
