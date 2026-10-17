<template>
  <view>
    <!-- 资产概览 -->
    <view class="summary">
      <view class="summary-row">
        <view class="summary-cell">
          <text class="MiSans-Demibold summary-num">{{ totalNum }}</text>
          <text class="MiSans-Regular summary-label">持有藏品</text>
        </view>
        <view class="summary-cell">
          <text class="MiSans-Demibold summary-num">{{ totalValue }}</text>
          <text class="MiSans-Regular summary-label">总价值(元)</text>
        </view>
        <view class="summary-cell">
          <text class="MiSans-Demibold summary-num">{{ floorText }}</text>
          <text class="MiSans-Regular summary-label">地板价(元)</text>
        </view>
      </view>
    </view>

    <!-- 分类 tab（原站 w-tabs lineColor #FFAA2D） -->
    <view class="mc-tab-bar flex">
      <view
        v-for="t in tabs"
        :key="t.types"
        class="mc-tab-item flex flex-ai-center flex-js-center"
        :class="{ active: types === t.types }"
        @click="$emit('change', t.types)"
      >
        <text class="MiSans-Medium mc-tab-text">{{ t.name }}</text>
        <text v-if="t.count" class="MiSans-Regular mc-tab-count">{{ t.count }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
defineProps({
  totalNum: { type: [Number, String], default: 0 },
  totalValue: { type: [Number, String], default: '0.00' },
  floorText: { type: [Number, String], default: '0.00' },
  tabs: { type: Array, default: () => [] },
  types: { type: Number, default: 1 },
})
defineEmits(['change'])
</script>

<style scoped>
@import '@/styles/atomic.css';
.summary {
  margin: 16rpx 16rpx 0;
  padding: 24rpx 0;
  border-radius: 12rpx;
  background: #fff;
}
.summary-row {
  display: flex;
}
.summary-cell {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.summary-num {
  font-size: 34rpx;
  color: #000;
}
.summary-label {
  margin-top: 8rpx;
  font-size: 20rpx;
  color: #999;
}
.mc-tab-bar {
  margin-top: 16rpx;
  padding: 0 8rpx;
  height: 88rpx;
  background: #fff;
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
}
.mc-tab-bar::-webkit-scrollbar {
  display: none;
}
.mc-tab-item {
  position: relative;
  flex: 1 0 auto;
  min-width: 150rpx;
  height: 88rpx;
  padding: 0 20rpx;
  white-space: nowrap;
}
/* 源站 u-tabs 选中态：文字下方 34rpx 橙色指示条。
   容器开了 overflow-x:auto，会裁掉 ::after，故改为给文字加 border。 */
.mc-tab-text {
  position: relative;
  font-size: 26rpx;
  color: #999;
  white-space: nowrap;
  padding-bottom: 8rpx;
  border-bottom: 6rpx solid transparent;
}
.mc-tab-item.active .mc-tab-text {
  color: #000;
  border-bottom-color: #ffaa2d;
}
.mc-tab-count {
  margin-left: 6rpx;
  font-size: 20rpx;
  color: #ffaa2d;
}
</style>