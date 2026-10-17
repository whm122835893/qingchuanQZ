<template>
  <view class="act-page">
    <PageNavbar title="活动中心" />

    <view class="banner">
      <img class="banner-img" :src="ossImg(bannerImg)" mode="aspectFill" />
    </view>

    <!-- 分类 tab -->
    <view class="tabs">
      <view
        v-for="t in tabs"
        :key="t.key"
        class="tab"
        :class="{ active: current === t.key }"
        @click="current = t.key"
      >
        <text class="MiSans-Medium tab-text" :class="{ active: current === t.key }">{{ t.label }}</text>
      </view>
    </view>

    <!-- 活动卡片列表 -->
    <view class="pa-16">
      <view v-for="a in list" :key="a.id" class="act-card" @click="go(a.route)">
        <img class="act-cover" :src="ossImg(a.listimg)" mode="aspectFill" />
        <view class="act-body">
          <view class="act-head">
            <text class="MiSans-Demibold act-title text-overflow">{{ a.title }}</text>
            <text class="MiSans-Regular act-type" :class="'t' + a.type">{{ typeOf(a.type) }}</text>
          </view>
          <text class="MiSans-Regular act-qualify">{{ a.qualify }}</text>
          <view class="act-meta">
            <text class="MiSans-Regular act-time">{{ a.start_time }} 至 {{ a.end_time }}</text>
          </view>
          <view class="act-foot">
            <text class="MiSans-Regular act-join">{{ a.join_num }} 人已参与</text>
            <view class="act-btn">
              <text class="MiSans-Demibold act-btn-text">立即参与</text>
            </view>
          </view>
        </view>
      </view>

      <view v-if="!list.length" class="empty-box">
        <text class="MiSans-Regular empty-text">暂无活动</text>
      </view>
    </view>
  </view>
</template>

<script setup>
/**
 * 原站 activeSelected/activeSelected —— 活动中心
 * 结构：顶部 banner + 分类 tab（最新活动 / 活动中心 / 抽奖中心）+ 活动卡片列表（封面图、标题、类型角标、参与条件、活动时间、参与人数、立即参与按钮）。
 * 说明：mock 中 route 指向对应活动页，点击整卡跳转。
 */
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import PageNavbar from '@/components/PageNavbar.vue'
import { fetchActiveSelectedList } from '@/utils/api'
import { ossImg } from '@/api'

defineOptions({ name: 'ActiveSelected' })

const router = useRouter()

const tabs = [
  { key: 'latest', label: '最新活动' },
  { key: 'center', label: '活动中心' },
  { key: 'lottery', label: '抽奖中心' }
]
const current = ref('center')

const all = ref([])
const bannerImg = ref('/uploads/20261015/6f1a83e2a2f0e0f9e4a1c2a4e2b3d4c1.jpg')

onMounted(async () => {
  const data = await fetchActiveSelectedList()
  all.value = Array.isArray(data) ? data : []
})

const list = computed(() => {
  if (current.value === 'lottery') return all.value.filter((a) => a.type === 2)
  if (current.value === 'latest') return all.value.slice().sort((a, b) => b.id - a.id)
  return all.value
})

/** type: 1 合成 / 2 抽奖 / 3 盲盒 / 4 签到 */
function typeOf(t) {
  return { 1: '合成', 2: '抽奖', 3: '盲盒', 4: '签到' }[t] || '活动'
}

function go(route) {
  if (route) router.push(route)
}
</script>

<style scoped>
@import '@/styles/atomic.css';

.act-page {
  min-height: 100vh;
  background: #f4f5f8;
  box-sizing: border-box;
}

.banner {
  padding: 0 16rpx;
}
.banner-img {
  width: 100%;
  height: 280rpx;
  border-radius: 16rpx;
}

.tabs {
  display: flex;
  align-items: center;
  height: 96rpx;
  padding: 0 16rpx;
}
.tab {
  margin-right: 48rpx;
  height: 96rpx;
  display: flex;
  align-items: center;
}
.tab-text {
  font-size: 30rpx;
  color: #666;
}
.tab-text.active {
  color: #1a2438;
  font-size: 34rpx;
}

.act-card {
  display: flex;
  padding: 24rpx;
  margin-bottom: 20rpx;
  background: #fff;
  border-radius: 16rpx;
}
.act-cover {
  width: 200rpx;
  height: 200rpx;
  border-radius: 12rpx;
  flex-shrink: 0;
}
.act-body {
  flex: 1;
  min-width: 0;
  margin-left: 20rpx;
  display: flex;
  flex-direction: column;
}
.act-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.act-title {
  flex: 1;
  min-width: 0;
  font-size: 30rpx;
  color: #1a2438;
}
.act-type {
  flex-shrink: 0;
  margin-left: 16rpx;
  padding: 4rpx 12rpx;
  border-radius: 6rpx;
  font-size: 20rpx;
  color: #fff;
  background: #e26f1b;
}
.act-type.t2 {
  background: #d2452f;
}
.act-type.t3 {
  background: #3f7fd6;
}
.act-type.t4 {
  background: #3aa76d;
}
.act-qualify {
  display: block;
  margin-top: 12rpx;
  font-size: 24rpx;
  color: #979997;
}
.act-meta {
  margin-top: 10rpx;
}
.act-time {
  font-size: 22rpx;
  color: #b6b8bb;
}
.act-foot {
  margin-top: auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.act-join {
  font-size: 24rpx;
  color: #979997;
}
.act-btn {
  padding: 10rpx 28rpx;
  border-radius: 32rpx;
  background: #e26f1b;
}
.act-btn-text {
  font-size: 24rpx;
  color: #fff;
}

.empty-box {
  padding: 120rpx 0;
  display: flex;
  justify-content: center;
}
.empty-text {
  font-size: 28rpx;
  color: #999;
}
</style>