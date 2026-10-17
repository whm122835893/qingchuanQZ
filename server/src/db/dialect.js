'use strict'

/**
 * 方言差异收敛点（ARCHITECTURE §3.2）。
 * 只暴露 6 个方法；其余方言差异一律不允许出现在 repository 里。
 */
const dialect = {
  driver: 'sqlite',

  /** 分页子句：SQLite `LIMIT l OFFSET o` / MySQL `LIMIT o, l` —— 唯一必须在 SQL 层处理的差异 */
  limit(limit, offset) {
    const l = Math.max(0, Number(limit) || 0)
    const o = Math.max(0, Number(offset) || 0)
    if (this.driver === 'mysql') return ` LIMIT ${o}, ${l}`
    return ` LIMIT ${l} OFFSET ${o}`
  },

  /** 布尔列出入参 */
  bool(v) {
    return v ? 1 : 0
  },

  /** INSERT 自增 id（写操作阶段使用） */
  insertAndGetId(result) {
    return result.lastInsertRowid
  },

  /** IN 查询占位符 */
  inPlaceholders(n) {
    return new Array(n).fill('?').join(',')
  },

  /** JSON 列解析 */
  jsonParse(s, fallback) {
    if (s === null || s === undefined || s === '') return fallback === undefined ? null : fallback
    if (typeof s === 'object') return s
    try {
      return JSON.parse(s)
    } catch {
      return fallback === undefined ? null : fallback
    }
  },

  /**
   * 金额出参：字符串透传，禁止 float（§3.2 / DATABASE.md §6.4）。
   * DB 列为 DECIMAL，better-sqlite3 返回 number；这里只做「序列化为字符串」，
   * 不做任何算术——算术留在 SQL 侧（ROUND）或业务明确要求处。
   */
  money(v) {
    if (v === null || v === undefined) return null
    if (typeof v === 'string') return v
    return String(v)
  },
}

module.exports = dialect
