<template>
  <view class="service-page">
    <PageNavbar title="加入社群" />

    <view class="flex flex-dir-col mt-12" style="height: 1432rpx; background: #fff">
      <text class="MiSans-Demibold hero-title">欢迎加入青川官方社群!</text>

      <text class="MiSans-Demibold hero-desc">
        以下是青川的官方社群，点击二维码图片保存到相册，QQ扫码入群，如果遇到二维码失效或者无法加入请更换其他群或者联系官方客服!
      </text>

      <view class="qr-wrap mt-16" @click="saveQrcode">
        <img class="qr-img" :src="asset('static/my/service.jpg')" mode="widthFix" />
      </view>

      <text class="MiSans-Regular qr-tip mt-12">点击二维码保存到手机/QQ扫码入群</text>
    </view>
  </view>
</template>

<script setup>
/**
 * 原站 my/service —— 加入社群（长图文承载页）
 * 与 my/join 指向同一张官方社群二维码图（原站分别用 config.service_image 与静态图）。
 */
import PageNavbar from '@/components/PageNavbar.vue'
import { asset } from '@/utils/api'

defineOptions({ name: 'MyServicePage' })

function saveQrcode() {
  uni.showToast({ title: '请长按图片保存到相册', icon: 'none' })
}
</script>

<style scoped>
.service-page {
  min-height: 100vh;
  background: #f6f6f6;
}
.hero-title {
  margin-top: 58rpx;
  text-align: center;
  font-size: 40rpx;
  color: #262626;
}
.hero-desc {
  margin-top: 70rpx;
  padding: 0 40rpx;
  text-align: center;
  font-size: 28rpx;
  line-height: 1.6;
  color: #f52e39;
}
.qr-wrap {
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 24rpx;
  overflow: hidden;
}
.qr-img {
  width: 612rpx;
  border-radius: 24rpx;
}
.qr-tip {
  text-align: center;
  font-size: 24rpx;
  color: #686868;
}
</style>
