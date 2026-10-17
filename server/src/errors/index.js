'use strict'

/**
 * 7 类分层异常。code 与 ARCHITECTURE §5.3 一一对应。
 * 401 独占：前端 utils/api.js 收到 401 会 setToken('')，不可与业务错误复用。
 * 0 与 1 永不使用：1 是成功（api/index.js L143 与 utils/api.js L24 硬编码）。
 */
class AppError extends Error {
  constructor(code, message) {
    super(message)
    this.name = this.constructor.name
    this.code = code
    this.expose = true
  }
}

class ValidationError extends AppError {
  constructor(message = '参数校验失败') {
    super(400, message)
  }
}

class AuthError extends AppError {
  constructor(message = '登录已失效，请重新登录') {
    super(401, message)
  }
}

class ForbiddenError extends AppError {
  constructor(message = '无权访问该数据') {
    super(403, message)
  }
}

class NotFoundError extends AppError {
  constructor(message = '资源不存在') {
    super(404, message)
  }
}

class ConflictError extends AppError {
  constructor(message = '状态冲突') {
    super(409, message)
  }
}

class BusinessError extends AppError {
  constructor(message = '业务规则不通过') {
    super(422, message)
  }
}

class DataSourceError extends AppError {
  constructor(message = '数据源不可用') {
    super(503, message)
  }
}

module.exports = {
  AppError,
  ValidationError,
  AuthError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  BusinessError,
  DataSourceError,
}
