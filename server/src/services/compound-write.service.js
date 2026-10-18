'use strict'

/**
 * 合成结果写操作 service（compound/result）。
 *
 * 前端现状（已核实）：compound/Result.vue:70 与 SchemeDetails.vue:129
 * 均调 fetchCompoundResult() 且**传空对象 {}**——不带 play_id。
 *
 * 语义澄清（重要）：源站此接口名为 result，语义是「查询某次合成的产出」，
 * 而非「触发一次合成」。真正的合成动作发生在别处。
 * 因此本实现是「按 record_id 读取已落库的产出」，不凭空生成合成记录——
 * 若按「写」理解为新建合成，会凭空造出用户没做过的合成行为（编造业务数据）。
 *
 * 未传 record_id / play_id 时：取当前用户最近一次合成记录的产出（前端传空对象的场景）。
 */

const activityRepo = require('../repositories/activity.repository')
const { NotFoundError } = require('../errors')

/**
 * 合成结果查询。
 * @param {number} userId 当前用户
 * @param {object} params 可含 record_id（合成记录 id）或 play_id（方案 play_id）
 */
async function compoundResult(userId, params) {
  const recordId = params.record_id || params.id || null
  const playId = params.play_id || null

  const record = await resolveRecord(userId, recordId, playId)
  if (!record) return { result: [] }

  const rows = await activityRepo.listCompoundResults(record.id)
  return { result: rows.map(resultRow) }
}

/**
 * 定位合成记录。
 * 显式 record_id → 校验归属；显式 play_id → 该用户该方案的最近一次；
 * 都没有 → 该用户最近一次合成记录。
 */
async function resolveRecord(userId, recordId, playId) {
  if (recordId) {
    const row = await activityRepo.findCompoundRecord(recordId)
    if (!row) throw new NotFoundError('合成记录不存在')
    // 归属校验：他人合成记录不返回（不泄露产出内容）
    if (row.user_id !== userId) return null
    return row
  }
  if (playId) {
    const row = await activityRepo.findLatestRecordByPlayId(userId, playId)
    return row || null
  }
  return activityRepo.findLatestRecord(userId)
}

/**
 * 产出行组装。E-COMPOUND-RESULT 三类异质产出：
 *  C 合集藏品 → user_collection_code + total_num
 *  M 材料     → number
 *  S 龙晶积分 → crystal_type + single_quantity
 * 只输出该类型实际携带的字段，不给缺失字段编造默认值。
 */
function resultRow(r) {
  const out = { type: r.result_type, name: r.name }
  if (r.result_type === 'C') {
    out.user_collection_code = r.user_collection_code
    out.total_num = r.total_num
  } else if (r.result_type === 'M') {
    out.number = r.number
  } else if (r.result_type === 'S') {
    out.crystal_type = r.crystal_type
    out.single_quantity = r.single_quantity
  }
  return out
}

module.exports = { compoundResult, resultRow }