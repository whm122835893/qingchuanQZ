// dump 原站 collectionDetails 运行 DOM + 关键计算样式
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
await p.goto('https://h5.qingchuanart.vip/#/pages/myCollection/collectionDetails?id=6001', { waitUntil: 'networkidle', timeout: 25000 }).catch(() => {});
await p.waitForTimeout(4000);

const dump = await p.evaluate(() => {
  const out = [];
  const walk = (el, depth) => {
    if (depth > 14) return;
    const cls = el.className && typeof el.className === 'string' ? el.className : '';
    const tag = el.tagName.toLowerCase();
    if (/^(uni-view|uni-text|uni-image|view|text|image|w-product-details-card|collection-detail-button|w-product-buy-need|w-copyright)$/i.test(tag)) {
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      out.push({
        d: depth, tag, cls: cls.slice(0, 90),
        txt: (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 40),
        box: [Math.round(r.width), Math.round(r.height), Math.round(r.left), Math.round(r.top)],
        bg: cs.backgroundColor, radius: cs.borderRadius, fs: cs.fontSize, color: cs.color
      });
    }
    for (const c of el.children) walk(c, depth + 1);
  };
  walk(document.body, 0);
  return out;
});
console.log(JSON.stringify(dump, null, 1).slice(0, 9000));
fs.writeFileSync('/tmp/pixel/site_collectionDetails_dom.json', JSON.stringify(dump, null, 1));
await p.screenshot({ path: '/tmp/pixel/site_cd_full.png', fullPage: true });
await b.close();
