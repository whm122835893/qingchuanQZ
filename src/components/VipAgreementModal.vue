<template>
  <view class="modal-mask" @click.self="emit('close')">
    <view class="vip-modal">
      <view class="flex flex-js-end mb-16">
        <text class="close-btn" @click="emit('close')">×</text>
      </view>
      <view class="w-modal">
        <view class="toast-title">开通VIP协议</view>
        <scroll-view class="agreement-scroll" scroll-y @scrolltolower="emit('scrolled')">
          <view class="mt-12">
            <text v-for="(p, i) in paragraphs" :key="i" class="agreement-para">{{ p }}</text>
          </view>
        </scroll-view>
        <view class="mt-10">
          <view class="flex flex-ai-center agree-row" @click="emit('toggle')">
            <view class="checkbox" :class="{ on: agreed }"></view>
            <text class="MiSans-Regular agree-label">我已阅读并同意以上协议（请下滑协议完成阅读）</text>
          </view>
        </view>
        <view class="toast-action flex">
          <view class="cancel-btn flex flex-ai-center flex-js-center" @click="emit('close')">
            <text class="MiSans-Medium cancel-text">取消</text>
          </view>
          <view
            class="confirm-btn flex flex-ai-center flex-js-center"
            :class="{ disabled: !agreed }"
            @click="emit('confirm')"
          >
            <text class="MiSans-Medium confirm-text">确认开通</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
/** 原站 vip-modal：开通VIP协议弹层（协议正文 + 勾选同意 + 取消/确认） */
defineOptions({ name: 'VipAgreementModal' })

defineProps({
  /** 协议正文段落 */
  paragraphs: { type: Array, default: () => [] },
  agreed: { type: Boolean, default: false },
})
const emit = defineEmits(['close', 'toggle', 'confirm', 'scrolled'])
</script>

<style scoped>
@import '@/styles/atomic.css';

.modal-mask {
  position: fixed;
  inset: 0;
  z-index: 200;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
}
.vip-modal {
  width: 654rpx;
  max-height: 80vh;
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx 32rpx 32rpx;
  box-sizing: border-box;
  overflow: hidden;
}
.close-btn {
  font-size: 44rpx;
  color: #666;
  line-height: 1;
}
.toast-title {
  text-align: center;
  font-size: 34rpx;
  font-weight: 600;
  color: #000;
  padding: 16rpx 0 24rpx;
}
.agreement-scroll {
  height: 600rpx;
  margin-top: 20rpx;
}
.agreement-para {
  display: block;
  font-size: 24rpx;
  line-height: 1.8;
  color: #666;
  margin-bottom: 16rpx;
}
.agree-row {
  padding: 8rpx 0;
}
.checkbox {
  width: 28rpx;
  height: 28rpx;
  border-radius: 50%;
  border: 2rpx solid #333;
  margin-right: 12rpx;
  flex-shrink: 0;
  box-sizing: border-box;
}
.checkbox.on {
  background: #333;
}
.agree-label {
  font-size: 24rpx;
  color: #666;
}
.toast-action {
  margin-top: 32rpx;
}
.toast-action .cancel-btn,
.toast-action .confirm-btn {
  flex: 1;
  height: 84rpx;
  border-radius: 42rpx;
}
.toast-action .cancel-btn {
  background: #f5f6fa;
}
.cancel-text {
  font-size: 30rpx;
  color: #8d90aa;
}
.toast-action .confirm-btn {
  margin-left: 16rpx;
  background: #333;
}
.toast-action .confirm-btn.disabled {
  opacity: 0.45;
}
.confirm-text {
  font-size: 30rpx;
  color: #fff;
}
</style>
