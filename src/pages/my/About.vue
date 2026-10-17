<template>
  <view class="about-page">
    <PageNavbar title="关于我们" />

    <view class="logo-wrap flex flex-ai-center flex-dir-col pt-48 pb-80">
      <img class="about-logo" :src="asset('static/logo/logo.png')" mode="widthFix" />
    </view>

    <view class="mt-24 plr-16">
      <text class="MiSans-Medium font-color-dark"> 关于我们： </text>
      <text class="MiSans-Regular about-body">{{ ABOUT_TEXT }}</text>
    </view>

    <view class="links flex flex-js-center font-color-999 mt-80">
      <text @click="toAgreement('用户服务协议')">《用户服务协议》</text>
      <text @click="toAgreement('隐私政策')">《隐私政策》</text>
    </view>
  </view>
</template>

<script setup>
/**
 * 原站 my/about —— 关于我们
 * 正文取自原站 u-parse 富文本（config.aboutus）的内容。
 */
import { useRouter } from 'vue-router'
import PageNavbar from '@/components/PageNavbar.vue'
import { asset } from '@/utils/api'

defineOptions({ name: 'AboutPage' })

const router = useRouter()

const ABOUT_TEXT =
  '青川数字艺术是一款基于区块链技术的数字艺术品交易平台，致力于为数字艺术爱好者提供安全、可靠的数字藏品交易服务。平台采用去中心化的链上存储方式，确保每一件数字艺术品的唯一性与永久性。'

function toAgreement(title) {
  // 原站跳转到 /index/index/usageterms 与 /index/index/agreement 内页，
  // 本项目统一收敛到内置协议页，按标题取对应正文。
  router.push({ path: '/pages/agreement/agreement', query: { title } })
}
</script>

<style scoped>
@import '@/styles/atomic.css';

.about-page {
  min-height: 100vh;
  background: #f4f6fa;
  padding-bottom: 40rpx;
  box-sizing: border-box;
}
.logo-wrap {
  width: 100%;
}
.about-logo {
  width: 320rpx;
}
.about-body {
  display: block;
  margin-top: 24rpx;
  font-size: 28rpx;
  line-height: 1.8;
  color: #999;
}
.links {
  font-size: 26rpx;
}
</style>
