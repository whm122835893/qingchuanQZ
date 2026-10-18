'use strict'

/**
 * 活动与玩法域数据访问：合成 / 转盘 / 抽签 / 精选活动。
 * 商城数据在 shop.repository.js，社群在 community.repository.js。
 */
const db = require('../db')
const { baseRepository } = require('./base.repository')

/* ────────────── 合成 ────────────── */

const compoundSchemes = baseRepository('compound_schemes', [
  'id',
  'play_id',
  'title',
  'listimg',
  'target_img',
  'start_time',
  'end_time',
  'join_num',
  'qualify',
  'rule_url',
  'rule_text',
])

function listCompoundSchemes() {
  return compoundSchemes.findAll('', [], 'id ASC')
}

function findCompoundScheme(playId, id) {
  if (playId) {
    const byPlay = db.queryOne(
      'SELECT id, play_id, title, listimg, target_img, start_time, end_time, join_num, qualify, rule_url, rule_text ' +
        'FROM compound_schemes WHERE play_id = ? LIMIT 1',
      [playId]
    )
    if (byPlay) return byPlay
  }
  if (id) {
    const byId = db.queryOne(
      'SELECT id, play_id, title, listimg, target_img, start_time, end_time, join_num, qualify, rule_url, rule_text ' +
        'FROM compound_schemes WHERE id = ? LIMIT 1',
      [id]
    )
    if (byId) return byId
  }
  return db.queryOne(
    'SELECT id, play_id, title, listimg, target_img, start_time, end_time, join_num, qualify, rule_url, rule_text ' +
      'FROM compound_schemes ORDER BY id ASC LIMIT 1'
  )
}

/** 方案材料明细：按条件名分组（compound_schemes.rule_text 为 NULL 时由此重建） */
function listSchemeItems(schemeId) {
  if (!schemeId) return []
  return db.query(
    'SELECT id, scheme_id, condition_name, need_num, collection_code, collection_name, total_num, image ' +
      'FROM compound_scheme_items WHERE scheme_id = ? ORDER BY id ASC',
    [schemeId]
  )
}

function listCompoundRecords(userId, page) {
  const w = ' WHERE user_id = ?'
  const params = [userId]
  const total = db.count(`SELECT COUNT(*) AS c FROM user_compound_records${w}`, params)
  const items = db.query(
    'SELECT id, user_id, scheme_id, title, cover_image, materials, method, consume, record_time ' +
      `FROM user_compound_records${w} ORDER BY record_time DESC, id DESC` +
      db.dialect.limit(page.pageSize, page.offset),
    params
  )
  return { items, total }
}

/** 合成产出（按记录 id 查）。三类产出字段都在同一行，故一次查全 */
function listCompoundResults(recordId = null) {
  const cols =
    'id, record_id, result_type, name, user_collection_code, total_num, number, crystal_type, single_quantity'
  if (recordId) {
    return db.query(
      `SELECT ${cols} FROM compound_results WHERE record_id = ? ORDER BY id ASC`,
      [recordId]
    )
  }
  return db.query(`SELECT ${cols} FROM compound_results ORDER BY id ASC`)
}

/** 合成记录按 id 查（含归属校验所需的 user_id） */
function findCompoundRecord(id) {
  if (!id) return null
  return db.queryOne(
    'SELECT id, user_id, scheme_id, title, cover_image, materials, method, consume, record_time ' +
      'FROM user_compound_records WHERE id = ? LIMIT 1',
    [id]
  )
}

/** 某用户某方案（play_id）的最近一次合成记录 */
function findLatestRecordByPlayId(userId, playId) {
  if (!playId) return null
  return db.queryOne(
    'SELECT r.id, r.user_id, r.scheme_id, r.title, r.cover_image, r.materials, r.method, r.consume, r.record_time ' +
      'FROM user_compound_records r JOIN compound_schemes s ON s.id = r.scheme_id ' +
      'WHERE r.user_id = ? AND s.play_id = ? ORDER BY r.record_time DESC, r.id DESC LIMIT 1',
    [userId, playId]
  )
}

/** 某用户最近一次合成记录（前端传空对象时的兜底） */
function findLatestRecord(userId) {
  if (!userId) return null
  return db.queryOne(
    'SELECT id, user_id, scheme_id, title, cover_image, materials, method, consume, record_time ' +
      'FROM user_compound_records WHERE user_id = ? ORDER BY record_time DESC, id DESC LIMIT 1',
    [userId]
  )
}

/* ────────────── 转盘 ────────────── */

function findLotteryRound() {
  return db.queryOne(
    'SELECT id, end_time, prizes, consume, rule FROM lottery_rounds ORDER BY id ASC LIMIT 1'
  )
}

function listLotteryRecords(userId, page) {
  const w = ' WHERE user_id = ?'
  const params = [userId]
  const total = db.count(`SELECT COUNT(*) AS c FROM user_lottery_records${w}`, params)
  const items = db.query(
    'SELECT id, user_id, prize_name, cover_image, prize_kind, record_time FROM user_lottery_records' +
      `${w} ORDER BY record_time DESC, id DESC` + db.dialect.limit(page.pageSize, page.offset),
    params
  )
  return { items, total }
}

/* ────────────── 抽签 / 活动 ────────────── */

const drawCodes = baseRepository('draw_codes', ['id', 'user_id', 'code', 'code_type', 'create_time_str'])

/** code_type：1=抽签码 2=中奖码（见 mock 实测） */
function listDrawCodes(codeType) {
  if (codeType) return drawCodes.findAll('code_type = ?', [codeType], 'id ASC')
  return drawCodes.findAll('', [], 'id ASC')
}

function findUserDrawCodes(userId) {
  return drawCodes.findAll('user_id = ?', [userId], 'id ASC')
}

function listDrawRecords(userId, page) {
  const w = ' WHERE user_id = ?'
  const params = [userId]
  const total = db.count(`SELECT COUNT(*) AS c FROM user_draw_records${w}`, params)
  const items = db.query(
    'SELECT id, user_id, draw_sn, draw_time, status FROM user_draw_records' +
      `${w} ORDER BY id DESC` + db.dialect.limit(page.pageSize, page.offset),
    params
  )
  return { items, total }
}

const activities = baseRepository('activities', [
  'id',
  'title',
  'listimg',
  'type',
  'start_time',
  'end_time',
  'join_num',
  'status',
  'qualify',
  'route',
])

function listActivities() {
  return activities.findAll('', [], 'id ASC')
}

/** 社区分享记录 */
function listShareRecords() {
  return db.query(
    'SELECT id, community, create_time FROM community_share_records ORDER BY id ASC'
  )
}

module.exports = {
  listCompoundSchemes,
  findCompoundScheme,
  listSchemeItems,
  listCompoundRecords,
  listCompoundResults,
  findCompoundRecord,
  findLatestRecordByPlayId,
  findLatestRecord,
  findLotteryRound,
  listLotteryRecords,
  listDrawCodes,
  findUserDrawCodes,
  listDrawRecords,
  listActivities,
  listShareRecords,
}
