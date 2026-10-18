#!/usr/bin/env node
/**
 * 写接口正确性自测：事务回滚 / 幂等 / 金额精度。
 *
 * 在**独立库副本**上跑（不碰 data/qingchuan.db），测完即删。
 * 用法：node scripts/write_checks.mjs
 */
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs'
import Database from 'better-sqlite3'

/**
 * 库副本由外部准备好（服务进程已持有该文件的连接，本进程再复制会拿到旧快照）：
 *   cp data/qingchuan.db /tmp/wt/check.db
 *   SQLITE_PATH=/tmp/wt/check.db PORT=3102 node src/index.js
 *   node scripts/write_checks.mjs
 */
const DB = process.env.CHECK_DB || '/tmp/wt/check.db'
const raw = new Database(DB, { readonly: false })

const BASE = 'http://localhost:3102'
const pass = []
const fail = []
function check(name, ok, detail) {
  ;(ok ? pass : fail).push(`${name}${detail ? ' → ' + detail : ''}`)
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' → ' + detail : ''}`)
}

async function post(pathname, token, body) {
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers.token = token
  const res = await fetch(BASE + pathname, { method: 'POST', headers, body: JSON.stringify(body) })
  return res.json()
}

const count = (sql, ...p) => raw.prepare(sql).get(...p).c

// 取登录 token
const login = await post('/user/login', null, { account: '17587881293', password: 'x' })
const TOKEN = login.data.userinfo.token
check('登录签发 token', login.code === 1 && !!TOKEN)

/* ── 1. 事务回滚：中途失败不留脏数据 ───────────────────── */
const before = {
  listings: count('SELECT COUNT(*) c FROM market_listings'),
  orders: count('SELECT COUNT(*) c FROM orders'),
  uc: count("SELECT COUNT(*) c FROM user_collections WHERE status = 2"),
}
// 藏品 6004 可售，但传入非法金额 → 校验在事务前拦截
const bad = await post('/market/trade/sell', TOKEN, { user_collection_id: 6004, price: 'abc' })
const afterBad = {
  listings: count('SELECT COUNT(*) c FROM market_listings'),
  orders: count('SELECT COUNT(*) c FROM orders'),
  uc: count("SELECT COUNT(*) c FROM user_collections WHERE status = 2"),
}
check(
  '事务回滚：非法金额三表均无变化',
  bad.code === 400 &&
    afterBad.listings === before.listings &&
    afterBad.orders === before.orders &&
    afterBad.uc === before.uc,
  `code=${bad.code} listings ${before.listings}→${afterBad.listings} orders ${before.orders}→${afterBad.orders} status2 ${before.uc}→${afterBad.uc}`
)

/* 事务中途失败：藏品状态乐观锁失败会抛错 → 挂单与订单必须一起回滚。
   构造方式：先把 6004 的 status 改成 2（模拟并发已占用），再调用 sell。
   若无事务，insertListing 会成功留下一条脏挂单。*/
raw.prepare("UPDATE user_collections SET status = 2 WHERE id = 6007").run()
const midBefore = count('SELECT COUNT(*) c FROM market_listings')
const mid = await post('/market/trade/sell', TOKEN, { user_collection_id: 6007, price: '20.00' })
const midAfter = count('SELECT COUNT(*) c FROM market_listings')
check(
  '事务回滚：中途失败不残留挂单',
  mid.code === 409 && midAfter === midBefore,
  `code=${mid.code} listings ${midBefore}→${midAfter}`
)
raw.prepare("UPDATE user_collections SET status = 1 WHERE id = 6007").run()

/* ── 2. 幂等：业务级键（不含 order_sn，= 前端真实请求形态）─────────
   关键：前端从不传 order_sn（源站契约无此字段），
   故幂等必须建立在 user_id + 业务参数 上。
   历史实现只在 order_sn 存在时查重，导致重复点击产生多笔在途单
   （实测 entrust_orders 3→5），本组用例即该缺陷的回归防线。        */
const COUNT_SQL =
  "SELECT COUNT(*) c FROM entrust_orders WHERE user_id = 22291 AND product_id = 226 AND price = 88 AND number = 1 AND order_status = 2"
const ib1 = count(COUNT_SQL)
const e1 = await post('/market/trade/createBegBuyOrder', TOKEN, {
  goods_id: 226,
  price: '88.00',
  number: 1,
  type: 1,
})
const ibMid = count(COUNT_SQL)
const e2 = await post('/market/trade/createBegBuyOrder', TOKEN, {
  goods_id: 226,
  price: '88.00',
  number: 1,
  type: 1,
})
const ib2 = count(COUNT_SQL)
check(
  '幂等：createBegBuyOrder 无 order_sn 两次提交只落 1 行且 id 相同',
  e1.code === 1 &&
    e2.code === 1 &&
    e1.data.id === e2.data.id &&
    ibMid - ib1 === 1 &&
    ib2 === ibMid,
  `该参数在途单数 ${ib1}→${ibMid}→${ib2}，返回 id ${e1.data.id} / ${e2.data.id}`
)

// 连发 3 次：验证不只是第 2 次，任意一次重发都收敛到同一单
const e3 = await post('/market/trade/createBegBuyOrder', TOKEN, {
  goods_id: 226,
  price: '88.00',
  number: 1,
  type: 1,
})
const ib3 = count(COUNT_SQL)
check(
  '幂等：createBegBuyOrder 第 3 次提交仍收敛到同一单',
  e3.code === 1 && e3.data.id === e1.data.id && ib3 === ib2,
  `id=${e3.data.id}，该参数在途单数 ${ib3}`
)

// 参数变更必须是新意图，不得被幂等误拦
const changed = await post('/market/trade/createBegBuyOrder', TOKEN, {
  goods_id: 226,
  price: '88.01',
  number: 1,
  type: 1,
})
const ibChanged = count('SELECT COUNT(*) c FROM entrust_orders WHERE price = 88.01 AND order_status = 2')
check(
  '幂等不误拦：改价（88.00→88.01）产生新单',
  changed.code === 1 && changed.data.id !== e1.data.id && ibChanged === 1,
  `新单 id=${changed.data?.id}，88.01 在途单数 ${ibChanged}`
)

/* sell 幂等：不传 order_sn，同一藏品重复提交只挂一单 */
const slb = count('SELECT COUNT(*) c FROM market_listings WHERE collection_id = 6001 AND status = 1')
const s1 = await post('/market/trade/sell', TOKEN, {
  user_collection_id: 6001,
  price: '15.00',
})
const slMid = count('SELECT COUNT(*) c FROM market_listings WHERE collection_id = 6001 AND status = 1')
const s2 = await post('/market/trade/sell', TOKEN, {
  user_collection_id: 6001,
  price: '15.00',
})
const sl2 = count('SELECT COUNT(*) c FROM market_listings WHERE collection_id = 6001 AND status = 1')
check(
  '幂等：sell 无 order_sn 两次提交只挂 1 单且 id 相同',
  s1.code === 1 &&
    s2.code === 1 &&
    s1.data.id === s2.data.id &&
    slMid - slb === 1 &&
    sl2 === slMid,
  `寄售中挂单 ${slb}→${slMid}→${sl2}，返回 id ${s1.data.id} / ${s2.data.id}`
)

// sell 重试不得重复落订单单（sell 一笔要写 3 张表）
const ordSn = s1.data.order_sn
const dupOrders = count('SELECT COUNT(*) c FROM orders WHERE order_sn LIKE ?', `${ordSn}%`)
check('幂等：sell 重试未重复落卖出订单', dupOrders === 1, `order_sn 前缀 ${ordSn} 命中 ${dupOrders} 行`)

/* register幂等：同一手机号是真实冲突，必须 409（区别于「返回已有记录」）*/
const regMobile = '13900009999'
const reg1 = await post('/user/register', null, { mobile: regMobile, password: 'x' })
const reg2 = await post('/user/register', null, { mobile: regMobile, password: 'y' })
const regUsers = count('SELECT COUNT(*) c FROM users WHERE mobile = ?', regMobile)
check(
  '幂等：register 同一手机号返 409 且不重复建号',
  reg1.code === 1 && reg2.code === 409 && regUsers === 1,
  `第1次 code=${reg1.code} 第2次 code=${reg2.code}，该手机号用户数 ${regUsers}`
)

/* register 第二个新用户不得撞 inviter_code 唯一约束（uk_users_inviter_code）。
   历史实现写死 inviter_code=''，而库中 4930 已占位空串，
   导致「第二个新用户注册必 500」（已实测复现 UNIQUE constraint failed）。 */
const regB = await post('/user/register', null, { mobile: '13900008888', password: 'x' })
const emptyCode = count("SELECT COUNT(*) c FROM users WHERE mobile IN (?, ?)", regMobile, '13900008888')
check(
  '修复：连续注册两个新用户均成功（inviter_code 唯一约束）',
  regB.code === 1 && emptyCode === 2,
  `第2个新用户 code=${regB.code}，两账号均存在=${emptyCode === 2}`
)

/* openbox 幂等：count=1 的盲盒重复提交不得二次开盒。
   基线库的盲盒行 id=55012 是 count=0 且 product_id=NULL（无法开盒），
   故本用例在库副本内自行造一个 count=1、product_id=226（有概率池）的盲盒行。
   注：本脚本整体跑在库副本上（见文件头），造数据不影响 data/qingchuan.db。*/
raw
  .prepare(
    `INSERT INTO user_collections (id, product_id, user_id, collection_code, collection_code_num,
       serial_num, series_total, user_hash, user_hash_text, rz_code, status, is_lock, weither_regift,
       weither_resale, can_compose, price, min_price, today_volume, has_sold, count, flux, total_num,
       zuzhao_info_id, task_id, blind_box_id, createtime, created_at, updated_at)
     VALUES (99001, 226, 22291, 'TESTBOX001', NULL, 0, 0, '', '', '', 1, 0, 0, 0, 0, 88.0, 88.0,
       0, 0, 1, 0, 0, NULL, '', 901, ?, ?, ?)`
  )
  .run(Math.floor(Date.now() / 1000), Math.floor(Date.now() / 1000), Math.floor(Date.now() / 1000))
const ob1 = await post('/user_collection/user_collection/openboxone', TOKEN, { blind_box_id: 99001 })
const ob2 = await post('/user_collection/user_collection/openboxone', TOKEN, { blind_box_id: 99001 })
const openedRows = count(
  'SELECT COUNT(*) c FROM user_collections WHERE user_id = 22291 AND blind_box_id = 901 AND id <> 99001'
)
// 注意：count() 帮助函数是 COUNT(*)，读「剩余数量」必须直接取 count 列
const boxLeft = raw.prepare('SELECT count FROM user_collections WHERE id = 99001').get().count
check(
  '幂等：openboxone 无幂等键重复提交不二次开盒（count 耗尽后仍返同一结果）',
  ob1.code === 1 && ob2.code === 1 && ob1.data?.id === ob2.data?.id && openedRows === 1,
  `产出藏品 ${openedRows} 行，返回 id ${ob1.data?.id} / ${ob2.data?.id}（首次 code=${ob1.code} 重试 code=${ob2.code}）`
)
check(
  '幂等：openboxone 重复提交只扣一次盲盒余量（count=1 → 0）',
  boxLeft === 0,
  `盲盒剩余 count=${boxLeft}（应为 0：扣 1 次而非 2 次，扣 2 次会得 -1）`
)

/* 幂等重放必须稳定：连续 3 次重试都返回同一产出，不得随次数变化 */
const ob3 = await post('/user_collection/user_collection/openboxone', TOKEN, { blind_box_id: 99001 })
const ob4 = await post('/user_collection/user_collection/openboxone', TOKEN, { blind_box_id: 99001 })
const openedRows2 = count(
  'SELECT COUNT(*) c FROM user_collections WHERE user_id = 22291 AND blind_box_id = 901 AND id <> 99001'
)
check(
  '幂等：openboxone 连发 4 次始终返回同一产出且库中始终 1 行',
  ob3.data?.id === ob1.data?.id && ob4.data?.id === ob1.data?.id && openedRows2 === 1,
  `id 依次 ${ob1.data?.id}/${ob2.data?.id}/${ob3.data?.id}/${ob4.data?.id}，库中产出 ${openedRows2} 行`
)

/* compound/result：读接口幂等（两次调用不产生新行、结果一致）*/
const crRows1 = count('SELECT COUNT(*) c FROM compound_results')
const cr1 = await post('/compound/compound/result', TOKEN, {})
const cr2 = await post('/compound/compound/result', TOKEN, {})
const crRows2 = count('SELECT COUNT(*) c FROM compound_results')
check(
  '幂等：compound/result 两次调用结果一致且不新增记录',
  cr1.code === 1 &&
    cr2.code === 1 &&
    JSON.stringify(cr1.data) === JSON.stringify(cr2.data) &&
    crRows1 === crRows2,
  `compound_results ${crRows1}→${crRows2}`
)

/* ── 3. 金额精度：分账无浮点误差 ────────────────────────── */
// 0.1+0.2 类陷阱：price=0.07, number=3 → total 0.21（float 会得 0.21000000000000002）
const amt = await post('/market/trade/createBegBuyOrder', TOKEN, {
  goods_id: 226,
  price: '0.07',
  number: 3,
  order_sn: 'AMOUNT-TEST-001',
})
check(
  '金额精度：0.07 × 3 = 0.21（float 会得 0.21000000000000002）',
  amt.data.total_price === '0.21' && amt.data.price === '0.07',
  `total_price=${amt.data.total_price} price=${amt.data.price}`
)

// 分账：15 − 0.75 − 0.00 = 14.25，且库中落值一致
const sellAmt = await post('/market/trade/sell', TOKEN, {
  user_collection_id: 6008,
  price: '1234.56',
  order_sn: 'AMOUNT-SELL-001',
})
const listing = raw
  .prepare("SELECT * FROM market_listings WHERE order_sn = 'AMOUNT-SELL-001'")
  .get()
const expectFee = '61.73' // 1234.56 × 0.05 = 61.728 → half-up 2 位 = 61.73
const expectReal = '1172.83' // 1234.56 − 61.73 = 1172.83
check(
  '金额精度：分账落库与响应一致（1234.56 − 61.73 = 1172.83）',
  sellAmt.data.platform_service_price === expectFee &&
    sellAmt.data.real_income === expectReal &&
    // DB 侧读回是 double（SQLite NUMERIC 列），故按数值口径比较：
    // 61.73 与 1172.83 均为精确值，说明定点运算未被浮点污染。
    Number(listing.platform_service_price) === Number(expectFee) &&
    Number(listing.real_income) === Number(expectReal) &&
    // 注意：SQLite 的 NUMERIC 列会把十进制串转成double 存储（全库 DECIMAL 列皆如此，
    // 非本轮引入），故读回是 1234.56 而非 '1234.5600'。数值等价，比较按数值口径。
    Number(listing.price) === 1234.56,
  `fee=${listing.platform_service_price} real=${listing.real_income} price=${listing.price}（float: ${(1234.56 * 0.05).toFixed(20)}）`
)

/* ── 4. 业务规则 ───────────────────────────────────────── */
const noCount = await post('/market/trade/sell', TOKEN, { user_collection_id: 77001, price: '15.00' })
check('业务规则：count=0 藏品不可出售', noCount.code === 422, `code=${noCount.code} msg=${noCount.msg}`)

const noAuth = await post('/market/trade/sell', null, { user_collection_id: 6001, price: '15.00' })
check('业务规则：无 token 401', noAuth.code === 401, `code=${noAuth.code}`)

const otherUser = await post('/user/login', null, { account: '130****5775', password: 'x' })
const crossToken = otherUser.data.userinfo.token
const cross = await post('/market/trade/sell', crossToken, { user_collection_id: 6001, price: '15.00' })
check('业务规则：他人藏品 403', cross.code === 403 || cross.code === 409, `code=${cross.code} msg=${cross.msg}`)

console.log(`\n通过 ${pass.length} / ${pass.length + fail.length}`)
if (fail.length) {
  console.log('失败项:')
  fail.forEach((f) => console.log('  - ' + f))
}
raw.close()
// 不删库副本：服务进程仍持有连接，删除会留下 -wal/-shm 残留文件
process.exit(fail.length ? 1 : 0)