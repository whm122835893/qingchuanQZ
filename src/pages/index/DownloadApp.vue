<template>
  <view class="dl-page">
    <!-- 原站为纯 CSS 装饰层（blob / grain），不依赖外部图片 -->
    <view class="dl-bg" aria-hidden="true">
      <view class="blob blob-a"></view>
      <view class="blob blob-b"></view>
      <view class="blob blob-c"></view>
      <view class="grain"></view>
    </view>

    <PageNavbar title="" />

    <view class="dl-body">
      <view class="hero">
        <view class="logo-wrap flex flex-ai-center flex-js-center">
          <img class="logo" :src="asset('static/logo/logo.png')" mode="aspectFill" />
        </view>
        <text class="MiSans-Bold brand">QingChuan</text>
        <text class="MiSans-Regular tagline">青川版权艺术平台</text>
        <text class="MiSans-Demibold headline">下载 APP，畅享藏品体验</text>
        <text class="MiSans-Regular subline">数字艺术 · 二级市场 · 合成活动，一站式触达</text>
      </view>

      <DownloadQrcode />

      <view class="cta-group">
        <view class="cta-btn primary flex flex-ai-center flex-js-center" @click="handleDownload()">
          <img class="cta-icon" :src="asset('static/icon/download2.png')" mode="aspectFit" />
          <text class="MiSans-Demibold cta-text">立即下载</text>
        </view>
        <view class="platform-row flex flex-ai-center">
          <view class="plat-btn flex flex-ai-center flex-js-center" @click="handleDownload('ios')">
            <img class="plat-icon" :src="asset('static/logo/ios_icon.png')" mode="aspectFit" />
            <text class="MiSans-Medium plat-text">iOS 下载</text>
          </view>
          <view class="plat-btn ml-20 flex flex-ai-center flex-js-center" @click="handleDownload('android')">
            <img class="plat-icon" :src="asset('static/logo/android_icon.png')" mode="aspectFit" />
            <text class="MiSans-Medium plat-text">Android 下载</text>
          </view>
        </view>
        <text class="MiSans-Regular tip">若在微信内打开，请用系统浏览器访问本页后再下载</text>
      </view>
    </view>

    <!-- 微信内打开引导 -->
    <view v-if="showWxGuide" class="wx-mask" @click="showWxGuide = false">
      <view class="wx-panel" @click.stop>
        <text class="MiSans-Demibold wx-title">请在浏览器中打开</text>
        <text class="MiSans-Regular wx-desc">点击右上角「···」，选择「在浏览器中打开」，即可下载青川 APP</text>
        <view class="wx-ok flex flex-ai-center flex-js-center" @click="showWxGuide = false">
          <text class="MiSans-Demibold wx-ok-text">我知道了</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
/**
 * 原站 index/downloadApp —— 下载 APP 页
 * 二维码原站为图片资源，此处按固定矩阵用 CSS 绘制（不外链、不生成二维码服务请求）。
 * 微信内打开时给出「在浏览器中打开」引导弹层，与原站 showWxGuide 分支一致。
 */
import { ref } from 'vue'
import PageNavbar from '@/components/PageNavbar.vue'
import DownloadQrcode from '@/components/DownloadQrcode.vue'
import { asset } from '@/utils/api'

defineOptions({ name: 'DownloadAppPage' })

const showWxGuide = ref(false)

function isWeixin() {
  return /micromessenger/i.test(navigator.userAgent)
}

function handleDownload() {
  if (isWeixin()) {
    showWxGuide.value = true
    return
  }
  uni.showToast({ title: '原站唤起 APP 下载', icon: 'none' })
}
</script>

<style scoped>
@import '@/styles/atomic.css';

.dl-page {
  position: relative;
  min-height: 100vh;
  background: #f4f6fa;
  overflow: hidden;
  box-sizing: border-box;
}
/* 原站三层柔光blob + 颗粒层，纯 CSS 绘制 */
.dl-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(80rpx);
}
.blob-a {
  width: 520rpx;
  height: 520rpx;
  top: -120rpx;
  right: -140rpx;
  background: rgba(122, 195, 134, 0.28);
}
.blob-b {
  width: 420rpx;
  height: 420rpx;
  top: 380rpx;
  left: -160rpx;
  background: rgba(26, 36, 56, 0.12);
}
.blob-c {
  width: 460rpx;
  height: 460rpx;
  bottom: -160rpx;
  right: -120rpx;
  background: rgba(122, 195, 134, 0.18);
}
.grain {
  position: absolute;
  inset: 0;
  opacity: 0.5;
  background-image: radial-gradient(rgba(0, 0, 0, 0.06) 1rpx, transparent 1rpx);
  background-size: 8rpx 8rpx;
}
.dl-body {
  position: relative;
  padding: 0 48rpx 80rpx;
}
.hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 40rpx;
}
.logo-wrap {
  width: 140rpx;
  height: 140rpx;
  border-radius: 32rpx;
  background: #fff;
  overflow: hidden;
}
.logo {
  width: 100%;
  height: 100%;
}
.brand {
  margin-top: 24rpx;
  font-size: 44rpx;
  color: #1a2438;
}
.tagline {
  margin-top: 8rpx;
  font-size: 24rpx;
  color: #7a7a7a;
}
.headline {
  margin-top: 40rpx;
  font-size: 40rpx;
  color: #1a2438;
  text-align: center;
}
.subline {
  margin-top: 16rpx;
  font-size: 24rpx;
  color: #7a7a7a;
  text-align: center;
}
.cta-group {
  margin-top: 60rpx;
}
.cta-btn {
  height: 96rpx;
  border-radius: 48rpx;
}
.cta-btn.primary {
  background: #7ac386;
}
.cta-icon {
  width: 36rpx;
  height: 36rpx;
  margin-right: 12rpx;
}
.cta-text {
  font-size: 32rpx;
  color: #fff;
}
.platform-row {
  margin-top: 28rpx;
}
.plat-btn {
  flex: 1;
  height: 88rpx;
  border-radius: 44rpx;
  background: #fff;
}
.plat-icon {
  width: 36rpx;
  height: 36rpx;
  margin-right: 12rpx;
}
.plat-text {
  font-size: 28rpx;
  color: #1a2438;
}
.ml-20 {
  margin-left: 20rpx;
}
.tip {
  display: block;
  margin-top: 28rpx;
  font-size: 22rpx;
  color: #999;
  text-align: center;
}
.wx-mask {
  position: fixed;
  inset: 0;
  z-index: 60;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
}
.wx-panel {
  width: 600rpx;
  padding: 48rpx 40rpx 32rpx;
  background: #fff;
  border-radius: 24rpx;
  box-sizing: border-box;
}
.wx-title {
  display: block;
  text-align: center;
  font-size: 32rpx;
  color: #1a2438;
}
.wx-desc {
  display: block;
  margin-top: 24rpx;
  font-size: 26rpx;
  line-height: 44rpx;
  color: #666;
  text-align: center;
}
.wx-ok {
  height: 88rpx;
  margin-top: 40rpx;
  border-radius: 44rpx;
  background: #7ac386;
}
.wx-ok-text {
  font-size: 28rpx;
  color: #fff;
}
</style>