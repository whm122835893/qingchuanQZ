/**
 * 像素级对比：本地复刻页 vs 原站，同视口 390×844。
 * 原站用 /tmp/my_probe/state.json 登录态；本地用 API 登录注入 token。
 * 输出 /tmp/pixel/{page}_{site,local}.png
 */
import { chromium } from 'playwright';
import fs from 'fs';
const SITE = 'https://h5.qingchuanart.vip';
const FE = 'http://localhost:5173';
const BE = 'http://localhost:3100';
const OUT = '/tmp/pixel';
fs.mkdirSync(OUT, { recursive: true });

const PAGES = [
  ['index', '/pages/index/index'],
  ['market', '/pages/market/market'],
  ['my', '/pages/my/my'],
  ['collectionDetails', '/pages/myCollection/collectionDetails?id=6001'],
  ['blindBoxDetails', '/pages/blindBox/blindBoxDetails?id=1'],
];

const b = await chromium.launch({
  executablePath: '/root/.cache/ms-playwright/chromium-1247/chrome-linux64/chrome',
  args: ['--no-sandbox']
});

// 原站 context（复用登录态）
const sctx = await b.newContext({
  viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true,
  storageState: '/tmp/my_probe/state.json'
});
const sp = await sctx.newPage();
// 本地 context（API 登录注入）
const lctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const lp = await lctx.newPage();
await lp.goto(FE + '/#/pages/index/index', { waitUntil: 'domcontentloaded' });
const login = await fetch(BE + '/user/login', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ account: '17587881293', password: 'whm981004' })
}).then(r => r.json());
await lp.evaluate(t => localStorage.setItem('token', t), login.data.userinfo.token);

for (const [slug, path] of PAGES) {
  // 原站
  try {
    await sp.goto(`${SITE}/#${path}`, { waitUntil: 'networkidle', timeout: 20000 }).catch(() => {});
    await sp.waitForTimeout(3500);
    await sp.screenshot({ path: `${OUT}/${slug}_site.png` });
    await sp.screenshot({ path: `${OUT}/${slug}_site_full.png`, fullPage: true });
    console.log(`[site] ${slug} ok`);
  } catch (e) { console.log(`[site] ${slug} FAIL ${e.message.slice(0, 80)}`); }
  // 本地
  try {
    await lp.goto(`${FE}/#${path}`, { waitUntil: 'networkidle', timeout: 20000 }).catch(() => {});
    await lp.waitForTimeout(3500);
    await lp.screenshot({ path: `${OUT}/${slug}_local.png` });
    await lp.screenshot({ path: `${OUT}/${slug}_local_full.png`, fullPage: true });
    console.log(`[local] ${slug} ok`);
  } catch (e) { console.log(`[local] ${slug} FAIL ${e.message.slice(0, 80)}`); }
}
await b.close();
console.log('完成');
