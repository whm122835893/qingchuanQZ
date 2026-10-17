<template>
  <view class="kline-info-page">
    <!-- 深色行情导航 -->
    <KlineDarkNavbar title="详情" action-text="切换购买" @back="goBack" @action="toBuy" />

    <!-- 原站 w-swiper 行情图轮播，此处用 CSS 网格绘制占位走势 -->
    <view class="chart-box mlr-26 mt-16">
      <view class="chart-grid"></view>
      <view class="chart-line" :class="info.increase ? 'up' : 'down'"></view>
    </view>

    <!-- 价格信息卡 -->
    <view class="info-card mlr-26">
      <view class="name flex flex-ai-center flex-js-sb">
        <view class="flex flex-ai-center">
          <text class="name-main">{{ info.name || '--' }}</text>
          <text class="MiSans-Regular series">{{ info.series_name }}</text>
        </view>
        <view class="flex flex-ai-center">
          <text class="MiSans-Medium price">{{ info.price }}CNY</text>
          <text class="MiSans-Regular chg ml-10" :class="info.increase ? 'up' : 'down'">
            {{ info.change }}
          </text>
        </view>
      </view>

      <view class="num-grid">
        <view v-for="n in numItems" :key="n.label" class="num-item">
          <text class="MiSans-Regular num-label">{{ n.label }}</text>
          <text class="MiSans-Regular num-val">{{ n.value }}</text>
        </view>
      </view>
    </view>

    <!-- tab：买盘 / 卖盘 / 成交明细 -->
    <view class="tabs mlr-26">
      <view
        v-for="t in tabList"
        :key="t.name"
        class="tab-item flex flex-ai-center flex-js-center"
        :class="{ active: current === t.key }"
        @click="changeTab(t.key)"
      >
        <text class="MiSans-Medium tab-text">{{ t.name }}</text>
      </view>
    </view>

    <!-- 买卖盘 / 成交明细 -->
    <KlineOrderBook :current="current" :rows="currentRows" :deals="deals" />

    <!-- 底部操作 -->
    <view class="footer">
      <view class="btn-row flex">
        <view class="btn flex flex-ai-center flex-js-center" @click="onAlert">
          <text class="MiSans-Regular btn-text">开启行情提醒</text>
        </view>
        <view class="btn flex flex-ai-center flex-js-center" @click="toBatch">
          <text class="MiSans-Regular btn-text">批量买卖</text>
        </view>
        <view class="btn flex flex-ai-center flex-js-center" @click="onFollow">
          <text class="MiSans-Medium btn-text">{{ followed ? '已关注' : '关注' }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
/**
 * 原站 kline/info —— K线详情页
 * 深色行情页：走势图 + 名称/价格/涨跌 + 六项数值 + 买盘/卖盘/成交明细三 tab + 底部三按钮。
 */
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import KlineDarkNavbar from '@/components/KlineDarkNavbar.vue'
import KlineOrderBook from '@/components/KlineOrderBook.vue'
import { fetchKlineInfo } from '@/utils/api'

defineOptions({ name: 'KlineInfoPage' })

const router = useRouter()
const info = ref({})
const current = ref('bid')
const followed = ref(false)

const tabList = [
  { name: '买盘', key: 'bid' },
  { name: '卖盘', key: 'ask' },
  { name: '成交明细', key: 'deal' },
]

const numItems = computed(() => {
  const n = info.value.num || {}
  return [
    { label: '流通：', value: n.flux || '--' },
    { label: '最近5min成交量：', value: n.deal_5min || '--' },
    { label: '24h最高：', value: n.high_24h || '--' },
    { label: '最近1h成交量：', value: n.deal_1h || '--' },
    { label: '24h最低：', value: n.low_24h || '--' },
    { label: '今日成交量：', value: n.deal_today || '--' },
  ]
})

const asks = computed(() => info.value.asks || [])
const bids = computed(() => info.value.bids || [])
const deals = computed(() => info.value.deals || [])
const currentRows = computed(() => (current.value === 'bid' ? bids.value : asks.value))

function goBack() {
  if (window.history.length > 1) router.back()
  else router.push('/pages/index/index')
}
function changeTab(key) {
  current.value = key
}
function toBuy() {
  router.push('/pages/kline/buy')
}
function toBatch() {
  router.push('/pages/market/batchPay')
}
function onFollow() {
  followed.value = !followed.value
  uni.showToast({ title: followed.value ? '已关注' : '已取消关注', icon: 'none' })
}
function onAlert() {
  uni.showToast({ title: '原站开启行情提醒需APP端权限', icon: 'none' })
}

onMounted(async () => {
  info.value = await fetchKlineInfo()
})
</script>

<style scoped>
@import '@/styles/atomic.css';

.kline-info-page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: #232744;
  padding-bottom: 140rpx;
  box-sizing: border-box;
}
.mlr-26 {
  margin-left: 26rpx;
  margin-right: 26rpx;
}
.mt-16 {
  margin-top: 16rpx;
}
.chart-box {
  position: relative;
  height: 400rpx;
  background: #1b1f38;
  border-radius: 8rpx;
  overflow: hidden;
  flex-shrink: 0;
}
.chart-grid {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(transparent 96%, rgba(255, 255, 255, 0.06) 96%),
    linear-gradient(90deg, transparent 96%, rgba(255, 255, 255, 0.06) 96%);
  background-size: 100% 80rpx, 62rpx 100%;
}
.chart-line {
  position: absolute;
  left: 0;
  right: 0;
  top: 55%;
  height: 4rpx;
}
.chart-line.up {
  background: #3ad32a;
}
.chart-line.down {
  background: #f0554e;
}
.info-card {
  margin-top: 16rpx;
  padding: 24rpx;
  background: #2b3050;
  border-radius: 8rpx;
}
.name-main {
  font-size: 32rpx;
  color: #fff;
}
.series {
  margin-left: 20rpx;
  margin-top: 4rpx;
  font-size: 24rpx;
  color: #8a90a8;
}
.price {
  font-size: 32rpx;
  color: #fff;
}
.chg {
  margin-top: 4rpx;
  font-size: 24rpx;
}
.up {
  color: #3ad32a;
}
.down {
  color: #f0554e;
}
.num-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16rpx 12rpx;
  margin-top: 24rpx;
}
.num-item {
  display: flex;
  flex-direction: column;
}
.num-label {
  font-size: 20rpx;
  color: #8a90a8;
}
.num-val {
  margin-top: 6rpx;
  font-size: 24rpx;
  color: #e8eaf0;
}
.tabs {
  display: flex;
  margin-top: 16rpx;
  height: 80rpx;
  flex-shrink: 0;
}
.tab-item {
  flex: 1;
  position: relative;
}
.tab-text {
  font-size: 26rpx;
  color: #8a90a8;
}
.tab-item.active .tab-text {
  color: #fff;
}
.tab-item.active::after {
  content: '';
  position: absolute;
  left: 50%;
  bottom: 8rpx;
  width: 70rpx;
  height: 5rpx;
  border-radius: 3rpx;
  background: #fff;
  transform: translateX(-50%);
}
.footer {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 16rpx 26rpx calc(28rpx + env(safe-area-inset-bottom));
  background: #232744;
}
.btn-row {
  gap: 16rpx;
}
.btn {
  flex: 1;
  height: 84rpx;
  border-radius: 42rpx;
  background: #2b3050;
}
.btn-text {
  font-size: 26rpx;
  color: #e8eaf0;
}
</style>