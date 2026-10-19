// 检查源站登录页 DOM 结构
import { chromium } from 'playwright';
const BASE = 'https://h5.qingchuanart.vip';
const b = await chromium.launch({
  executablePath: '/root/.cache/ms-playwright/chromium-1247/chrome-linux64/chrome',
  args: ['--no-sandbox']
});
const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })).newPage();

p.on('response', async (res) => {
  if (/api\.qingchuanart\.vip/.test(res.url())) {
    let body = ''; try { body = (await res.text()).slice(0, 400); } catch {}
    console.log('API:', res.status(), res.url().replace('https://api.qingchuanart.vip', '').slice(0, 100), '|', body.slice(0, 200));
  }
});

await p.goto(BASE + '/#/pages/login/login', { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {});
await p.waitForTimeout(2000);

// 输出所有 input
const inputs = await p.locator('input').all();
console.log('input 数量:', inputs.length);
for (let i = 0; i < inputs.length; i++) {
  const attrs = await inputs[i].evaluate(el => {
    const o = {};
    for (const a of el.attributes) o[a.name] = a.value;
    o._placeholder = el.placeholder;
    return o;
  });
  console.log(`input[${i}]:`, JSON.stringify(attrs));
}

// 所有可点击文本
const texts = await p.locator('view, text, button').allInnerTexts();
console.log('页面文本:', JSON.stringify([...new Set(texts)].filter(Boolean).slice(0, 30)));

// 找登录按钮
const btns = await p.locator('button, .btn, [class*=btn], [class*=button]').all();
console.log('按钮候选数:', btns.length);
for (let i = 0; i < Math.min(btns.length, 10); i++) {
  const t = await btns[i].innerText().catch(() => '');
  const c = await btns[i].getAttribute('class').catch(() => '');
  console.log(`  btn[${i}] class=${c} text=${t}`);
}

await p.screenshot({ path: '/tmp/login_page.png' });
await b.close();
