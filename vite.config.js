import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { isHTMLTag, isSVGTag, isMathMLTag } from '@vue/shared'
import { fileURLToPath, URL } from 'node:url'

/**
 * uni-app 短标签：这些标签在 Vue 3.5 编译器眼里是原生元素
 * （`view`/`text` 被列在 @vue/shared 的 SVG_TAGS 中），
 * 会被跳过组件解析，必须从原生名单里剔除才能走 resolveComponent。
 */
const UNI_SHORT_TAGS = new Set(['view', 'text', 'image', 'scroll-view', 'swiper', 'swiper-item'])

/** Vue 编译器默认的原生标签判定（与 @vue/compiler-dom 的 parserOptions 一致） */
const isNative = (tag) => isHTMLTag(tag) || isSVGTag(tag) || isMathMLTag(tag)

// rpx -> vw 转换插件：与原站 uni-app 行为一致（750rpx = 100vw）
// 支持两种格式: 28rpx 和 %?28?%（uni-app源码占位符）
function rpxToVw() {
  return {
    postcssPlugin: 'rpx-to-vw',
    Declaration(decl) {
      if (decl.value && (decl.value.includes('rpx') || decl.value.includes('%?'))) {
        decl.value = decl.value
          .replace(/(-?[\d.]+)rpx/g, (_, num) => `${+((parseFloat(num) / 750) * 100).toFixed(4)}vw`)
          .replace(/%\?(-?[\d.]+)\?%/g, (_, num) => `${+((parseFloat(num) / 750) * 100).toFixed(4)}vw`)
      }
    },
  }
}

export default defineConfig({
  plugins: [
    vue({
      // 关键修复：Vue 3.5 的编译器把 `view` / `text` 归入 SVG 原生标签
      // （见 @vue/shared 的 SVG_TAGS，末尾含 "...,use,view"，且含 "text"），
      // 编译器遇到原生标签会跳过组件解析（compiler-core: isNativeTag(tag) 为真则不 resolveComponent），
      // 导致 main.js 里 app.component('view', UniView) 的注册完全失效，
      // 渲染出 <view>/<text> 而非 <uni-view>/<uni-text>，
      // 结果 global.css 中所有 `uni-view` / `uni-text` 选择器全部失配
      // （表现为字号/颜色不生效、flex 布局错位）。
      // 这里覆盖 isNativeTag，让这些 uni-app 短标签不被当作原生元素，
      // 强制编译器走组件解析流程，由 UniView / UniText 等 shim 渲染成 uni-* 标签。
      template: {
        compilerOptions: {
          // 仅把 uni-app 短标签从「原生」名单里剔除，其余标签保持 Vue 默认判定。
          // 注意不能简单地「非短标签即原生」——那会让 <template> / <slot> 等
          // 也被判成非原生，触发 "v-slot can only be used on components or <template> tags"。
          isNativeTag: (tag) => !UNI_SHORT_TAGS.has(tag) && isNative(tag),
        },
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  css: {
    postcss: {
      plugins: [rpxToVw()],
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
})
