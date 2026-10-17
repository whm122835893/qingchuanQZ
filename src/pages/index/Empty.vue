<template>
  <view class="empty-page">
    <PageNavbar title="敬请期待" />
    <view class="empty-box">
      <img class="empty-img" :src="asset('static/empty/search1-empty.png')" mode="widthFix" />
      <text class="MiSans-Regular empty-text">{{ tipText }}</text>
    </view>
  </view>
</template>

<script setup>
/**
 * 原站 index/empty —— 敬请期待空状态页
 * 原站为 w-navbar + w-loading(emptyType=search1, emptyTop=80)，无交互。
 * tipText 允许通过 query 覆盖，默认「功能正在开发中，敬请期待」。
 */
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import PageNavbar from '@/components/PageNavbar.vue'
import { asset } from '@/utils/api'

defineOptions({ name: 'IndexEmptyPage' })

const route = useRoute()
const tipText = computed(() => route.query.text || '功能正在开发中，敬请期待')
</script>

<style scoped>
@import '@/styles/atomic.css';

.empty-page {
  min-height: 100vh;
  background: #f4f6fa;
  box-sizing: border-box;
}
.empty-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 160rpx;
}
.empty-img {
  width: 620rpx;
}
.empty-text {
  margin-top: 32rpx;
  font-size: 26rpx;
  color: #999;
}
</style>