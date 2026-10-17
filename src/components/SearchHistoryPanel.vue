<template>
  <view class="plr-16">
    <view class="flex flex-js-sb flex-ai-center pt-16 pb-24">
      <text class="MiSans-Regular his-title">搜索历史</text>
      <view class="del-btn" @click="$emit('clear')"></view>
    </view>
    <view class="flex flex-w">
      <view v-for="(h, i) in history" :key="i" class="his-item" @click="$emit('pick', h)">
        <text class="MiSans-Regular his-text">{{ h }}</text>
      </view>
      <view v-if="!history.length" class="his-empty">暂无搜索历史</view>
    </view>
  </view>
</template>

<script setup>
defineProps({
  history: { type: Array, default: () => [] },
})
defineEmits(['pick', 'clear'])
</script>

<style scoped>
@import '@/styles/atomic.css';
.his-title {
  font-size: 26rpx;
  color: #333;
}
.his-item {
  height: 56rpx;
  padding: 0 24rpx;
  margin: 0 16rpx 16rpx 0;
  display: flex;
  align-items: center;
  border-radius: 28rpx;
  background: #f4f6fa;
}
.his-text {
  font-size: 24rpx;
  color: #666;
}
.his-empty {
  font-size: 24rpx;
  color: #999;
}
.del-btn {
  width: 32rpx;
  height: 32rpx;
  position: relative;
}
.del-btn::before {
  content: '';
  position: absolute;
  left: 4rpx;
  top: 8rpx;
  width: 22rpx;
  height: 24rpx;
  border: 2rpx solid #999;
  border-radius: 0 0 6rpx 6rpx;
}
.del-btn::after {
  content: '';
  position: absolute;
  left: 1rpx;
  top: 4rpx;
  width: 28rpx;
  height: 3rpx;
  border-radius: 2rpx;
  background: #999;
}
</style>