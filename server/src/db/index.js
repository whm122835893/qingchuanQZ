'use strict'

/**
 * 连接管理：依据 DB 环境变量二选一，对上暴露 query/queryOne/run/count/transaction。
 * 单例连接 + 进程退出时关闭，不用连接池（ARCHITECTURE §3.3）。
 */
const env = require('../config/env')
const { DataSourceError } = require('../errors')

const adapter = env.driver === 'mysql' ? require('./mysql') : require('./sqlite')

/** SQLite 为同步、MySQL 为异步；这里统一为「可能返回 Promise」的导出，
 *  service 层统一 await，SQLite 下 await 非 Promise 无副作用。 */
module.exports = {
  driver: env.driver,
  dialect: adapter.dialect,
  query: adapter.query,
  queryOne: adapter.queryOne,
  run: adapter.run,
  count: adapter.count,
  transaction: adapter.transaction,
  close: adapter.close,

  /** 就绪探针用：能否连通且关键表可查 */
  ping() {
    try {
      const r = adapter.queryOne('SELECT COUNT(*) AS c FROM products')
      return { ok: !!r, driver: env.driver }
    } catch (err) {
      const e = new DataSourceError('数据源不可用')
      e.cause = err
      throw e
    }
  },

  /** 元信息：各表行数，供 /health/meta 核对灌库结果 */
  tableCounts() {
    const tables = adapter.query(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
    )
    const out = {}
    let total = 0
    for (const t of tables) {
      const r = adapter.queryOne(`SELECT COUNT(*) AS c FROM "${t.name}"`)
      const n = r ? Number(r.c) || 0 : 0
      out[t.name] = n
      total += n
    }
    return { tables: out, tableCount: tables.length, rowCount: total }
  },
}
