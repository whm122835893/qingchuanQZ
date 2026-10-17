/**
 * 逐接口契约验证（自检 B）。
 *
 * 对每个读接口：POST 请求本地服务 → 与 public/mock/<mock> 的data 做字段级 diff。
 *   - mock 有而后端缺 = missing（遗漏，需补）
 *   - 后端有而 mock 无 = extra（无依据，需删或说明）
 *   - 类型不一致 = type_mismatch（源站本身存在不一致，如 afficheList.per_page 是字符串）
 *
 * 用法：node scripts/import_mock.mjs [--base http://localhost:3100] [--out reports/contract-diff.json]
 *退出码 0 = 全部接口可达（字段差异不阻断，差异写入报告）
 */
import fs from 'node:fs'
import { execFileSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const PROJECT = path.resolve(ROOT, '..')

const argv = process.argv.slice(2)
function argOf(flag, fallback) {
  const i = argv.indexOf(flag)
  return i >= 0 && argv[i + 1] ? argv[i + 1] : fallback
}

const BASE = argOf('--base', process.env.BASE_URL || 'http://localhost:3100')
const OUT = path.resolve(ROOT, argOf('--out', 'reports/contract-diff.json'))
const MOCK_DIR = path.join(PROJECT, 'public/mock')
const { REQUESTS } = await import('./contract_diff_requests.mjs')

/**
 * 已知无法消除的差异及其原因（逐条核实过DB 与 mock，非遗留 TODO）。
 * 报告里原样输出，不做粉饰，也不为了好看去改后端返回。
 */
const ANNOTATIONS = {
  '/market/market/MarketDetail/ids/{id}':
    'buy_user_id / product.purchase_information：库中该挂单(240472)buy_user_id 为 NULL、products(236).purchase_information 为 NULL，属真实数据缺失，不编造。',
  '/order/order/myConsignment':
    'data[].collection_code：market_listings 33 行中仅 1 行有 collection_id，且其 user_collections(5712041).collection_code 为 NULL，编号无数据来源；mock 的 "QC88231" 系样例值。',
  '/crystal_goods/goodsDetail':
    'product.publisher：shop_goods 无发行方列，库中也不存在与 shop_goods 同 id 的 products 行，无数据来源；collectionlist 的 6 个 extra 是因为 mock 该商品 collectionlist 为空数组而库中 101 号商品有概率池（product_pool_items / shop_goods.pool_items 实有数据）。',
  '/crystal_goods/boxDetail':
    'product.publisher：同 goodsDetail，shop_goods 无发行方列，无数据来源。',
  '/crystal_goods/collectionDetail':
    'product.publisher：同 goodsDetail，shop_goods 无发行方列，无数据来源。',
  '/box/blind_box/myBox':
    'name/listimg/main_image/rarity_icon/product_id：user_collections 中唯一 blind_box_id 非空的行(55012)其 product_id 为 NULL（悬空引用），无从取商品信息；返回部分字段而非崩溃。',
  '/box/blind_box/openlog':
    '同 myBox：开盒记录关联的 user_collections.product_id 为 NULL，商品名/图/编号/稀有度图标无来源。',
  '/box/blind_box/list':
    'mock 源站返回空数组，无字段基准；后端返回库内实际 1 条products(goods_type=1)。',
}

/** 写接口（本轮 TODO）：只验可达与 msg 标注 */
const TODO_PATHS = [
  '/user/login',
  '/user/register',
  '/market/trade/createBegBuyOrder',
  '/market/trade/sell',
  '/user_collection/user_collection/openbox',
  '/user_collection/user_collection/openboxone',
  '/compound/compound/result',
]

/**
 * 读取 endpoint_meta.py 的 E 字典。
 * 走 python3 dump 成 JSON（该文件是Python 语法，JS 无法直接 eval；
 * 硬正则解析会在 True/False/None 上出错）。
 */
function loadEndpoints() {
  const file = path.join(PROJECT, 'docs/backend/endpoint_meta.py')
  const py = [
    'import importlib.util, json',
    `spec = importlib.util.spec_from_file_location("em", ${JSON.stringify(file)})`,
    'm = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)',
    'print(json.dumps(m.E, ensure_ascii=False))',
  ].join('\n')
  const out = execFileSync('python3', ['-c', py], { encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 })
  return JSON.parse(out)
}

/** 取 mock 文件名（形如 "orderDetail.json（与 begBuyOrderInfo 共用同一文件）"） */
function mockFile(meta) {
  if (!meta.mock) return null
  const name = meta.mock.split('（')[0].trim()
  return name.endsWith('.json') ? name : null
}

async function post(pathname, body, token) {
  const headers = { 'Content-Type': 'application/json', version: '1.0.1' }
  if (token) headers.token = token
  const res = await fetch(`${BASE}${pathname}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body || {}),
  })
  return res.json()
}

function typeOf(v) {
  if (v === null) return 'null'
  if (Array.isArray(v)) return 'array'
  return typeof v
}

/** 递归收集字段路径（含数组首元素） */
function paths(value, prefix, out, depth = 0) {
  if (depth > 6) return
  if (Array.isArray(value)) {
    out.push({ path: prefix, type: 'array' })
    if (value.length) paths(value[0], `${prefix}[]`, out, depth + 1)
    return
  }
  if (value && typeof value === 'object') {
    out.push({ path: prefix, type: 'object' })
    for (const k of Object.keys(value)) paths(value[k], prefix ? `${prefix}.${k}` : k, out, depth + 1)
    return
  }
  out.push({ path: prefix, type: typeOf(value) })
}

function diffFields(mockData, apiData) {
  const a = []
  const b = []
  paths(mockData, '', a)
  paths(apiData, '', b)
  const bMap = new Map(b.map((x) => [x.path, x.type]))
  const aMap = new Map(a.map((x) => [x.path, x.type]))
  const missing = []
  const typeMismatch = []
  for (const item of a) {
    if (!bMap.has(item.path)) {
      if (!bMap.has(item.path.replace(/\[\]$/, ''))) missing.push(item.path)
    } else if (bMap.get(item.path) !== item.type) {
      typeMismatch.push({ path: item.path, mock: item.type, api: bMap.get(item.path) })
    }
  }
  const extra = []
  for (const item of b) {
    if (!aMap.has(item.path) && !aMap.has(item.path.replace(/\[\]$/, ''))) extra.push(item.path)
  }
  return { missing, extra, typeMismatch }
}

async function main() {
  const E = loadEndpoints()
  const readPaths = Object.keys(E).filter((p) => E[p].impl === 'done')

  // 动态段 {id} 换成实参（前端 src/api/index.js 用模板串拼真实 id）
  // 取240472：库中唯一同时有 sale_user_id 与 collection_id 的挂单，
  // 能覆盖 marketDetail 的 user / user_collection 两个子对象
  const SAMPLE_ID = 240472
  const concrete = (p) => p.replace(/\{(\w+)\}/g, (_m, k) => String(SAMPLE_ID))

  // 鉴权 token：需鉴权接口靠它通过；可用 `npm run token` 生成后以 TOKEN=... 传入
  const token = process.env.TOKEN || null

  const results = []
  for (const p of readPaths) {
    const meta = E[p]
    const route = concrete(p)
    const body = REQUESTS[route] || REQUESTS[p] || {}
    let api
    try {
      api = await post(route, body, token)
    } catch (err) {
      results.push({ path: p, error: String(err) })
      continue
    }
    const entry = {
      path: p,
      route,
      style: meta.style,
      auth_required: meta.auth,
      http_code: api.code,
      msg: api.msg,
      mock: meta.mock,
    }
    if (api.code !== 1) {
      entry.status = 'unavailable'
      entry.reason = `code=${api.code} msg=${api.msg}`
      results.push(entry)
      continue
    }
    const mf = mockFile(meta)
    if (!mf) {
      entry.status = 'aligned'
      entry.note = '无 mock 基准'
      results.push(entry)
      continue
    }
    const mockJson = JSON.parse(fs.readFileSync(path.join(MOCK_DIR, mf), 'utf8'))
    const d = diffFields(mockJson.data, api.data)
    if (isEmptyData(mockJson.data)) {
      // mock 本身为空（如 blindBoxList 源站返回 []），无字段基准可比
      entry.status = 'no_baseline'
      entry.note = 'mock data 为空，无字段基准；后端返回库内实际数据'
      entry.missing = []
      entry.extra = []
      entry.type_mismatch = []
      entry.mock_data_is_empty = true
      results.push(entry)
      continue
    }
    entry.status = d.missing.length === 0 && d.extra.length === 0 && d.typeMismatch.length === 0 ? 'aligned' : 'diff'
    entry.missing = d.missing
    entry.extra = d.extra
    entry.type_mismatch = d.typeMismatch
    entry.mock_data_is_empty = isEmptyData(mockJson.data)
    entry.api_data_is_empty = isEmptyData(api.data)
    if (entry.status === 'diff' && ANNOTATIONS[p]) entry.reason = ANNOTATIONS[p]
    results.push(entry)
  }

  // 写接口：验可达 + msg 带 TODO 标注
  const todoResults = []
  for (const p of TODO_PATHS) {
    const api = await post(p, {}, token).catch((e) => ({ code: -1, msg: String(e) }))
    todoResults.push({
      path: p,
      http_code: api.code,
      marked_todo: typeof api.msg === 'string' && api.msg.includes('TODO: 未实现'),
      data_shape_ok: api.code === 1 && api.data !== undefined,
    })
  }

  const aligned = results.filter((r) => r.status === 'aligned').length
  const diffs = results.filter((r) => r.status === 'diff')
  const noBaseline = results.filter((r) => r.status === 'no_baseline')
  const unavailable = results.filter((r) => r.status === 'unavailable' || r.error)

  const report = {
    generated_at: new Date().toISOString(),
    base_url: BASE,
    summary: {
      total_read_endpoints: readPaths.length,
      aligned,
      no_baseline: noBaseline.length,
      with_diff: diffs.length,
      unavailable: unavailable.length,
      todo_endpoints: TODO_PATHS.length,
    },
    diff_ranked: diffs
      .map((r) => ({
        path: r.path,
        missing: r.missing.length,
        extra: r.extra.length,
        type_mismatch: r.type_mismatch.length,
      }))
      .sort((a, b) => b.missing + b.extra - (a.missing + a.extra)),
    endpoints: results,
    todo_endpoints: todoResults,
  }

  fs.mkdirSync(path.dirname(OUT), { recursive: true })
  fs.writeFileSync(OUT, JSON.stringify(report, null, 2))
  console.log(
    JSON.stringify(
      {
        out: OUT,
        summary: report.summary,
        diff_ranked: report.diff_ranked.slice(0, 10),
        todo: todoResults,
      },
      null,
      2
    )
  )
}

function isEmptyData(d) {
  if (d === null) return true
  if (Array.isArray(d)) return d.length === 0
  if (typeof d === 'object') {
    for (const k of Object.keys(d)) {
      if (k === 'data' || k === 'list') return Array.isArray(d[k]) && d[k].length === 0
    }
  }
  return false
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})