<template>
  <view class="cert-status-page">
    <PageNavbar title="认证结果" />

    <view class="header flex flex-dir-col flex-ai-center">
      <text class="title">{{ status === 1 ? '实名认证成功' : '实名认证失败' }}</text>
      <text v-if="status !== 1" class="hint mt-8">该身份信息认证失败，请重试</text>
    </view>

    <view class="empty flex flex-dir-col flex-ai-center">
      <img
        class="empty-icon"
        :src="asset(status === 1 ? 'static/icon/order-success.png' : 'static/icon/xrg_t.png')"
        mode="aspectFit"
      />
      <view
        class="ok-btn flex flex-ai-center flex-js-center"
        @click="onConfirm"
      >
        <text class="MiSans-Demibold ok-text">{{ status === 1 ? '我知道了' : '重新认证' }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
/**
 * 原站 certification/certificationStatus —— 认证结果
 * status=1 成功 / 其他 失败。成功图用已下载的 order-success.png；
 * 失败图原站 /static/icon/rzsb.png 源站已 404，改用项目内既有警示图 xrg_t.png。
 */
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PageNavbar from '@/components/PageNavbar.vue'
import { asset } from '@/utils/api'

defineOptions({ name: 'CertificationStatusPage' })

const route = useRoute()
const router = useRouter()
const status = ref(Number(route.query.status ?? 1))

function onConfirm() {
  if (status.value === 1) router.back()
  else router.replace('/pages/certification/certification')
}
</script>

<style scoped>
@import '@/styles/atomic.css';

.cert-status-page {
  min-height: 100vh;
  background: #f4f6fa;
  box-sizing: border-box;
}
.header {
  padding: 80rpx 0 40rpx;
}
.title {
  font-size: 40rpx;
  font-weight: 600;
  color: #1a2438;
}
.hint {
  font-size: 26rpx;
  color: #7a7a7a;
}
.empty {
  padding-top: 120rpx;
}
.empty-icon {
  width: 280rpx;
  height: 280rpx;
}
.ok-btn {
  width: 696rpx;
  height: 88rpx;
  margin-top: 280rpx;
  border-radius: 44rpx;
  background: #6aa27b;
}
.ok-text {
  font-size: 30rpx;
  color: #fff;
}
</style>