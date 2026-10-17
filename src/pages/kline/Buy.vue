<template>
  <view class="kline-buy">
    <!-- 导航 -->
    <view class="tnav" style="background: #232744">
      <view class="tnav-left" @click="goBack">
        <img class="back-white" :src="asset('static/common/back_white.png')" mode="widthFix" />
      </view>
      <text class="tnav-title" style="color: #fff">购买</text>
      <view class="tnav-right" @click="toInfo">
        <text class="MiSans-Regular right-text">切换行情</text>
      </view>
    </view>

    <!-- K线图占位（w-swiper 区域，原站为 swiper 轮播图） -->
    <view class="mlr-16 swiper-box">
      <view class="swiper-inner"></view>
    </view>

    <!-- 行情头部 -->
    <view class="ptb-12 flex flex-js-sb flex-ai-center plr-16">
      <view class="flex flex-ai-center">
        <text class="name">凤吹晚霞</text>
        <text class="brand MiSans-Regular ml-14">青川数字艺术</text>
      </view>
      <view class="flex flex-ai-center price-wrap" :class="info.increase ? 'down-color' : 'up-color'">
        <text class="chg MiSans-Regular">3.21%</text>
        <text class="price">112.34CNY</text>
      </view>
    </view>

    <!-- 分时 / K线 tab -->
    <view class="plr-16">
      <view class="tabs flex gap-12">
        <view
          v-for="t in tabs"
          :key="t.type"
          class="tabs-item"
          :class="{ active: t.type === tabType }"
          @click="changeType(t)"
        >
          <text> {{ t.name }} </text>
        </view>
      </view>

      <view class="chart-area"></view>

      <!-- 委托挂单 -->
      <view class="order-book">
        <view class="ob-head">
          <text class="ob-cell">价格</text>
          <text class="ob-cell">数量</text>
          <text class="ob-cell">合计</text>
        </view>
        <view v-for="(r, i) in asks" :key="'a' + i" class="ob-row">
          <text class="ob-cell price-sell">{{ r.price }}</text>
          <text class="ob-cell">{{ r.num }}</text>
          <text class="ob-cell">{{ r.total }}</text>
        </view>
        <view class="ob-mid">
          <text class="mid-price">112.34</text>
          <text class="mid-label">最新价</text>
        </view>
        <view v-for="(r, i) in bids" :key="'b' + i" class="ob-row">
          <text class="ob-cell price-buy">{{ r.price }}</text>
          <text class="ob-cell">{{ r.num }}</text>
          <text class="ob-cell">{{ r.total }}</text>
        </view>
      </view>

      <!-- 买入/卖出 -->
      <view class="trade-btns">
        <view class="trade-btn buy" @click="toSubmit">
          <text class="trade-btn-text">买入</text>
        </view>
        <view class="trade-btn sell" @click="toSubmit">
          <text class="trade-btn-text">卖出</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { asset } from '@/utils/api'

const router = useRouter()

const tabType = ref('1')
const info = ref({ increase: '+3.21' })

const tabs = [
  { name: '分时', type: '1' },
  { name: '1日', type: '2' },
  { name: '1周', type: '3' },
  { name: '1月', type: '4' },
  { name: '3月', type: '5' },
  { name: '1年', type: '6' },
]

const asks = [
  { price: '112.60', num: '12', total: '1351.20' },
  { price: '112.50', num: '8', total: '900.00' },
  { price: '112.45', num: '23', total: '2586.35' },
]
const bids = [
  { price: '112.30', num: '15', total: '1684.50' },
  { price: '112.20', num: '6', total: '673.20' },
  { price: '112.10', num: '31', total: '3475.10' },
]

function goBack() {
  if (window.history.length > 1) router.back()
  else router.push('/pages/market/market')
}
function toInfo() {
  router.push('/pages/kline/info')
}
function changeType(t) {
  tabType.value = t.type
}
function toSubmit() {
  router.push({ path: '/pages/market/detail', query: { id: 226 } })
}
</script>

<style scoped>
@import '@/styles/atomic.css';

.kline-buy {
  min-height: 100vh;
  background-color: #000;
  padding-bottom: calc(40rpx + env(safe-area-inset-bottom));
  box-sizing: border-box;
}
.tnav-title {
  color: #fff;
}
.back-white {
  width: 34rpx;
}
.right-text {
  font-size: 24rpx;
  color: #fff;
}
.mlr-16 {
  margin-left: 32rpx;
  margin-right: 32rpx;
}
.swiper-box {
  height: 420rpx;
  background: #171a2c;
  border-radius: 12rpx;
}
.swiper-inner {
  width: 100%;
  height: 100%;
  background:
    linear-gradient(transparent 96%, rgba(255, 255, 255, 0.06) 96%),
    linear-gradient(90deg, transparent 96%, rgba(255, 255, 255, 0.06) 96%);
  background-size: 100% 84rpx, 60rpx 100%;
}
.name {
  font-size: 36rpx;
  font-weight: 600;
  color: #fff;
}
.brand {
  font-size: 24rpx;
  color: #7a7a7a;
  margin-left: 28rpx;
}
.up-color {
  color: #3ad32a;
}
.down-color {
  color: #ff8c05;
}
.chg {
  font-size: 24rpx;
  margin-right: 14rpx;
}
.price {
  font-size: 40rpx;
}
.tabs {
  margin-top: 30rpx;
}
.tabs-item {
  font-size: 26rpx;
  color: #7a7a7a;
  line-height: 64rpx;
  padding: 0 20rpx;
}
.tabs-item.active {
  color: #fff;
  border-bottom: 3rpx solid #e3a86a;
}
.chart-area {
  height: 460rpx;
  margin-top: 24rpx;
  background:
    linear-gradient(transparent 96%, rgba(255, 255, 255, 0.06) 96%),
    linear-gradient(90deg, transparent 96%, rgba(255, 255, 255, 0.06) 96%);
  background-size: 100% 92rpx, 52rpx 100%;
}
.order-book {
  margin-top: 32rpx;
}
.ob-head,
.ob-row {
  display: flex;
  align-items: center;
  padding: 12rpx 0;
}
.ob-head .ob-cell {
  font-size: 22rpx;
  color: #7a7a7a;
}
.ob-cell {
  flex: 1;
  text-align: center;
  font-size: 24rpx;
  color: #bbb;
}
.price-sell {
  color: #ff8c05;
}
.price-buy {
  color: #3ad32a;
}
.ob-mid {
  display: flex;
  align-items: center;
  padding: 16rpx 0;
}
.mid-price {
  font-size: 40rpx;
  color: #3ad32a;
  font-weight: 700;
}
.mid-label {
  margin-left: 16rpx;
  font-size: 22rpx;
  color: #7a7a7a;
}
.trade-btns {
  display: flex;
  margin-top: 40rpx;
}
.trade-btn {
  flex: 1;
  height: 88rpx;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.trade-btn.buy {
  background: #3ad32a;
}
.trade-btn.sell {
  margin-left: 24rpx;
  background: #ff8c05;
}
.trade-btn-text {
  font-size: 30rpx;
  color: #fff;
  font-weight: 700;
}
</style>
