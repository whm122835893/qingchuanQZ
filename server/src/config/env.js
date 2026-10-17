'use strict'

/**
 * 环境变量读取与校验 —— 全项目 fail-fast 的唯一出口（ARCHITECTURE §7）。
 * 不引dotenv：Node 20+ 有 process.loadEnvFile，但为兼容 18 且保持零依赖，
 * 这里用一个 30 行的极简解析器，只认 KEY=VALUE 与 # 注释。
 */
const fs = require('fs')
const path = require('path')

function loadDotEnv() {
  const file = path.resolve(__dirname, '../../.env')
  if (!fs.existsSync(file)) return
  const text = fs.readFileSync(file, 'utf8')
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    const eq = line.indexOf('=')
    if (eq < 0) continue
    const key = line.slice(0, eq).trim()
    let val = line.slice(eq + 1).trim()
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1)
    }
    if (process.env[key] === undefined) process.env[key] = val
  }
}

loadDotEnv()

function str(key, fallback = '') {
  const v = process.env[key]
  return v === undefined || v === '' ? fallback : v
}

function int(key, fallback) {
  const v = Number.parseInt(process.env[key], 10)
  return Number.isFinite(v) ? v : fallback
}

const env = {
  port: int('PORT', 3000),
  host: str('HOST', '0.0.0.0'),
  driver: str('DB', 'sqlite'),
  sqlitePath: str('SQLITE_PATH', './data/qingchuan.db'),
  mysql: {
    host: str('DB_HOST', '127.0.0.1'),
    port: int('DB_PORT', 3306),
    user: str('DB_USER', 'root'),
    password: str('DB_PASSWORD', ''),
    database: str('DB_NAME', 'qingchuan'),
  },
  jwtSecret: str('JWT_SECRET', ''),
  jwtExpiresIn: str('JWT_EXPIRES_IN', '7d'),
  /** CORS 白名单，逗号分隔；空则回落到 http://localhost:5173（middleware/cors.js） */
  corsOrigins: str('CORS_ORIGINS', 'http://localhost:5173'),
  logLevel: str('LOG_LEVEL', 'info'),
  pageSizeMax: int('PAGE_SIZE_MAX', 100),
  pageSizeDefault: int('PAGE_SIZE_DEFAULT', 15),
}

// fail-fast：JWT_SECRET 为空时用默认值启动 = 任何人都能伪造 token（§4.3）
if (!env.jwtSecret) {
  console.error(
    '[FATAL] JWT_SECRET 未设置。拒绝以空密钥启动——那等于任何人都能伪造 token。\n' +
      '        生成方式：node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'base64url\'))"'
  )
  process.exit(1)
}

module.exports = env
