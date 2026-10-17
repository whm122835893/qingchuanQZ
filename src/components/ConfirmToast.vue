<template>
  <view>
    <view v-if="show" class="toast-mask" @click="$emit('update:show', false)"></view>
    <view v-if="show" class="toast-box">
      <view class="toast-content">{{ content }}</view>
      <view class="toast-btns flex">
        <view class="toast-btn flex flex-ai-center flex-js-center" @click="$emit('update:show', false)">
          取消
        </view>
        <view class="toast-btn ok flex flex-ai-center flex-js-center" @click="onOk">
          {{ okText }}
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
const props = defineProps({
  show: { type: Boolean, default: false },
  content: { type: String, default: '' },
  okText: { type: String, default: '确认' },
})
const emit = defineEmits(['update:show', 'ok'])
function onOk() {
  emit('update:show', false)
  emit('ok')
}
</script>

<style scoped>
@import '@/styles/atomic.css';
.toast-mask {
  position: fixed;
  inset: 0;
  z-index: 120;
  background: rgba(0, 0, 0, 0.5);
}
.toast-box {
  position: fixed;
  left: 50%;
  top: 50%;
  z-index: 121;
  width: 560rpx;
  transform: translate(-50%, -50%);
  border-radius: 12rpx;
  background: #fff;
}
.toast-content {
  padding: 40rpx 32rpx;
  text-align: center;
  font-size: 28rpx;
  color: #333;
}
.toast-btns {
  border-top: 1rpx solid #f0f0f0;
}
.toast-btn {
  flex: 1;
  height: 88rpx;
  font-size: 28rpx;
  color: #666;
}
.toast-btn.ok {
  color: #1a2438;
  font-weight: 500;
}
</style>