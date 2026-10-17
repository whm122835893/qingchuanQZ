<template>
  <view class="lottery-record-page">
    <PageNavbar title="中奖记录" />

    <view class="content">
      <view v-for="(r, i) in list" :key="r.id || i" class="record-card">
        <view class="win-item">
          <img class="thumb" :src="ossImg(r.listimg)" mode="aspectFill" />
          <view class="right">
            <text class="MiSans-Demibold name text-overflow">{{ r.name }}</text>
            <text class="MiSans-Regular time">{{ fmt(r.create_time) }}</text>
          </view>
        </view>
      </view>

      <view v-if="!list.length" class="empty-box">
        <img class="empty-img" :src="asset('static/empty/search1-empty.png')" mode="widthFix" />
        <text class="MiSans-Regular empty-text">暂无中奖记录</text>
      </view>
    </view>
  </view>
</template>

<script setup>
/**
 * 原站 lottery/record —— 中奖记录
 * 结构：导航 + 中奖记录列表（奖品缩略图 + 名称 + 编号 + 时间），空态「暂无中奖记录」。
 */
import { onMounted, ref } from 'vue'
import PageNavbar from '@/components/PageNavbar.vue'
import { asset, fetchLotteryRecord } from '@/utils/api'
import { ossImg } from '@/api'

defineOptions({ name: 'LotteryRecord' })

const list = ref([])

onMounted(async () => {
  list.value = await fetchLotteryRecord()
})

function fmt(v) {
  if (!v) return ''
  const d = new Date(Number(v) * 1000)
  if (Number.isNaN(d.getTime())) return String(v)
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}
</script>

<style scoped>
@import '@/styles/atomic.css';

.lottery-record-page {
  min-height: 100vh;
  background: #f4f5f8;
  box-sizing: border-box;
}

.content {
  margin: 15rpx;
  padding: 30rpx 15rpx;
  background: linear-gradient(90deg, #fbeaf4, #e0fbf2);
  border-radius: 14rpx;
}
.record-card {
  width: 100%;
  padding: 30rpx;
  margin-bottom: 24rpx;
  background: #fff;
  border-radius: 16.5rpx;
  box-sizing: border-box;
}
.win-item {
  display: flex;
  align-items: center;
  width: 100%;
  height: 112.5rpx;
  padding-left: 30rpx;
  background: linear-gradient(47deg, #ffdcc1, #ffefe3 48%, #fffae0);
  border-radius: 12rpx;
  box-sizing: border-box;
}
.thumb {
  width: 130rpx;
  height: 130rpx;
  margin-left: -6rpx;
  border-radius: 10rpx;
  background: #f0f1f4;
  flex-shrink: 0;
}
.right {
  flex: 1;
  min-width: 0;
  margin-left: 26rpx;
  display: flex;
  flex-direction: column;
}
.name {
  font-size: 30rpx;
  font-weight: 600;
  color: #ff812c;
}
.time {
  margin-top: 8rpx;
  font-size: 21rpx;
  color: #222;
}

.empty-box {
  padding: 160rpx 0 80rpx;
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