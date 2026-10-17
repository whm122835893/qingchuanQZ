<template>
  <view
    class="goods-list-page"
    :style="{ backgroundImage: `url(${asset('static/detail/bg.png')})` }"
  >
    <!-- 导航 -->
    <view class="navbar plr-16 flex flex-ai-center">
      <view class="back-btn flex flex-ai-center flex-js-center" @click="goBack">
        <img :src="asset('static/common/back_default.png')" mode="widthFix" />
      </view>
      <text class="navbar-title">专辑列表</text>
      <img
        class="nav-like"
        :src="product.is_like ? asset('static/detail/like_select.png') : asset('static/detail/like_defult.png')"
        mode="aspectFit"
        @click="targetLike"
      />
    </view>

    <MarketGoodsHeader
      :product="product"
      :main-img="mainImg"
      :tabs="tabs"
      :tab-current="tabCurrent"
      @brand="goBrand"
      @mine="goMine"
      @notice="showNotice = true"
      @tab="onTabChange"
    />

    <MarketDealPanel
      v-if="tabCurrent === 3"
      :info="dealInfo"
      :prices="tradePrices"
      :sub-tab="dealSubTab"
      @sub="dealSubTab = $event"
    />

    <MarketGoodsItems
      v-if="!(tabCurrent === 3 && dealSubTab === 1)"
      :list="curList"
      :tab-current="tabCurrent"
      @to-detail="toDetails"
    />

    <!-- 底部操作条 -->
    <view v-if="tabCurrent !== 3" class="action-bar flex flex-js-sb flex-ai-center">
      <template v-if="tabCurrent === 0">
        <view
          v-if="product.batch_pay && curList.length"
          class="act-btn gray flex flex-ai-center flex-js-center"
          @click="goBatch"
        >
          <text class="MiSans-Medium act-text dark">批量购买</text>
        </view>
        <view
          class="act-btn green flex flex-ai-center flex-js-center"
          :class="{ full: !(product.batch_pay && curList.length) }"
          @click="showCreate = true"
        >
          <text class="MiSans-Demibold act-text">快捷下单</text>
        </view>
      </template>
      <template v-else-if="tabCurrent === 1">
        <view class="act-btn gray flex flex-ai-center flex-js-center" @click="toMyEntrust">
          <text class="MiSans-Medium act-text dark">我的委托</text>
        </view>
        <view class="act-btn green flex flex-ai-center flex-js-center" @click="toEntrust">
          <text class="MiSans-Demibold act-text">立即委托</text>
        </view>
      </template>
      <template v-else>
        <view class="act-btn gray flex flex-ai-center flex-js-center" @click="toMyBeg">
          <text class="MiSans-Medium act-text dark">我的求购</text>
        </view>
        <view class="act-btn green flex flex-ai-center flex-js-center" @click="toBeg">
          <text class="MiSans-Demibold act-text">立即求购</text>
        </view>
      </template>
    </view>

    <MarketGoodsSheets
      v-model:show-create="showCreate"
      v-model:show-notice="showNotice"
      :pay-checked="payChecked"
      :product="product"
      :main-img="mainImg"
      :floor-price-text="floorPriceText"
      :notice-list="noticeList"
      @toggle-pay="payChecked = !payChecked"
      @submit="onFastSubmit"
      @notice-click="goNotice"
    />
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { fetchSeriesGoodsList, fetchAfficheList, asset } from '@/utils/api'
import { ossImg } from '@/api'
import MarketGoodsHeader from '@/components/MarketGoodsHeader.vue'
import MarketGoodsItems from '@/components/MarketGoodsItems.vue'
import MarketDealPanel from '@/components/MarketDealPanel.vue'
import MarketGoodsSheets from '@/components/MarketGoodsSheets.vue'

// tab 顺序与文案严格对齐源站：寄售 / 委托 / 求购 / 当前成交
// hot 角标渲染在当前选中项上（见 MarketGoodsHeader）
// key 含义：0=寄售 1=委托 2=求购 3=当前成交
const TABS = [
  { name: '寄售', key: 0 },
  { name: '委托', key: 1 },
  { name: '求购', key: 2 },
  { name: '当前成交', key: 3 },
]

const route = useRoute()
const router = useRouter()
const detail = ref({ product: {}, data: [] })
const tabCurrent = ref(0)
const dealSubTab = ref(0)
const showCreate = ref(false)
const showNotice = ref(false)
const payChecked = ref(true)
const noticeList = ref([])
const tabs = TABS

const product = computed(() => detail.value.product || {})
const mainImg = computed(() => {
  const src = product.value.listimg || ''
  return src ? ossImg(src) : asset('static/collection/top_bg.png')
})
const firstPrice = computed(() => {
  const l = detail.value.data || []
  return l.length ? l[0].min_price : 0
})
const floorPriceText = computed(() =>
  Number(product.value.min_price || firstPrice.value || 0).toFixed(2)
)
const dealInfo = computed(() => (detail.value.data || [])[0] || {})
const tradePrices = computed(() => {
  if (dealSubTab.value !== 1) return []
  const l = (detail.value.data || [])[0]
  return ((l && l.trade_list) || []).map((t) => Number(t.price || 0))
})
const curList = computed(() => {
  const l = detail.value.data || []
  if (tabCurrent.value === 3) return (l[0] && l[0].trade_list) || []
  return l
})

function onTabChange(k) {
  tabCurrent.value = k
  dealSubTab.value = 0
}
function targetLike() {
  product.value.is_like = product.value.is_like ? 0 : 1
  uni.showToast({ title: product.value.is_like ? '已收藏' : '已取消收藏' })
}
function goBack() {
  if (window.history.length > 1) router.back()
  else router.push('/pages/market/market')
}
function goBrand() {
  router.push('/pages/market/categoryManager')
}
function goMine() {
  router.push('/pages/myCollection/myCollection')
}
function toDetails(t) {
  router.push(`/pages/market/detail?id=${t.id}`)
}
function goBatch() {
  router.push('/pages/market/batchPay')
}
function toMyBeg() {
  router.push('/pages/order/beg/list')
}
function toBeg() {
  router.push('/pages/market/submitBegBuy')
}
function toMyEntrust() {
  router.push('/pages/order/entrust/list')
}
function toEntrust() {
  router.push('/pages/market/submitEntrust')
}
function onFastSubmit() {
  if (!payChecked.value) return
  showCreate.value = false
  uni.showToast({ title: '下单成功' })
}
function goNotice(n) {
  router.push(`/pages/notice/noticeDetails?id=${n.id}`)
}

async function init() {
  // 源站实测 URL：#/pages/market/marketGoodsList?id=236&goodsType=2&minPrice=15
  // 接口：marketGoodsDetail {id, type} + getMarketGoodsListByGoodsId {page,sort,type,id}
  // 本地 mock 为 id=236 的真实快照，id 缺省时回落到该快照。
  const id = route.query.id || 236
  detail.value = await fetchSeriesGoodsList({ id, type: route.query.goodsType || 2 })
  noticeList.value = await fetchAfficheList({ page: 1, limit: 5 })
}
init()
</script>

<style scoped>
@import '@/styles/atomic.css';
.goods-list-page {
  min-height: 100vh;
  background-color: #fff;
  background-repeat: no-repeat;
  background-position: top;
  background-size: 100% 430rpx;
  padding-bottom: 140rpx;
}
/* 源站量测：navbar 高 44px */
.navbar {
  height: 85rpx;
}
.back-btn {
  width: 56rpx;
  height: 56rpx;
  border-radius: 50%;
  background: rgba(244, 244, 244, 0.5);
}
.back-btn img {
  width: 26rpx;
}
.navbar-title {
  flex: 1;
  margin-left: 16rpx;
  font-family: MiSans-Demibold, MiSans, sans-serif;
  font-size: 34rpx;
  color: #1a2438;
}
.nav-like {
  width: 44rpx;
  height: 44rpx;
}
.action-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 20;
  gap: 15rpx;
  /* 源站量测：padding 8px 14px、总高 61px */
  padding: 15rpx 27rpx;
  background: #fff;
  box-shadow: 0 -8rpx 16rpx rgba(0, 0, 0, 0.04);
}
.act-btn {
  /* 源站量测：单按钮 362x45、圆角 6px、底色 #6aa27b */
  flex: 1;
  height: 87rpx;
  border-radius: 12rpx;
}
.act-btn.full {
  flex: none;
  width: 100%;
}
.act-btn.gray {
  background: #f3f6f8;
}
.act-btn.green {
  background: #6aa27b;
}
.act-text {
  font-size: 30rpx;
  color: #fff;
}
.act-text.dark {
  color: #1a2438;
}
</style>