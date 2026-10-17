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
├── docs/
│   ├── DATABASE.md         # 数据库设计文档（7 域 48 表 / 枚举字典 / 脏数据决策 / mock 映射）
│   └── schema.sql          # MySQL 8.0 建表脚本 v1.2（可执行）
├── scripts/                # 数据灌库工具链（见下方「数据库」）
├── data/
│   ├── qingchuan.db        # SQLite 灌库产物（48 表 / 341 行）
│   ├── seed-report.json    # 灌库报告（表行数 / 孤儿行 / 校验结果 / 跳过台账）
│   └── audit-report.json   # 独立审计报告（不复用灌库链路代码）
├── public/                 # 静态资源（85MB，含 265 张源站图片）
│   ├── static/             # 从源站 img CDN 下载的真实图片
│   ├── mock/               # 78 份接口响应快照（数据库灌库的唯一数据源）
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

## 数据库

78 份源站 mock 已按定稿 schema 灌入 48 张表，产出可查询的 SQLite 库。

```bash
cd qingchuan-h5 && python3 scripts/seed.py      # 重建 data/qingchuan.db
python3 scripts/audit.py                        # 独立审计（不复用灌库代码）
```

**规模**：48 表 / 341 行 / 79 索引 / 耗时约 6.4s / 零第三方依赖（仅 Python 标准库）

### 文档

| 文件 | 内容 |
|------|------|
| [`docs/DATABASE.md`](docs/DATABASE.md) | 设计文档：7 域 48 表字段级定义、枚举字典（含推断依据）、主外键 ER 图、脏数据决策、mock→表映射清单、不入库数据说明 |
| [`docs/schema.sql`](docs/schema.sql) | MySQL 8.0 建表脚本 v1.2，48 张表 / 575 字段 / 17 强 FK / 79 索引 |
| [`scripts/README.md`](scripts/README.md) | 灌库工具链文件职责与用法 |

### 核心设计决策

| 决策 | 依据 |
|------|------|
| **强 FK 仅 17 个**，其余 28 列降级为「弱引用 + 100% 索引」 | 挂单的卖家不在 `users` 表内是真实业务常态（源站仅暴露当前登录用户），硬 FK 会导致外键形同虚设 |
| **混合引用列用方案 X**：源站 `0` → 目标列 `NULL` + `_raw` 列留原值 | `0` 是合法 BIGINT，类型系统无法区分哨兵与真实 ID；`NULL` 天然被 FK 放行且是三态语义 |
| **金额统一 `DECIMAL(18,4)`**，禁用浮点 | `real_income = 15 − 0.75 − 0.00` 是分账字段，浮点丢精度 |
| **非标准时间保持 VARCHAR，不 CAST** | `"10-16 09:24"` 缺年份、`"18:26:45"` 是纯时刻、`"1812061059386431"` 是雪花 ID —— 强行转换等于伪造数据 |
| **零 MySQL ENUM 类型**，枚举用 TINYINT/VARCHAR + COMMENT | 源站枚举跨域语义冲突（`goods_type` 在藏品域 1=盲盒、商城域 2=盲盒），ENUM 改值属 DDL 灾难 |
| **`app_configs` 复合主键 `(config_group, config_key)`** | `basic` 与 `trade` 两组均存在同名 `appName`，单列主键无法区分 |
| **`sms_getCapt.json` 不入库** | 127KB 全是 base64 验证码（占 mock 总量 47%），秒级过期 |

### 质量校验

两套**互不复用代码**的校验同时跑，结果必须一致：

| 校验 | 方法 | 结果 |
|------|------|------|
| `seed.py` 自检 | `PRAGMA foreign_key_check`（约束生效状态） | 0 违规 |
| `audit.py` 独立审计 | 从 `schema.sql` 原文重解析 17 强 FK，各写 `LEFT JOIN` | 0 违规 / 17 |

另有：`NOT NULL` 违规 0、枚举越界 0、双向列校验 0 差异、`app_configs` 跨组同名 key 前缀残留 0。

### 已知遗留

- `order_cards` 表 0 行 —— 源站 `card[]` 实测为空数组，schema 保留骨架待真实数据出现
- `activity_configs` 主键仍为单列 `config_key`（当前 4 组 key 不撞名，mapper 保留 `group:` 前缀做保险）
- MySQL 分支代码完整，但需 `PyMySQL` 且未做真库联调（SQLite 为默认且已全量验证）

---

## 交付统计

```
页面文件  105
组件      25
mock      78
路由      110
图片      265

数据库    48 表 / 575 字段 / 17 强 FK / 79 索引
灌库产物  341 行 / 636KB（SQLite）
脚本      24 个文件 / 4418 行
设计文档  DATABASE.md 1491 行 + schema.sql 1155 行
```