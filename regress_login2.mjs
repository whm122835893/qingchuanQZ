// 源站登录并保存 state
import { chromium } from 'playwright';
import fs from 'fs';
const BASE = 'https://h5.qingchuanart.vip';
const b = await chromium.launch({
  executablePath: '/root/.cache/ms-playwright/chromium-1247/chrome-linux64/chrome',
  args: ['--no-sandbox']
});
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const p = await ctx.newPage();

p.on('response', async (res) => {
  if (/api\.qingchuanart\.vip/.test(res.url())) {
    let body = ''; try { body = (await res.text()).slice(0, 600); } catch {}
    console.log('API:', res.status(), res.url().replace('https://api.qingchuanart.vip', '').slice(0, 80), '|', body.slice(0, 300));
  }
});

await p.goto(BASE + '/#/pages/login/login', { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {});
await p.waitForTimeout(2500);

await p.locator('input').nth(0).fill('17587881293');
await p.locator('input').nth(1).fill('whm981004');
await p.waitForTimeout(300);
await p.locator('.btn-primary').first().click();
await p.waitForTimeout(5000);

console.log('登录后 URL:', p.url());
await p.screenshot({ path: '/tmp/after_login.png' });
await ctx.storageState({ path: '/tmp/my_probe/state.json' });
await b.close();
