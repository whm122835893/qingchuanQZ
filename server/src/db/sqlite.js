'use strict'

/**
 * SQLite adapter（better-sqlite3）。同步 API，事务处理最简。
 */
const fs = require('fs')
const path = require('path')
const Database = require('better-sqlite3')
const env = require('../config/env')
const dialect = require('./dialect')
const { DataSourceError } = require('../errors')

dialect.driver = 'sqlite'

/** 项目根目录（server/ 的父目录），相对路径的默认基准 */
const PROJECT_ROOT = path.resolve(__dirname, '../../..')

/**
 * 相对路径自动解析：部署时环境变量填相对路径是常态，不能要求调用方必须给绝对路径。
 *
 * 依次尝试三个基准，取第一个真实存在的文件：
 *   1) 项目根目录    —— 与默认 SQLITE_PATH=./data/qingchuan.db 的语义一致
 *   2) 进程 cwd      —— 兼容 `SQLITE_PATH=../data/x.db` 这类按启动位置书写的相对路径
 *   3) server/ 目录  —— 兼容从 server/ 内书写相对路径
 * 都不存在时返回项目根下的路径，交由上层报「文件不存在」并给出可读路径。
 */
function resolvePath() {
  const p = env.sqlitePath
  if (path.isAbsolute(p)) return p

  const bases = [PROJECT_ROOT, process.cwd(), path.resolve(__dirname, '../..')]
  for (const base of bases) {
    const candidate = path.resolve(base, p)
    if (fs.existsSync(candidate)) return candidate
  }
  return path.resolve(PROJECT_ROOT, p)
}

let conn = null

function connection() {
  if (conn) return conn
  const file = resolvePath()
  if (!fs.existsSync(file)) {
    throw new DataSourceError(`SQLite 文件不存在: ${file}`)
  }
  conn = new Database(file)
  conn.pragma('journal_mode = WAL')
  conn.pragma('foreign_keys = OFF') // 库内为弱引用（DATABASE.md §5），不建 FK
  return conn
}

/** 查询多行 */
function query(sql, params = []) {
  try {
    return connection().prepare(sql).all(params)
  } catch (err) {
    throw wrap(err)
  }
}

/** 查询单行，无匹配返回 null（不抛 404——是否 404 由上层判定） */
function queryOne(sql, params = []) {
  const rows = query(sql, params)
  return rows.length ? rows[0] : null
}

/** 写操作，返回 { changes, lastInsertRowid } */
function run(sql, params = []) {
  try {
    const info = connection().prepare(sql).run(params)
    return { changes: info.changes, lastInsertRowid: info.lastInsertRowid }
  } catch (err) {
    throw wrap(err)
  }
}

/** COUNT 查询 */
function count(sql, params = []) {
  const row = queryOne(sql, params)
  if (!row) return 0
  const keys = Object.keys(row)
  return keys.length ? Number(row[keys[0]]) || 0 : 0
}

/** 事务 */
function transaction(fn) {
  return connection().transaction(fn)
}

function close() {
  if (conn) {
    conn.close()
    conn = null
  }
}

function wrap(err) {
  const e = new DataSourceError('数据源不可用')
  e.cause = err
  e.rawCode = err.code
  return e
}

module.exports = { query, queryOne, run, count, transaction, close, dialect }
