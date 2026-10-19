// 探源站「我的藏品」页（myCollection）真实显示
import { chromium } from 'playwright';
import fs from 'fs';
const BASE = 'https://h5.qingchuanart.vip';
const b = await chromium.launch({
  executablePath: '/root/.cache/ms-playwright/chromium-1247/chrome-linux64/chrome',
  args: ['--no-sandbox']
});
const ctx = await b.newContext({
  viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true,
  storageState: '/tmp/my_probe/state.json'
});
const p = await ctx.newPage();
const logs = [];
p.on('response', async (res) => {
  if (/api\.qingchuanart\.vip/.test(res.url())) {
    let body = ''; try { body = await res.text(); } catch {}
    logs.push({ url: res.url().replace('https://api.qingchuanart.vip', ''), status: res.status(), body: body.slice(0, 4000) });
  }
});

await p.goto(BASE + '/#/pages/myCollection/myCollection', { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {});
await p.waitForTimeout(3500);
logs.forEach(r => console.log(r.status, r.url, '|', r.body.slice(0, 500)));
fs.writeFileSync('/tmp/my_probe/myCollection_page.json', JSON.stringify(logs, null, 1));
await p.screenshot({ path: '/tmp/my_probe/myCollection_page.png', fullPage: true });
await b.close();
