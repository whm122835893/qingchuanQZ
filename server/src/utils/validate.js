'use strict'

/**
 * 参数校验小工具。抛ValidationError（400）。
 * 白名单验证：未声明的字段不进入下游。
 */
const { ValidationError } = require('../errors')

function requireId(value, name = 'id') {
  const n = Number.parseInt(value, 10)
  if (!Number.isFinite(n) || n <= 0) throw new ValidationError(`参数 ${name} 缺失或非法`)
  return n
}

function optionalId(value, name = 'id') {
  if (value === undefined || value === null || value === '') return null
  return requireId(value, name)
}

/** 分页参数：`limit` > `list_rows` > 默认（§6.3）；page 从 1 起；pageSize 上限 100 */
function pagination(params, env) {
  const rawSize =
    params.limit !== undefined && params.limit !== null && params.limit !== ''
      ? params.limit
      : params.list_rows
  let pageSize = Number.parseInt(rawSize, 10)
  if (!Number.isFinite(pageSize) || pageSize <= 0) pageSize = env.pageSizeDefault
  if (pageSize > env.pageSizeMax) pageSize = env.pageSizeMax

  let page = Number.parseInt(params.page, 10)
  if (!Number.isFinite(page) || page < 1) page = 1

  return { page, pageSize, offset: (page - 1) * pageSize }
}

/** 由 total/pageSize 计算 last_page；total=0 时源站表现为 0，保持 */
function pageMeta(total, page, pageSize) {
  const lastPage = pageSize > 0 ? Math.ceil(total / pageSize) : 0
  return { total, page, pageSize, lastPage }
}

/** 可选枚举校验（不在枚举内则忽略该条件，不报错——源站脏数据枚举外值存在） */
function optionalEnum(value, allowed) {
  if (value === undefined || value === null || value === '') return null
  return allowed.includes(Number(value)) ? Number(value) : null
}

function optionalString(value, max = 200) {
  if (value === undefined || value === null) return null
  const s = String(value).trim()
  if (!s) return null
  return s.slice(0, max)
}

/**
 * 路径段参数取值。
 * Express 4 路由匹配后 req.params 只剩路径段（body/query 已被丢弃），
 * 故body/query 合并在 req.input；路径段优先。
 */
function routeId(req, name = 'id') {
  const fromPath = req.params && req.params[name]
  return fromPath === undefined ? req.input[name] : fromPath
}

module.exports = { requireId, optionalId, pagination, pageMeta, optionalEnum, optionalString, routeId }
