'use strict'

/**
 * MySQL adapter（mysql2，按需 require）。
 * 与 scripts/dialect.py 的 DB=mysql 开关语义一致。
 * 注意：本分支在 SQLite 环境下未被集成测试覆盖（ARCHITECTURE §13 遗留项）。
 */
const env = require('../config/env')
const dialect = require('./dialect')
const { DataSourceError } = require('../errors')

dialect.driver = 'mysql'

let pool = null

function getPool() {
  if (pool) return pool
  let mysql
  try {
    mysql = require('mysql2/promise')
  } catch {
    throw new DataSourceError('DB=mysql 但未安装 mysql2 依赖')
  }
  if (!env.mysql.user || !env.mysql.password) {
    throw new DataSourceError('DB=mysql 时 DB_USER / DB_PASSWORD 必须配置')
  }
  pool = mysql.createPool({
    host: env.mysql.host,
    port: env.mysql.port,
    user: env.mysql.user,
    password: env.mysql.password,
    database: env.mysql.database,
    waitForConnections: true,
    connectionLimit: 10, // 只读为主的分析型负载，§3.3 不做池化过度设计
    dateStrings: true,
  })
  return pool
}

async function query(sql, params = []) {
  try {
    const [rows] = await getPool().query(sql, params)
    return rows
  } catch (err) {
    const e = new DataSourceError('数据源不可用')
    e.cause = err
    throw e
  }
}

const queryOne = async (sql, params) => {
  const rows = await query(sql, params)
  return rows.length ? rows[0] : null
}

const run = async (sql, params = []) => {
  try {
    const [result] = await getPool().query(sql, params)
    return { changes: result.affectedRows, lastInsertRowid: result.insertId }
  } catch (err) {
    const e = new DataSourceError('数据源不可用')
    e.cause = err
    throw e
  }
}

const count = async (sql, params = []) => {
  const row = await queryOne(sql, params)
  if (!row) return 0
  const keys = Object.keys(row)
  return keys.length ? Number(row[keys[0]]) || 0 : 0
}

/** 事务包装（mysql2 异步） */
function transaction(fn) {
  return async (...args) => {
    const conn = await getPool().getConnection()
    try {
      await conn.beginTransaction()
      const out = await fn(conn, ...args)
      await conn.commit()
      return out
    } catch (err) {
      await conn.rollback()
      throw err
    } finally {
      conn.release()
    }
  }
}

async function close() {
  if (pool) {
    await pool.end()
    pool = null
  }
}

module.exports = { query, queryOne, run, count, transaction, close, dialect }
