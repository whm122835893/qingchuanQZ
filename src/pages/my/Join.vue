<template>
  <view class="join-page flex flex-dir-col flex-ai-center">
    <PageNavbar title="加入社群" />
    <img class="join-image" :src="asset('static/my/service.jpg')" mode="widthFix" />
  </view>
</template>

<script setup>
/**
 * 原站 my/join —— 加入社群
 * 原站结构极简：导航 + 一张 config.service_image 社群二维码（.join-image 386rpx 见方）。
 */
import PageNavbar from '@/components/PageNavbar.vue'
import { asset } from '@/utils/api'

defineOptions({ name: 'MyJoinPage' })
</script>

<style scoped>
.join-page {
  height: 1624rpx !important;
  width: 100%;
  min-height: 100vh;
  background: #fff;
  align-items: center;
}
.join-image {
  width: 386rpx;
  height: 386rpx;
  margin-top: 420rpx;
  border-radius: 24rpx;
}
</style>
