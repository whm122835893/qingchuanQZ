'use strict'

/**
 * 配置类数据访问：app_configs / activity_configs / trade_unions。
 * 均为 KV 或单行表，无分页。
 */
const db = require('../db')
const { baseRepository } = require('./base.repository')

const appConfigs = baseRepository('app_configs', [
  'config_group',
  'config_key',
  'config_value',
  'value_type',
])

/** 取某个 group 下的全部键值对 → 扁平对象 */
function groupAsObject(group) {
  const rows = appConfigs.findAll('config_group = ?', [group], 'config_key ASC')
  const out = {}
  for (const r of rows) out[r.config_key] = r.config_value
  return out
}

function groupValue(group, key) {
  const row = appConfigs.findOneBy('config_group = ? AND config_key = ?', [group, key])
  return row ? row.config_value : null
}

const activityConfigs = baseRepository('activity_configs', [
  'config_key',
  'config_value',
  'config_group',
])

function activityConfigValue(group, key) {
  const row = activityConfigs.findOneBy('config_group = ? AND config_key = ?', [group, key])
  return row ? row.config_value : null
}

const tradeUnions = baseRepository('trade_unions', [
  'id',
  'unlock',
  'member_count',
  'rebate_holder',
  'rebate_invited',
  'rebate_extra',
  'max_bind',
])

/** 全局单行：GM 工会配置 */
function firstTradeUnion() {
  return db.queryOne(
    'SELECT id, unlock, member_count, rebate_holder, rebate_invited, rebate_extra, max_bind FROM trade_unions ORDER BY id ASC LIMIT 1'
  )
}

module.exports = {
  groupAsObject,
  groupValue,
  activityConfigValue,
  firstTradeUnion,
}
