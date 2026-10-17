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
  listAddresses,
  findSignStatus,
  crystalNumber,
  listSignRewards,
  listInvitations,
  countInvitations,
  listAssists,
}
