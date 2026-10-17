<template>
  <view class="rebate-page">
    <PageNavbar title="邀请返利" />

    <view class="page-body">
      <!-- 我的信息 -->
      <view class="info-box flex flex-ai-center">
        <img class="avatar" :src="avatarSrc" mode="aspectFill" />
        <text class="MiSans-Regular nickname">{{ info.nickname }}</text>
      </view>

      <!-- 默认邀请链接 -->
      <text class="MiSans-Demibold block-title">默认邀请链接</text>
      <view class="info-card">
        <view class="row flex flex-ai-center flex-js-sb">
          <text class="MiSans-Regular row-label">邀请码</text>
          <view class="flex flex-ai-center">
            <text class="MiSans-Regular row-value">{{ info.inviter_code }}</text>
            <img class="row-icon" :src="asset('static/icon/copy.png')" mode="aspectFit" @click="onCopy(info.inviter_code)" />
          </view>
        </view>
        <view class="row flex flex-ai-center flex-js-sb" @click="toPoster">
          <text class="MiSans-Regular row-label">邀请海报</text>
          <img class="row-icon arrow" :src="asset('static/icon/arrow-right-black.png')" mode="aspectFit" />
        </view>
        <view class="row flex flex-ai-center flex-js-sb" @click="onCopy(inviteUrl)">
          <text class="MiSans-Regular row-label text-overflow">邀请链接: {{ maskedUrl }}</text>
          <img class="row-icon" :src="asset('static/icon/copy.png')" mode="aspectFit" />
        </view>
      </view>

      <!-- 数据详情 -->
      <text class="MiSans-Demibold block-title">数据详情</text>
      <view class="info-card">
        <view class="row flex flex-ai-center flex-js-sb">
          <text class="MiSans-Regular row-label">总返佣金额</text>
          <text class="MiSans-Regular row-value">￥{{ info.all_commision }}</text>
        </view>
        <view class="row flex flex-ai-center flex-js-sb" @click="showTip('本期返佣金额指前一天的返金额')">
          <view class="flex flex-ai-center">
            <text class="MiSans-Regular row-label mr">本期返佣金额</text>
            <img class="row-icon q" :src="asset('static/icon/product-tips.png')" mode="aspectFit" />
          </view>
          <text class="MiSans-Regular row-value">￥{{ info.yesterday_commision }}</text>
        </view>
        <view class="row flex flex-ai-center flex-js-sb">
          <text class="MiSans-Regular row-label">名下用户总交易金额</text>
          <text class="MiSans-Regular row-value">￥{{ info.user_transaction }}</text>
        </view>
        <view class="row flex flex-ai-center flex-js-sb">
          <text class="MiSans-Regular row-label">名下用户总佣金</text>
          <text class="MiSans-Regular row-value">￥{{ info.mingxia_commision }}</text>
        </view>
      </view>

      <!-- 被邀请人 -->
      <view class="flex flex-ai-center head-row" @click="toInviteDetail">
        <text class="MiSans-Demibold block-title mr">被邀请人</text>
        <img class="row-icon arrow" :src="asset('static/icon/arrow-right-black.png')" mode="aspectFit" />
      </view>
      <view class="info-card">
        <view class="row flex flex-ai-center flex-js-sb">
          <text class="MiSans-Regular row-label">邀请人数</text>
          <text class="MiSans-Regular row-value">{{ info.yao_counts }}</text>
        </view>
        <view class="row flex flex-ai-center flex-js-sb" @click="showTip('有效邀请人数指有交易记录的邀请人数')">
          <view class="flex flex-ai-center">
            <text class="MiSans-Regular row-label mr">有效邀请人数</text>
            <img class="row-icon q" :src="asset('static/icon/product-tips.png')" mode="aspectFit" />
          </view>
          <text class="MiSans-Regular row-value">{{ info.you_yao_counts }}</text>
        </view>
      </view>

      <!-- 节点排行榜入口（原站为 /static/bg/yao-image.png，该图源站已 404，改用等效卡片） -->
      <text class="MiSans-Demibold block-title leaderboard-title">节点排行榜</text>
      <view class="leaderboard-entry flex flex-ai-center flex-js-sb" @click="toLeaderboard">
        <view class="flex flex-dir-col flex-1">
          <text class="MiSans-Demibold entry-title">邀请排行榜</text>
          <text class="MiSans-Regular entry-desc">看看谁邀请得最多，赢返佣</text>
        </view>
        <img class="row-icon arrow" :src="asset('static/icon/arrow-right-black.png')" mode="aspectFit" />
      </view>

      <!-- 说明 -->
      <view class="desc-box">
        <text class="MiSans-Regular desc-text">{{ desc }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
/**
 * 原站 rebate/rebate —— 返利中心
 * 结构：我的信息 / 默认邀请链接（邀请码、邀请海报、邀请链接）/ 数据详情 / 被邀请人 / 节点排行榜入口 / 说明。
 * 说明文案取原站 config.comm_desc。
 */
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import PageNavbar from '@/components/PageNavbar.vue'
import { asset, fetchRebateInfo } from '@/utils/api'
import { ossImg } from '@/api'

defineOptions({ name: 'RebatePage' })

const router = useRouter()
const info = ref({})

const avatarSrc = computed(() => ossImg(info.value.avatar || ''))
const inviteUrl = computed(() => info.value.h5_invite_url || '')
const maskedUrl = computed(() => {
  const u = inviteUrl.value
  if (u.length < 20) return u
  return u.slice(0, 10) + '******' + u.slice(-5)
})
const desc = computed(
  () =>
    info.value.comm_desc ||
    '本期返佣金额指前一天的返金额；名下用户总佣金为已结算返佣累计。有效邀请人数指有交易记录的邀请人数。'
)

function onCopy(text) {
  if (!text) return
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).catch(() => {})
  }
  uni.showToast({ title: '已复制', icon: 'none' })
}
function showTip(content) {
  uni.showToast({ title: content, icon: 'none' })
}
function toPoster() {
  // 原站跳 /pages/invitation/invitation（邀请海报），本项目该页仍在复刻中
  uni.showToast({ title: '原站跳转邀请海报页', icon: 'none' })
}
function toInviteDetail() {
  router.push('/pages/rebate/rebateInviteDetail')
}
function toLeaderboard() {
  router.push('/pages/rebate/leaderboard')
}

onMounted(async () => {
  info.value = await fetchRebateInfo()
})
</script>

<style scoped>
@import '@/styles/atomic.css';

.rebate-page {
  min-height: 100vh;
  background: #f4f6fa;
  box-sizing: border-box;
}
.page-body {
  padding: 24rpx 32rpx 60rpx;
}
.info-box {
  padding-bottom: 8rpx;
  /* 全局 .info-box 引用了源站已下线的 /static/cw/lj_bg.png，此处覆盖为纯色（保持原视觉：原图加载失败时亦为无背景） */
  background: none;
}
.avatar {
  width: 96rpx;
  height: 96rpx;
  border-radius: 50%;
  background: #dfe3ea;
  flex-shrink: 0;
}
.nickname {
  margin-left: 16rpx;
  font-size: 28rpx;
  color: #666;
}
.block-title {
  display: block;
  margin-top: 40rpx;
  font-size: 40rpx;
  color: #1a2438;
}
.head-row {
  margin-top: 40rpx;
}
.mr {
  margin-right: 8rpx;
}
.leaderboard-title {
  margin-bottom: 24rpx;
}
.info-card {
  margin-top: 24rpx;
  padding: 0 24rpx;
  background: #fff;
  border-radius: 8rpx;
}
.row {
  min-height: 96rpx;
  border-bottom: 1rpx solid #f0f2f5;
}
.row:last-child {
  border-bottom: none;
}
.row-label {
  font-size: 32rpx;
  color: #666;
}
.row-value {
  font-size: 32rpx;
  color: #1a2438;
}
.row-icon {
  width: 32rpx;
  height: 32rpx;
  margin-left: 12rpx;
}
.row-icon.arrow {
  margin-left: 0;
  width: 26rpx;
  height: 26rpx;
}
.row-icon.q {
  width: 30rpx;
  height: 30rpx;
  margin-left: 0;
}
.leaderboard-entry {
  margin-top: 24rpx;
  padding: 32rpx;
  background: #fff;
  border-radius: 8rpx;
}
.entry-title {
  font-size: 32rpx;
  color: #1a2438;
}
.entry-desc {
  margin-top: 10rpx;
  font-size: 24rpx;
  color: #999;
}
.desc-box {
  position: relative;
  margin-top: 40rpx;
  padding: 32rpx 32rpx 32rpx 56rpx;
  background: #fff;
  border-radius: 8rpx;
}
.desc-box::before {
  content: '';
  position: absolute;
  left: 24rpx;
  top: 34rpx;
  width: 8rpx;
  height: 28rpx;
  background: #6aa27b;
}
.desc-text {
  font-size: 24rpx;
  line-height: 40rpx;
  color: #999;
}
</style>