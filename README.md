# qingchuanQZ — 青川数字艺术 H5 平台复刻

Vue 3 + Vite 对 [青川数字艺术 H5](https://h5.qingchuanart.vip/) 的**像素级复刻**项目。

---

## 技术栈

| 层 | 选型 |
|---|---|
| 框架 | Vue 3.5（`<script setup>` SFC） |
| 构建 | Vite + rolldown |
| 路由 | Vue Router 4（hash 模式，110 条） |
| 样式 | 原生 CSS + 750rpx 设计稿（PostCSS 自定义 `rpxToVw` 插件转换 vw） |
| 字体 | MiSans（Regular / Medium / Demibold / Semibold） |
| 数据 | 本地 mock 快照（取自源站真实接口响应，80 份） |

**无 UI 组件库依赖** —— 所有 `uni-view` / `uni-text` / `uni-image` 均为项目自实现的 shim 组件，样式行为对齐 uni-app 编译产物。

---

## 核心工程决策

### 1. 覆盖 `isNativeTag` 以支持 uni-app 短标签

Vue 3.5 的 `@vue/shared` 中 `SVG_TAGS` 字符串末尾包含 `use,view`，且包含 `text`，导致编译器把 `<view>` / `<text>` 判定为**原生元素**，直接跳过 `resolveComponent`，使全局组件注册完全失效。

```js
// vite.config.js
const UNI_SHORT_TAGS = new Set(['view', 'text', 'image', 'scroll-view', 'swiper', 'swiper-item'])
const isNative = (tag) => isHTMLTag(tag) || isSVGTag(tag) || isMathMLTag(tag)

vue({
  template: {
    compilerOptions: {
      isNativeTag: (tag) => !UNI_SHORT_TAGS.has(tag) && isNative(tag),
    },
  },
})
```

> 注意不能写成 `tag => !UNI_SHORT_TAGS.includes(tag)` —— 那会让 `<template>` / `<slot>` 也被判为非原生，触发 `v-slot can only be used on components or <template> tags`。

### 2. `UniText` 需过滤纯空白文本节点

Vue 模板编译会把元素间的缩进空白也作为文本节点传入 slot，而 `uni-text` 的 `white-space` 是 `pre-line`，这些空白会把中文挤成多行（实测「赛博」被压成 12px 宽、32px 高）。

```js
// src/components/uni.js
const clean = (nodes) =>
  nodes.flatMap((n) => {
    if (typeof n === 'string') return n.trim() ? [n] : []
    if (n?.type === 3) return n.children.trim() ? [n] : []
    return [n]
  })
return h('uni-text', attrs, [h('span', clean(slots.default?.() ?? []))])
```

### 3. flex 尺寸协商陷阱

`box-sizing: border-box` + `flex: 1` 时 flex 项会被压到内容宽度，padding 被「吃掉」。源站的 `.cate-item` 显式声明 `width: 48px` 正是为了规避这点 —— 复刻时必须同样显式声明。

另外 `uni-text` 作为 flex item 默认 `flex-shrink: 1`，长文字会被逐字压缩换行，需显式 `flex-shrink: 0` + `white-space: nowrap`。

---

## 目录结构

```
├── index.html
├── vite.config.js          # isNativeTag 覆盖 + rpxToVw 插件
├── public/                 # 静态资源（85MB，含 265 张源站图片）
│   ├── static/             # 从源站 img CDN 下载的真实图片
│   ├── mock/               # 80 份接口响应快照
│   └── home/ market/ my/ … # 各业务模块图片
└── src/
    ├── main.js             # 全局组件注册（UniView / UniText / UniImage …）
    ├── App.vue
    ├── router/index.js     # 110 条 hash 路由
    ├── api/index.js        # 接口定义 + ossImg 图片映射
    ├── utils/api.js        # mock 加载器（fetchXxx 系列）
    ├── styles/
    │   ├── global.css      # 源站扒取的全量样式
    │   ├── atomic.css      # 原子类（flex / mt / plr …）
    │   └── MiSans.css
    ├── components/         # 25 个复用组件
    └── pages/              # 105 个页面
```

---

## 本地运行

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # 产出 dist/
npm run preview
```

### 静态部署注意

发布静态站点时**必须指向 `dist/`**，不能指向项目根目录 —— 根目录的 `index.html` 引用 `/src/main.js`（未打包的 ES 源码，含 `from 'vue'` 裸模块名），浏览器无法解析会导致白屏。

---

## 数据说明

- 所有 mock 数据均为**源站真实接口响应快照**，未经虚构改写
- 图片资源 265 张，全部从源站 CDN 下载填充，**无 SVG 占位图**
- 本项目为**独立项目**，运行时不依赖源站任何服务

---

## 交付统计

```
页面文件  105
组件      25
mock      80
路由      110
图片      265
```