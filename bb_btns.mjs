import { chromium } from 'playwright'
const EXEC = '/root/.cache/ms-playwright/chromium_headless_shell-1247/chrome-headless-shell-linux64/chrome-headless-shell'
const j = (s) => JSON.stringify(s)
const browser = await chromium.launch({ executablePath: EXEC })
const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
await page.goto('http://localhost:5173/#/pages/my/my')
await page.waitForTimeout(500)
await page.evaluate(() => { const d = { uid: 22291, nickname: '像素复刻', token: 'pixel-mock-token', avatar: 'https://thirdqq.qlogo.cn/g?b=sdk&k=abcd&s=640', invite_code: 'QC8829', tenant_id: '1000', is_authentication: 1, mobile: '17587881293' }; localStorage.setItem('qingchuan_user_info', j(d)); localStorage.setItem('token', 'pixel-mock-token') })
await page.goto('http://localhost:5173/#/pages/blindBox/blindBoxDetails?id=6004')
await page.waitForTimeout(3500)
const info = await page.evaluate(() => {
  const btns = Array.from(document.querySelectorAll('.act-btn'))
  const bar = document.querySelector('.product-action')
  const cs = (e) => e ? getComputedStyle(e) : null
  return {
    n: btns.length,
    texts: btns.map(b => b.textContent.trim()),
    styles: btns.map(b => { const s = cs(b); return { text: b.textContent.trim(), bg: s.backgroundColor, color: s.color, h: s.height, fs: s.fontSize, radius: s.borderRadius, ff: s.fontFamily } }),
    bar: bar ? { display: cs(bar).display, gap: cs(bar).gap, pad: cs(bar).padding } : null
  }
})
console.log(j(info, null, 1))
await page.screenshot({ path: '/workspace/compare/blindBoxDetails-btns-local.png', fullPage: true })
await browser.close()
