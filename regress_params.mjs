// 抓 antMycollection 请求参数 + 空状态图 URL
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

p.on('request', async (req) => {
  if (/antMycollection/.test(req.url())) {
    console.log('REQ:', req.method(), req.url());
    console.log('  postData:', req.postData());
  }
});

await p.goto(BASE + '/#/pages/my/my', { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {});
await p.waitForTimeout(3000);

// 空状态图 URL
const imgs = await p.evaluate(() => {
  return [...document.querySelectorAll('img')].map(i => ({
    src: i.src, w: i.naturalWidth, h: i.naturalHeight
  })).filter(i => i.src.includes('qingchuan') || i.src.includes('/static/') || i.src.includes('uploads'));
});
console.log('\n图片列表:');
imgs.forEach(i => console.log('  ', i.w + 'x' + i.h, i.src));

// 专门找空状态容器下的图
const emptyImg = await p.evaluate(() => {
  const views = [...document.querySelectorAll('uni-view, view')];
  const cand = views.filter(v => /空|暂无|没有/.test(v.className || '') || /empty/.test(v.className || ''));
  const out = [];
  for (const c of cand) {
    const im = c.querySelector('img');
    if (im) out.push({ cls: c.className, src: im.src, w: im.naturalWidth, h: im.naturalHeight });
  }
  return out;
});
console.log('\n空状态图:', JSON.stringify(emptyImg, null, 1));

// 点「盲盒」tab 看请求参数
console.log('\n--- 点击盲盒 tab ---');
await p.getByText('盲盒', { exact: true }).first().click();
await p.waitForTimeout(2500);

console.log('\n--- 点击已售 tab ---');
await p.getByText('已售', { exact: true }).first().click();
await p.waitForTimeout(2500);

await b.close();
