<template>
  <view class="modal-mask" @click.self="emit('close')">
    <view class="auth-popup ptb-26 br-12">
      <view class="close-row flex flex-js-end">
        <img class="close" :src="asset('static/icon/dele.png')" mode="aspectFit" @click="emit('close')" />
      </view>
      <text class="pt-10 text-center font-color-black auth-title"> 请输入操作密码 </text>
      <text class="font-color-textPrimary font-size-12 text-center auth-forget"> 忘记密码？ </text>
      <view class="flex flex-center mt-30 code-wrap">
        <input
          :value="pwd"
          class="code-input"
          type="number"
          maxlength="6"
          placeholder=" "
          @input="onInput"
        />
        <view class="code-cells">
          <view v-for="i in 6" :key="i" class="code-cell" :class="{ on: pwd.length >= i }"></view>
        </view>
      </view>
      <view class="auth-confirm flex flex-ai-center flex-js-center" @click="emit('confirm')">
        <text class="MiSans-Medium auth-confirm-text">确认注销</text>
      </view>
    </view>
  </view>
</template>

<script setup>
/** 原站操作密码校验弹层（u-popup mode=center round=12 + u-code-input dot） */
import { asset } from '@/utils/api'

defineOptions({ name: 'ActionPwdModal' })

const props = defineProps({ pwd: { type: String, default: '' } })
const emit = defineEmits(['close', 'confirm', 'update'])

function onInput(e) {
  emit('update', e.detail.value)
  // 与原站 u-code-input finish 行为一致：满 6 位自动提交
  if (e.detail.value.length === 6) emit('confirm')
}
</script>

<style scoped>
@import '@/styles/atomic.css';

.modal-mask {
  position: fixed;
  inset: 0;
  z-index: 200;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
}
.auth-popup {
  position: relative;
  width: 654rpx;
  background: #fff;
}
.close-row {
  padding: 24rpx 24rpx 0;
}
.close {
  width: 45rpx;
  height: 45rpx;
}
.auth-title {
  display: block;
  font-size: 32rpx;
  color: #000;
  margin-top: 20rpx;
}
.auth-forget {
  display: block;
  font-size: 24rpx;
  margin-top: 12rpx;
}
.code-wrap {
  position: relative;
  width: 100%;
  padding: 0 48rpx;
  box-sizing: border-box;
}
.code-input {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 84rpx;
  opacity: 0;
  z-index: 2;
}
.code-cells {
  display: flex;
  align-items: center;
  gap: 20rpx;
  width: 100%;
}
.code-cell {
  flex: 1;
  height: 84rpx;
  background: #ececec;
  border-radius: 16rpx;
}
.code-cell.on {
  background: #1d569e;
}
.auth-confirm {
  margin: 48rpx 48rpx 0;
  height: 92rpx;
  background: linear-gradient(90deg, #183c6a 0%, #1d569e 100%);
  border-radius: 46rpx;
}
.auth-confirm-text {
  font-size: 30rpx;
  color: #fff;
}
</style>
