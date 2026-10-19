// 对比源站 antMycollection vs userCollectionList 的数据差异
import { chromium } from 'playwright';
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
await p.goto(BASE + '/#/pages/my/my', { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {});
await p.waitForTimeout(2000);

const result = await p.evaluate(async () => {
  const ls = {};
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    ls[k] = localStorage.getItem(k).slice(0, 100);
  }
  const token = localStorage.getItem('token') || '';
  const call = async (path, body) => {
    const r = await fetch('https://api.qingchuanart.vip' + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', token },
      body: JSON.stringify(body || {})
    });
    return { status: r.status, text: (await r.text()).slice(0, 3000) };
  };
  return {
    ls,
    tokenLen: token.length,
    ant_types2: await call('/api/user_collection/user_collection/antMycollection', { keywords: '', types: 2, page: 1 }),
    ant_types1: await call('/api/user_collection/user_collection/antMycollection', { keywords: '', types: 1, page: 1 }),
    ant_types3: await call('/api/user_collection/user_collection/antMycollection', { keywords: '', types: 3, page: 1 }),
    userCollectionList: await call('/api/market/trade/userCollectionList', { page: 1 }),
    userInfo: await call('/api/user/getUserInfo', {})
  };
});

console.log('localStorage keys:', JSON.stringify(result.ls, null, 1));
console.log('tokenLen:', result.tokenLen);
for (const k of ['ant_types2', 'ant_types1', 'ant_types3', 'userCollectionList', 'userInfo']) {
  console.log(`\n=== ${k} (${result[k].status}) ===`);
  console.log(result[k].text.slice(0, 1200));
}
await b.close();
