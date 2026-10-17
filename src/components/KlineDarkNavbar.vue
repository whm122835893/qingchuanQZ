<template>
  <!-- 深色行情导航（原站 w-navbar bgColor #232744，标题白字，右侧 slot） -->
  <view class="tnav flex flex-ai-center">
    <view class="tnav-left" @click="$emit('back')">
      <img class="tnav-back" :src="asset('static/common/back_white.png')" mode="widthFix" />
    </view>
    <text class="tnav-title">{{ title }}</text>
    <view class="tnav-right" @click="$emit('action')">
      <text class="MiSans-Regular right-text">{{ actionText }}</text>
    </view>
  </view>
</template>

<script setup>
/**
 * 行情页深色导航（kline/info 内嵌，对应原站 w-navbar bgColor #232744 + 右侧 slot）。
 */
import { asset } from '@/utils/api'

defineOptions({ name: 'KlineDarkNavbar' })

defineProps({
  title: { type: String, default: '' },
  actionText: { type: String, default: '' },
})
defineEmits(['back', 'action'])
</script>

<style scoped>
.tnav {
  position: relative;
  height: 88rpx;
  padding: 0 32rpx;
  flex-shrink: 0;
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
.tnav-right {
  position: absolute;
  right: 32rpx;
  top: 0;
  bottom: 0;
  display: flex;
  align-items: center;
}
.right-text {
  font-size: 24rpx;
  color: #fff;
}
</style>