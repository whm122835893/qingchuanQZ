<template>
  <view class="master-rank-page">
    <!-- 原站导航为深色沉浸式（bgColor #1A1002，标题白字） -->
    <view class="tnav flex flex-ai-center">
      <view class="tnav-left" @click="goBack">
        <img class="tnav-back" :src="asset('static/common/back_white.png')" mode="widthFix" />
      </view>
      <text class="tnav-title">大师动态</text>
    </view>

    <view class="steps plr-32">
      <!-- 原站 u-steps 竖向时间轴：dot + desc 插槽 -->
      <view v-for="(m, i) in list" :key="m.id" class="step-item">
        <view class="step-dot"></view>
        <view v-if="i < list.length - 1" class="step-line"></view>

        <view class="step-desc">
          <view class="flex flex-ai-center">
            <img class="avatar" :src="avatarOf(m)" mode="aspectFill" />
            <text class="MiSans-Regular nick text-overflow flex-1">{{ m.nickname }}</text>
            <text class="MiSans-Regular time">{{ formatDate(m.createtime) }}</text>
          </view>

          <view class="goods flex flex-ai-center">
            <img class="goods-thumb" :src="ossImg(m.goods_cover_image)" mode="aspectFill" />
            <view class="goods-meta flex flex-dir-col flex-js-sb flex-1">
              <text class="MiSans-Regular goods-name text-overflow">{{ m.goods_name }}</text>
              <text class="MiSans-Regular goods-num">x{{ m.num }}</text>
            </view>
            <view class="buy-btn flex flex-ai-center flex-js-center" @click.stop="toBuy(m)">
              <text class="MiSans-Medium buy-btn-text">去购买</text>
            </view>
          </view>
        </view>
      </view>

      <view v-if="!list.length" class="empty-box">
        <text class="MiSans-Regular empty-text">暂无大师动态</text>
      </view>
    </view>
  </view>
</template>

<script setup>
/**
 * 原站 rank/masterRank —— 大师动态（藏家动态时间轴）
 * 深色底#1A1002 + 导航白字；u-steps 竖向时间轴，每条含头像/昵称/时间 + 藏品卡片 + 去购买。
 */
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { asset, fetchMasterRank } from '@/utils/api'
import { ossImg } from '@/api'

defineOptions({ name: 'MasterRankPage' })

const router = useRouter()
const list = ref([])

function goBack() {
  if (window.history.length > 1) router.back()
  else router.push('/pages/index/index')
}
function avatarOf(m) {
  return m.avatar ? ossImg(m.avatar) : ossImg(m.goods_cover_image)
}
function formatDate(ts) {
  if (!ts) return '--'
  if (typeof ts === 'string') return ts.slice(5, 16)
  const d = new Date(ts * 1000)
  const p = (n) => String(n).padStart(2, '0')
  return `${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}
function toBuy(m) {
  router.push({ path: '/pages/kline/buy', query: { id: m.goods_cover_image ? undefined : m.id } })
}

onMounted(async () => {
  list.value = await fetchMasterRank()
})
</script>

<style scoped>
@import '@/styles/atomic.css';

.master-rank-page {
  min-height: 100vh;
  background: #1a1002;
  padding-bottom: 60rpx;
  box-sizing: border-box;
}
.tnav {
  position: relative;
  height: 88rpx;
  padding: 0 32rpx;
}
.tnav-left {
  width: 60rpx;
  display: flex;
  align-items: center;
}
.tnav-back {
  width: 34rpx;
}
.tnav-title {
  position: absolute;
  left: 182rpx;
  right: 182rpx;
  text-align: center;
  font-size: 34rpx;
  color: #fff;
  font-family: MiSans-Demibold, sans-serif;
}
.steps {
  padding-top: 8rpx;
}
.step-item {
  position: relative;
  padding-left: 40rpx;
}
.step-dot {
  position: absolute;
  left: 4rpx;
  top: 12rpx;
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
  background: #6aa27b;
}
.step-line {
  position: absolute;
  left: 11rpx;
  top: 32rpx;
  bottom: -12rpx;
  width: 2rpx;
  background: rgba(255, 255, 255, 0.14);
}
.step-desc {
  padding-bottom: 24rpx;
}
.avatar {
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  background: #35354a;
  flex-shrink: 0;
}
.nick {
  margin-left: 16rpx;
  font-size: 32rpx;
  color: #f5f5f5;
}
.time {
  font-size: 24rpx;
  color: #8a8a8a;
  flex-shrink: 0;
  margin-left: 12rpx;
}
.goods {
  margin-top: 20rpx;
  padding: 20rpx 24rpx;
  border-radius: 8rpx;
  background: #35354a;
}
.goods-thumb {
  width: 90rpx;
  height: 90rpx;
  border-radius: 4rpx;
  background: #555;
  flex-shrink: 0;
}
.goods-meta {
  margin-left: 20rpx;
  min-width: 0;
}
.goods-name {
  font-size: 28rpx;
  color: #fff;
}
.goods-num {
  margin-top: 12rpx;
  font-size: 24rpx;
  color: #c8c8d0;
}
.buy-btn {
  height: 52rpx;
  padding: 0 24rpx;
  border-radius: 26rpx;
  background: #6aa27b;
  flex-shrink: 0;
  margin-left: 12rpx;
}
.buy-btn-text {
  font-size: 24rpx;
  color: #fff;
}
.empty-box {
  padding: 140rpx 0;
  text-align: center;
}
.empty-text {
  font-size: 26rpx;
  color: #8a8a8a;
}
</style>