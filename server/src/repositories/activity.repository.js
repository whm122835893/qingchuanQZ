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

/** 合成结果（写接口 TODO 用；结构与源站 compoundResult 一致） */
function listCompoundResults(recordId = null) {
  if (recordId) {
    return db.query(
      'SELECT id, record_id, result_type, name, user_collection_code, total_num FROM compound_results WHERE record_id = ? ORDER BY id ASC',
      [recordId]
    )
  }
  return db.query(
    'SELECT id, record_id, result_type, name, user_collection_code, total_num FROM compound_results ORDER BY id ASC'
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
  findLotteryRound,
  listLotteryRecords,
  listDrawCodes,
  findUserDrawCodes,
  listDrawRecords,
  listActivities,
  listShareRecords,
}
