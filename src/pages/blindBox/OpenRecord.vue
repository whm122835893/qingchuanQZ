<template>
  <view class="open-record-page">
    <PageNavbar title="开盒记录" />

    <view class="list">
      <view v-for="(r, i) in list" :key="r.id || i" class="record-item">
        <view class="left">
          <view class="thumb-wrap">
            <img class="thumb" :src="ossImg(r.listimg)" mode="aspectFill" />
            <img class="thumb-rarity" :src="ossImg(r.rarity_icon)" mode="aspectFit" />
          </view>
          <view class="meta">
            <text class="MiSans-Medium box-name text-overflow-2">{{ r.box_name || '盲盒' }}</text>
            <text class="MiSans-Regular code">#{{ r.collection_code }}</text>
            <text class="MiSans-Regular time">{{ fmt(r.createtime) }}</text>
          </view>
        </view>
        <view class="right">
          <text class="MiSans-Regular draw-label">抽中</text>
          <text class="MiSans-Medium draw-name text-overflow">{{ r.name }}</text>
        </view>
      </view>

      <view v-if="!list.length" class="empty-box">
        <img class="empty-img" :src="asset('static/empty/search1-empty.png')" mode="widthFix" />
        <text class="MiSans-Regular empty-text">暂无开盒记录</text>
      </view>
    </view>
  </view>
</template>

<script setup>
/**
 * 原站 blindBox/openRecord —— 开盒记录
 * 结构：导航 + 记录列表（盲盒缩略图 + 盲盒名 + 藏品编号 + 时间 ｜ 抽中藏品名）。
 */
import { onMounted, ref } from 'vue'
import PageNavbar from '@/components/PageNavbar.vue'
import { asset, fetchBlindBoxOpenRecord } from '@/utils/api'
import { ossImg } from '@/api'

defineOptions({ name: 'BlindBoxOpenRecord' })

const list = ref([])

onMounted(async () => {
  list.value = await fetchBlindBoxOpenRecord()
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

.open-record-page {
  min-height: 100vh;
  background: #f4f5f8;
  box-sizing: border-box;
}

.record-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx 32rpx;
  background: #fff;
  border-bottom: 1rpx solid #f2f2f2;
}
.left {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
}
.thumb-wrap {
  position: relative;
  width: 118rpx;
  height: 118rpx;
  flex-shrink: 0;
}
.thumb {
  width: 118rpx;
  height: 118rpx;
  border-radius: 8rpx;
  background: #f0f1f4;
}
.thumb-rarity {
  position: absolute;
  right: -10rpx;
  bottom: -10rpx;
  width: 60rpx;
  height: 56rpx;
}
.meta {
  flex: 1;
  min-width: 0;
  margin-left: 24rpx;
  display: flex;
  flex-direction: column;
}
.box-name {
  font-size: 28rpx;
  color: #1a2438;
}
.code {
  margin-top: 10rpx;
  font-size: 22rpx;
  color: #666;
}
.time {
  margin-top: 8rpx;
  font-size: 20rpx;
  color: #999;
}
.right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  max-width: 240rpx;
  margin-left: 20rpx;
}
.draw-label {
  font-size: 22rpx;
  color: #999;
}
.draw-name {
  margin-top: 8rpx;
  font-size: 26rpx;
  color: #1a2438;
  text-align: right;
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