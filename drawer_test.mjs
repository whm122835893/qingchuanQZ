import { chromium } from 'playwright'
const j = (s) => JSON.stringify(s)
const EXEC = '/root/.cache/ms-playwright/chromium_headless_shell-1247/chrome-headless-shell-linux64/chrome-headless-shell'
const browser = await chromium.launch({ executablePath: EXEC })
const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
await page.goto('http://localhost:3000/#/pages/my/my')
await page.waitForTimeout(800)
await page.evaluate(() => {
  const d = { uid: 22291, nickname: '像素复刻', token: 'pixel-mock-token', avatar: 'https://thirdqq.qlogo.cn/g?b=sdk&k=abcd&s=640', invite_code: 'QC8829', tenant_id: '1000', is_authentication: 1, mobile: '17587881293' }
  localStorage.setItem('qingchuan_user_info', JSON.stringify(d))
  localStorage.setItem('token', 'pixel-mock-token')
})
await page.reload()
await page.waitForTimeout(2500)
// 点三条杠
await page.click('.top-icon')
await page.waitForTimeout(600)
const info = await page.evaluate(() => {
  const panel = document.querySelector('.slider-panel')
  const drawer = document.querySelector('.drawer')
  const cs = (e) => (e ? getComputedStyle(e) : null)
  const rows = Array.from(document.querySelectorAll('.slider-panel .row-text')).map((r) => r.textContent.trim())
  const d = drawer ? cs(drawer) : null
  const titles = Array.from(document.querySelectorAll('.slider-panel .section-title')).map((t) => t.textContent.trim())
  return {
    panelVisible: !!panel && cs(panel).transform,
    drawer: d ? { w: d.width, h: d.height, bg: d.backgroundColor, pad: d.padding } : null,
    sectionTitles: titles,
    rowTexts: rows,
    avatarSize: (() => { const a = document.querySelector('.slider-panel .avatar'); return a ? [cs(a).width, cs(a).height, cs(a).borderRadius] : null })(),
  }
})
console.log(j(info, null, 1))
await page.screenshot({ path: '/workspace/qingchuan-h5/compare/drawer-open-local.png' })
// 点退出登录
await page.evaluate(() => {
  const rows = Array.from(document.querySelectorAll('.slider-panel .row'))
  rows[rows.length - 1].click()
})
await page.waitForTimeout(400)
const modal = await page.evaluate(() => {
  const m = document.querySelector('.w-modal')
  const cs = (e) => (e ? getComputedStyle(e) : null)
  if (!m) return null
  const btns = Array.from(m.querySelectorAll('.modal-btn')).map((b) => ({ text: b.textContent.trim(), bg: cs(b).backgroundColor, w: cs(b).width, h: cs(b).height, color: cs(b).color, radius: cs(b).borderRadius }))
  return { title: m.querySelector('.toast-title')?.textContent.trim(), bg: cs(m).backgroundColor, w: cs(m).width, radius: cs(m).borderRadius, btns }
})
console.log(j(modal, null, 1))
await page.screenshot({ path: '/workspace/qingchuan-h5/compare/drawer-logout-modal.png' })
await browser.close()
