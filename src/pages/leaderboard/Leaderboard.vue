<template>
  <view class="leaderboard-page">
    <!-- 原站 rank 导航：圆形半透明返回按钮 -->
    <view class="tnav flex flex-ai-center">
      <view class="tnav-back-btn flex flex-ai-center flex-js-center" @click="goBack">
        <img class="tnav-back" :src="asset('static/common/back_white.png')" mode="widthFix" />
      </view>
      <text class="tnav-title">{{ tabList[tabIndex].name }}</text>
    </view>

    <!-- 原站顶部 banner 区（rank_top_bg.png / rank_title.png 源站已 404，用 CSS 等效绘制） -->
    <view class="hero">
      <text class="hero-title">排行榜</text>
    </view>

    <!-- tab -->
    <view class="tabs flex">
      <view
        v-for="(t, i) in tabList"
        :key="t.name"
        class="tab-item flex flex-ai-center flex-js-center"
        :class="{ active: tabIndex === i }"
        @click="changeTab(i)"
      >
        <text class="MiSans-Medium tab-text">{{ t.name }}</text>
      </view>
    </view>

    <!-- 藏品榜 -->
    <LeaderboardGoodsList v-if="tabIndex === 0" :goods="goods" @view="toGoods" @like="toggleLike" />

    <!-- 用户榜 -->
    <view v-else class="user-list pa-12">
      <LeaderboardPodium
        v-if="users.length"
        :list="users"
        :metric-name="metricName"
        :metric-of="metricOf"
      />

      <!-- 本人名次 -->
      <view v-if="Object.keys(my).length" class="item-box my-box flex flex-ai-center flex-js-sb">
        <view class="who flex flex-ai-center">
          <text class="MiSans-Regular my-num text-center">{{ my.order_num }}</text>
          <img class="avatar" :src="ossImg(my.avatar)" mode="aspectFill" />
          <view class="flex flex-ai-center">
            <text class="MiSans-Regular me mr-4">本人</text>
            <text class="MiSans-Regular my-mobile">{{ my.mobile }}</text>
          </view>
        </view>
        <text class="MiSans-Medium my-value">{{ metricOf(my) }}</text>
      </view>

      <!-- 第 4 名以后 -->
      <view v-for="(u, i) in restUsers" :key="u.id" class="item-box flex flex-ai-center flex-js-sb">
        <view class="who flex flex-ai-center">
          <text class="MiSans-Regular user-num text-center">{{ i + 4 }}</text>
          <img class="avatar" :src="ossImg(u.avatar)" mode="aspectFill" />
          <text class="MiSans-Regular user-name text-overflow">{{ u.nickname.slice(0, 16) }}</text>
        </view>
        <text class="MiSans-Regular user-value">{{ metricOf(u) }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
/**
 * 原站 leaderboard/leaderboard —— 综合榜单
 * 两个 tab：藏品榜（名次 + 缩略图 + 发行/流通 + 最低价 + 点赞）、用户榜（前三名领奖台 + 本人名次 + 4名以后列表）。
 */
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import LeaderboardGoodsList from '@/components/LeaderboardGoodsList.vue'
import LeaderboardPodium from '@/components/LeaderboardPodium.vue'
import { asset, fetchLeaderboardGoods, fetchLeaderboardUser } from '@/utils/api'
import { ossImg } from '@/api'

defineOptions({ name: 'LeaderboardPage' })

const router = useRouter()
const tabIndex = ref(0)
const goods = ref([])
const userData = ref({ list: [], my: {} })

const tabList = [
  { name: '藏品榜' },
  { name: '用户榜' },
]
const users = computed(() => userData.value.list || [])
const my = computed(() => userData.value.my || {})
const restUsers = computed(() => users.value.slice(3))
const metricName = '邀请人数'

function metricOf(u) {
  if (!u) return '--'
  return String(u.yao_count)
}
function changeTab(i) {
  tabIndex.value = i
}
function goBack() {
  if (window.history.length > 1) router.back()
  else router.push('/pages/index/index')
}
function toGoods(g) {
  router.push({ path: '/pages/market/detail', query: { id: g.id } })
}
function toggleLike(g) {
  g.is_like = g.is_like ? 0 : 1
}

onMounted(async () => {
  goods.value = await fetchLeaderboardGoods()
  userData.value = await fetchLeaderboardUser()
})
</script>

<style scoped>
@import '@/styles/atomic.css';

.leaderboard-page {
  min-height: 100vh;
  background: #f4f6fa;
  padding-bottom: 60rpx;
  box-sizing: border-box;
}
.tnav {
  position: relative;
  height: 88rpx;
  padding: 0 32rpx;
}
.tnav-back-btn {
  width: 68rpx;
  height: 68rpx;
  border-radius: 50%;
  background: rgba(244, 244, 244, 0.5);
}
.tnav-back {
  height: 26rpx;
}
.tnav-title {
  position: absolute;
  left: 182rpx;
  right: 182rpx;
  text-align: center;
  font-size: 34rpx;
  color: #1a2438;
  font-family: MiSans-Demibold, sans-serif;
}
.hero {
  height: 338rpx;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 40rpx;
  background: #2b2f45;
}
.hero-title {
  font-size: 56rpx;
  font-weight: 700;
  letter-spacing: 6rpx;
  color: #f0d9a8;
}
.tabs {
  height: 88rpx;
  margin-top: 12rpx;
  background: #fff;
}
.tab-item {
  flex: 1;
  position: relative;
}
.tab-text {
  font-size: 28rpx;
  color: #999;
}
.tab-item.active .tab-text {
  color: #1a2438;
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
.item-box {
  padding: 24rpx 30rpx;
  margin-bottom: 12rpx;
  background: #fff;
  border-radius: 4rpx;
}
.my-box {
  background: #f0f4ea;
}
.who {
  width: 80%;
}
.my-num,
.user-num {
  width: 60rpx;
  flex-shrink: 0;
  font-size: 28rpx;
  color: #666;
}
.avatar {
  width: 60rpx;
  height: 60rpx;
  margin: 0 16rpx;
  border-radius: 50%;
  background: #ddd;
  flex-shrink: 0;
}
.me {
  font-size: 24rpx;
  color: #666;
}
.mr-4 {
  margin-right: 8rpx;
}
.my-mobile,
.user-name {
  font-size: 28rpx;
  color: #000;
}
.user-name {
  min-width: 0;
}
.my-value,
.user-value {
  font-size: 28rpx;
  color: #000;
}
</style>