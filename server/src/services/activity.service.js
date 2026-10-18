'use strict'

/**
 * 活动与玩法域 service：合成 / 转盘 / 签到 / 抽签 / 精选活动。
 * 合成结果写接口（compound/result）已实现，见 compound-write.service.js。
 */
const env = require('../config/env')
const activityRepo = require('../repositories/activity.repository')
const configRepo = require('../repositories/config.repository')
const userRepo = require('../repositories/user.repository')
const statsRepo = require('../repositories/stats.repository')
const { pagination } = require('../utils/validate')
const { jsonArray, jsonObject, bool } = require('../utils/pick')

/* ─────────────── 合成 ─────────────── */

async function compoundList() {
  return await activityRepo.listCompoundSchemes().map((r) => ({
    id: r.id,
    play_id: r.play_id,
    title: r.title,
    listimg: r.listimg,
    start_time: r.start_time,
    end_time: r.end_time,
    join_num: r.join_num === null ? 0 : r.join_num,
    qualify: r.qualify || '',
    rule_url: r.rule_url || '',
  }))
}

/** 合成方案（style D）。rule_text 为 NULL 时由 compound_scheme_items 按条件名分组重建 */
async function compoundScheme(params) {
  const scheme = await activityRepo.findCompoundScheme(params.play_id, params.id)
  if (!scheme) return null
  return {
    play_id: scheme.play_id,
    title: scheme.title,
    target_img: scheme.target_img || '',
    rule_text: scheme.rule_text
      ? jsonArray(scheme.rule_text)
      : await rebuildRuleText(scheme.id),
  }
}

async function rebuildRuleText(schemeId) {
  const items = await activityRepo.listSchemeItems(schemeId)
  const groups = new Map()
  for (const it of items) {
    const key = it.condition_name || '条件1'
    if (!groups.has(key)) groups.set(key, { name: key, number: it.need_num, collectionList: [] })
    groups.get(key).collectionList.push({
      id: it.id,
      name: it.collection_name,
      collection_code: it.collection_code,
      total_num: it.total_num,
      image: it.image,
    })
  }
  return [...groups.values()]
}

async function compoundRecord(userId, params) {
  const page = pagination(params, env)
  const { items } = await activityRepo.listCompoundRecords(userId, page)
  return items.map((r) => ({
    id: r.id,
    create_time: r.record_time,
    title: r.title,
    listimg: r.cover_image,
    materials: r.materials || '',
    method: r.method === null ? 0 : r.method,
    consume: jsonArray(r.consume),
  }))
}

/* ─────────────── 转盘 ─────────────── */

async function lotteryInfo() {
  const round = await activityRepo.findLotteryRound()
  if (!round) return null
  return {
    prizeList: jsonArray(round.prizes),
    consume: jsonArray(round.consume),
    end_time: round.end_time,
  }
}

async function lotteryRecord(userId, params) {
  const page = pagination(params, env)
  const { items } = await activityRepo.listLotteryRecords(userId, page)
  return items.map((r) => ({
    id: r.id,
    name: r.prize_name,
    listimg: r.cover_image,
    create_time: r.record_time,
  }))
}

async function lotteryRule() {
  const round = await activityRepo.findLotteryRound()
  const rule = (round && round.rule) || (await configRepo.activityConfigValue('lottery', 'rule')) || ''
  return { rule }
}

/* ─────────────── 签到 ─────────────── */

async function signInfo(userId) {
  const status = await userRepo.findSignStatus(userId)
  const user = await userRepo.findUser(userId)
  const rewards = await userRepo.listSignRewards()
  const rule = rewards.length ? rewards[0].sign_rule || '' : ''
  return {
    user_info: user
      ? { nickname: user.nickname, avatar: user.avatar, id: user.id }
      : { nickname: '', avatar: '', id: userId },
    continuous_days: status ? status.continuous_days || 0 : 0,
    sign_days: parseSignDays(status ? status.sign_days : null),
    sign_status: status && status.sign_status !== null ? status.sign_status : 0,
    crystal_number: status ? status.crystal_number || 0 : 0,
    sign_rule: rule,
    reward_list: rewards.map((r) => ({ day: r.day, crystal: r.crystal })),
  }
}

/** sign_days 库中为逗号分隔字符串（如 "1,2,3"） */
function parseSignDays(raw) {
  if (raw === null || raw === undefined || raw === '') return []
  return String(raw)
    .split(',')
    .map((s) => Number.parseInt(s, 10))
    .filter((n) => Number.isFinite(n))
}

/* ─────────────── 抽签 ─────────────── */

const DRAW_CODE = 1
const WIN_CODE = 2

async function activityDrawInfo(userId) {
  const activity = jsonObject(await configRepo.activityConfigValue('draw', 'activity'))
  const codes = await activityRepo.listDrawCodes(DRAW_CODE)
  const winCodes = await activityRepo.listDrawCodes(WIN_CODE)
  return {
    activity: {
      title: activity.title || '',
      listimg: activity.listimg || '',
      start_time: activity.start_time || '',
      draw_time: activity.draw_time || '',
      open_time: activity.open_time || '',
      end_time: activity.end_time || '',
    },
    draw_code: codes.length ? codes[0].code : '',
    win_code: winCodes.length ? winCodes[0].code : '',
    code_list: codes.map(codeItem),
    win_code_list: winCodes.map(codeItem),
    draw_rule: (await configRepo.activityConfigValue('draw', 'draw_rule')) || '',
  }
}

function codeItem(r) {
  return { id: r.id, code: r.code, create_time: r.create_time_str || '' }
}

async function activityRecord(userId, params) {
  const page = pagination(params, env)
  const { items } = await activityRepo.listDrawRecords(userId, page)
  return items.map((r) => ({
    id: r.id,
    draw_sn: r.draw_sn,
    draw_time: r.draw_time || '',
    status: r.status === null ? 0 : r.status,
  }))
}

/** 抽签结果（drawResult，style D）。draw_complete：存在中奖码即为 1 */
async function drawResult(userId) {
  const winCodes = await activityRepo.listDrawCodes(WIN_CODE)
  return {
    draw_complete: winCodes.length ? 1 : 0,
    success_code: winCodes.length ? winCodes[0].code : '',
    success_list: winCodes.map((r) => ({ id: r.id, code: r.code })),
  }
}

/** 抽签排行榜（drawLeaderboard，style D）。榜单以 rank_snapshots.rank_type='draw' 为源 */
async function drawLeaderboard(userId) {
  const list = await statsRepo.listRankSnapshots({ rankType: 'draw', orderBy: 'score DESC', limit: 20 })
  const rule = (await configRepo.activityConfigValue('draw', 'rank_rule')) || ''
  // 我的名次与持有数：按 rank_snapshots 中本用户的 draw 记录反查（无记录则 null / 0）
  const mine = userId ? await statsRepo.myRankOf('draw', userId) : null
  const myRow = userId
    ? (await statsRepo.listRankSnapshots({ rankType: 'draw', userId, limit: 1 }))[0]
    : null
  return {
    myrank: {
      rank_num: mine ? mine.rk : null,
      nums: myRow ? myRow.score || 0 : 0,
    },
    list: list.map((r, i) => ({
      id: i + 1,
      nickname: r.nickname || '',
      avatar: r.avatar || '',
      nums: r.score === null ? 0 : r.score,
    })),
    rank_rule: rule,
  }
}

/** 社区分享（communityShare，style D） */
async function communityShare() {
  const images = await configRepo.activityConfigValue('community_share', 'share_images')
  const auditStatus = await configRepo.activityConfigValue('community_share', 'audit_status')
  const auditText = await configRepo.activityConfigValue('community_share', 'audit_text')
  return {
    share_images: jsonArray(images),
    audit_status: auditStatus === null ? 0 : Number(auditStatus),
    audit_text: auditText || '',
    share_records: (await activityRepo.listShareRecords()).map((r) => ({
      id: r.id,
      community: r.community || '',
      create_time: r.create_time || '',
    })),
  }
}

/** 好友助力（invitationAssist，style D） */
async function invitationAssist(userId, params) {
  const records = await userRepo.listAssists(params.code, userId)
  const need = 3
  return {
    assist_num: records.length,
    need_num: need,
    code: params.code || (records.length ? records[0].code : ''),
    hero_image: (await configRepo.activityConfigValue('assist', 'hero_image')) || '',
    records: records.map((r) => ({
      id: r.id,
      nickname: r.nickname || '',
      avatar: r.avatar || '',
      create_time: r.assist_time || '',
      is_new_user: bool(r.is_new_user),
      is_real: bool(r.is_real),
    })),
    assist_tip: (await configRepo.activityConfigValue('assist', 'assist_tip')) || '',
  }
}

/** 精选活动（activeSelectedList，style A） */
async function activeSelectedList() {
  return await activityRepo.listActivities().map((r) => ({
    id: r.id,
    title: r.title,
    listimg: r.listimg,
    type: r.type === null ? 0 : r.type,
    start_time: r.start_time || '',
    end_time: r.end_time || '',
    join_num: r.join_num === null ? 0 : r.join_num,
    status: r.status === null ? 0 : r.status,
    qualify: r.qualify || '',
    route: r.route || '',
  }))
}

module.exports = {
  compoundList,
  compoundScheme,
  compoundRecord,
  lotteryInfo,
  lotteryRecord,
  lotteryRule,
  signInfo,
  activityDrawInfo,
  activityRecord,
  drawResult,
  drawLeaderboard,
  communityShare,
  invitationAssist,
  activeSelectedList,
}