<template>
  <view class="rule-page">
    <view class="navbar flex flex-ai-center">
      <view class="back-btn flex flex-ai-center flex-js-center" @click="goBack">
        <img :src="asset('static/common/back_default.png')" mode="widthFix" />
      </view>
      <text class="MiSans-Demibold navbar-title">购买规则</text>
    </view>

    <view class="mobile-rules">
      <!-- 概要卡片 -->
      <view class="info-card">
        <view class="info-item">
          <text class="info-label">商品名称</text>
          <text class="info-value">{{ info.name || '--' }}</text>
        </view>
        <view class="info-item">
          <text class="info-label">盲盒价格</text>
          <text class="info-value">¥{{ info.price || '0.00' }}</text>
        </view>
        <view class="info-item">
          <text class="info-label">发行总量</text>
          <text class="info-value">{{ info.total_num || 0 }} 份</text>
        </view>
        <view class="info-item">
          <text class="info-label">已售出</text>
          <text class="info-value">{{ info.sale_num || 0 }} 份</text>
        </view>
        <view class="info-item">
          <text class="info-label">规则更新</text>
          <text class="info-value">{{ info.rule_updated || '--' }}</text>
        </view>
      </view>

      <!-- 规则条目 -->
      <view
        v-for="(r, i) in info.rules || []"
        :key="i"
        class="rule-section"
      >
        <text class="section-title">{{ r.title }}</text>
        <view
          v-for="(line, j) in r.lines"
          :key="j"
          class="rule-item"
          :class="{ highlight: isHighlight(r, line), refund: isRefund(line) }"
        >
          <view class="rule-icon flex-center">
            <text class="MiSans-Medium icon-text">{{ i + 1 }}.{{ j + 1 }}</text>
          </view>
          <view class="rule-body">
            <text class="rule-line" :class="lineClass(line)">{{ line }}</text>
          </view>
        </view>
      </view>

      <view class="tip">
        <text class="MiSans-Regular tip-text">
          本商品为在线数字化商品，一经出售不支持七天无理由退换货；未满 18 周岁人群禁止购买。
        </text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { fetchProductRule, asset } from '@/utils/api'

const route = useRoute()
const router = useRouter()
const info = ref({})

const EMPHASIZE = ['重要', '特别提醒', '注意']
const REFUND = ['不支持七天无理由', '不予退']

function isHighlight(r, line) {
  return EMPHASIZE.some((k) => r.title.includes(k))
}
function isRefund(line) {
  return REFUND.some((k) => line.includes(k))
}
function lineClass(line) {
  if (line.includes('：') || line.includes(':')) return 'emphasize'
  return ''
}

function goBack() {
  if (window.history.length > 1) router.back()
  else router.push('/')
}

async function init() {
  const data = await fetchProductRule({ id: route.query.id || 226 })
  if (data && data.rules) info.value = data
}
init()
</script>

<style scoped>
@import '@/styles/atomic.css';
.rule-page {
  min-height: 100vh;
  background: #f8f9fa;
}
.navbar {
  height: 88rpx;
  padding: 0 16rpx;
  background: #fff;
}
.back-btn {
  width: 56rpx;
  height: 56rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.55);
}
.back-btn img {
  width: 17rpx;
}
.navbar-title {
  font-size: 32rpx;
  color: #000;
}
.mobile-rules-container {
  padding: 24rpx;
}
/* 原站此处为紫色渐变卡，按 P0 规范改为品牌纯色 */
.info-card {
  padding: 32rpx;
  margin-bottom: 32rpx;
  border-radius: 16rpx;
  background: #1a2438;
  color: #fff;
}
.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 0;
  border-bottom: 1rpx solid rgba(255, 255, 255, 0.1);
}
.info-item:last-child {
  border-bottom: none;
}
.info-label {
  font-size: 28rpx;
  opacity: 0.9;
}
.info-value {
  font-size: 32rpx;
  font-weight: 600;
  text-align: right;
}
.rule-section {
  padding: 32rpx;
  margin-bottom: 32rpx;
  border: 1rpx solid #f0f0f0;
  border-radius: 16rpx;
  background: #fff;
}
.section-title {
  display: block;
  padding-bottom: 24rpx;
  margin-bottom: 8rpx;
  border-bottom: 4rpx solid #f0f0f0;
  font-size: 36rpx;
  font-weight: 700;
  color: #1a2438;
}
.rule-item {
  display: flex;
  align-items: flex-start;
  padding: 28rpx 0;
  border-bottom: 1rpx solid #f5f5f5;
}
.rule-item:last-child {
  border-bottom: none;
}
.rule-item.highlight {
  margin: 24rpx -16rpx 0;
  padding: 32rpx 16rpx;
  border-left: 8rpx solid #1a2438;
  border-radius: 12rpx;
  background: #f0f2f5;
}
.rule-icon {
  width: 48rpx;
  height: 48rpx;
  margin-right: 24rpx;
  border-radius: 8rpx;
  background: #f4f6fa;
  flex-shrink: 0;
}
.icon-text {
  font-size: 20rpx;
  color: #999;
}
.rule-body {
  flex: 1;
}
.rule-line {
  font-size: 28rpx;
  line-height: 44rpx;
  color: #333;
}
.rule-line.emphasize {
  color: #1a2438;
  font-weight: 700;
}
.rule-item.refund .rule-line {
  color: #3f7d58;
  font-weight: 700;
}
.tip {
  padding: 24rpx;
  border-radius: 12rpx;
  background: #fff;
}
.tip-text {
  font-size: 24rpx;
  line-height: 40rpx;
  color: #666;
}
</style>