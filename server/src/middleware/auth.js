'use strict'

/**
 * token 解析 → req.user。白名单放行（ARCHITECTURE §4.2）。
 *
 * 从 `token` 头读取，不用 `Authorization: Bearer` —— 前端 remoteRequest 已硬编码。
 * version头只记日志，不做校验（校验会引入源站未证实的约束）。
 */
const jwt = require('jsonwebtoken')
const env = require('../config/env')
const { AuthError } = require('../errors')

/** 免鉴权白名单（30 条，按 endpoint_meta.py 的 auth 字段判定） */
const PUBLIC_PATHS = new Set([
  '/index/getConfig',
  '/banner/show/getBanner',
  '/index/afficheList',
  '/index/affichetypelist',
  '/index/getSeries',
  '/index/afficheDetail',
  '/index/newsDetail',
  '/addons/diypage/index',
  '/market/market/getMarketList',
  '/market/market/seriesGoodsList',
  '/product/product/detail',
  '/product/product/rule',
  '/box/blind_box/list',
  '/user/login',
  '/user/register',
  '/market/trade/collectionDetail',
  '/kline/info/detail',
  '/compound/compound/list',
  '/compound/compound/scheme',
  '/lottery/lottery/info',
  '/lottery/lottery/rule',
  '/activity/draw/info',
  '/activeSelected/list',
  '/shequ/rumor/info',
  '/rank/masterRank/list',
  '/rank/userBuy/list',
  '/leaderboard/leaderboard/goods',
  '/marketCapRanking/marketCapRanking/list',
  '/community/chat/messageList',
  // 动态路径：/market/market/MarketDetail/ids/:id 亦为公开
])

function isPublic(path) {
  if (PUBLIC_PATHS.has(path)) return true
  if (/^\/market\/market\/MarketDetail\/ids\/[^/]+$/.test(path)) return true
  return false
}

/** 解析请求体 + query，兼容前端 param 走 query string 的约定 */
function readParams(req) {
  const body = req.body && typeof req.body === 'object' ? req.body : {}
  const query = req.query && typeof req.query === 'object' ? req.query : {}
  return { ...query, ...body }
}

function sign(payload) {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpiresIn })
}

function verify(token) {
  return jwt.verify(token, env.jwtSecret)
}

/**
 * 挂 req.auth 与 req.input（合并 body/query），不抛错。
 *
 * 刻意不写 req.params：Express 4 在路由匹配时会用 route params 覆写 req.params，
 * body/query 会被静默丢弃（表现为「参数 id 缺失」）。
 */
function attach(req, _res, next) {
  req.input = readParams(req)
  req.clientVersion = req.headers.version || null
  req.clientIp =
    (req.headers['x-forwarded-for'] || '').toString().split(',')[0].trim() ||
    req.socket.remoteAddress ||
    ''
  const token = req.headers.token
  if (token) {
    try {
      const payload = verify(String(token))
      req.auth = { uid: payload.uid, nickname: payload.nickname || '' }
    } catch {
      req.auth = null
      req.authInvalid = true
    }
  } else {
    req.auth = null
  }
  next()
}

/** 强制鉴权：39 条需登录接口使用 */
function requireAuth(req, _res, next) {
  if (req.auth && req.auth.uid) return next()
  return next(new AuthError())
}

/** 鉴权 + 当前用户 id（service 层参数） */
function currentUid(req) {
  return req.auth ? req.auth.uid : null
}

module.exports = { attach, requireAuth, isPublic, readParams, sign, verify, currentUid, PUBLIC_PATHS }
