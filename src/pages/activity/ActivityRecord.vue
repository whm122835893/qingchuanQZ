<template>
  <view class="record-page">
    <PageNavbar title="中签记录" />

    <view class="br-12 pa-16">
      <view v-for="(r, i) in list" :key="r.draw_sn" class="record-item">
        <view class="item-row">
          <view class="item-meta">
            <text class="MiSans-Medium sn">签号:{{ r.draw_sn }}</text>
            <text class="MiSans-Regular time">抽签时间:{{ r.draw_time }}</text>
          </view>
          <view class="tag" :class="statusOf(r).cls">
            <text class="MiSans-Regular tag-text">{{ statusOf(r).text }}</text>
          </view>
        </view>
        <view v-if="i + 1 !== list.length" class="divider"></view>
      </view>

      <view v-if="!list.length" class="empty-box">
        <img class="empty-img" :src="asset('static/empty/search1-empty.png')" mode="widthFix" />
        <text class="MiSans-Regular empty-text">暂无中签记录</text>
      </view>
    </view>
  </view>
</template>

<script setup>
/**
 * 原站 activity/record —— 中签记录
 * 结构：导航 + 记录卡（签号 + 抽签时间 + 状态标签：已中签 / 未中签 / 未开奖），条目间有分隔线。
 */
import { onMounted, ref } from 'vue'
import PageNavbar from '@/components/PageNavbar.vue'
import { asset, fetchActivityRecord } from '@/utils/api'

defineOptions({ name: 'ActivityRecord' })

const list = ref([])

onMounted(async () => {
  list.value = await fetchActivityRecord()
})

/** status: 1 已中签 / 2 未中签 / 0 未开奖 */
function statusOf(r) {
  if (r.status === 1) return { text: '已中签', cls: 'win' }
  if (r.status === 2) return { text: '未中签', cls: 'lose' }
  return { text: '未开奖', cls: 'lose' }
}
</script>

<style scoped>
@import '@/styles/atomic.css';

.record-page {
  min-height: 100vh;
  background: #f4f5f8;
  padding: 0 24rpx 60rpx;
  box-sizing: border-box;
}

.record-item {
  width: 100%;
}
.item-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.item-meta {
  flex: 1;
  min-width: 0;
}
.sn {
  display: block;
  font-size: 28rpx;
  color: #1a2438;
}
.time {
  display: block;
  margin-top: 8rpx;
  font-size: 24rpx;
  color: #999;
}
.tag {
  flex-shrink: 0;
  margin-left: 20rpx;
  padding: 4rpx 14rpx;
  border-radius: 6rpx;
}
.tag.win {
  background: #ff8a00;
}
.tag.lose {
  background: #afafaf;
}
.tag-text {
  font-size: 20rpx;
  color: #fff;
}
.divider {
  height: 1rpx;
  margin: 24rpx 0;
  background: #eee;
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