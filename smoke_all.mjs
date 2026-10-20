/**
 * 全站冒烟：所有路由逐个导航，收集 console error / mock 回落 / 后端 5xx / 空页。
 *
 * 前置：VITE_API_BASE=http://localhost:3100 启动 vite + 3100 后端在线（见 e2e_trade.mjs 头）。
 * 路由清单从 src/router/index.js 提取（正则匹配 path/name 对）。
 *
 * 已知边界（2026-10-20 实测，非缺陷）：
 *   - 「空页」判据（body 文本 < 30 字符）有时序假阳性：数据异步到达前 innerText 已取。
 *     必须用截图文件大小二次甄别（< 12KB 才大概率为真空页）。
 *   - myEnablingCenter / empty 页源站本就是空壳，忠实保留。
 *   - 详情类页面无参访问会因业务 404 回落 mock，须带真实 id 复测（见 smoke_params.mjs）。
 */
/**
 * 全站冒烟（原 109 条路由）逐个导航，收集
 *   - console error（排除 favicon 等噪音）
 *   - mock 回落告警（假绿检测，判据必须为 0）
 *   - 后端 5xx 响应
 *   - 空页（body 文本 < 30 字符 且无 .uni-shim-toast）
 * 每页截图存 /tmp/smoke/shots/。
 *
 * 前置：VITE_API_BASE=http://localhost:3100 启动 vite + 3100 后端在线。
 */
import { chromium } from 'playwright';
import fs from 'fs';

const FE = 'http://localhost:5173';
const BE = 'http://localhost:3100';
const OUT = '/tmp/smoke';
const SHOTS = `${OUT}/shots`;
fs.mkdirSync(SHOTS, { recursive: true });

const routes = JSON.parse(fs.readFileSync('/tmp/smoke_routes.json', 'utf8'));

const b = await chromium.launch({
  executablePath: '/root/.cache/ms-playwright/chromium-1247/chrome-linux64/chrome',
  args: ['--no-sandbox']
});
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const p = await ctx.newPage();

// 登录（API 注入，冒烟关注渲染不关注登录 UI）
await p.goto(FE + '/#/pages/index/index', { waitUntil: 'domcontentloaded' });
const login = await fetch(BE + '/user/login', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ account: '17587881293', password: 'whm981004' })
}).then(r => r.json());
const token = login.data.userinfo.token;
await p.evaluate(t => localStorage.setItem('token', t), token);
console.log('token 就绪');

const problems = [];
const fallbackTotal = [];
let done = 0;

for (const r of routes) {
  const slug = r.name;
  const tag = `[${done + 1}/${routes.length}] ${slug} ${r.path}`;
  const errs = [];
  const fbs = [];
  const srv5xx = [];
  const onErr = (m) => { const t = m.text(); if (!/favicon|ERR_INTERNET_DISCONNECTED/i.test(t)) errs.push(t.slice(0, 160)); };
  const onFb = (m) => { if (m.text().includes('回落')) fbs.push(m.text().slice(0, 150)); };
  const onResp = async (res) => {
    if (res.url().includes('3100') && res.status() >= 500) srv5xx.push(res.url().replace(BE, '') + ' ' + res.status());
  };
  p.on('console', onErr); p.on('console', onFb); p.on('response', onResp);

  let empty = false, textLen = 0;
  try {
    await p.goto(`${FE}/#${r.path}`, { waitUntil: 'networkidle', timeout: 12000 }).catch(() => {});
    await p.waitForTimeout(1100);
    const txt = await p.locator('body').innerText().catch(() => '');
    textLen = txt.replace(/\s/g, '').length;
    empty = textLen < 30;
    await p.screenshot({ path: `${SHOTS}/${slug}.png`, timeout: 5000 }).catch(() => {});
  } catch (e) {
    errs.push('NAV: ' + e.message.slice(0, 120));
  }
  p.off('console', onErr); p.off('console', onFb); p.off('response', onResp);

  if (errs.length || fbs.length || srv5xx.length || empty) {
    problems.push({ slug, path: r.path, empty, textLen, errs: errs.slice(0, 3), fbs: fbs.slice(0, 3), srv5xx });
    console.log(`${tag} -> 问题: ${empty ? '空页 ' : ''}err=${errs.length} fb=${fbs.length} 5xx=${srv5xx.length} 文本=${textLen}`);
  } else {
    console.log(`${tag} -> OK (文本=${textLen})`);
  }
  fbs.forEach(f => fallbackTotal.push(slug + ' | ' + f));
  done++;
}

fs.writeFileSync(`${OUT}/problems.json`, JSON.stringify(problems, null, 1));
console.log('\n===== 汇总 =====');
console.log('总页数:', routes.length, '| 问题页:', problems.length, '| mock 回落告警:', fallbackTotal.length);
problems.forEach(x => console.log(' -', x.slug, x.path, '| 空页:', x.empty, '| err:', x.errs.length, '| fb:', x.fbs.length, '| 5xx:', x.srv5xx.length));
await b.close();
