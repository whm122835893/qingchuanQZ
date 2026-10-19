<template>
  <view class="container my-page">
    <view class="my-body">
      <!-- 顶栏：菜单 / 扫码 / 消息。源站 more_left→openDrawer（MenuSlider 未复刻）；
           scan / msg 均→toEmpty（/pages/index/empty） -->
      <view class="flex flex-ai-center flex-js-sb top-bar">
        <img class="top-icon" :src="asset('static/my/more_left.png')" mode="widthFix" @click="openDrawer" />
        <view class="flex flex-ai-center">
          <img class="top-icon" :src="asset('static/my/scan.png')" mode="widthFix" @click="toEmpty" />
          <img class="top-icon" :src="asset('static/my/msg.png')" mode="widthFix" @click="toEmpty" />
        </view>
      </view>

      <!-- 资产 / 收益 -->
      <view class="asset-box">
        <text class="MiSans-Bold asset-title">资产/收益</text>

        <view class="flex flex-js-sb asset-row">
          <view class="flex flex-dir-col flex-1">
            <view class="flex flex-ai-center">
              <text class="MiSans-Regular asset-label">总资产预估(元)</text>
              <!-- 源站为 u-icon eye-fill / eye-off（#999 size 16），此处以同语义 SVG 还原 -->
              <view class="asset-eye flex flex-ai-center flex-js-center" @click="toggleHideAsset">
                <svg v-if="!hideAsset" class="eye-svg" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="currentColor" d="M12 5c-4.6 0-8.5 2.9-10 7 1.5 4.1 5.4 7 10 7s8.5-2.9 10-7c-1.5-4.1-5.4-7-10-7zm0 11.2A4.2 4.2 0 1 1 16.2 12 4.2 4.2 0 0 1 12 16.2z" />
                  <circle cx="12" cy="12" r="2.2" fill="#fff" />
                </svg>
                <svg v-else class="eye-svg" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="none" stroke="currentColor" stroke-width="1.6" d="M12 5c-4.6 0-8.5 2.9-10 7 1.5 4.1 5.4 7 10 7s8.5-2.9 10-7c-1.5-4.1-5.4-7-10-7z" />
                  <circle cx="12" cy="12" r="2.2" fill="none" stroke="currentColor" stroke-width="1.6" />
                  <line x1="4" y1="4" x2="20" y2="20" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
                </svg>
              </view>
            </view>
            <text class="MiSans-Bold asset-value">{{ displayTotalAsset }}</text>
          </view>
        </view>

        <!-- 图例 -->
        <view class="legend-bar flex flex-ai-center">
          <view class="flex flex-ai-center legend-group">
            <view class="legend-dot legend-dot-a"></view>
            <text class="MiSans-Regular legend-text">总资产累计变化</text>
          </view>
          <view class="flex flex-ai-center">
            <view class="legend-dot legend-dot-b"></view>
            <view class="legend-dot legend-dot-c"></view>
            <text class="MiSans-Regular legend-text">每日收益正负</text>
          </view>
        </view>
      </view>

      <!-- 快捷菜单 5 项：源站 menuList，分享App 为 action:share（InvitePoster 海报，未复刻，暂跳下载页） -->
      <view class="flex flex-js-sb menu-row">
        <view
          v-for="m in menuList"
          :key="m.title"
          class="flex flex-dir-col flex-ai-center menu-item"
          @click="doAction(m)"
        >
          <img class="menu-icon" :src="asset(m.icon)" mode="widthFix" />
          <text class="MiSans-Regular menu-label">{{ m.title }}</text>
        </view>
      </view>

      <!-- 藏品分类：源站 cateTabs，绘画/卡牌/建模/卡券/元素 types=null 恒空态 -->
      <scroll-view scroll-x class="cate-scroll" :show-scrollbar="false">
        <view class="flex flex-ai-center cate-list">
          <view
            v-for="(c, i) in cateTabs"
            :key="c.name"
            class="cate-item"
            :class="{ active: cateIndex === i }"
            @click="onCateChange(i)"
          >
            <text class="MiSans-Medium cate-text">{{ c.name }}</text>
            <view v-if="cateIndex === i" class="cate-line"></view>
          </view>
        </view>
      </scroll-view>

      <!-- 搜索：源站为真 input，confirm 触发 onSearch -->
      <view class="search-bar flex flex-ai-center">
        <img class="search-icon" :src="asset('static/my/search.png')" mode="widthFix" />
        <input
          class="MiSans-Regular flex-1 search-input"
          v-model="param.keywords"
          type="search"
          placeholder="请输入关键词"
          @keyup.enter="onSearch"
        />
      </view>

      <!-- 藏品列表 -->
      <view class="goods-box">
        <template v-if="currentTabHasData">
          <view
            v-for="(item, i) in list"
            :key="listKey(item, i)"
            class="asset-row flex flex-ai-center"
            @click="openPop(item)"
          >
            <img class="asset-thumb" :src="ossImg(item.collection && item.collection.listimg)" mode="aspectFill" />
            <view class="flex flex-dir-col asset-name-col">
              <text class="MiSans-Medium text-overflow asset-name">{{ (item.collection && item.collection.name) || '--' }}</text>
              <text class="MiSans-Regular asset-num">持有数量：{{ isLogin ? (item.num || 0) : '--' }}</text>
            </view>
            <view class="flex flex-dir-col flex-ai-end asset-floor-col">
              <text class="MiSans-Demibold asset-floor">{{ isLogin ? floorPriceText(item) : '--' }}</text>
              <text class="MiSans-Regular asset-sub">市场地板价</text>
            </view>
            <view class="flex flex-dir-col flex-ai-end asset-change-col">
              <view class="flex flex-ai-center">
                <template v-if="isLogin">
                  <img
                    class="trend-icon"
                    :src="changeNum(item) >= 0 ? asset('static/my/zhang.png') : asset('static/my/die.png')"
                    mode="aspectFit"
                  />
                  <text
                    class="MiSans-Semibold change-text"
                    :class="changeNum(item) >= 0 ? 'up' : 'down'"
                  >{{ formatChange(item) }}</text>
                </template>
                <text v-else class="MiSans-Semibold change-none">--</text>
              </view>
              <text class="MiSans-Regular asset-sub">市场涨跌幅</text>
            </view>
          </view>

          <!-- w-loading type=empty：源站 market 空态仅渲染 330rpx 图（文字分支源站即为空），mt=2×emptyTop=80rpx -->
          <view v-if="loadingType === 'empty'" class="empty-box flex flex-dir-col flex-ai-center">
            <img class="empty-img" :src="asset('static/empty/market-empty.png')" mode="widthFix" />
          </view>
          <!-- w-loading type=loading：u-loading-icon 加载中（14px #333 竖排） -->
          <view v-else-if="loadingType === 'loading'" class="loading-box flex flex-ai-center flex-js-center">
            <view class="loading-spinner"></view>
            <text class="MiSans-Regular loading-text">加载中</text>
          </view>
          <!-- 源站底部：list.length && loadingType==='none' && !isNext -->
          <view v-if="list.length && loadingType === 'none' && !isNext" class="flex flex-js-center list-end">
            <text class="MiSans-Regular end-text">我已经到底了</text>
          </view>
        </template>

        <!-- currentTabHasData=false（types=null 的 5 个 tab）：源站直接 w-loading type=empty -->
        <view v-else class="empty-box flex flex-dir-col flex-ai-center">
          <img class="empty-img" :src="asset('static/empty/market-empty.png')" mode="widthFix" />
        </view>
      </view>
    </view>

    <!-- 持有详情弹窗（popDetails）：自取数，opened 后刷新列表 -->
    <CollectionDetailPopup
      v-model:show="showPop"
      :id="collectionId"
      :types="param.types"
      :summary="popSummary"
      @opened="onBoxOpened"
    />

    <AppTabBar :value="4" />
  </view>
</template>

<script setup>
import { onActivated, onBeforeUnmount, onMounted, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import AppTabBar from '@/components/AppTabBar.vue'
import CollectionDetailPopup from '@/components/CollectionDetailPopup.vue'
import { fetchAntMyCollection, fetchUserInfo, asset } from '@/utils/api'
import { ossImg } from '@/api'

defineOptions({ name: 'MyPage' })

const router = useRouter()

/**
 * 源站 cateTabs（pages-my-my.0e9b7c94.js 实证）：
 * 绘画/卡牌/建模/卡券/元素 types=null —— onCateChange 命中 null 直接 loadingType='empty'，
 * 永不发请求；藏品=2 / 盲盒=1 / 已售=3。默认 cateIndex=4（藏品）。
 */
const cateTabs = [
  { name: '绘画', types: null },
  { name: '卡牌', types: null },
  { name: '建模', types: null },
  { name: '卡券', types: null },
  { name: '藏品', types: 2 },
  { name: '盲盒', types: 1 },
  { name: '已售', types: 3 },
  { name: '元素', types: null },
]

/** 源站 menuList：分享App 为 action:share（弹出 InvitePoster 邀请海报，l-painter 画布），项目未复刻，暂跳下载页 */
const menuList = [
  { title: '我的订单', url: '/pages/order/list', icon: 'static/my/order.png' },
  { title: '我的钱包', url: '/pages/wallet/wallet', icon: 'static/my/wallet.png' },
  { title: '邀请好友', url: '/pages/invitation/invitation', icon: 'static/my/invite.png' },
  { title: '在线客服', url: '/pages/my/service', icon: 'static/my/kefu.png' },
  { title: '分享App', url: '/pages/index/downloadApp', icon: 'static/my/share.png' },
]

const isLogin = ref(!!localStorage.getItem('token'))
const userInfo = ref({})
const hideAsset = ref(false)
const totalAsset = ref('0') // 源站 data 默认 "0"
const loadingType = ref('none')
const list = ref([])
const isNext = ref(true)
const fetching = ref(false)
const cateIndex = ref(4)
const param = ref({ keywords: '', types: 2, page: 1 })
const showPop = ref(false)
const collectionId = ref('')
const popSummary = ref({})

const currentTabHasData = computed(() => {
  const t = cateTabs[cateIndex.value]
  return t && t.types != null
})

/** 源站 displayTotalAsset：未登录 "--" / 隐藏 "****" / 否则 formatThousands(statistics.total_assets ?? totalAsset) */
const displayTotalAsset = computed(() => {
  if (!isLogin.value) return '--'
  if (hideAsset.value) return '****'
  const t =
    (userInfo.value && userInfo.value.statistics && userInfo.value.statistics.total_assets) ??
    totalAsset.value
  return formatThousands(t)
})

/* ===== 源站 helpers 逐字移植 ===== */

function formatThousands(a) {
  if (a == null || a === '') return '--'
  const t = Number(a)
  if (isNaN(t)) return String(a)
  const d = Number.isInteger(t) ? String(Math.trunc(t)) : t.toFixed(2)
  const r = d.split('.')
  r[0] = r[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return r.join('.')
}

/** changeNum：change_rate 或 market_fluctuate_new 任一非空 → 取 market_fluctuate_new（源站优先级） */
function changeNum(a) {
  const t = a.change_rate != null || a.market_fluctuate_new != null ? a.market_fluctuate_new : 0
  return Number(t) || 0
}

function formatChange(a) {
  const t = changeNum(a)
  const d = t > 0 ? '+' : ''
  return `${d}${t.toFixed(2)}%`
}

/** floorPriceText：min_price ?? floor_price ?? price；null/""/0 → "--"，否则 "¥"+Number */
function floorPriceText(a) {
  const t = a.min_price != null ? a.min_price : a.floor_price != null ? a.floor_price : a.price
  return t == null || t === '' || Number(t) === 0 ? '--' : '¥' + Number(t)
}

function listKey(a, t) {
  const d = (a.collection && a.collection.id) || a.id || t
  return d + '-' + t
}

/* ===== 源站 methods 移植 ===== */

function toggleHideAsset() {
  if (isLogin.value) hideAsset.value = !hideAsset.value
}

function toEmpty() {
  router.push('/pages/index/empty')
}

function openDrawer() {
  /* 源站侧边抽屉 MenuSlider 未复刻 */
}

async function initInfo() {
  if (!isLogin.value) return
  userInfo.value = await fetchUserInfo()
}

function initPage() {
  if (isLogin.value && currentTabHasData.value) fetchList(true)
  else loadingType.value = 'empty'
}

/** onCateChange：null types → 清空 + loadingType='empty' 直接返回；否则换 tab 重新拉取 */
function onCateChange(a) {
  if (cateIndex.value !== a) {
    cateIndex.value = a
    const t = cateTabs[a]
    list.value = []
    isNext.value = true
    param.value.page = 1
    if (t.types == null) {
      param.value.types = null
      loadingType.value = 'empty'
      return
    }
    param.value.types = t.types
    if (isLogin.value) {
      loadingType.value = 'loading'
      fetchList(true)
    } else {
      loadingType.value = 'empty'
    }
  }
}

/** fetchList：刷新替换 / 分页 concat；page < last_page → page++ & isNext=true */
async function fetchList(isRefresh) {
  if (!isLogin.value || !currentTabHasData.value) return
  if (fetching.value) return
  fetching.value = true
  if (isRefresh && !list.value.length) loadingType.value = 'loading'
  try {
    const r = await fetchAntMyCollection({
      keywords: param.value.keywords || '',
      types: param.value.types,
      page: param.value.page,
    })
    const d = (r && r.data) || []
    list.value = isRefresh ? d : list.value.concat(d)
    const lastPage = r ? r.last_page : 0
    if (param.value.page < lastPage) {
      param.value.page++
      isNext.value = true
    } else {
      isNext.value = false
    }
    loadingType.value = list.value.length ? 'none' : 'empty'
  } catch (e) {
    loadingType.value = list.value.length ? 'none' : 'empty'
  } finally {
    fetching.value = false
  }
}

/** loadMore（源站 onReachBottom）：isLogin && currentTabHasData && isNext && !fetching */
function loadMore() {
  if (isLogin.value && currentTabHasData.value && isNext.value && !fetching.value) {
    fetchList(false)
  }
}

function onSearch() {
  if (!isLogin.value) return
  param.value.page = 1
  isNext.value = true
  loadingType.value = list.value.length ? 'none' : 'loading'
  fetchList(true)
}

/** openPop：源站 3 != this.param.types（已售 tab 不弹窗） */
function openPop(a) {
  if (!isLogin.value) return
  if (param.value.types === 3) return
  if (a && a.collection) {
    collectionId.value = a.collection.id
    popSummary.value = a
    showPop.value = true
  }
}

/** onBoxOpened：弹窗内开盒后刷新列表 */
function onBoxOpened() {
  if (isLogin.value && currentTabHasData.value) {
    param.value.page = 1
    isNext.value = true
    fetchList(true)
  }
}

function doAction(a) {
  if (a.url) router.push(a.url)
}

/* 触底加载（对应源站 onReachBottom → loadMore） */
function onScroll() {
  const el = document.documentElement
  if (el.scrollHeight - el.scrollTop - el.clientHeight < 50) loadMore()
}

onMounted(() => {
  initPage()
  window.addEventListener('scroll', onScroll, { passive: true })
})

// MyPage 在 keep-alive 内：对应源站 onShow 重新拉用户信息（登录态可能已变）
onActivated(() => {
  isLogin.value = !!localStorage.getItem('token')
  initInfo()
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll)
})
</script>

<style scoped>
.my-page {
  min-height: 100vh;
  /* 底部固定 tabbar 高 160rpx，页面留出同等底部内边距 */
  padding-bottom: 160rpx;
  background: #fff url('/static/my/my_bg.png') no-repeat 50% 0 / 100% auto;
}
/* 源站内容区 paddingTop = statusBarHeight + 144rpx；浏览器无状态栏，取 144rpx（safe-area 兜底） */
.my-body {
  padding-top: calc(env(safe-area-inset-top) + 144rpx);
}
/* 顶栏：源站 padding 12rpx 28rpx 0，图标 40×40rpx，msg 间距 28rpx */
.top-bar {
  padding: 12rpx 28rpx 0;
}
.top-icon {
  width: 40rpx;
  height: 40rpx;
}
.top-icon + .top-icon {
  margin-left: 28rpx;
}
/* 资产区：源站 padding 28rpx 28rpx 0 */
.asset-box {
  padding: 28rpx 28rpx 0;
}
.asset-title {
  display: block;
  font-size: 40rpx;
  line-height: 54rpx;
  color: #1a2438;
}
.asset-row {
  margin-top: 28rpx;
}
.asset-label {
  font-size: 22rpx;
  line-height: 30rpx;
  color: #999;
}
.asset-eye {
  margin-left: 8rpx;
  width: 48rpx;
  height: 40rpx;
}
.eye-svg {
  width: 16px;
  height: 16px;
  color: #999;
}
.asset-value {
  margin-top: 8rpx;
  font-size: 48rpx;
  line-height: 60rpx;
  color: #1a2438;
}
/* 图例条：源站 h56 padding 0 20rpx bg #f5f5f5 radius 12rpx mt 24rpx */
.legend-bar {
  height: 56rpx;
  margin: 24rpx 28rpx 0;
  padding: 0 20rpx;
  background: #f5f5f5;
  border-radius: 12rpx;
}
/* 源站 dot A 16rpx #c8c8c8；dot B/C 10rpx #e54d42/#22a06b，radius 2rpx */
.legend-dot {
  border-radius: 2rpx;
  flex-shrink: 0;
}
.legend-dot-a {
  width: 16rpx;
  height: 16rpx;
  background: #c8c8c8;
}
.legend-dot-b {
  width: 10rpx;
  height: 10rpx;
  background: #e54d42;
}
.legend-dot-c {
  width: 10rpx;
  height: 10rpx;
  margin-left: 4rpx;
  background: #22a06b;
}
.legend-group {
  margin-right: 32rpx;
}
.legend-text {
  margin-left: 8rpx;
  font-size: 20rpx;
  line-height: 28rpx;
  color: #999;
}
/* 快捷菜单：源站 padding 36rpx 20rpx 8rpx，项 flex:1，图标 34×38rpx */
.menu-row {
  padding: 36rpx 20rpx 8rpx;
}
.menu-item {
  flex: 1;
  min-width: 0;
}
.menu-icon {
  width: 34rpx;
  height: 38rpx;
}
.menu-label {
  margin-top: 24rpx;
  font-size: 23rpx;
  line-height: 30rpx;
  color: #333;
}
/* 分类：源站 cate-scroll mt 16rpx；cate-item mr 36rpx padding 12rpx 0 16rpx */
.cate-scroll {
  width: 100%;
  height: 56rpx;
  margin-top: 16rpx;
  white-space: nowrap;
}
.cate-list {
  padding: 0 28rpx;
  width: max-content;
}
.cate-item {
  position: relative;
  margin-right: 36rpx;
  padding: 12rpx 0 16rpx;
  flex: 0 0 auto;
  text-align: center;
}
.cate-text {
  font-size: 28rpx;
  line-height: 28rpx;
  color: #999;
}
.cate-item.active .cate-text {
  color: #1a2438;
  font-weight: 600;
}
/* cate-line：36×6rpx 居中，radius 3rpx */
.cate-line {
  position: absolute;
  left: 50%;
  bottom: 0;
  transform: translateX(-50%);
  width: 36rpx;
  height: 6rpx;
  background: #1a2438;
  border-radius: 3rpx;
}
/* 搜索：源站 h68 padding 0 24rpx radius 34rpx，margin 20rpx 28rpx 0 */
.search-bar {
  height: 68rpx;
  margin: 20rpx 28rpx 0;
  padding: 0 24rpx;
  background: #f5f5f5;
  border-radius: 34rpx;
}
.search-icon {
  width: 28rpx;
  height: 28rpx;
  flex-shrink: 0;
}
.search-input {
  margin-left: 12rpx;
  font-size: 24rpx;
  line-height: 34rpx;
  color: #333;
  background: transparent;
  border: 0;
  outline: none;
  min-width: 0;
}
.search-input::placeholder {
  color: #bbb;
  font-size: 24rpx;
}
/* 列表容器：源站 padding 8rpx 28rpx 40rpx */
.goods-box {
  padding: 8rpx 28rpx 40rpx;
}
/* 源站 asset-row：padding 24rpx 0，border-bottom 1px #f3f3f3 */
.asset-row {
  padding: 24rpx 0;
  border-bottom: 1px solid #f3f3f3;
}
/* 源站 asset-thumb：96×96rpx radius 12rpx bg #2f4f3a */
.asset-thumb {
  width: 96rpx;
  height: 96rpx;
  border-radius: 12rpx;
  background: #2f4f3a;
  flex-shrink: 0;
}
.asset-name-col {
  flex: 1.2;
  min-width: 0;
  margin-left: 16rpx;
}
.asset-name {
  font-size: 28rpx;
  line-height: 38rpx;
  color: #1a2438;
}
.asset-num {
  margin-top: 8rpx;
  font-size: 22rpx;
  line-height: 30rpx;
  color: #999;
}
.asset-floor-col {
  flex: 0.8;
  margin-left: 8rpx;
}
.asset-floor {
  font-size: 28rpx;
  line-height: 38rpx;
  color: #1a2438;
}
.asset-change-col {
  flex: 0.9;
  margin-left: 12rpx;
}
.asset-sub {
  margin-top: 8rpx;
  font-size: 20rpx;
  line-height: 28rpx;
  color: #999;
}
.trend-icon {
  width: 28rpx;
  height: 20rpx;
  flex-shrink: 0;
}
.change-text {
  margin-left: 4rpx;
  font-size: 24rpx;
  line-height: 20rpx;
}
.change-text.up {
  color: #e54d42;
}
.change-text.down {
  color: #22a06b;
}
.change-none {
  font-size: 24rpx;
  line-height: 20rpx;
  color: #999;
}
/* 空态：源站 w-loading market —— 330rpx 图 + marginTop 2×40rpx（文字分支源站即为空） */
.empty-box {
  margin-top: 80rpx;
}
.empty-img {
  width: 330rpx;
  height: auto;
}
/* 加载中：u-loading-icon size 14 #333 竖排 */
.loading-box {
  padding: 40rpx 0;
}
.loading-spinner {
  width: 14px;
  height: 14px;
  margin-right: 8rpx;
  border: 2px solid #333;
  border-right-color: transparent;
  border-radius: 50%;
  animation: my-spin 0.8s linear infinite;
}
@keyframes my-spin {
  to {
    transform: rotate(360deg);
  }
}
.loading-text {
  font-size: 14px;
  line-height: 20px;
  color: #333;
}
/* 源站底部提示：padding 24rpx 0，24rpx #bbb */
.list-end {
  padding: 24rpx 0;
}
.end-text {
  font-size: 24rpx;
  line-height: 32rpx;
  color: #bbb;
}
</style>
