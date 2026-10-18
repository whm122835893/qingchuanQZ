'use strict'

/**
 * 开盒写操作 service（openbox / openboxone）。
 *
 * 前端现状（已逐处核实，本轮不改前端）：
 *  - blindBox/Result.vue:55  fetchBlindBoxResult()   传空对象 {}
 *  - blindBox/Result2.vue:47 fetchBlindBoxResultOne() 传空对象 {}
 * 即**不带 blind_box_id**。故接口必须支持「不传 id」：按当前用户唯一待开盲盒处理。
 *
 * 开盒语义：扣减 user_collections 中盲盒行的 count，并按概率池产出新的藏品实例行。
 * 「扣减 + 产出」必须同事务——否则会凭空多出藏品（多发）或扣了不发货（少发）。
 *
 * 概率说明：库中 pool 概率合计 23 ≠ 100（DATABASE.md §4 已注明源站如此，
 * 「非简单概率」）。本实现按**归一化权重**抽样，而非当百分比直接用，
 * 否则 77% 的抽签会落在空区间（永远抽不到东西）。
 */

const crypto = require('crypto')
const db = require('../db')
const writeRepo = require('../repositories/trade-write.repository')
const idemRepo = require('../repositories/idempotency.repository')
const collectionRepo = require('../repositories/collection.repository')
const productRepo = require('../repositories/product.repository')
const decimal = require('../utils/decimal')
const win = require('../utils/idempotency-window')
const { NotFoundError, ForbiddenError, ConflictError, BusinessError } = require('../errors')

/**
 * 单次开盒产出件数。
 * 源站 mock恒 3 条，但库中无「每次开盒产出几件」的配置列，
 * 不得凭空取 3——按 1 件实现并在README 标注该简化。
 */
const BATCH_PER_OPEN = 1

/** 开盒（批量，响应裸数组） */
async function openbox(userId, blindBoxId) {
  const box = await resolveBox(userId, blindBoxId)
  const replay = replayOpen(box)
  // 判长度而非判真值：空数组是truthy，if (replay) 会让「无产出」走进重放分支
  if (replay && replay.length) return replay.map(replayShape)
  const created = await openOnce(userId, box)
  return Promise.all(created.map(toResponse))
}

/** 开盒（单个，响应单对象）。与批量同一套逻辑，仅返回第一条 */
async function openboxone(userId, blindBoxId) {
  const box = await resolveBox(userId, blindBoxId)
  const replay = replayOpen(box)
  if (replay && replay.length) return replayShape(replay[0])
  const created = await openOnce(userId, box)
  if (!created.length) throw new BusinessError('开盒未产出藏品')
  return toResponse(created[0])
}

/**
 * 幂等重放：该盲盒在窗口内已有开盒产出 → 直接返回上次结果，不重复抽签。
 *
 * 幂等键：user_id + blind_box_id，窗口 60s（依据见 utils/idempotency-window.js）。
 *
 * 必须早于 count 校验：盲盒 count=1 时首次开盒后即为 0，
 * 若先校验 count 会返回 409「盲盒已开完」，重复点击就变成了报错而非无感返回——
 * 这正是幂等要解决的场景。窗外的耗尽盒仍应如实报 409。
 */
function replayOpen(box) {
  if (!box || !box.blind_box_id) return null
  return idemRepo.findLatestOpenedCollections(
    box.user_id,
    box.blind_box_id,
    box.id,
    win.since(win.OPENBOX_WINDOW_SEC)
  )
}

/**
 * 幂等重放的响应组装。
 * 字段名与 toResponse 一致。
 *
 * 已知局限（已核实库结构，非编造）：产出行只落了盲盒产品 id，
 * 池内变体共用该 id，故重放时 name 为产品级名（如「赛博铁牛盲盒」），
 * 首次开盒为池级名（如「赛博铁牛」）；rarity_icon 属池字段未落库，按 listimg 兜底。
 * 彻底解决需给 user_collections 增加池条目 id 列（schema 变更，超出本轮范围）。
 */
function replayShape(row) {
  return {
    id: row.id,
    name: row.name || '',
    collection_code: row.collection_code || '',
    listimg: row.listimg || '',
    main_image: row.main_image || row.listimg || '',
    rarity_icon: row.listimg || '',
  }
}

/**
 * 定位待开盲盒。
 * 显式传 id 时校验归属（他人盲盒 403）；未传时取该用户唯一一条待开盲盒。
 *
 * 注意：此处**不**校验 count —— count 已耗尽的盲盒必须先经replayOpen 判定
 * 是否为重复提交（幂等重放要早于「已开完」报错，见 replayOpen 注释）；
 * 真正的新开盒请求由 openOnce 内consumeBlindBox 的 count > 0 条件兜住，
 * 耗尽时抛的仍是 ConflictError，语义不变。
 */
async function resolveBox(userId, blindBoxId) {
  if (blindBoxId) {
    const row = await writeRepo.findBoxForUpdate(blindBoxId)
    if (!row || row.blind_box_id === null) throw new NotFoundError('盲盒不存在')
    if (row.user_id !== userId) throw new ForbiddenError('无权操作该盲盒')
    return row
  }
  const box = await collectionRepo.findMyBlindBox(userId)
  if (!box) throw new NotFoundError('暂无待开盲盒')
  return { ...box, blind_box_id: box.blind_box_id }
}

/**
 * 执行一次开盒：扣减余量 + 落库产出，同一事务。
 * 返回新建藏品的行数组。
 */
async function openOnce(userId, box) {
  const pool = box.product_id ? await productRepo.listPoolItems(box.product_id) : []
  if (!pool.length) throw new BusinessError('该盲盒无概率池配置，无法开盒')

  const product = await productRepo.findProduct(box.product_id)
  const picks = drawPool(pool, BATCH_PER_OPEN)

  return db.transaction(() => {
    // 扣减余量：count > 0 写在 WHERE 里做乐观锁，返回 0 说明已被并发开掉。
    // 这同时兜住「盲盒确已耗尽」——此时抛出 ConflictError，与既有语义一致。
    const consumed = writeRepo.consumeBlindBox(box.id)
    if (consumed !== 1) throw new ConflictError('盲盒已开完')

    return picks.map((pick) => {
      const info = writeRepo.insertCollection({
        product_id: box.product_id,
        user_id: userId,
        collection_code: generateCollectionCode(),
        collection_code_num: null,
        series_total: pick.show_total_num || 0,
        rz_code: '',
        status: 1, // E-COLLECTION-STATUS 1=持有中
        price: product ? decimal.of(product.price).toFixed() : '0.0000',
        min_price: product ? decimal.of(product.price).toFixed() : '0.0000',
        count: 1,
        flux: product ? product.flux : 0,
        total_num: product ? product.total_num : 0,
        blind_box_id: box.blind_box_id,
      })
      return { id: info.id, pick, product }
    })
  })()
}

/**
 * 按归一化权重抽样。
 * 用 crypto.randomInt而非 Math.random：抽奖场景下可预测的随机源等于没有随机。
 */
function drawPool(pool, batch) {
  const weights = pool.map((p) => Number(p.probability) || 0)
  const sum = weights.reduce((a, b) => a + b, 0)
  if (sum <= 0) throw new BusinessError('概率池权重合计为 0，无法开盒')

  const total = sum * 1000 // 提高粒度，避免整数权重下抽样偏差过大
  const out = []
  for (let i = 0; i < batch; i++) {
    let ticket = crypto.randomInt(total)
    let hit = pool[pool.length - 1]
    for (let j = 0; j < pool.length; j++) {
      const w = Math.round((weights[j] / sum) * total)
      if (ticket < w) {
        hit = pool[j]
        break
      }
      ticket -= w
    }
    out.push(hit)
  }
  return out
}

/** 藏品编号 QC + yyMMdd + 6 位随机 + 2 位自增序列。uk_uc_code 唯一约束兜底重复 */
let seq = 0
function generateCollectionCode() {
  const d = new Date()
  const ymd =
    String(d.getFullYear()).slice(2) +
    String(d.getMonth() + 1).padStart(2, '0') +
    String(d.getDate()).padStart(2, '0')
  seq = (seq + 1) % 100
  const rand = String(crypto.randomInt(1000000)).padStart(6, '0')
  return `QC${ymd}${rand}${String(seq).padStart(2, '0')}`
}

/**
 * 响应组装：字段名逐字对齐 blindBoxResult.json / blindBoxResultOne.json。
 * collection_code 需回查藏品行（新插入的 code 在内存对象里没有）。
 */
async function toResponse(row) {
  const saved = await writeRepo.findCollectionForUpdate(row.id)
  const pick = row.pick
  const product = row.product
  return {
    id: row.id,
    name: pick.name,
    collection_code: saved ? saved.collection_code : '',
    listimg: pick.listimg || (product && product.listimg) || '',
    main_image: (product && product.main_image) || pick.listimg || '',
    rarity_icon: pick.rarity_icon || pick.listimg || '',
  }
}

module.exports = { openbox, openboxone, BATCH_PER_OPEN }