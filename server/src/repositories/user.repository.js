'use strict'

/**
 * 用户与账户域数据访问：users / user_addresses / user_sign_status / 邀请。
 */
const db = require('../db')
const { baseRepository } = require('./base.repository')

const USER_COLS =
  'id, username, nickname, mobile, avatar, score, inviter_code, yao_count, huifu_service_charge, sandpay_service_charge'

const users = baseRepository('users', USER_COLS.split(', '))

function findUser(id) {
  if (!id) return null
  return db.queryOne(`SELECT ${USER_COLS} FROM users WHERE id = ?`, [id])
}

/** 登录用：账号（手机号或用户名）匹配。不做密码校验——见 service 层说明 */
function findUserByAccount(account) {
  if (!account) return null
  return db.queryOne(
    `SELECT ${USER_COLS} FROM users WHERE mobile = ? OR username = ? LIMIT 1`,
    [account, account]
  )
}

/** 演示账号：库中仅 2 行，取首个作为无 token 场景的兜底身份 */
function firstUser() {
  return db.queryOne(`SELECT ${USER_COLS} FROM users ORDER BY id ASC LIMIT 1`)
}

/** 手机号是否已存在（注册唯一性校验。库内无唯一索引，只能应用层查） */
function existsMobile(mobile) {
  if (!mobile) return null
  return db.queryOne('SELECT id FROM users WHERE mobile = ? LIMIT 1', [mobile])
}

/**
 * inviter_code 是否已被占用。
 *
 * 该列有唯一索引 uk_users_inviter_code，而**空串也算占用**——
 * 库里 user 4930 的 inviter_code 就是 ''。故注册时若写入 ''，
 * 第一个新用户能建成、第二个必然撞唯一约束（已实测复现）。
 * 生成邀请码前必须查重，不能靠"库里只有 2 个用户"这种假设。
 */
function existsInviterCode(code) {
  if (!code) return null
  return db.queryOne('SELECT id FROM users WHERE inviter_code = ? LIMIT 1', [code])
}

/**
 * 新增用户（注册）。
 * created_at / updated_at 为灌库审计列，写接口统一补 unix 秒，与seed 保持一致。
 */
function insertUser(data) {
  const now = Math.floor(Date.now() / 1000)
  const row = {
    username: data.username,
    nickname: data.nickname,
    mobile: data.mobile,
    avatar: data.avatar,
    score: data.score === undefined ? 0 : data.score,
    inviter_code: data.inviter_code === undefined ? '' : data.inviter_code,
    yao_count: data.yao_count === undefined ? 0 : data.yao_count,
    huifu_service_charge: data.huifu_service_charge === undefined ? 0 : data.huifu_service_charge,
    sandpay_service_charge: data.sandpay_service_charge === undefined ? 0 : data.sandpay_service_charge,
    created_at: now,
    updated_at: now,
  }
  const cols = Object.keys(row)
  const info = db.run(
    `INSERT INTO users (${cols.join(', ')}) VALUES (${db.dialect.inPlaceholders(cols.length)})`,
    cols.map((c) => row[c])
  )
  return { id: db.dialect.insertAndGetId(info), changes: info.changes }
}

const userAddresses = baseRepository('user_addresses', [
  'id',
  'user_id',
  'name',
  'mobile',
  'province',
  'city',
  'area',
  'address',
  'is_default',
])

function listAddresses(userId) {
  return userAddresses.findAll('user_id = ?', [userId], 'is_default DESC, id ASC')
}

const userSignStatus = baseRepository('user_sign_status', [
  'user_id',
  'continuous_days',
  'sign_days',
  'sign_status',
  'crystal_number',
])

function findSignStatus(userId) {
  if (!userId) return null
  return db.queryOne(
    'SELECT user_id, continuous_days, sign_days, sign_status, crystal_number FROM user_sign_status WHERE user_id = ?',
    [userId]
  )
}

/** 积分余额：crystal_number 承载于 user_sign_status（DATABASE.md §13 遗留项已裁决） */
function crystalNumber(userId) {
  const row = findSignStatus(userId)
  return row ? row.crystal_number : 0
}

const signRewardRules = baseRepository('sign_reward_rules', ['id', 'day', 'crystal', 'sign_rule'])

function listSignRewards() {
  return signRewardRules.findAll('', [], 'day ASC')
}

const userInvitations = baseRepository('user_invitations', [
  'id',
  'user_id',
  'invitee_mobile',
  'invite_time',
  'status',
  'remark',
])

function listInvitations(userId, page) {
  const w = ' WHERE user_id = ?'
  const params = [userId]
  const total = userInvitations.countBy('user_id = ?', params)
  const items = db.query(
    'SELECT id, user_id, invitee_mobile, invite_time, status, remark FROM user_invitations' +
      `${w} ORDER BY invite_time DESC, id DESC` + db.dialect.limit(page.pageSize, page.offset),
    params
  )
  return { items, total }
}

function countInvitations(userId) {
  return userInvitations.countBy('user_id = ?', [userId])
}

/** 助力记录 */
const userInvitationAssists = baseRepository('user_invitation_assists', [
  'id',
  'code',
  'user_id',
  'nickname',
  'avatar',
  'assist_time',
  'is_new_user',
  'is_real',
])

function listAssists(code, userId) {
  const where = []
  const params = []
  if (code) {
    where.push('code = ?')
    params.push(code)
  } else if (userId) {
    where.push('user_id = ?')
    params.push(userId)
  }
  const w = where.length ? ` WHERE ${where.join(' AND ')}` : ''
  return db.query(
    'SELECT id, code, user_id, nickname, avatar, assist_time, is_new_user, is_real ' +
      `FROM user_invitation_assists${w} ORDER BY id ASC`,
    params
  )
}

module.exports = {
  findUser,
  findUserByAccount,
  firstUser,
  existsMobile,
  existsInviterCode,
  insertUser,
  listAddresses,
  findSignStatus,
  crystalNumber,
  listSignRewards,
  listInvitations,
  countInvitations,
  listAssists,
}
