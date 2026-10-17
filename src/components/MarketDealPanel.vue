<template>
  <view class="deal-wrap">
    <!-- 成交统计面板（原站 deal-panel） -->
    <view v-if="subTab === 0" class="deal-panel">
      <view class="deal-floor flex flex-js-sb flex-ai-center">
        <text class="MiSans-Regular deal-floor-label">当前地板价</text>
        <text class="MiSans-Demibold deal-floor-price">{{ floorPriceText }}</text>
      </view>
      <view class="deal-grid">
        <view class="deal-col">
          <view class="deal-row flex flex-ai-center">
            <view class="tag-hi flex flex-ai-center flex-js-center">
              <text class="MiSans-Regular tag-text">今日最高</text>
            </view>
            <text class="MiSans-Demibold deal-val">¥{{ stat('today_highest_price') }}</text>
          </view>
          <view class="deal-row flex flex-ai-center">
            <view class="tag-lo flex flex-ai-center flex-js-center">
              <text class="MiSans-Regular tag-text">今日最低</text>
            </view>
            <text class="MiSans-Demibold deal-val">¥{{ stat('today_lowest_price') }}</text>
          </view>
        </view>
        <view class="deal-col">
          <view class="deal-row flex flex-ai-center">
            <view class="tag-outline flex flex-ai-center flex-js-center">
              <text class="MiSans-Regular tag-text">今日成交</text>
            </view>
            <text class="MiSans-Demibold deal-val">{{ info.today_volume || 0 }} 笔</text>
          </view>
          <view class="deal-row flex flex-ai-center">
            <view class="tag-outline flex flex-ai-center flex-js-center">
              <text class="MiSans-Regular tag-text">小时成交</text>
            </view>
            <text class="MiSans-Demibold deal-val">{{ stat('hour_volume') }} 笔</text>
          </view>
        </view>
      </view>
      <view class="deal-sub flex flex-ai-center">
        <view class="deal-sub-item" :class="{ on: subTab === 0 }" @click="$emit('sub', 0)">
          <text class="MiSans-Medium sub-text">实时成交</text>
        </view>
        <view class="deal-sub-item" :class="{ on: subTab === 1 }" @click="$emit('sub', 1)">
          <text class="MiSans-Medium sub-text">行情趋势</text>
        </view>
      </view>
    </view>

    <!-- 行情趋势（原站 u-canvas 折线） -->
    <view v-if="subTab === 1" class="trend-box">
      <template v-if="points.length > 1">
        <view class="trend-canvas">
          <svg viewBox="0 0 300 90" preserveAspectRatio="none" width="100%" height="180rpx">
            <polyline
              :points="points"
              fill="none"
              stroke="#6aa27b"
              stroke-width="2"
              vector-effect="non-scaling-stroke"
            />
          </svg>
        </view>
        <view class="trend-meta flex flex-js-sb">
          <text class="MiSans-Regular meta-text">近 {{ prices.length }} 笔成交</text>
          <text class="MiSans-Regular meta-text"
            >最低 ¥{{ min.toFixed(2) }} / 最高 ¥{{ max.toFixed(2) }}</text
          >
        </view>
      </template>
      <view v-else class="empty-box flex flex-dir-col flex-ai-center">
        <text class="MiSans-Regular empty-text">暂无成交数据</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  info: { type: Object, default: () => ({}) },
  prices: { type: Array, default: () => [] },
  subTab: { type: Number, default: 0 },
})
defineEmits(['sub'])

const stat = (k) => {
  const c = props.info && props.info.consignment
  const v = c ? c[k] : 0
  return Number(v || 0).toFixed(2)
}
const floorPriceText = computed(() =>
  Number((props.info && props.info.min_price) || 0).toFixed(2)
)
const min = computed(() => Math.min(...props.prices, 0))
const max = computed(() => Math.max(...props.prices, 0))
const points = computed(() => {
  const p = props.prices
  if (p.length < 2) return ''
  const lo = min.value
  const hi = max.value
  const span = hi - lo || 1
  return p
    .map((v, i) => `${((i / (p.length - 1)) * 300).toFixed(1)},${(88 - ((v - lo) / span) * 80).toFixed(1)}`)
    .join(' ')
})
</script>

<style scoped>
@import '@/styles/atomic.css';
.deal-panel {
  margin: 18rpx 21rpx 0;
  padding: 0 18rpx;
  border-radius: 12rpx 12rpx 0 0;
  background: #fff;
}
.deal-floor {
  height: 52rpx;
}
.deal-floor-label {
  font-size: 20rpx;
  color: #1a2438;
}
.deal-floor-price {
  font-size: 24rpx;
  color: #e54d42;
}
.deal-grid {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  margin-top: 15rpx;
  padding: 18rpx 44rpx;
  background: #f3f6f8;
}
.deal-col {
  flex: 1;
  min-width: 0;
}
.deal-col + .deal-col {
  margin-left: 24rpx;
}
.deal-row {
  margin-bottom: 14rpx;
}
.tag-hi,
.tag-lo,
.tag-outline {
  width: 84rpx;
  height: 30rpx;
  border-radius: 5rpx;
  font-size: 15rpx;
  flex-shrink: 0;
  box-sizing: border-box;
}
.tag-hi {
  background: #ff0016;
}
.tag-lo {
  background: #4cd964;
}
.tag-outline {
  border: 1rpx solid #333;
  background: #fff;
}
.tag-text {
  font-size: 15rpx;
  color: #333;
}
.tag-hi .tag-text,
.tag-lo .tag-text {
  color: #fff;
}
.deal-val {
  margin-left: 33rpx;
  font-size: 20rpx;
  color: #1a2438;
}
.deal-sub {
  padding: 12rpx 18rpx;
}
.deal-sub-item {
  padding: 8rpx 21rpx;
  margin-right: 12rpx;
  border-radius: 21rpx;
}
.sub-text {
  font-size: 20rpx;
  color: #666;
}
.deal-sub-item.on {
  background: #e8f2e0;
}
.deal-sub-item.on .sub-text {
  color: #5a9a45;
}
.trend-box {
  margin: 18rpx 21rpx 0;
  padding: 18rpx 21rpx 30rpx;
  border-radius: 12rpx;
  background: #fff;
}
.trend-canvas {
  width: 100%;
  border-radius: 12rpx;
  background: #fff;
}
.trend-meta {
  margin-top: 12rpx;
  padding: 0 3rpx;
}
.meta-text {
  font-size: 22rpx;
  color: #999;
}
.empty-box {
  padding: 45rpx 0 30rpx;
}
.empty-text {
  font-size: 24rpx;
  color: #999;
}
</style>