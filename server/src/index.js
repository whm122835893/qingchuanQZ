'use strict'

/**
 * 入口：仅做装配与listen，不含业务逻辑（ARCHITECTURE §9）。
 */
const env = require('./config/env')
const db = require('./db')
const app = require('./app')

const server = app.listen(env.port, env.host, () => {
  console.log(
    JSON.stringify({
      ts: new Date().toISOString(),
      level: 'info',
      msg: 'server started',
      host: env.host,
      port: env.port,
      driver: env.driver,
    })
  )
})

function shutdown(signal) {
  console.log(JSON.stringify({ ts: new Date().toISOString(), level: 'info', msg: 'shutting down', signal }))
  server.close(() => {
    db.close()
    process.exit(0)
  })
  //兜底：连接卡住时强制退出，避免容器停不下来
  setTimeout(() => process.exit(1), 5000).unref()
}

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))

module.exports = server