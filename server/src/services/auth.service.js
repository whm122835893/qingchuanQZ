'use strict'

/**
 * 登录 / 注册 service（写接口，本轮实现）。
 *
 * ── 重要声明：演示环境不做密码校验（方案 A）────────────────────
 * users 表无 password_hash 列（源站从不返回密码，无从获取），
 * 因此本实现**不校验 password**：任何非空密码都能登录。
 * 这是「演示环境不做鉴权」的语义，绝不能被理解为密码已校验。
 * token 是真实 JWT 签名（env.jwtSecret），后续 39 条需鉴权接口依赖它。
 * 若要启用真实密码校验，需先批 schema 变更新增 users.password_hash。
 * ────────────────────────────────────────────────────────────
 *
 * 账号不存在时返回 404 而非新建用户：库里只有 2 个真实用户，
 * 为任意输入编造用户行会污染灌库基线（48 表 341 行）。
 */

const crypto = require('crypto')
const db = require('../db')
const userRepo = require('../repositories/user.repository')
const { sign } = require('../middleware/auth')
const { ValidationError, NotFoundError, ConflictError } = require('../errors')

/** 登录响应 msg：mock user.json 逐字为「登录成功」 */
const LOGIN_MSG = '登录成功'

/**
 * 登录。入参 account（手机号或用户名）+ password。
 * 校验顺序：参数 → 账号存在性 → 签发 token。密码仅做非空校验。
 */
async function login(params) {
  const account = requireString(params.account, 'account', 64)
  requireString(params.password, 'password', 128)

  const user = await userRepo.findUserByAccount(account)
  // 不抛 401：401 独占语义是「token 失效，前端会清 token」，
  // 登录失败时前端尚未持有 token，用 401 会误导前端清空刚签发的凭证。
  if (!user) throw new NotFoundError('账号不存在')

  return { userinfo: await buildUserInfo(user, sign({ uid: user.id, nickname: user.nickname || '' })) }
}

/**
 * 注册。入参 mobile + password（+ code 短信码，演示环境不校验）。
 *
 * 幂等口径：mobile 是唯一键，重复注册是**真实冲突**而非重试，
 * 故返回 409（区别于求购/挂单的"返回已有记录"——重复点击不是错误，
 * 但重复注册一个账号是）。手机号存在性检查与插入同处一个事务，
 * 否则并发下两个请求都能通过 existsMobile 检查并都去插入。
 *
 * 库内 mobile 无唯一索引（只有 idx_users_mobile 普通索引），
 * 故唯一性完全依赖本处的应用层检查 + 事务，故检查必须在事务内。
 */
async function register(params) {
  const mobile = requireString(params.mobile, 'mobile', 32)
  requireString(params.password, 'password', 128)

  // username 取手机号；nickname 源站为脱敏串，此处沿用账号形态而非编造中文名
  const created = db.transaction(() => {
    if (userRepo.existsMobile(mobile)) throw new ConflictError('该手机号已注册')
    const info = userRepo.insertUser({
      username: mobile,
      nickname: mobile,
      mobile,
      avatar: '/defautAvatar.png',
      score: 0,
      // 邀请码必须唯一：空串会撞 uk_users_inviter_code（4930 已占位）
      inviter_code: generateInviterCode(),
      yao_count: 0,
      huifu_service_charge: 0,
      sandpay_service_charge: 0,
    })
    return info
  })()

  const user = await userRepo.findUser(created.id)
  return { userinfo: await buildUserInfo(user, sign({ uid: user.id, nickname: user.nickname || '' })) }
}

/**
 * 生成未被占用的邀请码。
 *
 * 格式对齐库中既有值 E99022291：E + 8 位数字。
 * 用 crypto 而非 Math.random：邀请码是可被他人输入的注册入口，
 * 可预测序列意味着邀请码可被枚举撞库。
 */
function generateInviterCode() {
  for (let i = 0; i < 10; i++) {
    const code = 'E' + String(crypto.randomInt(100000000))
    if (!userRepo.existsInviterCode(code)) return code
  }
  throw new ConflictError('邀请码生成失败，请重试')
}

/** userinfo 组装：字段名与顺序逐字对齐 mock user.json */
async function buildUserInfo(user, token) {
  return {
    id: user.id,
    username: user.username,
    nickname: user.nickname,
    mobile: user.mobile,
    avatar: user.avatar,
    score: user.score === null ? 0 : user.score,
    inviter_code: user.inviter_code || '',
    yao_count: user.yao_count === null ? 0 : user.yao_count,
    huifu_service_charge: user.huifu_service_charge === null ? 0 : user.huifu_service_charge,
    sandpay_service_charge: user.sandpay_service_charge === null ? 0 : user.sandpay_service_charge,
    token,
  }
}

function requireString(value, name, max) {
  if (value === undefined || value === null || String(value).trim() === '') {
    throw new ValidationError(`参数 ${name} 缺失`)
  }
  return String(value).trim().slice(0, max)
}

module.exports = { login, register, LOGIN_MSG }