'use strict'

/**
 * 交易写操作service：发起委托/求购、以求购价出售。
 *
 * 前端现状（已逐处核实，本轮不改前端）：
 *  - SubmitBegBuy.vue:206 onSubmitTap 末行只弹 toast 后return，**从不发请求**
 *  - SellBegBuy.vue:253 同理，只弹 toast
 * 故这两个接口无前端验证路径，属契约实现而非页面可见行为。
 *
 * 金额铁律：全部经 utils/decimal 定点运算，禁浮点。
 * 分账公式（源站实测）：real_income = price − platform_service_price − creator_service_price
 */

const db = require('../db')
const writeRepo = require('../repositories/trade-write.repository')
const idemRepo = require('../repositories/idempotency.repository')
const productRepo = require('../repositories/product.repository')
const decimal = require('../utils/decimal')
const win = require('../utils/idempotency-window')
const { entrustShape, sellShape, PAY_NAME } = require('./trade-write-shape')
const { ValidationError, NotFoundError, ForbiddenError, ConflictError, BusinessError } = require('../errors')

/** 平台服务费率：源站实测 0.05（market_listings.pay_platform_service_rate） */
const PLATFORM_RATE = '0.05'
/** E-PAY-WAY 唯一实测值 */
const PAY_WAY = 'huifu'
/** E-ENTRUST-STATUS：2=委托中 */
const ENTRUST_PENDING = 2

/**
 * 发起委托 / 求购（createBegBuyOrder）。
 *
 * ── 幂等（业务级，非单号级）───────────────────────────────
 * 历史实现只在 `params.order_sn` 存在时查重，但**前端从不传该字段**
 * （源站契约里也没有），于是每次都走 generateOrderSn 生成新单号，
 * uk_entrust_sn 唯一约束因单号不同而完全兜不住——
 * 用户重复点击会产生多笔在途委托单。此为资损级缺陷，本轮改为业务键查重。
 *
 * 幂等键：user_id + product_id + price + number，且 order_status = 委托中(2)，
 * 且创建时间在 60s 窗口内（窗口依据见 utils/idempotency-window.js）。
 *
 * 查重与插入同处一个事务：better-sqlite3 的 transaction 回调是同步的，
 * 事务内不做 await，故不存在「查完到插入」之间的窗口。
 *
 * 返回语义：重复提交返 code:1 + 已有记录（前端无感），
 * 而非 409——对用户而言「重复点击」不是错误。
 */
async function createBegBuyOrder(userId, params) {
  const productId = requireProductId(params.goods_id !== undefined ? params.goods_id : params.product_id)
  const price = requireAmount(params.price, 'price')
  const number = requireNumber(params.number, 'number')

  // 显式 order_sn 优先：前端若将来补上该字段，精确匹配比业务键更严格
  if (params.order_sn) {
    const existing = await writeRepo.findEntrustBySn(String(params.order_sn).trim())
    if (existing) {
      if (existing.user_id !== userId) throw new ForbiddenError('无权操作该委托单')
      return entrustShape(existing)
    }
  }

  const product = await productRepo.findProduct(productId)
  if (!product) throw new NotFoundError('商品不存在')

  const priceFixed = decimal.of(price).toFixed()
  const totalPrice = decimal.of(price).mul(number).toFixed()
  const since = win.since(win.ENTRUST_WINDOW_SEC)

  // 事务内查重 + 插入。返回 existing 表示命中幂等，交给事务外统一出参。
  const outcome = inTransaction(() => {
    const dup = idemRepo.findInFlightEntrust(userId, productId, priceFixed, number, since)
    if (dup) return { existing: dup }

    const orderSn = params.order_sn ? String(params.order_sn).trim() : generateOrderSn('BE')
    writeRepo.insertEntrustOrder({
      order_sn: orderSn,
      order_status: ENTRUST_PENDING,
      user_id: userId,
      product_id: product.id,
      goods_name: product.name || '',
      cover_image: product.listimg || '',
      collection_code: '',
      number,
      price: priceFixed,
      total_price: totalPrice,
      pay_way: PAY_WAY,
    })
    return { orderSn }
  })

  if (outcome.existing) return entrustShape(outcome.existing)

  try {
    return entrustShape(await writeRepo.findEntrustBySn(outcome.orderSn))
  } catch (err) {
    // 唯一约束兜底：并发下同一显式 order_sn 只应落一行
    if (isUniqueViolation(err)) {
      const again = await writeRepo.findEntrustBySn(outcome.orderSn)
      if (again) return entrustShape(again)
    }
    throw err
  }
}

/**
 * 以求购价出售（sell）。
 *
 * 业务语义：用户持有藏品，按求购单价格挂单出售。
 * 事务内 3 张表联动：entrust_orders（求购单成交量）/ market_listings（新挂单）/
 * user_collections（藏品置为寄售中）。任一失败全部回滚。
 *
 * 幂等键：user_id + collection_id，且挂单 status = 寄售中(1)。
 * 不设时间窗——挂单终结后键自然失效，理由见 utils/idempotency-window.js。
 */
async function sell(userId, params) {
  const collectionId = requireProductId(params.user_collection_id !== undefined ? params.user_collection_id : params.collection_id)
  const price = requireAmount(params.price, 'price')

  const collection = await writeRepo.findCollectionForUpdate(collectionId)
  if (!collection) throw new NotFoundError('藏品不存在')
  if (collection.user_id !== userId) throw new ForbiddenError('无权出售该藏品')

  // 幂等键检查必须早于状态校验：
  // 首次请求已把藏品置为寄售中(status=2)，重试时若先查状态会误报 409，
  // 客户端便无法安全重试（这正是幂等要解决的场景）。
  if (params.order_sn) {
    const dup = await writeRepo.findListingBySn(String(params.order_sn).trim())
    if (dup) {
      if (dup.sale_user_id !== userId) throw new ForbiddenError('无权操作该挂单')
      return sellShape(dup, collection, null)
    }
  }

  // 业务键查重与状态校验都在事务内、且查重早于状态校验（见下方 inTransaction）：
  // 事务外查重存在「查完到插入」的并发窗口；
  // 状态校验若早于查重，首次请求已把藏品置为寄售中(2)，重试会误报 409。

  const product = collection.product_id ? await productRepo.findProduct(collection.product_id) : null
  // products 表无 series_name 列，系列名需经 series 补齐（与 collectionInfo 同做法）
  const series =
    product && product.series_id ? await productRepo.findSeries(product.series_id) : null
  const seriesName = series ? series.name || '' : ''

  // 分账：平台服务费 = 价格 × 费率（4 位精度），创作者服务费库中恒为 0.00
  const platformFee = decimal.of(price).mul(PLATFORM_RATE).round(2)
  const creatorFee = decimal.of('0')
  const realIncome = decimal.subtractAll(price, platformFee.toFixed(), creatorFee.toFixed())
  if (realIncome.isNegative()) throw new BusinessError('分账后金额为负，请检查价格与费率')

  const orderSn = params.order_sn ? String(params.order_sn).trim() : generateOrderSn('SL')
  const entrustSn = optionalSn(params.entrust_order_sn || params.order_id)

  // 事务内不做 await：better-sqlite3 的 transaction 回调是同步的（await 会抛 SyntaxError）
  const outcome = inTransaction(() => {
    // 0) 业务键查重（必须在事务内，且早于状态校验）：
    //    同一藏品已有在寄售中的挂单 → 判定为重试，不新建。
    //    早于状态校验的原因：首次请求已把藏品置为寄售中(status=2)，
    //    重试时若先查状态会误报 409，客户端便无法安全重试。
    const dup = idemRepo.findActiveListingByCollection(userId, collectionId)
    if (dup) return { listing: dup }

    // 状态校验：必须在查重之后、写入之前（顺序理由见函数头注释）
    if (collection.status !== 1) {
      throw new ConflictError('该藏品当前状态不可出售（可能已在寄售或赠送中）')
    }
    if (collection.is_lock === 1) throw new BusinessError('该藏品已锁定，不可出售')
    // 持有量为 0 的藏品没有可卖数量（库中确有 count=0 的行，如 id=77001）
    if (collection.count <= 0) throw new BusinessError('该藏品持有量为 0，不可出售')

    // 1) 藏品置寄售中（乐观锁：status 必须仍为 1，changes!==1 说明已被并发占用）
    const moved = writeRepo.updateCollectionStatus(collectionId, 1, 2)
    if (moved !== 1) throw new ConflictError('该藏品状态已变更，请重试')

    // 2) 新挂单落库（含分账四字段）
    writeRepo.insertListing({
      product_id: collection.product_id,
      collection_id: collectionId,
      sale_user_id: userId,
      name: (product && product.name) || '',
      cover_image: (product && product.listimg) || '',
      series_name: seriesName,
      price: decimal.of(price).toFixed(),
      status: 1, // E-LISTING-STATUS 1=寄售中
      goods_type: product ? product.goods_type : null,
      income_type: PAY_WAY,
      income_type_raw: JSON.stringify([PAY_WAY]),
      pay_way: PAY_WAY,
      order_sn: orderSn,
      pay_platform_service_rate: PLATFORM_RATE,
      platform_service_price: platformFee.toFixed(),
      creator_service_price: creatorFee.toFixed(),
      real_income: realIncome.toFixed(),
      img: (product && product.main_image) || '',
    })

    // 3) 卖出单落 orders（order_type=2，E-ORDER-STATUS-BUY 不适用：卖出走寄售语义，
    //    此处 order_status=1 待付款，表示「已挂单待买家付款」）
    writeRepo.insertOrder({
      order_sn: `${orderSn}-O`,
      order_status: 1,
      order_type: 2,
      product_id: collection.product_id,
      product_name: (product && product.name) || '',
      cover_image: (product && product.listimg) || '',
      collection_code: collection.collection_code || '',
      user_hash_text: '',
      number: 1,
      price: decimal.of(price).toFixed(),
      total_price: decimal.of(price).toFixed(),
      pay_way: PAY_WAY,
      pay_name: PAY_NAME,
      income_type: PAY_WAY,
      income_type_raw: JSON.stringify([PAY_WAY]),
      goods_type: product ? product.goods_type : null,
      remark: entrustSn ? `匹配求购单 ${entrustSn}` : '',
      user_id: userId,
    })

    return { created: true }
  })

  // 命中幂等：返回已有挂单（重复提交对前端无感，不报 409）
  if (outcome.listing) return sellShape(outcome.listing, collection, entrustSn)

  const listing = await writeRepo.findListingBySn(orderSn)
  return sellShape(listing, collection, entrustSn)
}

function optionalSn(v) {
  if (v === undefined || v === null || String(v).trim() === '') return null
  return String(v).trim().slice(0, 64)
}

/* ────────────── 单号生成 ────────────── */

/**
 * 委托/出售单号：前缀 + unix 秒 + 4 位随机。
 * 源站实测为 30 位数字串，此处保留前缀字母以便日志区分单据来源——
 * 该字段仅入库与展示，前端无格式校验（已核实 entrustList/orderList 无 format 断言）。
 */
function generateOrderSn(prefix) {
  const ts = Math.floor(Date.now() / 1000)
  const rand = String(Math.floor(Math.random() * 10000)).padStart(4, '0')
  return `${prefix}${ts}${rand}`
}

/* ────────────── 工具 ────────────── */

/** 事务：写操作要么全成功要么全回滚（ARCHITECTURE §3.3） */
function inTransaction(fn) {
  return db.transaction(fn)()
}

/** 唯一约束冲突识别：SQLITE_CONSTRAINT_UNIQUE / ER_DUP_ENTRY */
function isUniqueViolation(err) {
  const code = err && (err.rawCode || err.code)
  return code === 'SQLITE_CONSTRAINT_UNIQUE' || code === 'ER_DUP_ENTRY'
}

function requireProductId(value) {
  const n = Number.parseInt(value, 10)
  if (!Number.isFinite(n) || n <= 0) throw new ValidationError('参数 goods_id 缺失或非法')
  return n
}

/** 金额入参：必须是合法十进制数且 > 0（禁浮点解析，走 decimal 字符串路径） */
function requireAmount(value, name) {
  if (value === undefined || value === null || String(value).trim() === '') {
    throw new ValidationError(`参数 ${name} 缺失`)
  }
  let d
  try {
    d = decimal.of(String(value).trim())
  } catch {
    throw new ValidationError(`参数 ${name} 不是合法金额`)
  }
  if (d.cmp('0') <= 0) throw new ValidationError(`参数 ${name} 必须大于 0`)
  if (d.isNegative()) throw new ValidationError(`参数 ${name} 不能为负`)
  return d.toFixed()
}

function requireNumber(value, name) {
  const n = Number.parseInt(value, 10)
  if (!Number.isFinite(n) || n <= 0) throw new ValidationError(`参数 ${name} 缺失或非法`)
  if (n > 9999) throw new ValidationError(`参数 ${name} 超出上限`)
  return n
}

module.exports = { createBegBuyOrder, sell, PLATFORM_RATE }