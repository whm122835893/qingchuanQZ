/**
 * 最小 uni-app API shim
 *
 * 原站是 uni-app 小程序/H5，页面里直接调用 `uni.showToast`、`uni.previewImage`。
 * 本项目是纯 Vue3 Web，没有 uni 运行时，这里只补页面实际用到的少量 API，
 * 保持页面代码与原站一致，无需改写。
 */

function toast({ title = '', icon = 'success', duration = 1800 } = {}) {
  const el = document.createElement('div')
  el.className = 'uni-shim-toast'
  el.setAttribute('role', 'status')
  if (icon === 'none') {
    el.textContent = title
  } else {
    // success / loading 用纯文字呈现，避免引入任何图标资源
    el.textContent = title
  }
  el.style.cssText = [
    'position:fixed',
    'left:50%',
    'top:50%',
    'transform:translate(-50%,-50%)',
    'z-index:99999',
    'max-width:70vw',
    'padding:10px 16px',
    'border-radius:8px',
    'background:rgba(0,0,0,.75)',
    'color:#fff',
    'font-size:14px',
    'line-height:1.5',
    'text-align:center',
    'pointer-events:none',
    'transition:opacity .15s ease',
  ].join(';')
  document.body.appendChild(el)
  requestAnimationFrame(() => {
    el.style.opacity = '1'
  })
  setTimeout(() => {
    el.style.opacity = '0'
    setTimeout(() => el.remove(), 200)
  }, duration)
}

function showLoading({ title = '加载中' } = {}) {
  return { title }
}
function hideLoading() {}

function previewImage({ urls = [], current = 0 } = {}) {
  if (!urls.length) return
  const list = Array.isArray(urls) ? urls : [urls]
  let idx = typeof current === 'number' ? current : 0
  const overlay = document.createElement('div')
  overlay.style.cssText = [
    'position:fixed',
    'inset:0',
    'z-index:99999',
    'background:rgba(0,0,0,.9)',
    'display:flex',
    'align-items:center',
    'justify-content:center',
  ].join(';')

  const img = document.createElement('img')
  img.src = list[idx]
  img.style.cssText = 'max-width:92vw;max-height:80vh;object-fit:contain'

  const counter = document.createElement('div')
  counter.style.cssText =
    'position:absolute;bottom:24px;left:0;right:0;text-align:center;color:#fff;font-size:13px'

  const render = () => {
    img.src = list[idx]
    counter.textContent = `${idx + 1} / ${list.length}`
  }

  const prev = document.createElement('button')
  prev.textContent = '上一张'
  prev.style.cssText =
    'position:absolute;left:12px;top:50%;transform:translateY(-50%);padding:10px 12px;border:0;border-radius:6px;background:rgba(255,255,255,.16);color:#fff;font-size:13px;cursor:pointer'

  const next = document.createElement('button')
  next.textContent = '下一张'
  next.style.cssText =
    'position:absolute;right:12px;top:50%;transform:translateY(-50%);padding:10px 12px;border:0;border-radius:6px;background:rgba(255,255,255,.16);color:#fff;font-size:13px;cursor:pointer'

  const close = () => overlay.remove()
  prev.onclick = () => {
    idx = (idx - 1 + list.length) % list.length
    render()
  }
  next.onclick = () => {
    idx = (idx + 1) % list.length
    render()
  }
  overlay.onclick = (e) => {
    if (e.target === overlay) close()
  }

  overlay.append(img, counter, prev, next)
  document.body.appendChild(overlay)
  render()
}

export function installUniShim() {
  if (typeof window === 'undefined') return
  if (window.uni) return
  window.uni = {
    showToast: toast,
    hideToast: () => {},
    showLoading,
    hideLoading,
    previewImage,
    navigateTo: () => {},
    redirectTo: () => {},
    switchTab: () => {},
    reLaunch: () => {},
    navigateBack: () => window.history.back(),
  }
}