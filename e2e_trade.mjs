/**
 * 交易链路端到端回归（前端 5173 → 后端 3100）。
 *
 * 前提：前端必须真连后端才有效，即 VITE_API_BASE=http://localhost:3100 启动 vite。
 * 默认 .env 的 VITE_API_BASE=. 会让请求打到自身域 404 → 静默回落 mock（假绿），
 * 此时本脚本会误报全绿。启动方式：
 *   VITE_API_BASE=http://localhost:3100 npx vite --port 5173
 *   PORT=3100 node src/index.js   （server 目录，CORS 白名单已含 5173）
 *
 * 链路覆盖：登录 → 市场详情(真实挂单) → 立即购买 → 确认购买弹层 → 立即支付
 *          → 藏品详情 → 寄售入口 → 盲盒页。
 *
 * 【写操作为何点不动】源站下单/支付/寄售/出售/委托/求购全部要先过 w-jy-verify
 * 滑块人机验证（源站 bundle 实证），本地没有滑块 SDK，页面忠实复刻为 toast 占位
 * （与源站不可绕过一致），因此 UI 层点到支付只会弹「原站下单需人机验证」。
 * 真写链路（sell / batchchangeMarketGoods / openbox）由接口层与 write_checks.mjs
 * 验证落库与幂等，不在本脚本内。
 *
 * 判据：脚本末尾打印「mock 回落」必须为「无」；有回落即为假绿。
 */
import { chromium } from 'playwright';
import fs from 'fs';
const FE = 'http://localhost:5173';
const BE = 'http://localhost:3100';
const OUT = '/tmp/e2e';
const log = [];
const say = (s) => { console.log(s); log.push(s); };

const b = await chromium.launch({
  executablePath: '/root/.cache/ms-playwright/chromium-1247/chrome-linux64/chrome',
  args: ['--no-sandbox']
});
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const p = await ctx.newPage();
const beReqs = [];
p.on('request', r => { if (r.url().includes('3100')) beReqs.push(r.method() + ' ' + r.url().replace(BE, '').slice(0, 70)); });
const fb = [];
p.on('console', m => { if (m.text().includes('回落')) fb.push(m.text().slice(0, 120)); });

let n = 0;
async function step(name, fn) {
  n++;
  try { await fn(); say(`STEP ${n} ${name}: OK`); } catch (e) { say(`STEP ${n} ${name}: FAIL -> ${e.message.slice(0, 140)}`); }
}

// 0. 先落首页，建立 history，使登录后 router.back() 有去处
await p.goto(FE + '/#/pages/index/index', { waitUntil: 'networkidle' });
await p.waitForTimeout(1500);

await step('登录（UI）', async () => {
  await p.goto(FE + '/#/pages/login/login', { waitUntil: 'networkidle' });
  await p.waitForTimeout(1500);
  await p.locator('input').nth(0).fill('17587881293');
  await p.locator('input').nth(1).fill('whm981004');
  await p.locator('.btn-primary').first().click();
  await p.waitForTimeout(3000);
  const tk = await p.evaluate(() => { try { return localStorage.getItem('token') || ''; } catch { return 'ERR'; } });
  say('  token 长度: ' + (tk === 'ERR' ? 'ERR' : tk.length) + ' | URL=' + p.url().split('#')[1]);
  if (!tk || tk === 'ERR') throw new Error('未取到 token');
  fs.writeFileSync(`${OUT}/token.txt`, tk);
});

await step('市场详情 240472 + 立即购买', async () => {
  await p.goto(FE + '/#/pages/market/detail?id=240472', { waitUntil: 'networkidle' });
  await p.waitForTimeout(2500);
  const buy = p.getByText('立即购买', { exact: false }).first();
  const ok = await buy.click({ timeout: 4000 }).then(() => true).catch(() => false);
  say('  点「立即购买」: ' + ok);
  await p.waitForTimeout(1500);
  const txt = await p.locator('body').innerText();
  say('  弹层出现「确认购买」: ' + txt.includes('确认购买'));
  await p.screenshot({ path: `${OUT}/v2_buy_sheet.png` });
});

await step('确认购买弹层 → 立即支付', async () => {
  const pay = p.getByText(/立即支付|立即下单/).first();
  const ok = await pay.click({ timeout: 4000 }).then(() => true).catch(() => false);
  await p.waitForTimeout(1500);
  const toast = await p.locator('.uni-shim-toast').first().innerText().catch(() => '');
  say('  点支付: ' + ok + ' | toast=' + JSON.stringify(toast));
  say('  预期 toast 含「人机验证」: ' + toast.includes('人机验证'));
  await p.screenshot({ path: `${OUT}/v2_pay_toast.png` });
});

await step('寄售链路（我的藏品 → 详情 → 寄售）', async () => {
  await p.goto(FE + '/#/pages/myCollection/collectionDetails?id=6001', { waitUntil: 'networkidle' });
  await p.waitForTimeout(2500);
  const txt = await p.locator('body').innerText();
  say('  藏品详情片段: ' + JSON.stringify(txt.slice(0, 100)));
  const sell = p.getByText(/寄售|出售/).first();
  const ok = await sell.click({ timeout: 4000 }).then(() => true).catch(() => false);
  await p.waitForTimeout(1500);
  const toast = await p.locator('.uni-shim-toast').first().innerText().catch(() => '');
  say('  点寄售: ' + ok + ' | toast=' + JSON.stringify(toast));
  await p.screenshot({ path: `${OUT}/v2_sell.png` });
});

await step('盲盒页（真写接口准备）', async () => {
  await p.goto(FE + '/#/pages/blindBox/index', { waitUntil: 'networkidle' });
  await p.waitForTimeout(2500);
  const txt = await p.locator('body').innerText();
  say('  盲盒页片段: ' + JSON.stringify(txt.slice(0, 120)));
  await p.screenshot({ path: `${OUT}/v2_blindbox.png` });
});

say('\n=== mock 回落 ===');
say(fb.length ? fb.join('\n') : '无');
say('=== 后端请求 ===');
beReqs.forEach(r => say('  ' + r));
fs.writeFileSync(`${OUT}/report_v2.txt`, log.join('\n'));
await b.close();
