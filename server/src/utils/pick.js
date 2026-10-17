'use strict'

/**
 * 字段挑选与值规范化（ARCHITECTURE §9）。
 *
 * 存在的理由：mock 中有源站冗余/脏字段（DATABASE.md §9 列12 类）。
 * 用显式 pick 声明输出字段，而不是把数据库行直接序列化——后者会把内部列
 * （created_at / *_raw / product_id_raw 等）泄漏成对外契约，一旦泄漏就再也改不动。
 */

/** 按 keys 顺序构造新对象；缺失键填 undefined（JSON.stringify 会自动丢弃） */
function pick(row, keys) {
  const out = {}
  if (!row) return out
  for (const k of keys) out[k] = row[k]
  return out
}

/** 金额：DECIMAL → 字符串，禁止 float（§6.4）。null 保持 null */
function money(v) {
  if (v === null || v === undefined || v === '') return null
  if (typeof v === 'string') return v
  return String(v)
}

/** 金额带两位小数字符串（源站形如 "100.00"） */
function money2(v) {
  if (v === null || v === undefined || v === '') return null
  const n = Number(v)
  if (!Number.isFinite(n)) return String(v)
  return n.toFixed(2)
}

/** TINYINT(0/1) → 源站真实布尔（源站布尔类型不统一，DATABASE.md §6.6） */
function bool(v) {
  return v === 1 || v === true || v === '1'
}

/** JSON TEXT 列 → 数组；空/NULL → [] */
function jsonArray(v) {
  if (v === null || v === undefined || v === '') return []
  if (Array.isArray(v)) return v
  try {
    const parsed = JSON.parse(v)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

/** JSON TEXT 列 → 对象；空/NULL → fallback */
function jsonObject(v, fallback = {}) {
  if (v === null || v === undefined || v === '') return fallback
  if (typeof v === 'object') return v
  try {
    const parsed = JSON.parse(v)
    return parsed && typeof parsed === 'object' ? parsed : fallback
  } catch {
    return fallback
  }
}

/** 空串 → null（用于「有字段但未设置」与「无内容」的区分，§6.6） */
function blankToNull(v) {
  if (v === undefined) return null
  if (typeof v === 'string' && v.trim() === '') return null
  return v
}

module.exports = { pick, money, money2, bool, jsonArray, jsonObject, blankToNull }
