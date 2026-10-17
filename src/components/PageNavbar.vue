<template>
  <view class="tnav" :style="{ background: bg }">
    <view class="tnav-left" @click="goBack">
      <img
        class="tnav-back"
        :src="asset(white ? 'static/common/back_white.png' : 'static/common/back_default.png')"
        mode="widthFix"
      />
    </view>
    <text class="tnav-title" :style="{ color: titleColor }">{{ title }}</text>
    <view v-if="$slots.right" class="tnav-right">
      <slot name="right" />
    </view>
  </view>
</template>

<script setup>
/**
 * 原站 w-navbar（u-navbar）的 web 等价实现。
 * 沉浸式：高度 88rpx，标题绝对居中，返回图标在左。
 */
import { useRouter } from 'vue-router'
import { asset } from '@/utils/api'

defineOptions({ name: 'PageNavbar' })

const props = defineProps({
  title: { type: String, default: '' },
  /** 白底黑字（默认）；dark 为深色底白字 */
  variant: { type: String, default: 'light' },
})
const router = useRouter()

const white = () => props.variant === 'dark'
const bg = () => (props.variant === 'dark' ? '#000' : '#fff')
const titleColor = () => (props.variant === 'dark' ? '#fff' : '#1a2438')

function goBack() {
  if (window.history.length > 1) router.back()
  else router.push('/pages/my/my')
}
</script>

<style scoped>
.tnav {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  height: 88rpx;
  padding: 0 24rpx;
  box-sizing: border-box;
  flex-shrink: 0;
}
.tnav-left {
  width: 60rpx;
  height: 88rpx;
  display: flex;
  align-items: center;
  flex-shrink: 0;
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
  line-height: 46rpx;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.tnav-right {
  position: absolute;
  right: 24rpx;
  top: 0;
  bottom: 0;
  display: flex;
  align-items: center;
}
</style>
