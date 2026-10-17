<template>
  <scroll-view class="table-scroll mlr-26" scroll-y>
    <!-- 买盘 / 卖盘：价格 / 数量 / 合计 + 深度条 -->
    <view v-if="current !== 'deal'">
      <view class="thead flex">
        <text class="c-price">价格(CNY)</text>
        <text class="c-num text-right">数量</text>
        <text class="c-total text-right">合计(CNY)</text>
      </view>
      <view v-for="(r, i) in rows" :key="current + i" class="trow flex">
        <view class="depth-bar" :class="current === 'bid' ? 'up-bg' : 'down-bg'" :style="depthStyle(i)"></view>
        <text class="c-price" :class="current === 'bid' ? 'up' : 'down'">{{ r.price }}</text>
        <text class="c-num text-right">{{ r.num }}</text>
        <text class="c-total text-right">{{ r.total }}</text>
      </view>
    </view>

    <!-- 成交明细 -->
    <view v-else>
      <view class="thead flex">
        <text class="c-time">时间</text>
        <text class="c-price text-right">价格(CNY)</text>
        <text class="c-num text-right">数量</text>
        <text class="c-total text-right">合计(CNY)</text>
      </view>
      <view v-for="(d, i) in deals" :key="i" class="trow flex">
        <text class="c-time">{{ d.time }}</text>
        <text class="c-price text-right">{{ d.price }}</text>
        <text class="c-num text-right">{{ d.num }}</text>
        <text class="c-total text-right">{{ d.total }}</text>
      </view>
    </view>

    <view v-if="!rows.length && !deals.length" class="empty-box">
      <text class="MiSans-Regular empty-text">暂无数据</text>
    </view>
  </scroll-view>
</template>

<script setup>
/**
 * 行情买卖盘 / 成交明细表（kline/info 内嵌）。
 * 深度条按当前列表数量的最大值归一化。
 */
defineOptions({ name: 'KlineOrderBook' })

const props = defineProps({
  current: { type: String, default: 'bid' },
  rows: { type: Array, default: () => [] },
  deals: { type: Array, default: () => [] },
})

function depthStyle(i) {
  const rows = props.rows
  if (!rows.length) return { width: '0%' }
  const max = Math.max(...rows.map((r) => Number(r.num) || 0)) || 1
  return { width: Math.round(((Number(rows[i].num) || 0) / max) * 100) + '%' }
}
</script>

<style scoped>
@import '@/styles/atomic.css';

.table-scroll {
  flex: 1;
  min-height: 480rpx;
  margin-top: 16rpx;
  background: #2b3050;
  border-radius: 8rpx;
  padding: 0 20rpx;
}
.mlr-26 {
  margin-left: 26rpx;
  margin-right: 26rpx;
}
.thead {
  height: 64rpx;
  align-items: center;
}
.trow {
  position: relative;
  height: 60rpx;
  align-items: center;
}
.c-time {
  width: 160rpx;
  flex-shrink: 0;
  font-size: 22rpx;
  color: #c8ccd8;
}
.c-price {
  flex: 1;
  font-size: 24rpx;
  color: #e8eaf0;
}
.c-num {
  width: 150rpx;
  flex-shrink: 0;
  font-size: 24rpx;
  color: #e8eaf0;
}
.c-total {
  width: 180rpx;
  flex-shrink: 0;
  font-size: 24rpx;
  color: #e8eaf0;
}
.up {
  color: #3ad32a;
}
.down {
  color: #f0554e;
}
.depth-bar {
  position: absolute;
  right: 0;
  top: 6rpx;
  bottom: 6rpx;
  z-index: 0;
}
.depth-bar.up-bg {
  background: rgba(58, 211, 42, 0.16);
}
.depth-bar.down-bg {
  background: rgba(240, 85, 78, 0.16);
}
.trow text,
.thead text {
  position: relative;
  z-index: 1;
}
.empty-box {
  padding: 120rpx 0;
  text-align: center;
}
.empty-text {
  font-size: 26rpx;
  color: #8a90a8;
}
</style>