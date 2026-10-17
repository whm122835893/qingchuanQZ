<template>
  <view class="page-index">
    <!-- 顶部标题 -->
    <view class="header MiSans-Bold" :style="{ paddingTop: '44px' }">
      <text class="header-title">QingChuan</text>
    </view>

    <!-- banner 轮播 -->
    <view class="banner-box">
      <view class="banner-swiper">
        <view
          v-for="(item, index) in bannerList"
          :key="index"
          class="banner-slide"
          @click="bannerClick(index)"
        >
          <img class="banner-img" :src="ossImg(item.image)" mode="aspectFill" />
        </view>
      </view>
      <view class="banner-indicator">
        <view
          v-for="(item, index) in bannerList"
          :key="'dot' + index"
          class="banner-dot"
          :class="{ 'banner-dot--active': bannerCurrent === index }"
        />
      </view>
    </view>

    <!-- 五个功能入口 -->
    <view class="flex flex-js-sb entries-box">
      <view
        v-for="item in topMenus"
        :key="item.name"
        class="flex flex-dir-col flex-ai-center entry-item"
        @click="goMenu(item)"
      >
        <img class="entry-icon" :src="asset(item.icon)" mode="aspectFit" />
        <text class="entry-text MiSans-Regular">{{ item.name }}</text>
      </view>
    </view>

    <!-- 数字艺术区 -->
    <view class="flex art-box">
      <view class="art-left">
        <view class="flex flex-ai-center art-title-row">
          <text class="art-title MiSans-Heavy">数字艺术</text>
          <view class="flex flex-ai-center art-more" @click="goMarket">
            <text class="MiSans-Regular">更多</text>
            <text class="MiSans-Regular art-more-arrow">&gt;</text>
          </view>
        </view>
        <view v-if="marketGoods" class="flex flex-ai-center art-goods" @click="goMarketGoods(marketGoods)">
          <img class="art-goods-img" :src="ossImg(marketGoods.product && marketGoods.product.listimg)" mode="aspectFill" />
          <view class="flex flex-dir-col flex-js-sb art-goods-info">
            <view class="flex flex-dir-col">
              <text class="art-goods-name MiSans-Medium text-overflow">藏品：{{ (marketGoods.product && marketGoods.product.name) || '--' }}</text>
              <text class="art-goods-price MiSans-Semibold mt-16">{{ marketGoods.is_out ? '--' : Number(marketGoods.min_price || 0).toFixed(2) }}</text>
            </view>
            <view class="flex flex-ai-center">
              <view class="art-author-avatar">
                <img class="art-author-img" :src="asset('static/logo/logo.png')" mode="aspectFill" />
              </view>
              <text class="art-author-name MiSans-Medium">QingChuan</text>
            </view>
          </view>
        </view>
        <view v-else class="flex flex-dir-col flex-js-center flex-ai-center art-empty">
          <text class="art-empty-text MiSans-Regular">暂无藏品</text>
        </view>
      </view>
      <view class="flex flex-dir-col art-right">
        <img
          v-for="(item, index) in artSideMenus"
          :key="item.name"
          class="art-side-img"
          :class="{ 'art-side-img--first': index === 0 }"
          :src="asset(item.icon)"
          mode="aspectFill"
          @click="goMenu(item)"
        />
      </view>
    </view>

    <!-- 公告栏 -->
    <view class="flex flex-ai-center notice-box">
      <view class="notice-logo">
        <img class="notice-logo-img" :src="asset('static/logo/logo.png')" mode="" />
      </view>
      <view class="notice-bar-wrap">
        <view class="u-notice" @click="goNotice">
          <view class="u-notice__swiper" :style="{ transform: 'translateY(' + -noticeCurrent * 100 + '%)' }">
            <view v-for="(text, index) in noticeText" :key="index" class="u-notice__swiper-item">
              <text class="u-notice__swiper-text">{{ text }}</text>
            </view>
          </view>
        </view>
      </view>
      <text class="notice-more MiSans-Regular" @click="goNotice">更多 &gt;</text>
    </view>

    <!-- 快捷链接 -->
    <view class="quick-box">
      <view class="quick-swiper" :style="{ transform: 'translateX(' + -menuCurrent * 100 + '%)' }">
        <view v-for="(page, pageIndex) in menuPages" :key="'page' + pageIndex" class="quick-page flex flex-w">
          <view
            v-for="item in page"
            :key="item.name + item.icon"
            class="flex flex-ai-center quick-item"
            @click="goMenu(item)"
          >
            <view class="quick-icon-box">
              <img class="quick-icon" :src="asset(item.icon)" mode="aspectFit" />
            </view>
            <text class="quick-text MiSans-Medium text-overflow">{{ item.name }}</text>
          </view>
        </view>
      </view>
      <view class="flex flex-js-center flex-ai-center quick-dots">
        <view
          v-for="(page, index) in menuPages"
          :key="'dot' + index"
          class="quick-dot"
          :class="{ 'quick-dot--active': menuCurrent === index }"
        />
      </view>
    </view>

    <!-- 分类 tabs + 商品列表 -->
    <view class="category-box">
      <div class="category-scroll">
        <view class="flex flex-ai-center category-scroll-inner">
          <view
            v-for="(item, index) in categoryTabs"
            :key="item.name"
            class="flex flex-dir-col flex-ai-center category-tab"
            :class="{ 'category-tab--last': index === categoryTabs.length - 1 }"
            @click="changeCategory(index)"
          >
            <text class="category-tab-text" :class="categoryIndex === index ? 'MiSans-Demibold' : 'MiSans-Regular'">{{ item.name }}</text>
            <view class="category-tab-line" :class="{ 'category-tab-line--active': categoryIndex === index }" />
          </view>
        </view>
      </div>

      <view v-if="categoryIndex === 0" class="flex flex-w flex-js-sb goods-list">
        <view v-for="item in goodsList" :key="item.id + String(item.batch_id || '')" class="goods-item" @click="goGoodsDetail(item)">
          <img class="goods-img" :src="ossImg(item.listimg)" mode="aspectFill" />
          <text class="goods-name MiSans-Medium text-overflow">{{ item.name || 'QingChuan藏品名称' }}</text>
          <text class="goods-price MiSans-Bold">¥{{ item.price }}</text>
        </view>
      </view>

      <!-- 空状态 -->
      <view v-if="loadingType === 'empty'" class="flex flex-dir-col flex-ai-center empty-box">
        <img class="empty-img" :src="asset('static/empty/search1-empty.png')" mode="aspectFit" />
        <text class="empty-text">暂无内容</text>
      </view>
      <view v-else-if="loadingType === 'loading'" class="flex flex-dir-col flex-ai-center empty-box">
        <text class="empty-text">加载中...</text>
      </view>
    </view>

    <!-- 顶部下载 APP 提示条（原站 fixed top:0，高43px） -->
    <view v-if="showSuspendDownload" class="suspend-bar flex flex-ai-center">
      <text class="suspend-text flex-1">下载APP应用获得更好体验！</text>
      <view class="suspend-btn" @click="downloadApp">下载APP</view>
      <view class="suspend-close" @click="closeShowSuspendDownload">
        <svg viewBox="0 0 12 12" class="suspend-close-svg" aria-hidden="true">
          <path d="M1 1 L11 11 M11 1 L1 11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" fill="none" />
        </svg>
      </view>
    </view>

    <!-- 底部导航 -->
    <AppTabBar :value="0" />
  </view>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ossImg } from '@/api'
import AppTabBar from '@/components/AppTabBar.vue'
import { api } from '@/api'

defineOptions({ name: 'IndexPage' })

const router = useRouter()
const EMPTY_PAGE = '/pages/index/empty'

const asset = (p) => (import.meta.env.BASE_URL + p.replace(/^\//, ''))

const bannerList = ref([])
const bannerCurrent = ref(0)
const marketGoods = ref(null)
const noticeText = ref(['青川版权艺术平台正式上线，敬请期待...'])
const noticeCurrent = ref(0)
const menuCurrent = ref(0)
const categoryIndex = ref(0)
const categoryTabs = [{ name: '全部' }, { name: '推荐' }, { name: '潮流玩物' }, { name: '严选服装' }, { name: '潮酷数码' }]
const goodsList = ref([])
const loadingType = ref('none')
const showSuspendDownload = ref(false)
const pageInfo = ref({ list_rows: 10, page: 1 })
const indexGrid = ref([])
let noticeTimer = null

// 首页五个功能入口（与原站数据一致）
const topMenus = [
  { name: '合成兑换', auth: true, icon: '/static/home/hecheng.png', path: '/pages/compound/compound' },
  { name: '万象重铸', icon: '/static/home/chongzhu.png', path: EMPTY_PAGE },
  { name: '签到有礼', icon: '/static/home/huanhua.png', path: '/pages/sign/index', auth: true },
  { name: '全民抽签', auth: true, icon: '/static/home/draw.png', path: '/pages/activity/draw' },
  { name: '更多活动', icon: '/static/home/more.png', path: '/pages/notice/notice', tab: true },
]

// 数字艺术区右侧两个入口
const artSideMenus = [
  { name: '创作者中心', icon: '/static/home/center_create.png', path: EMPTY_PAGE },
  { name: '实体卡牌', icon: '/static/home/shitikapai.png', path: EMPTY_PAGE },
]

// 快捷链接（三页，与原站硬编码数据一致）
const menuPages = [
  [
    { name: '商品收藏', icon: '/static/home/icon_collec.png', path: EMPTY_PAGE },
    { name: '浏览记录', icon: '/static/home/icon_zuji.png', path: EMPTY_PAGE },
    { name: '收货地址', icon: '/static/home/icon_address.png', path: '/pages/my/address/list', auth: true },
    { name: '购物车', icon: '/static/home/icon_cart.png', path: EMPTY_PAGE },
    { name: '限时秒杀', icon: '/static/home/icon_limit.png', path: EMPTY_PAGE },
    { name: '领取福利', icon: '/static/home/icon_wealth.png', path: EMPTY_PAGE },
  ],
  [
    { name: '搜索商品', icon: '/static/home/icon_search.png', path: '/pages/market/search' },
    { name: '电商中心', icon: '/static/home/icon_dianshangzhongxin.png', path: EMPTY_PAGE },
    { name: '签到有礼', icon: '/static/home/icon_sign.png', path: '/pages/sign/index', auth: true },
    { name: '积分转盘', icon: '/static/home/icon_zhuanpan.png', path: EMPTY_PAGE },
    { name: '商品订单', icon: '/static/home/icon_order.png', path: '/pages/order/list', auth: true },
    { name: '积分商城', icon: '/static/home/icon_shop.png', path: '/pages/shop/shop' },
  ],
  [
    { name: '品质拼团', icon: '/static/home/icon_tuan.png', path: EMPTY_PAGE },
    { name: '浏览记录', icon: '/static/home/icon_liulangjilu.png', path: EMPTY_PAGE },
  ],
]

const isLogin = () => !!localStorage.getItem('token')

// 与原站 goMenu 一致：compound/draw 走 diypage 配置的路径，tab 项 switchTab
function goMenu(item) {
  if (!item || !item.path) return router.push(EMPTY_PAGE)
  if (!item.auth || isLogin()) {
    if (item.path.indexOf('compound/compound') > -1) {
      const grid = indexGrid.value.filter((g) => g.path && g.path.indexOf('compound/compound') > -1)[0]
      if (grid && grid.path) return router.push(grid.path)
      return alert('敬请期待!')
    }
    if (item.path.indexOf('activity/draw') > -1) {
      const grid = indexGrid.value.filter((g) => g.path && g.path.indexOf('activity/draw') > -1)[0]
      if (grid && grid.path) return router.push(grid.path)
      return alert('敬请期待!')
    }
    if (item.tab) return router.push(item.path)
    return router.push(item.path)
  }
  router.push('/pages/login/login')
}

function goMarket() { router.push('/pages/market/market') }
function goNotice() { router.push('/pages/notice/notice') }
function goMarketGoods(item) {
  if (!isLogin()) return router.push('/pages/login/login')
  if (item && item.product) {
    router.push({ path: '/pages/market/marketGoodsList', query: { id: item.product.id, goodsType: item.goods_type || 2, minPrice: item.min_price } })
  }
}
function goGoodsDetail(item) {
  if (item && item.id) {
    router.push({ path: item.goods_type == 1 ? '/pages/product/box' : '/pages/product/collection', query: { id: item.id, batch_id: item.batch_id || '' } })
  }
}
function bannerClick(index) {
  const item = bannerList.value[index]
  if (!item) return
  const url = item.url
  if (!url) return
  if (String(url).startsWith('/pages')) router.push(url)
  else uni.showToast({ title: '该活动暂未开放', icon: 'none' })
}
function changeCategory(index) {
  if (categoryIndex.value === index) return
  categoryIndex.value = index
  if (index === 0) {
    pageInfo.value.page = 1
    getGoodsList({ ...pageInfo.value })
  } else {
    goodsList.value = []
    loadingType.value = 'empty'
  }
}
function closeShowSuspendDownload() {
  localStorage.setItem('timePop', String(Date.parse(new Date().toDateString())))
  showSuspendDownload.value = false
}
function downloadApp() { router.push('/pages/index/downloadApp') }

async function fetchBanner() {
  try {
    const res = await api.getBanner({ type: 1 })
    bannerList.value = (res.data && res.data.data || []).map((t) => ({ ...t, image: ossImg(t.image) }))
  } catch (e) { /* 忽略 */ }
}

async function fetchMarketFirst() {
  try {
    const res = await api.getMarketList({ page: 1, list_rows: 1, goods_type: 2 })
    const list = res.data || []
    marketGoods.value = list.length ? list[0] : null
  } catch (e) {
    marketGoods.value = null
  }
}

async function fetchNotice() {
  try {
    const res = await api.afficheList({})
    const list = (res.data && res.data.data) || []
    const titles = list.map((a) => a.title || '').filter(Boolean)
    if (titles.length) noticeText.value = titles
  } catch (e) {
    // 原站 afficheList 接口 CORS 预检失败时，用本地抓取的原站真实数据兜底
    try {
      const res = await fetch(asset('mock/afficheList.json'))
      const json = await res.json()
      const list = (json.data && json.data.data) || []
      const titles = list.map((a) => a.title || '').filter(Boolean)
      if (titles.length) noticeText.value = titles
    } catch (e2) { /* 保留默认公告 */ }
  }
}

async function getGoodsList(params) {
  if (loadingType.value === 'loading') return
  loadingType.value = 'loading'
  try {
    const res = await api.blindBoxList(params)
    const list = res.data || []
    if (params.page === 1) goodsList.value = []
    if (list.length) {
      pageInfo.value = params
      goodsList.value = goodsList.value.concat(list)
      loadingType.value = list.length < params.list_rows ? 'nomore' : 'none'
    } else {
      loadingType.value = params.page === 1 ? 'empty' : 'nomore'
    }
  } catch (e) {
    loadingType.value = goodsList.value.length ? 'none' : 'empty'
  }
}

async function fetchIndexGrid() {
  try {
    const res = await api.diypage()
    const menu = (res.data || []).find((a) => a.type === 'menu' && a.category === 'home')
    if (menu) {
      const content = typeof menu.content === 'string' ? JSON.parse(menu.content) : menu.content
      indexGrid.value = (content.list || []).filter((g) => g.path)
    }
  } catch (e) {
    // 原站 diypage 接口 CORS 预检失败时，用本地抓取的原站真实数据兜底
    try {
      const res = await fetch(asset('mock/diypage.json'))
      const json = await res.json()
      const menu = (json.data || []).find((a) => a.type === 'menu' && a.category === 'home')
      if (menu) {
        const content = typeof menu.content === 'string' ? JSON.parse(menu.content) : menu.content
        indexGrid.value = (content.list || []).filter((g) => g.path)
      }
    } catch (e2) { /* 忽略 */ }
  }
}

onMounted(() => {
  fetchBanner()
  fetchMarketFirst()
  fetchNotice()
  fetchIndexGrid()
  getGoodsList({ list_rows: 10, page: 1 })
  // 与原站一致：当天首次访问显示下载提示
  const today = Date.parse(new Date().toDateString())
  const last = Number(localStorage.getItem('timePop') || 0)
  if (!last || today > last + 86400000) {
    localStorage.setItem('timePop', String(today))
    showSuspendDownload.value = true
  }
  // 公告垂直滚动（duration 5000）
  noticeTimer = setInterval(() => {
    if (noticeText.value.length > 1) {
      noticeCurrent.value = (noticeCurrent.value + 1) % noticeText.value.length
    }
  }, 5000)
})

onUnmounted(() => {
  if (noticeTimer) clearInterval(noticeTimer)
})
</script>

<style scoped>
.page-index {
  min-height: 100vh;
  background: #fff;
  padding-bottom: 160rpx;
  font-size: 28rpx;
  color: #4a4a4a;
}

/* 顶部标题 */
/* 显式覆盖 original-commons 中其他页面泄漏的 .header 规则（min-height:244rpx 等） */
.header {
  padding: 0 0 4px 23rpx;
  min-height: 0;
  display: block;
  align-items: stretch;
  width: auto;
  font-size: 0;
}
.header-title {
  display: block;
  font-size: 20px;
  line-height: 27px;
  height: 27px;
  color: #8a9690;
  font-style: italic;
  letter-spacing: 1rpx;
}

/* banner */
.banner-box {
  padding: 15rpx 23rpx 0;
  position: relative;
}
.banner-swiper {
  width: 100%;
  height: 269rpx;
  border-radius: 10px;
  overflow: hidden;
  position: relative;
}
.banner-slide {
  width: 100%;
  height: 100%;
}
.banner-img {
  width: 100%;
  height: 100%;
  display: block;
}
.banner-indicator {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 12rpx;
  display: flex;
  justify-content: center;
  align-items: center;
}
.banner-dot {
  width: 8rpx;
  height: 8rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.5);
  margin: 0 8rpx;
}
.banner-dot--active {
  background: #fff;
}

/* 五个入口（对齐原站实测：容器 padding 16px/12px/4px，项高96rpx，icon 44x42rpx） */
.entries-box {
  padding: 16px 12px 4px;
}
.entry-item {
  width: 141rpx;
}
.entry-icon {
  width: 44rpx;
  height: 42rpx;
}
.entry-text {
  margin-top: 12px;
  font-size: 12px;
  color: #3f3f3f;
}

/* 数字艺术区（原站实测 padding 12px 12px 0） */
.art-box {
  padding: 12px 12px 0;
}
.art-left {
  flex: 1;
  margin-right: 16rpx;
  min-width: 0;
}
.art-title-row {
  margin-bottom: 20rpx;
}
.art-title {
  font-size: 32rpx;
  color: #1a2438;
}
.art-more {
  margin-left: 16rpx;
  font-size: 24rpx;
  color: #999;
}
.art-more-arrow {
  margin-left: 4rpx;
}
.art-goods {
  min-height: 202rpx;
}
.art-goods-img {
  width: 202rpx;
  height: 202rpx;
  border-radius: 16rpx;
  flex-shrink: 0;
}
.art-goods-info {
  margin-left: 20rpx;
  flex: 1;
  min-width: 0;
  height: 202rpx;
}
.art-goods-name {
  font-size: 26rpx;
  color: #3f3f3f;
}
.art-goods-price {
  font-size: 28rpx;
  color: #3f3f3f;
}
.art-author-avatar {
  width: 49rpx;
  height: 49rpx;
  border-radius: 50%;
  overflow: hidden;
}
.art-author-img {
  width: 49rpx;
  height: 49rpx;
}
.art-author-name {
  margin-left: 16rpx;
  font-size: 22rpx;
  color: #a8a8a8;
}
.art-empty {
  height: 200rpx;
  background: #f7f7f7;
  border-radius: 20rpx;
}
.art-empty-text {
  font-size: 26rpx;
  color: #999;
}
.art-right {
  width: 204rpx;
  flex-shrink: 0;
}
.art-side-img {
  width: 204rpx;
  height: 124rpx;
  border-radius: 16rpx;
}
.art-side-img--first {
  margin-bottom: 16rpx;
}

/* 公告栏 */
.notice-box {
  padding: 24px 12px;
  border-bottom: 1px solid #f3f3f3;
}
.notice-logo {
  width: 36rpx;
  height: 36rpx;
  border-radius: 50%;
  flex-shrink: 0;
  overflow: hidden;
}
.notice-logo-img {
  width: 36rpx;
  height: 36rpx;
}
.notice-bar-wrap {
  flex: 1;
  margin: 0 16rpx;
  min-width: 0;
  overflow: hidden;
}
.u-notice {
  flex: 1;
  overflow: hidden;
  padding: 9px 12rpx;
}
.u-notice__swiper {
  transition: transform 0.5s ease;
}
.u-notice__swiper-item {
  height: 32rpx;
  line-height: 32rpx;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.u-notice__swiper-text {
  font-size: 24rpx;
  color: #555555;
}
.notice-more {
  font-size: 22rpx;
  color: #999;
  flex-shrink: 0;
}

/* 快捷链接 */
.quick-box {
  padding: 20px 12px 23px;
  overflow: hidden;
}
.quick-swiper {
  display: flex;
  height: 140rpx;
  transition: transform 0.3s ease;
}
.quick-page {
  width: 100%;
  flex-shrink: 0;
  align-content: flex-start;
}
.quick-item {
  width: 33.33%;
  margin-bottom: 28rpx;
  box-sizing: border-box;
  padding-right: 8rpx;
}
.quick-icon-box {
  width: 47rpx;
  height: 47rpx;
  background: #f6f8f8;
  border-radius: 10rpx;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.quick-icon {
  width: 28rpx;
  height: 28rpx;
}
.quick-text {
  margin-left: 18rpx;
  font-size: 24rpx;
  color: #3f3f3f;
  flex: 1;
  min-width: 0;
}
.quick-dots {
  margin-top: 4rpx;
}
.quick-dot {
  width: 10rpx;
  height: 10rpx;
  border-radius: 10rpx;
  margin: 0 6rpx;
  background: #d8d8d8;
}
.quick-dot--active {
  width: 16rpx;
  background: #3d3d3d;
}

/* 分类 tabs */
.category-box {
  padding: 16rpx 24rpx 0;
}
.category-scroll {
  white-space: nowrap;
  width: 100%;
}
.category-scroll-inner {
  padding-bottom: 16rpx;
}
.category-tab {
  margin-right: 40rpx;
  display: inline-flex;
}
.category-tab--last {
  margin-right: 0;
}
.category-tab-text {
  font-size: 28rpx;
  color: #666666;
}
.category-tab-text.MiSans-Demibold {
  color: #333333;
}
.category-tab-line {
  width: 24rpx;
  height: 6rpx;
  margin-top: 8rpx;
  border-radius: 4rpx;
  background: transparent;
}
.category-tab-line--active {
  background: #333333;
}

/* 商品列表 */
.goods-list {
  margin-top: 8rpx;
}
.goods-item {
  width: 340rpx;
  margin-bottom: 28rpx;
}
.goods-img {
  width: 340rpx;
  height: 340rpx;
  border-radius: 20rpx;
  background: #000;
  display: block;
}
.goods-name {
  display: block;
  margin-top: 16rpx;
  font-size: 28rpx;
  color: #1a2438;
}
.goods-price {
  display: block;
  margin-top: 8rpx;
  font-size: 28rpx;
  color: #1a2438;
}


/* uni-image mode 行为映射 */
.banner-img { object-fit: cover; }
.entry-icon { object-fit: contain; }
.art-goods-img { object-fit: cover; }
.art-author-img { object-fit: cover; }
.art-side-img { object-fit: cover; }
.notice-logo-img { object-fit: cover; }
.quick-icon { object-fit: contain; }
.goods-img { object-fit: cover; }
.empty-img { object-fit: contain; }

/* 空状态 */
.empty-box {
  margin-top: 41px;
}
.empty-img {
  width: 171px;
  height: 120px;
}
.empty-text {
  color: #999999;
  font-size: 26rpx;
  margin-top: 12rpx;
}

/* 底部下载提示条 */
.suspend-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 43px;
  padding: 0 13px;
  background: rgba(0, 0, 0, 0.3);
  z-index: 999;
}
.suspend-text {
  color: #000;
  font-size: 14px;
}
.suspend-btn {
  min-width: 62px;
  height: 26px;
  line-height: 26px;
  text-align: center;
  border-radius: 20px;
  background: linear-gradient(-90deg, #f6c588, #ffebc7);
  color: #000;
  font-size: 12px;
}
.suspend-close {
  margin-left: 10px;
  width: 14px;
  height: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #4a4a4a;
}
.suspend-close-svg {
  width: 12px;
  height: 12px;
  display: block;
}
</style>
