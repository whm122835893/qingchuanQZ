// 原站 shop 页 → 盲盒详情（公开）→ 实测 introduce 富文本 + 整体结构
import { chromium } from 'playwright';
import fs from 'fs';
const b = await chromium.launch({
  executablePath: '/root/.cache/ms-playwright/chromium-1247/chrome-linux64/chrome',
  args: ['--no-sandbox']
});
const ctx = await b.newContext({
  viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true,
  storageState: '/tmp/my_probe/state.json'
});
const p = await ctx.newPage();
const apis = [];
p.on('response', async r => {
  const u = r.url();
  if (u.includes('api.qingchuanart.vip')) {
    let body = '';
    try { body = await r.text(); } catch {}
    apis.push({ u: u.replace('https://api.qingchuanart.vip/api', ''), b: body.slice(0, 200) });
  }
});
await p.goto('https://h5.qingchuanart.vip/#/pages/shop/shop', { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {});
await p.waitForTimeout(4000);
apis.forEach(a => console.log(a.u, '|', a.b.slice(0, 150)));
await p.screenshot({ path: '/tmp/pixel/site_shop.png', fullPage: true });
await b.close();
