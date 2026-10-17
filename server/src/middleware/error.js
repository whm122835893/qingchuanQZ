'use strict'

/**
 * 异常 → 错误码映射，全项目唯一出口（ARCHITECTURE §5.2）。
 *
 * 铁律：
 *  - controller 不写 try/catch，错误映射只允许有一个地方
 *  - 500 的 msg 必须是固定文案，绝不返回 err.message（会泄露表名列名）
 *  - HTTP 状态码保持 200，错误靠 body 里的 code 表达（源站如此，前端只看 body）
 */
const responder = require('./respond')
const env = require('../config/env')
const { AppError } = require('../errors')

const FIXED_500_MSG = '服务异常'

function logError(err, req) {
  const level = err.code === 500 ? 'error' : 'warn'
  const entry = {
    ts: new Date().toISOString(),
    level,
    code: err.code || 500,
    msg: FIXED_500_MSG,
    method: req.method,
    path: req.originalUrl,
    uid: (req.auth && req.auth.uid) || null,
    err: err.message,
  }
  if (err.rawCode) entry.rawCode = err.rawCode
  console[level === 'error' ? 'error' : 'warn'](
    JSON.stringify(env.logLevel === 'debug' ? { ...entry, stack: err.stack } : entry)
  )
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, _next) {
  if (res.headersSent) return

  if (err instanceof AppError) {
    logError(err, req)
    return responder.fail(res, err.code, err.message, null)
  }

  // express.json 的 body 解析失败
  if (err && err.type === 'entity.parse.failed') {
    return responder.fail(res, 400, '请求体不是合法 JSON', null)
  }

  const wrapped = new Error(FIXED_500_MSG)
  wrapped.code = 500
  wrapped.original = err
  logError(wrapped, req)
  return responder.fail(res, 500, FIXED_500_MSG, null)
}

/** 404 兜底：未注册路径 */
function notFoundHandler(req, res) {
  return responder.fail(res, 404, '接口不存在', null)
}

module.exports = { errorHandler, notFoundHandler, FIXED_500_MSG }
