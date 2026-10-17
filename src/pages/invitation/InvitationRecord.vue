<template>
  <view class="record-page">
    <PageNavbar title="邀请列表" />

    <!-- tab -->
    <view class="tabs-bar">
      <view
        v-for="(t, i) in tabList"
        :key="t"
        class="tab-item"
        :class="{ on: activeTab === i }"
        @click="activeTab = i"
      >
        <text class="MiSans-Medium tab-text">{{ t }}</text>
      </view>
    </view>

    <!-- 列表 -->
    <view v-if="current.length" class="table-card">
      <view class="table-head">
        <text class="MiSans-Medium head-cell">编号</text>
        <text class="MiSans-Medium head-cell">用户手机</text>
        <text class="MiSans-Medium head-cell">邀请结果</text>
      </view>
      <view v-for="(r, i) in current" :key="r.id || i" class="table-row">
        <text class="MiSans-Regular row-cell">{{ pad(i + 1) }}</text>
        <text class="MiSans-Regular row-cell">{{ r.mobile || r.nickname || '暂无手机号' }}</text>
        <text class="MiSans-Regular row-cell" :class="{ fail: isFail(r) }">{{ resultOf(r) }}</text>
      </view>
    </view>

    <view v-else class="empty-box">
      <img class="empty-img" :src="asset('static/empty/search1-empty.png')" mode="widthFix" />
      <text class="MiSans-Regular empty-text">暂无邀请记录</text>
    </view>
  </view>
</template>

<script setup>
/**
 * 原站 invitation/invitationrecord —— 邀请列表
 * 结构：导航 + tab（邀请成功 / 邀请失败）+ 表格（编号 / 用户手机 / 邀请结果）。
 */
import { computed, onMounted, ref } from 'vue'
import PageNavbar from '@/components/PageNavbar.vue'
import { asset, fetchInvitationRecord } from '@/utils/api'

defineOptions({ name: 'InvitationRecord' })

const tabList = ['邀请成功', '邀请失败']
const activeTab = ref(0)
const list = ref([])

onMounted(async () => {
  const data = await fetchInvitationRecord()
  list.value = (data && data.list) || []
})

/** status: 1 实名通过（成功）/ 0 待实名（待成功）/ 2 实名未通过（失败） */
const current = computed(() =>
  activeTab.value === 0 ? list.value.filter((r) => r.status !== 2) : list.value.filter((r) => r.status === 2)
)

function isFail(r) {
  return r.status === 2
}
function resultOf(r) {
  if (r.status === 1) return '成功'
  if (r.status === 2) return r.remark || '失败'
  return '待成功'
}
function pad(n) {
  return String(n).padStart(2, '0')
}
</script>

<style scoped>
@import '@/styles/atomic.css';

.record-page {
  min-height: 100vh;
  background: #f6f6f6;
  padding-bottom: 108rpx;
  box-sizing: border-box;
}

.tabs-bar {
  display: flex;
  align-items: center;
  background: #fff;
  border-bottom: 1rpx solid #f0f0f0;
}
.tab-item {
  flex: 1;
  height: 100rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}
.tab-item.on::after {
  content: '';
  position: absolute;
  left: 50%;
  bottom: 16rpx;
  width: 60rpx;
  height: 4rpx;
  background: #3b3b3b;
  border-radius: 2rpx;
  transform: translateX(-50%);
}
.tab-text {
  font-size: 28rpx;
  color: #666;
  white-space: nowrap;
}
.tab-item.on .tab-text {
  color: #333;
}

.table-card {
  margin: 20rpx;
  background: #fff;
  border-radius: 16rpx;
  overflow: hidden;
}
.table-head,
.table-row {
  display: flex;
  align-items: center;
  padding: 24rpx 0;
}
.table-head {
  border-bottom: 1rpx solid #f0f0f0;
}
.table-row {
  border-bottom: 1rpx solid #f0f0f0;
}
.table-row:last-child {
  border-bottom: none;
}
.head-cell {
  flex: 1;
  text-align: center;
  font-size: 28rpx;
  color: #333;
}
.head-cell:nth-child(2) {
  flex: 2;
}
.row-cell {
  flex: 1;
  text-align: center;
  font-size: 28rpx;
  color: #333;
}
.row-cell:nth-child(2) {
  flex: 2;
}
.row-cell.fail {
  color: #f44336;
}

.empty-box {
  padding: 180rpx 0 80rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.empty-img {
  width: 300rpx;
}
.empty-text {
  margin-top: 24rpx;
  font-size: 26rpx;
  color: #999;
}
</style>