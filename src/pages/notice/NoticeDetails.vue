<template>
  <view class="notice-details-page">
    <view class="navbar">
      <view class="navbar-left" @click="goBack">
        <img :src="asset('static/common/back_default.png')" mode="widthFix" />
      </view>
      <text class="navbar-title">官方公告</text>
    </view>

    <view class="plr-16">
      <text class="MiSans-Demibold detail-title">{{ info.title || '--' }}</text>
      <text class="topic-family mt-12 MiSans-Regular detail-time">{{
        info.publish_time || '--'
      }}</text>

      <!-- 富文本正文（原站 u-parse） -->
      <view class="MiSans-Regular detail-body" v-html="info.content || ''"></view>

      <!-- 关联藏品：点击查看 -->
      <view
        v-for="c in info.collection || []"
        :key="c.id"
        class="goodItem flex flex-center flex-js-sb"
        @click="goMarket(c)"
      >
        <view class="flex flex-center font-size-14">
          <img class="good-thumb" :src="imgOf(c)" mode="aspectFill" />
          <text class="MiSans-Demibold good-name text-overflow">{{ c.name }}</text>
        </view>
        <view class="view-btn flex flex-ai-center flex-js-center">
          <text class="MiSans-Medium view-btn-text">点击查看</text>
        </view>
      </view>

      <!-- 风险提示（原站固定文案） -->
      <view class="flex flex-dir-col mt-32 MiSans-Regular">
        <text class="font-size-16 risk-title">【青川风险提示】:</text>
        <text class="font-size-14 mt-12 risk-body">
          青川发售的数字藏品仅具备收藏欣赏价值，官方对藏品价格不构成任何指导意义，请谨慎购买，严防炒作。
        </text>
        <text class="font-size-16 mt-12 risk-title">【青川郑重提醒广大用户】:</text>
        <text class="font-size-14 mt-12 risk-body">
          平台对于使用第三方工具锁单、抢单;以平台的名义进行承诺收益、承诺回购、非法集资、非法吸收公共存款;为了非法目的进行拉人头、要求缴纳入门费、团队计酬返利等涉嫌传销的行为或故意从事旨在对平台、平台用户或服务的履行造成不利影响的等行为秉持零容忍态度，一经发现将采取封号、冻结等措施。请大家规范抢购，不要轻信此类第三方工具或任何非官方的抢购信息，避免造成个人财产损失!
        </text>
        <text class="font-size-14 mt-12 risk-body">
          根据国家反洗钱、反诈骗等法律法规规定，特提醒广大用户严格遵守国家法律法规，禁止在青川平台进行洗钱、诈骗、赌博、开设赌场、非法集资、非法融资、传销等违法行为，否则一经平台查实，将对您的青川账号作出封禁、冻结等处理，并移交国家司法机关追究其法律责任。
        </text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { fetchAfficheDetail, asset } from '@/utils/api'
import { ossImg } from '@/api'

const router = useRouter()
const route = useRoute()

const info = ref({})

function imgOf(c) {
  return c.listimg ? ossImg(c.listimg) : ''
}

function goBack() {
  if (window.history.length > 1) router.back()
  else router.push('/pages/notice/notice')
}

function goMarket(c) {
  router.push({ path: '/pages/market/detail', query: { id: c.id } })
}

onMounted(async () => {
  // 源站 noticeDetails 以 route.query.id 为参数（公告 id，如 429）
  info.value = await fetchAfficheDetail({ id: route.query.id })
})
</script>

<style scoped>
@import '@/styles/atomic.css';

.notice-details-page {
  min-height: 100vh;
  background: #fff;
  padding-bottom: 60rpx;
}

.navbar {
  position: relative;
  height: 88rpx;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
}
.navbar-left {
  position: absolute;
  left: 26rpx;
  top: 0;
  bottom: 0;
  display: flex;
  align-items: center;
}
.navbar-left img {
  width: 34rpx;
}
.navbar-title {
  font-size: 32rpx;
  color: #1a2438;
  font-family: MiSans-Demibold;
}

.detail-title {
  display: block;
  margin-top: 18rpx;
  font-size: 36rpx;
  color: #161616;
  line-height: 1.45;
}
.detail-time {
  display: block;
  font-weight: 300;
  font-size: 21rpx;
  color: #757575;
  padding-bottom: 23rpx;
}
.detail-body {
  margin-top: 20rpx;
  font-size: 28rpx;
  letter-spacing: 4rpx;
  color: #333333;
  line-height: 52rpx;
  word-break: break-all;
}
.detail-body :deep(p) {
  margin: 0 0 24rpx;
}
.detail-body :deep(strong) {
  font-weight: 600;
}

.goodItem {
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f5f5f5;
}
.good-thumb {
  width: 150rpx;
  height: 150rpx;
  border-radius: 20rpx;
  margin-right: 18rpx;
  flex-shrink: 0;
  background: #f0f0f0;
}
.good-name {
  font-size: 28rpx;
  color: #333;
  max-width: 380rpx;
}
.view-btn {
  height: 56rpx;
  padding: 0 28rpx;
  background: #6aa27b;
  border-radius: 28rpx;
  flex-shrink: 0;
}
.view-btn-text {
  font-size: 24rpx;
  color: #fff;
}

.risk-title {
  color: #333;
  font-size: 32rpx;
}
.risk-body {
  color: #373737;
  letter-spacing: 2rpx;
  line-height: 1.7;
}
</style>