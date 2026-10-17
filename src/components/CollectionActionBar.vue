<template>
  <view class="action-wrap">
    <view class="product-action">
      <view class="action-container plr-16">
        <view
          v-for="b in buttons"
          :key="b.text"
          class="act-btn flex flex-ai-center flex-js-center"
          :class="{ gray: b.disabled }"
          @click="$emit('action', b)"
        >
          <text class="MiSans-Medium act-text">{{ b.text }}</text>
        </view>
      </view>
    </view>

    <view v-if="confirmCancel" class="toast-mask" @click="$emit('update:confirmCancel', false)">
      <view class="toast-box flex-center" @click.stop>
        <text class="MiSans-Regular toast-text">确认取消此寄售？</text>
        <view class="toast-actions flex">
          <view class="toast-btn flex-center" @click="$emit('update:confirmCancel', false)">
            <text class="MiSans-Regular">取消</text>
          </view>
          <view class="toast-btn flex-center" @click="$emit('confirm')">
            <text class="MiSans-Regular">确定</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
defineProps({
  buttons: { type: Array, default: () => [] },
  confirmCancel: { type: Boolean, default: false },
})
defineEmits(['action', 'confirm', 'update:confirmCancel'])
</script>

<style scoped>
@import '@/styles/atomic.css';
.product-action {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 16rpx;
  background: #fff;
}
.action-container {
  display: flex;
  gap: 20rpx;
}
.act-btn {
  flex: 1;
  height: 78rpx;
  border-radius: 39rpx;
  background: #1a2438;
}
.act-btn.gray {
  background: #d9dde3;
}
.act-text {
  font-size: 28rpx;
  color: #fff;
}
.toast-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 90;
}
.toast-box {
  width: 560rpx;
  padding: 40rpx 0 0;
  border-radius: 12rpx;
  background: #fff;
  flex-direction: column;
}
.toast-text {
  font-size: 28rpx;
  color: #333;
}
.toast-actions {
  width: 100%;
  margin-top: 32rpx;
  border-top: 1rpx solid #f0f0f0;
}
.toast-btn {
  flex: 1;
  height: 88rpx;
  font-size: 28rpx;
  color: #333;
}
</style>