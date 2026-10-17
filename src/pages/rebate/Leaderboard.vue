<template>
  <view class="rebate-rank-page">
    <!-- 原站 w-tabs 顶部切换：返佣榜 / 邀请榜 -->
    <view class="tabs flex">
      <view
        v-for="(t, i) in tabs"
        :key="t.name"
        class="tab-item flex flex-ai-center flex-js-center"
        :class="{ active: tabIndex === i }"
        @click="changeTab(i)"
      >
        <text class="MiSans-Medium tab-text">{{ t.name }}</text>
      </view>
    </view>

    <!-- 表头 -->
    <view class="head flex flex-ai-center">
      <text class="ranking">排名</text>
      <text class="niceName">用户</text>
      <text class="price text-right">返佣金额</text>
    </view>

    <!-- 列表 -->
    <view class="list">
      <view
        v-for="(u, i) in list"
        :key="u.id"
        class="item flex flex-ai-center"
        :class="rankClass(i)"
        @click="toInviteDetail(u)"
      >
        <view class="ranking flex flex-ai-center flex-js-center">
          <text v-if="i < 3" class="rank-badge" :class="'rank-' + (i + 1)">{{ i + 1 }}</text>
          <text v-else class="rank-num">{{ pad(i + 1) }}</text>
        </view>
        <text class="niceName text-overflow">{{ u.nickname }}</text>
        <text class="price text-right">￥{{ u.com_price }}</text>
      </view>
      <view v-if="!list.length" class="empty-box">
        <text class="MiSans-Regular empty-text">暂无排行榜数据</text>
      </view>
    </view>
  </view>
</template>

<script setup>
/**
 * 原站 rebate/leaderboard —— 邀请排行榜
 * 原站用 w-tabs 在「返佣榜 / 邀请榜」间切换，本项目保留双 tab，
 * 数据统一取 rebateLeaderboard（返佣金额维度）。
 */
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { fetchRebateLeaderboard } from '@/utils/api'

defineOptions({ name: 'RebateLeaderboardPage' })

const router = useRouter()
const tabs = [
  { name: '返佣榜' },
  { name: '邀请榜' },
]
const tabIndex = ref(0)
const all = ref([])

/** 邀请榜按人数倒序（原站 tab 切换为不同排序维度） */
const list = computed(() => {
  if (tabIndex.value === 0) return all.value
  return [...all.value].sort((a, b) => Number(b.id) - Number(a.id))
})

function changeTab(i) {
  tabIndex.value = i
}
function pad(n) {
  return n < 10 ? '0' + n : String(n)
}
function rankClass(i) {
  return i === 0 ? 'one' : i === 1 ? 'two' : i === 2 ? 'three' : ''
}
function toInviteDetail() {
  router.push('/pages/rebate/rebateInviteDetail')
}

onMounted(async () => {
  all.value = await fetchRebateLeaderboard()
})
</script>

<style scoped>
@import '@/styles/atomic.css';

.rebate-rank-page {
  min-height: 100vh;
  background: #f4f6fa;
  padding-bottom: 60rpx;
  box-sizing: border-box;
}
.tabs {
  background: #fff;
  height: 88rpx;
}
.tab-item {
  flex: 1;
  position: relative;
  height: 88rpx;
}
.tab-text {
  font-size: 28rpx;
  color: #999;
}
.tab-item.active .tab-text {
  color: #1a2438;
  font-family: MiSans-Demibold, sans-serif;
}
.tab-item.active::after {
  content: '';
  position: absolute;
  left: 50%;
  bottom: 10rpx;
  width: 40rpx;
  height: 6rpx;
  background: #1a2438;
  border-radius: 3rpx;
  transform: translateX(-50%);
}
.head {
  padding: 0 32rpx;
  height: 72rpx;
  font-size: 24rpx;
  color: #999;
}
.ranking {
  width: 96rpx;
  flex-shrink: 0;
}
.niceName {
  flex: 1;
  min-width: 0;
}
.price {
  width: 200rpx;
  flex-shrink: 0;
  font-size: 28rpx;
  color: #1a2438;
}
.list {
  padding: 0 32rpx;
}
.item {
  height: 96rpx;
  margin-bottom: 16rpx;
  padding: 0 32rpx;
  background: #fff;
  border-radius: 8rpx;
}
.item.one,
.item.two,
.item.three {
  height: 104rpx;
}
.rank-badge {
  width: 44rpx;
  height: 44rpx;
  border-radius: 50%;
  font-size: 24rpx;
  color: #fff;
  text-align: center;
  line-height: 44rpx;
}
.rank-one {
  background: #d4a04a;
}
.rank-two {
  background: #9aa3ad;
}
.rank-three {
  background: #b4795a;
}
.rank-num {
  font-size: 26rpx;
  color: #999;
}
.item .niceName {
  font-size: 28rpx;
  color: #1a2438;
}
.empty-box {
  padding: 120rpx 0;
  text-align: center;
}
.empty-text {
  font-size: 26rpx;
  color: #999;
}
</style>