'use strict'

/**
 * baseRepository：通用单表 CRUD。SQL 只出现在 repositories 层（ARCHITECTURE §2.1）。
 */
const db = require('../db')

/**
 * @param {string} table 表名
 * @param {string[]} cols  允许读写的列白名单（防注入 & 防脏字段直出）
 */
function baseRepository(table, cols) {
  const colList = cols.map((c) => `"${c}"`).join(', ')

  return {
    table,

    findById(id) {
      return db.queryOne(`SELECT ${colList} FROM "${table}" WHERE id = ?`, [id])
    },

    /** 单条件列表，orderBy 形如 'id DESC'（由调用方写死，不接受外部输入） */
    findAll(where = '', params = [], orderBy = 'id ASC', limit = null) {
      const sql =
        `SELECT ${colList} FROM "${table}"` +
        (where ? ` WHERE ${where}` : '') +
        (orderBy ? ` ORDER BY ${orderBy}` : '') +
        (limit ? db.dialect.limit(limit.pageSize, limit.offset) : '')
      return db.query(sql, params)
    },

    findOneBy(where, params = []) {
      return db.queryOne(
        `SELECT ${colList} FROM "${table}" WHERE ${where} LIMIT 1`,
        params
      )
    },

    countBy(where = '', params = []) {
      return db.count(
        `SELECT COUNT(*) AS c FROM "${table}"` + (where ? ` WHERE ${where}` : ''),
        params
      )
    },

    insert(data) {
      const keys = cols.filter((c) => data[c] !== undefined)
      if (!keys.length) return { changes: 0, lastInsertRowid: null }
      const sql =
        `INSERT INTO "${table}" (${keys.map((k) => `"${k}"`).join(', ')}) ` +
        `VALUES (${db.dialect.inPlaceholders(keys.length)})`
      return db.run(
        sql,
        keys.map((k) => data[k])
      )
    },

    updateById(id, data) {
      const keys = cols.filter((c) => data[c] !== undefined)
      if (!keys.length) return { changes: 0 }
      const sql =
        `UPDATE "${table}" SET ${keys.map((k) => `"${k}" = ?`).join(', ')} WHERE id = ?`
      return db.run(sql, [...keys.map((k) => data[k]), id])
    },
  }
}

module.exports = { baseRepository }
