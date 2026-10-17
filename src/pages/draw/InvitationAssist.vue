<template>
  <view class="assist-page">
    <PageNavbar title="好友助力" />

    <view class="pa-16">
      <!-- 助力图 -->
      <img class="hero" :src="ossImg(heroImage)" mode="aspectFill" />

      <view class="invite-btn" @click="copyInvite">
        <text class="MiSans-Medium invite-btn-text">邀请</text>
      </view>

      <!-- 助力次数 -->
      <view class="count-box">
        <text class="MiSans-Regular count-label">您已成功获得助力</text>
        <text class="MiSans-Demibold count-num">{{ assistNum }}</text>
        <text class="MiSans-Regular count-label">次</text>
      </view>

      <!-- 助力明细 -->
      <view class="table-wrap">
        <view class="row head">
          <text class="MiSans-Regular head-cell col-time">日期</text>
          <text class="MiSans-Regular head-cell col-type">用户类型</text>
          <text class="MiSans-Regular head-cell col-user">为您助力用户</text>
          <text class="MiSans-Regular head-cell col-res">结果</text>
        </view>
        <view v-for="(r, i) in records" :key="r.id || i" class="row" :class="{ stripe: i % 2 === 0 }">
          <text class="MiSans-Regular cell col-time">{{ shortDate(r.create_time) }}</text>
          <text class="MiSans-Regular cell col-type">{{ r.is_new_user ? '新用户' : '老用户' }}</text>
          <view class="cell col-user user">
            <img class="avatar" :src="ossImg(r.avatar)" mode="aspectFill" />
            <text class="MiSans-Regular nickname text-overflow">{{ r.nickname }}</text>
          </view>
          <text class="MiSans-Regular cell col-res" :class="{ ok: r.is_real }">{{ r.is_real ? '成功' : '失败' }}</text>
        </view>

        <view v-if="!records.length" class="empty-box">
          <text class="MiSans-Regular empty-text">暂无助力记录</text>
        </view>
      </view>

      <!-- 规则 -->
      <view class="rule-box">
        <view class="rule-head">
          <img class="rule-icon" :src="asset('static/icon/product-tips.png')" mode="aspectFit" />
          <text class="MiSans-Demibold rule-title">好友助力规则</text>
        </view>
        <text class="MiSans-Regular rule-text">{{ assistTip }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
/**
 * 原站 draw/InvitationFriendAssist/InvitationFriendAssist —— 好友助力
 * 结构：助力商品图 + 「邀请」按钮 + 助力次数卡 + 助力明细表（日期 / 用户类型 / 为您助力用户 / 结果，隔行渐变底）+ 规则说明。
 */
import { computed, onMounted, ref } from 'vue'
import PageNavbar from '@/components/PageNavbar.vue'
import { asset, fetchInvitationAssist } from '@/utils/api'
import { ossImg } from '@/api'

defineOptions({ name: 'InvitationAssist' })

const info = ref({})

onMounted(async () => {
  info.value = await fetchInvitationAssist()
})

const records = computed(() => info.value.records || [])
const assistNum = computed(() => info.value.assist_num || 0)
const assistTip = computed(() => info.value.assist_tip || '')
const heroImage = computed(() => info.value.hero_image || '')

function shortDate(v) {
  if (!v) return ''
  const d = new Date(Number(v) * 1000)
  if (Number.isNaN(d.getTime())) return String(v)
  const p = (n) => String(n).padStart(2, '0')
  return `${p(d.getMonth() + 1)}-${p(d.getDate())}`
}
function copyInvite() {
  if (navigator.clipboard) navigator.clipboard.writeText(window.location.href)
  window.uni && window.uni.showToast({ title: '邀请链接已复制', icon: 'none' })
}
</script>

<style scoped>
@import '@/styles/atomic.css';

.assist-page {
  min-height: 100vh;
  background: #f4f5f8;
  box-sizing: border-box;
}

.hero {
  width: 100%;
  height: 260rpx;
  border-radius: 12rpx;
  background: #e8e8e8;
}
.invite-btn {
  margin-top: 20rpx;
  height: 88rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #e26f1b;
  border-radius: 44rpx;
}
.invite-btn-text {
  font-size: 30rpx;
  color: #fff;
}

.count-box {
  margin-top: 30rpx;
  padding: 36rpx 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  border-radius: 20rpx;
}
.count-label {
  font-size: 28rpx;
  color: #666;
}
.count-num {
  margin: 0 12rpx;
  font-size: 34rpx;
  color: #e26f1b;
}

.table-wrap {
  margin-top: 32rpx;
  padding: 24rpx 0;
  background: #fff;
  border-radius: 12rpx;
}
.row {
  display: flex;
  align-items: center;
  height: 88rpx;
  color: #979997;
}
.row.head {
  height: 72rpx;
  font-size: 24rpx;
}
.row.stripe {
  background: linear-gradient(90deg, #91edf3, rgba(145, 243, 243, 0));
}
.head-cell {
  text-align: center;
  color: #979997;
}
.cell {
  text-align: center;
  font-size: 26rpx;
  color: #1a2438;
}
.col-time {
  width: 25%;
}
.col-type {
  width: 25%;
}
.col-user {
  width: 35%;
}
.col-res {
  width: 15%;
}
.cell.ok {
  color: #e26f1b;
}
.user {
  display: flex;
  align-items: center;
  justify-content: center;
}
.avatar {
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  background: #eee;
  margin-right: 10rpx;
  flex-shrink: 0;
}
.nickname {
  max-width: 150rpx;
}

.empty-box {
  padding: 60rpx 0 20rpx;
  display: flex;
  justify-content: center;
}
.empty-text {
  font-size: 26rpx;
  color: #999;
}

.rule-box {
  margin-top: 20rpx;
  padding: 24rpx;
  background: #fff;
  border-radius: 12rpx;
}
.rule-head {
  display: flex;
  align-items: center;
  margin-bottom: 12rpx;
}
.rule-icon {
  width: 30rpx;
  height: 30rpx;
  margin-right: 20rpx;
}
.rule-title {
  font-size: 32rpx;
  color: #1a2438;
}
.rule-text {
  font-size: 26rpx;
  line-height: 44rpx;
  color: #505050;
}
</style>