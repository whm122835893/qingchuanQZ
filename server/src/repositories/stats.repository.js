'use strict'

/**
 * 统计与分销域数据访问：rank_snapshots / rebate_profiles / rebate_invites / regift_records。
 *
 * rank_type 枚举见 DATABASE.md §4 E-RANK-TYPE：
 * user_buy / master / product_buy / draw / rebate。
 */
const db = require('../db')

const RANK_COLS =
  'id, rank_type, user_id, product_id, nickname, avatar, score, secondary_score, count, event_time, snapshot_time'

/**
 * 榜单快照。rankType 由 service 白名单传入（不直接取用户输入）。
 * product_id 为空的行是用户榜（用户榜无产品维度），返回时该字段为 null。
 */
function listRankSnapshots({ rankType = null, userId = null, orderBy = 'score DESC', limit = 20 }) {
  const where = []
  const params = []
  if (rankType) {
    where.push('rank_type = ?')
    params.push(rankType)
  }
  if (userId) {
    where.push('user_id = ?')
    params.push(userId)
  }
  const w = where.length ? ` WHERE ${where.join(' AND ')}` : ''
  return db.query(
    `SELECT ${RANK_COLS} FROM rank_snapshots${w} ORDER BY ${orderBy} LIMIT ${Number(limit)}`,
    params
  )
}

/** 我的榜单名次（榜单接口的 self 段：按分数反查排名） */
function myRankOf(rankType, userId) {
  if (!rankType || !userId) return null
  return db.queryOne(
    'SELECT COUNT(*) + 1 AS rk FROM rank_snapshots WHERE rank_type = ? AND score > ' +
      '(SELECT score FROM rank_snapshots WHERE rank_type = ? AND user_id = ? LIMIT 1)',
    [rankType, rankType, userId]
  )
}

/** 返利档案（rebate_profiles 以 user_id 为主键，可能缺失 → 返 null 由service 兜 0） */
function findRebateProfile(userId) {
  if (!userId) return null
  return db.queryOne(
    'SELECT user_id, all_commision, yesterday_commision, user_transaction, mingxia_commision, yao_counts, ' +
      'you_yao_counts FROM rebate_profiles WHERE user_id = ?',
    [userId]
  )
}

/** 返利榜单：按档案返佣排序 */
function listRebateProfiles(limit = 20) {
  return db.query(
    'SELECT r.user_id, r.all_commision, r.yesterday_commision, r.user_transaction, r.mingxia_commision, ' +
      'u.nickname, u.avatar ' +
      'FROM rebate_profiles r LEFT JOIN users u ON u.id = r.user_id ' +
      `ORDER BY r.all_commision DESC LIMIT ${Number(limit)}`
  )
}

/** 我的邀请明细（invitee_id 为空的悬空行 nickname 有值，保留返回） */
function listRebateInvites(inviterId) {
  if (!inviterId) return []
  return db.query(
    'SELECT id, inviter_id, invitee_id, nickname, join_time, first_transaction_time, user_transaction, ' +
      'month_transaction FROM rebate_invites WHERE inviter_id = ? ORDER BY id ASC',
    [inviterId]
  )
}

/** 转赠记录 */
function listRegiftRecords(fromUserId, page) {
  const w = fromUserId ? ' WHERE from_user_id = ?' : ''
  const params = fromUserId ? [fromUserId] : []
  const total = db.count(`SELECT COUNT(*) AS c FROM regift_records${w}`, params)
  const items = db.query(
    'SELECT id, collection_id, collection_code, product_name, cover_image, from_user_id, from_user_nickname, ' +
      'status, status_text, order_no, create_time_str, back_time FROM regift_records' +
      `${w} ORDER BY id ASC` + db.dialect.limit(page.pageSize, page.offset),
    params
  )
  return { items, total }
}

module.exports = { listRankSnapshots, myRankOf, findRebateProfile, listRebateProfiles, listRebateInvites, listRegiftRecords }