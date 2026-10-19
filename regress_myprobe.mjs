// 探测源站「我的」页 8 个 tab 的真实接口与数据（复用已登录 state）
import { chromium } from 'playwright';
import fs from 'fs';

const BASE = 'https://h5.qingchuanart.vip';
const OUT = '/tmp/my_probe';
fs.mkdirSync(OUT, { recursive: true });

const b = await chromium.launch({
  executablePath: '/root/.cache/ms-playwright/chromium-1247/chrome-linux64/chrome',
  args: ['--no-sandbox']
});
const ctx = await b.newContext({
  viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true,
  storageState: `${OUT}/state.json`
});
const p = await ctx.newPage();

const apiLog = [];
p.on('response', async (res) => {
  const u = res.url();
  if (!/api\.qingchuanart\.vip/.test(u)) return;
  let body = ''; try { body = await res.text(); } catch {}
  apiLog.push({ url: u, status: res.status(), body: body.slice(0, 300000) });
});

async function gotoMy() {
  apiLog.length = 0;
  await p.goto(BASE + '/#/pages/my/my', { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {});
  await p.waitForTimeout(3000);
  return apiLog.slice();
}

// 1. 初始请求
const init = await gotoMy();
console.log('=== 我的页初始请求 ===');
init.forEach(r => console.log('  ', r.status, r.url.replace('https://api.qingchuanart.vip', '').slice(0, 120)));
fs.writeFileSync(`${OUT}/my_initial.json`, JSON.stringify(init, null, 1));

// 2. 逐个 tab 点击
const CATES = ['绘画', '卡牌', '建模', '卡券', '藏品', '盲盒', '已售', '元素'];
for (let i = 0; i < CATES.length; i++) {
  const name = CATES[i];
  const before = apiLog.length;
  const tab = p.getByText(name, { exact: true }).first();
  const ok = await tab.click({ timeout: 5000 }).then(() => true).catch(e => false);
  await p.waitForTimeout(3000);
  const after = apiLog.slice(before);
  console.log(`\n=== tab[${i}] ${name} === 点击=${ok} 新请求 ${after.length} 条`);
  after.forEach(r => console.log('  ', r.status, r.url.replace('https://api.qingchuanart.vip', '').slice(0, 120)));
  fs.writeFileSync(`${OUT}/tab_${i}_${name}.json`, JSON.stringify(after, null, 1));
  await p.screenshot({ path: `${OUT}/tab_${i}_${name}.png` });
}

await b.close();
console.log('\n完成');
