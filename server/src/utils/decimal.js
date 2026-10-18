'use strict'

/**
 * 定点十进制金额运算（禁浮点铁律的落地实现）。
 *
 * 为什么不用 number：0.1 + 0.2 !== 0.3，金额累加必然产生误差，
 * 分账字段（real_income = price − platform_service_price − creator_service_price）
 * 一旦有浮点误差就是资金对不上账。
 *
 * 为什么不用 BigInt 直接存：DB 列是 DECIMAL(18,4)，出参要字符串。
 *
 * 方案：以 4 位小数（DB 精度）为缩放因子，全部用 BigInt 在整数域运算，
 * 边界处（入库 / 出参）再转字符串。运算全程无浮点。
 *
 * 用法：
 *   const d = require('../utils/decimal')
 *   d.of('15').minus('0.75').minus('0.00').toFixed()  // => '14.2500'
 *   d.of('0.05').mul('15').round(2).toFixed()          // => '0.75'
 */

const SCALE = 4 // 与 DECIMAL(18,4) 对齐
const FACTOR = 10n ** BigInt(SCALE)

class Decimal {
  /** @param {bigint} units 缩放后的整数（真实值 × 10^4） */
  constructor(units) {
    this.units = units
  }

  static from(v) {
    return new Decimal(toUnits(v))
  }

  plus(other) {
    return new Decimal(this.units + Decimal.from(other).units)
  }

  minus(other) {
    return new Decimal(this.units - Decimal.from(other).units)
  }

  /** 乘法：除以 FACTOR 回到缩放域，全程整数 */
  mul(other) {
    const o = Decimal.from(other)
    return new Decimal((this.units * o.units) / FACTOR)
  }

  /**
   * 四舍五入到指定小数位（half-up，与源站金额展示一致）。
   * 负数对称处理：先取绝对值再补回符号，避免 -0。
   *
   * 返回值缩放域恒为 SCALE——与 toFixed 契约一致，
   * 否则 round(2).toFixed() 会放大 10^(SCALE-2) 倍。
   */
  round(places = 2) {
    const neg = this.units < 0n
    const abs = neg ? -this.units : this.units
    // 到 places 位需除以 10^(SCALE-places)，四舍五入加半
    const divisor = 10n ** BigInt(SCALE - places)
    const rounded = (abs + divisor / 2n) / divisor
    return new Decimal((neg ? -rounded : rounded) * 10n ** BigInt(SCALE - places))
  }

  isNegative() {
    return this.units < 0n
  }

  isZero() {
    return this.units === 0n
  }

  cmp(other) {
    const o = Decimal.from(other).units
    if (this.units < o) return -1
    if (this.units > o) return 1
    return 0
  }

  /**
   * 固定小数位字符串。默认 4 位（DB 精度），2 位用于对外展示。
   *
   * 换算：units 是「真实值 × 10^SCALE」，要展示 places 位小数，
   * 需先折算到「真实值 × 10^places」，即除以 10^(SCALE-places)。
   */
  toFixed(places = SCALE) {
    const neg = this.units < 0n
    const abs = neg ? -this.units : this.units
    const divisor = 10n ** BigInt(SCALE - places)
    // 四舍五入到 places 位（避免直接截断丢精度）
    const atPlaces = (abs + divisor / 2n) / divisor
    const unit = 10n ** BigInt(places)
    const intPart = atPlaces / unit
    const fracPart = atPlaces % unit
    const frac = places > 0 ? '.' + fracPart.toString().padStart(places, '0') : ''
    return (neg && atPlaces !== 0n ? '-' : '') + intPart.toString() + frac
  }

  /** 原样字符串（入库用，保持 4 位精度） */
  toString() {
    return this.toFixed(SCALE)
  }
}

/** 任意输入 → 缩放整数。空值按 0 处理；非法输入抛错（绝不静默当 0） */
function toUnits(v) {
  if (v === null || v === undefined || v === '') return 0n
  if (v instanceof Decimal) return v.units
  const s = String(v).trim()
  if (!/^-?\d+(\.\d+)?$/.test(s)) {
    throw new TypeError(`金额非法: ${JSON.stringify(v)}`)
  }
  const neg = s.startsWith('-')
  const body = neg ? s.slice(1) : s
  const [intPart, fracPart = ''] = body.split('.')
  // 超过 4 位小数直接截断会改金额，改为四舍五入到 DB 精度
  let frac = fracPart.padEnd(SCALE, '0').slice(0, SCALE)
  let units = BigInt(intPart) * FACTOR + BigInt(frac || '0')
  // 第 5 位起四舍五入
  if (fracPart.length > SCALE && Number(fracPart[SCALE]) >= 5) units += 1n
  return neg ? -units : units
}

function of(v) {
  return Decimal.from(v)
}

/** 常用组合：a − b − c（分账三段相减） */
function subtractAll(a, b, c) {
  return of(a).minus(b).minus(c)
}

module.exports = { Decimal, of, subtractAll, SCALE }