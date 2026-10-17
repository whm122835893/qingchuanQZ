'use strict'

/**
 * 生成本地调试 token（仅用于契约 diff / 鉴权矩阵自检）。
 * 用法：node scripts/dev-token.js [uid] [nickname]
 * 生产环境不存在此脚本的调用方——登录接口本轮未实现，无任何线上签发路径。
 */
const { sign } = require('../src/middleware/auth')

const uid = Number.parseInt(process.argv[2] || '22291', 10)
const nickname = process.argv[3] || '川QvHY78u6'
process.stdout.write(sign({ uid, nickname }))
