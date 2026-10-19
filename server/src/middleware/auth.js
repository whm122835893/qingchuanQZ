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
  const token = readToken(req)
  // 取出后立即剔除，避免 body 里的 token 混进业务参数（service 只看业务字段）
  if (req.input && req.input.token !== undefined) delete req.input.token
  if (token) {
    try {
      const payload = verify(String(token))
      req.auth = { uid: payload.uid, nickname: payload.nickname || '' }
    } catch (e) {
      req.auth = null
      req.authInvalid = true
      // 诊断留痕：verify 失败曾长期被静默吞掉，导致线上「token 有效却全 401」
      // 无从定位。只记错误名不含 token 内容。
      req.authError = e && e.name ? String(e.name) : 'VerifyError'
    }
  } else {
    req.auth = null
  }
  next()
}

/**
 * 取 token，三种来源按可靠性排序：
 *
 *   1) 请求体/查询串里的 `token` —— **发布环境唯一可靠的通路**
 *   2) `Authorization: Bearer <jwt>` —— 直连/本地可用
 *   3) `token` 头 —— 源站约定，前端历史用法
 *
 * 【为什么 body 优先】
 * 单端口部署上线后，全部需鉴权接口返 401，而同一 token 用同一 .env 的
 * secret 可正常 verify、iat/exp 均正常。用诊断端点抓到实证：
 *   - 客户端发的 `Authorization` 被网关**覆盖**成平台令牌
 *     （decode 后 iss=cloudstudio.net、user_nickname=体验用户、长度 379）
 *   - 客户端发的自定义 `token` 头被网关**剥离**（has_token_header=false）
 * 即 HTTP 头在该链路上不可作为凭据通道，只有 body 能原样到达。
 * 头方式保留给本地/直连调试，不影响既有调用方。
 */
function readToken(req) {
  const fromInput = req.input && req.input.token
  if (fromInput) return fromInput
  const auth = req.headers.authorization
  if (auth) {
    const m = /^Bearer\s+(.+)$/i.exec(String(auth).trim())
    if (m) return m[1]
  }
  return req.headers.token || null
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
