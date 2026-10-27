/**
 * collectionDetails 专项像素对比（重写后复跑）。
 * 原站用 /tmp/my_probe/state.json 登录态；本地 API 登录注入 token。
 * 三张图：
 *   cd_site_empty   原站 id=6001（原站无此藏品 → 空数据态，默认「藏品名称/限量」）
 *   cd_local_empty  本地 id=999999（同样空数据态，对齐默认值渲染）
 *   cd_local_real   本地 id=6001（真实持有藏品，验证数据流）
 * 输出 /tmp/pixel/cd_*.png
 */
import { chromium } from 'playwright';
import fs from 'fs';
const SITE = 'https://h5.qingchuanart.vip';
const FE = 'http://localhost:5173';
const BE = 'http://localhost:3100';
const OUT = '/tmp/pixel';
fs.mkdirSync(OUT, { recursive: true });

const b = await chromium.launch({
  executablePath: '/root/.cache/ms-playwright/chromium-1247/chrome-linux64/chrome',
  args: ['--no-sandbox']
});

const sctx = await b.newContext({
  viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true,
  storageState: '/tmp/my_probe/state.json'
});
const sp = await sctx.newPage();
const lctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const lp = await lctx.newPage();
await lp.goto(FE + '/#/pages/index/index', { waitUntil: 'domcontentloaded' });
const login = await fetch(BE + '/user/login', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ account: '17587881293', password: 'whm981004' })
}).then(r => r.json());
await lp.evaluate(t => localStorage.setItem('token', t), login.data.userinfo.token);

// 真实数据态必须用全新 context：hash 路由 query 变化会复用组件不重跑 onMounted
const rctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const rp = await rctx.newPage();
await rp.goto(FE + '/#/pages/index/index', { waitUntil: 'domcontentloaded' });
await rp.evaluate(t => localStorage.setItem('token', t), login.data.userinfo.token);

async function shot(page, url, path, full = false) {
  await page.goto(url, { waitUntil: 'networkidle', timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(3500);
  await page.screenshot({ path, fullPage: full });
  console.log('ok', path);
}

await shot(sp, `${SITE}/#/pages/myCollection/collectionDetails?id=6001`, `${OUT}/cd_site_empty.png`);
await shot(lp, `${FE}/#/pages/myCollection/collectionDetails?id=999999`, `${OUT}/cd_local_empty.png`);
await shot(rp, `${FE}/#/pages/myCollection/collectionDetails?id=6001`, `${OUT}/cd_local_real.png`);
await shot(rp, `${FE}/#/pages/myCollection/collectionDetails?id=6001`, `${OUT}/cd_local_real_full.png`, true);

// 采集本地运行态关键指标（与源站 DOM dump 对齐核对）
const probe = await rp.evaluate(() => {
  const q = (s) => document.querySelector(s);
  const box = (s) => { const e = q(s); if (!e) return null; const r = e.getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height), Math.round(r.x), Math.round(r.y)]; };
  const cs = (s, p) => { const e = q(s); return e ? getComputedStyle(e)[p] : null; };
  return {
    productCard: box('.product-card'),
    productCardBg: cs('.product-card', 'backgroundColor'),
    mainImg: box('.main-img'),
    mainImgRadius: cs('.main-img', 'borderRadius'),
    name: box('.name'),
    nameColor: cs('.name', 'color'),
    limitTag: box('.limit-tag'),
    limitTagBg: cs('.limit-tag', 'backgroundColor'),
    detailBody: box('.detail-body'),
    detailBodyRadius: cs('.detail-body', 'borderRadius'),
    techRow: box('.tech-row'),
    techRowsText: [...document.querySelectorAll('.tech-row')].map(e => e.innerText.replace(/\n/g, '|')),
    buyNeed: box('.buy-need'),
    buyNeedRadius: cs('.buy-need', 'borderRadius'),
    productAction: box('.product-action'),
    actBtn: box('.act-btn'),
    actBtnBg: cs('.act-btn', 'backgroundColor'),
    actBtnText: q('.act-btn') ? q('.act-btn').innerText : null,
    navbarBack: box('.cd-back'),
    navbarBackBg: cs('.cd-back', 'backgroundColor'),
    xuanyao: box('.xuanyao-img'),
  };
});
console.log('LOCAL PROBE:', JSON.stringify(probe, null, 1));
await b.close();
console.log('完成');
