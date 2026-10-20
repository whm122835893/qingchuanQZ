/**
 * 回落页带真实参数复测 + blindBoxDetails pool 修复验证。
 * 判据：无 mock 回落、无 Vue warn。
 */
import { chromium } from 'playwright';
import fs from 'fs';
const FE = 'http://localhost:5173';
const BE = 'http://localhost:3100';
const OUT = '/tmp/smoke';
fs.mkdirSync(OUT, { recursive: true });

// (slug, path, 说明) —— id 均用真实挂单 240472
const CASES = [
  ['marketDetail', '/pages/market/detail?id=240472', '市场详情'],
  ['batchPay', '/pages/market/batchPay?id=240472', '批量支付'],
  ['sellBegBuy', '/pages/market/sellBegBuy?id=240472', '出售'],
  ['submitBegBuy', '/pages/market/submitBegBuy?id=240472', '求购'],
  ['submitEntrust', '/pages/market/submitEntrust?id=240472', '委托'],
  ['consignments', '/pages/consignments/consignments?id=240472', '寄售'],
  ['orderSubmit', '/pages/order/orderSubmit?id=240472&type=2', '提交订单'],
  ['noticeDetails', '/pages/notice/noticeDetails?id=1', '公告详情'],
  ['blindBoxDetails', '/pages/blindBox/blindBoxDetails?id=1', '盲盒详情(pool修复)'],
  ['drawResult', '/pages/draw/drawResult/drawResult?id=1', '抽签结果'],
];

const b = await chromium.launch({
  executablePath: '/root/.cache/ms-playwright/chromium-1247/chrome-linux64/chrome',
  args: ['--no-sandbox']
});
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const p = await ctx.newPage();

await p.goto(FE + '/#/pages/index/index', { waitUntil: 'domcontentloaded' });
const login = await fetch(BE + '/user/login', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ account: '17587881293', password: 'whm981004' })
}).then(r => r.json());
await p.evaluate(t => localStorage.setItem('token', t), login.data.userinfo.token);

const results = [];
for (const [slug, path, desc] of CASES) {
  const fbs = [], warns = [];
  const onFb = m => { if (m.text().includes('回落')) fbs.push(m.text().slice(0, 120)); };
  const onWarn = m => { if (m.text().includes('[Vue warn]')) warns.push(m.text().slice(0, 120)); };
  p.on('console', onFb); p.on('console', onWarn);
  let textLen = 0;
  try {
    await p.goto(`${FE}/#${path}`, { waitUntil: 'networkidle', timeout: 12000 }).catch(() => {});
    await p.waitForTimeout(1800);
    const txt = await p.locator('body').innerText().catch(() => '');
    textLen = txt.replace(/\s/g, '').length;
    await p.screenshot({ path: `${OUT}/param_${slug}.png` }).catch(() => {});
  } catch (e) { warns.push('NAV:' + e.message.slice(0, 100)); }
  p.off('console', onFb); p.off('console', onWarn);
  const ok = fbs.length === 0 && warns.length === 0;
  results.push({ slug, path, desc, ok, fbs, warns, textLen });
  console.log(`${ok ? 'PASS' : 'FAIL'} ${slug} ${desc} | 回落=${fbs.length} warn=${warns.length} 文本=${textLen}`);
  if (!ok) { fbs.forEach(f => console.log('   FB:', f)); warns.forEach(w => console.log('   WARN:', w)); }
}

const pass = results.filter(r => r.ok).length;
console.log(`\n===== 汇总: ${pass}/${results.length} 通过 =====`);
fs.writeFileSync(`${OUT}/param_results.json`, JSON.stringify(results, null, 1));
await b.close();
