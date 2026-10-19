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

/**
 * 我的页「资产/收益」统计块（getUserInfo 的 userinfo.statistics）。
 *
 * 源站契约（getUserInfo_full 实测）：
 *   statistics:{invited_count, buy_count, sale_count, join_day, total_assets}
 * 源站账号已清空（实测全 0），无口径可抄；以下按本项目数据**诚实派生**，
 * 每一项的推导依据逐条注释，不拿业务值冒充：
 *   - invited_count：user_invitations 行数（我邀请的好友记录）
 *   - buy_count：orders 中 order_type=1（买入单）行数
 *   - sale_count：market_listings 中 status=2（E-LISTING-STATUS 已成交）行数
 *   - join_day：(now - users.created_at) 向下取整天
 *   - total_assets：当前持有（status IN (1,2) 且 has_sold=0 且 count>0）的
 *     Σ(count × price)——与我的页藏品 tab 同口径，UI 标签即「总资产预估」。
 *     注意这是买入价口径的估值，非源站服务端算法（不可见），已在 README 标注。
 */
function userStatistics(userId) {
  const invited = userInvitations.countBy('user_id = ?', [userId])
  const buy = db.queryOne(
    "SELECT COUNT(*) AS c FROM orders WHERE user_id = ? AND order_type = 1",
    [userId]
  )
  const sale = db.queryOne(
    'SELECT COUNT(*) AS c FROM market_listings WHERE sale_user_id = ? AND status = 2',
    [userId]
  )
  const asset = db.queryOne(
    "SELECT COALESCE(SUM(c.count * c.price), 0) AS s FROM user_collections c " +
      'WHERE c.user_id = ? AND c.status IN (1, 2) AND c.has_sold = 0 AND c.count > 0',
    [userId]
  )
  const user = db.queryOne('SELECT created_at FROM users WHERE id = ?', [userId])
  const createdAt = user && user.created_at ? Number(user.created_at) : null
  const joinDay = createdAt
    ? Math.max(0, Math.floor((Math.floor(Date.now() / 1000) - createdAt) / 86400))
    : 0
  return {
    invited_count: invited,
    buy_count: Number(buy && buy.c) || 0,
    sale_count: Number(sale && sale.c) || 0,
    join_day: joinDay,
    total_assets: Number(asset && asset.s) || 0,
  }
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
  userStatistics,
  listAssists,
}
