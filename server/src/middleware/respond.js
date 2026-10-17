'use strict'

/**
 * 统一响应封装 + 5 种responder（ARCHITECTURE §2.1 / §6.2）。
 *
 * 为什么必须有 responder：前端按 5 种不同形状硬解析 data。若让每个 controller
 * 自己拼 JSON，封装逻辑就散落各处，漏改一处即整页白屏。收拢到一处可查可测。
 *
 * code=1 是成功（utils/api.js L24 `if (res.code === 1)`）。0 与 400以下皆为错误。
 */

/** 成功码。源站硬约定，不可改 */
const SUCCESS = 1

function now() {
  return new Date().toISOString()
}

function envelope(code, msg, data) {
  return { code, msg, data: data === undefined ? null : data, time: now() }
}

const responder = {
  /** D 单对象：`data:{...}` */
  single(res, data, msg = 'ok') {
    return res.json(envelope(SUCCESS, msg, data === undefined ? null : data))
  },

  /** A 裸数组：`data:[]` */
  bareList(res, items, msg = 'ok') {
    return res.json(envelope(SUCCESS, msg, Array.isArray(items) ? items : []))
  },

  /** B 标准分页：`{total,per_page,current_page,last_page,data:[]}`。perPage 可覆盖类型（源站个别接口是字符串） */
  standardPagination(res, page, msg = 'ok') {
    return res.json(
      envelope(SUCCESS, msg, {
        total: page.total,
        per_page: page.perPage === undefined ? page.pageSize : page.perPage,
        current_page: page.page,
        last_page: page.lastPage,
        data: page.items || [],
      })
    )
  },

  /**
   * C 精简分页：`{total,data:[]}`。
   * 变体：userCollectionList 为 `{total,current_page,last_page,data}`，
   *      invitationRecord 列表键为 `list` 而非 `data`。
   * 这两处由 opts 显式声明，不靠隐式猜测。
   */
  slimPagination(res, page, msg = 'ok', opts = {}) {
    const body = { total: page.total }
    if (opts.withPageMeta) {
      body.current_page = page.page
      body.last_page = page.lastPage
    }
    body[opts.listKey || 'data'] = page.items || []
    return res.json(envelope(SUCCESS, msg, body))
  },

  /** E 嵌套混合：service 直接给出完整对象，responder 只做外壳 */
  nested(res, data, msg = 'ok') {
    return res.json(envelope(SUCCESS, msg, data === undefined ? null : data))
  },

  /** 错误（仅供 error 中间件与健康检查使用） */
  fail(res, code, msg, data = null, httpStatus = 200) {
    return res.status(httpStatus).json(envelope(code, msg, data))
  },

  envelope,
  SUCCESS,
}

module.exports = responder
