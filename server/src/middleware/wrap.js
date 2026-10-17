'use strict'

/**
 * async 控制器包装。
 *
 * Express 4 不会捕获 async 函数返回的 rejected Promise——不包装的话，
 * service 抛出的异常会变成 unhandledRejection 并直接终止进程（而不是走 error 中间件）。
 * 这是 Express 4 的已知陷阱，不是本项目特例。
 */

/**
 * @param {Function} handler async (req, res) => void
 * @returns {Function} (req, res, next) => void
 */
function wrap(handler) {
  return function wrapped(req, res, next) {
    Promise.resolve(handler(req, res, next)).catch(next)
  }
}

module.exports = { wrap }