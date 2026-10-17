<template>
  <view class="placeholder-page">
    <view class="placeholder-inner">
      <text class="placeholder-title">{{ title }}</text>
      <text class="placeholder-tip">该页面正在按原站像素级复刻中</text>
      <view class="placeholder-btn" @click="router.back()">返回上一页</view>
    </view>
  </view>
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router'

defineOptions({ name: 'PlaceholderPage' })

const route = useRoute()
const router = useRouter()
const title = route.meta && route.meta.title ? route.meta.title : '页面'
</script>

<style scoped>
.placeholder-page {
  min-height: 100vh;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
}
.placeholder-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.placeholder-title {
  font-size: 36rpx;
  color: #1a2438;
  font-weight: 600;
}
.placeholder-tip {
  margin-top: 16rpx;
  font-size: 26rpx;
  color: #999;
}
.placeholder-btn {
  margin-top: 48rpx;
  padding: 16rpx 48rpx;
  border-radius: 44rpx;
  background: #495f50;
  color: #fff;
  font-size: 26rpx;
}
</style>
