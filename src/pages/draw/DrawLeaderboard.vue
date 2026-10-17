<template>
  <view class="leaderboard-page">
    <PageNavbar title="抽签码排行榜" />

    <view class="pa-16">
      <!-- 我的排名 -->
      <view v-if="myrank.rank_num" class="my-box">
        <text class="MiSans-Regular my-label">我的排名</text>
        <text class="MiSans-Demibold my-num">{{ myrank.rank_num }}，</text>
        <text class="MiSans-Regular my-label">抽签码数量</text>
        <text class="MiSans-Demibold my-num accent">{{ myrank.nums }}</text>
      </view>

      <view class="rank-wrap">
        <!-- 表头 -->
        <view class="row head">
          <text class="MiSans-Regular head-cell col-1">排名</text>
          <text class="MiSans-Regular head-cell col-2">用户</text>
          <text class="MiSans-Regular head-cell col-3">抽签码数量</text>
        </view>
        <!-- 列表 -->
        <view v-for="(u, i) in list" :key="u.id || i" class="row" :class="{ stripe: i % 2 === 0 }">
          <text class="MiSans-Regular cell col-1">{{ i + 1 }}</text>
          <view class="cell col-2 user">
            <img class="avatar" :src="ossImg(u.avatar)" mode="aspectFill" />
            <text class="MiSans-Regular nickname text-overflow">{{ u.nickname }}</text>
          </view>
          <text class="MiSans-Regular cell col-3 nums">{{ u.nums }}</text>
        </view>

        <view v-if="!list.length" class="empty-box">
          <text class="MiSans-Regular empty-text">暂无排行榜数据</text>
        </view>
      </view>

      <!-- 规则 -->
      <view class="rule-box">
        <view class="rule-head">
          <img class="rule-icon" :src="asset('static/icon/product-tips.png')" mode="aspectFit" />
          <text class="MiSans-Demibold rule-title">抽签码排行榜规则</text>
        </view>
        <view class="rich" v-html="rankRule"></view>
      </view>

      <!-- 底部助力按钮 -->
      <view class="bottom-box">
        <view class="assist-btn" @click="go('/pages/draw/InvitationFriendAssist')">
          <text class="MiSans-Medium assist-text">邀请好友助力</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
/**
 * 原站 draw/Leaderboard/Leaderboard —— 抽签码排行榜
 * 结构：我的排名卡 + 排行榜（排名 25% / 用户 35% / 抽签码数量 20%，隔行渐变底）+ 排行榜规则富文本 + 底部「邀请好友助力」。
 * 说明：原站 /static/img/icon/icon_cp.png 已 404，改用项目已有的 static/icon/product-tips.png。
 */
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import PageNavbar from '@/components/PageNavbar.vue'
import { asset, fetchDrawLeaderboard } from '@/utils/api'
import { ossImg } from '@/api'

defineOptions({ name: 'DrawLeaderboard' })

const router = useRouter()
const data = ref({})

onMounted(async () => {
  data.value = await fetchDrawLeaderboard()
})

const list = computed(() => data.value.list || [])
const myrank = computed(() => data.value.myrank || {})
const rankRule = computed(() => data.value.rank_rule || '')

function go(path) {
  router.push(path)
}
</script>

<style scoped>
@import '@/styles/atomic.css';

.leaderboard-page {
  min-height: 100vh;
  background: #f4f5f8;
  padding-bottom: 200rpx;
  box-sizing: border-box;
}

.my-box {
  padding: 36rpx 0;
  display: flex;
  align-items: baseline;
  justify-content: center;
  background: #fff;
  border-radius: 40rpx;
}
.my-label {
  font-size: 28rpx;
  color: #666;
}
.my-num {
  margin: 0 12rpx;
  font-size: 32rpx;
  color: #1a2438;
}
.my-num.accent {
  color: #e26f1b;
}

.rank-wrap {
  margin-top: 32rpx;
  background: #fff;
  border-radius: 8rpx;
  overflow: hidden;
}
.row {
  display: flex;
  align-items: center;
  height: 88rpx;
}
.row.head {
  height: 80rpx;
  color: #979997;
  font-size: 24rpx;
}
.row.stripe {
  background: linear-gradient(90deg, #91edf3, rgba(145, 243, 243, 0));
}
.head-cell {
  text-align: center;
}
.cell {
  text-align: center;
  font-size: 26rpx;
  color: #1a2438;
}
.col-1 {
  width: 25%;
}
.col-2 {
  width: 35%;
}
.col-3 {
  width: 20%;
}
.head-cell.col-3 {
  width: 40%;
}
.cell.col-3 {
  width: 40%;
}
.user {
  display: flex;
  align-items: center;
  justify-content: center;
}
.avatar {
  width: 48rpx;
  height: 48rpx;
  border-radius: 50%;
  background: #eee;
  margin-right: 12rpx;
  flex-shrink: 0;
}
.nickname {
  max-width: 200rpx;
  color: #1a2438;
}
.nums {
  color: #e26f1b;
}

.empty-box {
  padding: 80rpx 0;
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
.rich {
  font-size: 26rpx;
  line-height: 44rpx;
  color: #505050;
  word-break: break-all;
}

.bottom-box {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 16rpx 55rpx calc(36rpx + env(safe-area-inset-bottom));
  background: #fff;
  box-shadow: 0 -4rpx 16rpx rgba(0, 0, 0, 0.04);
}
.assist-btn {
  width: 100%;
  height: 88rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #e26f1b;
  border-radius: 44rpx;
}
.assist-text {
  font-size: 30rpx;
  color: #fff;
}
</style>