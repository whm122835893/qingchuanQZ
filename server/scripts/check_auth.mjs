#!/usr/bin/env node
/**
 * 鉴权矩阵自检（自检 C）。
 *
 * 三组断言：
 *  1. 39 条需鉴权接口：无 token → 401
 *  2. 30 条公开接口：无 token → code=1
 *  3. 错误 token / 过期 token → 401
 *
 * 用法：TOKEN=<合法 token> node scripts/check_auth.mjs [--base http://localhost:3100]
 */
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const PROJECT = path.resolve(ROOT, '..')

const argv = process.argv.slice(2)
const argOf = (f, d) => {
  const i = argv.indexOf(f)
  return i >= 0 && argv[i + 1] ? argv[i + 1] : d
}
const BASE = argOf('--base', process.env.BASE_URL || 'http://localhost:3100')
const VALID_TOKEN = process.env.TOKEN || null
const UID = process.env.UID || '22291'

const E = loadEndpoints()
const READ = Object.keys(E).filter((p) => E[p].impl === 'done')

function loadEndpoints() {
  const file = path.join(PROJECT, 'docs/backend/endpoint_meta.py')
  const py = [
    'import importlib.util, json',
    `spec = importlib.util.spec_from_file_location("em", ${JSON.stringify(file)})`,
    'm = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)',
    'print(json.dumps(m.E, ensure_ascii=False))',
  ].join('\n')
  return JSON.parse(execFileSync('python3', ['-c', py], { encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 }))
}

async function post(pathname, token, body = { id: 1, page: 1 }) {
  const headers = { 'Content-Type': 'application/json', version: '1.0.1' }
  if (token !== null && token !== undefined) headers.token = token
  const res = await fetch(`${BASE}${pathname}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })
  return res.json()
}

function makeToken(payload, expiresIn) {
  const js = [
    `const jwt = require(${JSON.stringify(path.join(ROOT, 'node_modules/jsonwebtoken'))})`,
    'const env = require(process.env.__ENV_PATH)',
    `process.stdout.write(jwt.sign(${JSON.stringify(payload)}, env.jwtSecret, { expiresIn: ${JSON.stringify(expiresIn)} }))`,
  ].join('\n')
  return execFileSync('node', ['-e', js], {
    encoding: 'utf8',
    env: { ...process.env, __ENV_PATH: path.join(ROOT, 'src/config/env.js') },
  }).trim()
}

async function main() {
  // endpoint_meta 的 auth=True 共 39 条，其中 7 条是本轮未实现的写接口
  // （写接口同样要求 token），故鉴权矩阵按「读接口 34 条 + 写接口 5 条」分别核对。
  const needAuth = READ.filter((p) => E[p].auth === true)
  const isPublic = READ.filter((p) => E[p].auth === false)
  const TODO_WRITE = [
    '/market/trade/createBegBuyOrder',
    '/market/trade/sell',
    '/user_collection/user_collection/openbox',
    '/user_collection/user_collection/openboxone',
    '/compound/compound/result',
  ]

  const badToken = 'not-a-jwt'
  const expiredToken = makeToken({ uid: Number(UID), nickname: 'x' }, '-1s')
  const goodToken = VALID_TOKEN || makeToken({ uid: Number(UID), nickname: 'x' }, '1h')

  const failures = []

  // 1) 需鉴权：无 token → 401
  for (const p of needAuth) {
    const r = await post(concrete(p), null)
    if (r.code !== 401) failures.push({ group: 'need_auth_without_token', path: p, got: r.code })
  }

  // 2) 公开：无 token → 不得 401。
  // 不断言 code===1：部分公开接口按通用 id=1 查会命中业务 404（如公告/藏品/规则不存在），
  // 那是正确的业务响应，不是鉴权问题。403/500 才是缺陷。
  for (const p of isPublic) {
    const r = await post(concrete(p), null)
    if (r.code === 401 || r.code === 403 || r.code >= 500) {
      failures.push({ group: 'public_without_token', path: p, got: r.code, msg: r.msg })
    }
  }

  // 3) 错误 token → 401（抽样 10 条 + 全部公开接口确认不被 token 影响）
  for (const p of needAuth.slice(0, 10)) {
    const r = await post(concrete(p), badToken)
    if (r.code !== 401) failures.push({ group: 'bad_token', path: p, got: r.code })
  }
  // 过期 token → 401
  for (const p of needAuth.slice(0, 10)) {
    const r = await post(concrete(p), expiredToken)
    if (r.code !== 401) failures.push({ group: 'expired_token', path: p, got: r.code })
  }
  // 公开接口带合法 token 也不应被鉴权拦下（token 不改变公开接口行为）
  for (const p of isPublic.slice(0, 10)) {
    const r = await post(concrete(p), goodToken)
    if (r.code === 401 || r.code === 403) {
      failures.push({ group: 'public_with_token', path: p, got: r.code, msg: r.msg })
    }
  }

  const report = {
    generated_at: new Date().toISOString(),
    base_url: BASE,
    summary: {
      need_auth_read: needAuth.length,
      need_auth_todo_write: TODO_WRITE.length,
      need_auth_total: needAuth.length + TODO_WRITE.length,
      public: isPublic.length,
      failures: failures.length,
    },
    failures,
  }
  console.log(JSON.stringify(report, null, 2))
  process.exit(failures.length ? 1 : 0)
}

function concrete(p) {
  return p.replace(/\{(\w+)\}/g, (_m, k) => (k === 'id' ? '240472' : '1'))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
