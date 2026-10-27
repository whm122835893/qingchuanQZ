<template>
  <view>
    <!-- 遮罩（源站 u-popup mode=center 默认蒙层） -->
    <view v-if="show" class="toast-mask" @click="$emit('update:show', false)"></view>
    <!-- 源站 w-toast：宽 593rpx、圆角 38rpx、padding 24/30/32rpx -->
    <view v-if="show" class="w-toast">
      <!-- 右上关闭（源站 text-align:right + dele.png 44rpx） -->
      <view class="toast-close" @click="$emit('update:show', false)">
        <img class="close-img" :src="asset('static/icon/dele.png')" mode="aspectFit" />
      </view>
      <!-- 标题：源站默认「提示」40rpx 700 #000 居中 -->
      <view class="toast-title">{{ title }}</view>
      <!-- 内容：源站 toast-content 高 170rpx、flex 水平居中、28rpx #000 -->
      <view class="toast-content" :style="{ textAlign: contentAlign }">{{ content }}</view>
      <!-- 操作区：源站 toast-action margin-top 20rpx、flex 居中 -->
      <view class="toast-action">
        <view v-if="showCancel" class="toast-btn cancel" @click="$emit('update:show', false)">
          {{ cancelText }}
        </view>
        <view class="toast-btn submit" @click="onOk">{{ okText }}</view>
      </view>
    </view>
  </view>
</template>

<script setup>
/**
 * 源站 w-toast（模块 0242/414c/005d 双轨取证）：
 *   u-popup(show, bgColor=transparent, mode=center, round=16)
 *   └─ .w-toast：宽 593rpx、圆角 38rpx、padding 24rpx/30rpx/32rpx、白底
 *      ├─ 关闭行：text-align:right + dele.png 44rpx×44rpx → event(false)
 *      ├─ .toast-title：「提示」40rpx/700/#000/居中
 *      ├─ .toast-content：高 170rpx、padding-top 32rpx、28rpx/#000、flex 水平居中、text-align=contentAlign
 *      └─ .toast-action：margin-top 20rpx、flex 居中
 *         ├─ 取消（showCancel）：w-button 内联 #f3f4f8/42rpx/mr-24rpx/83rpx/#333/27rpx，宽 220rpx
 *         └─ 确认：w-button 内联 #718878/42rpx/83rpx/27rpx，宽 220rpx
 * 行为：event(a) → $emit('action', a) + $emit('change', false)；本地以 update:show + ok 承接。
 */
import { asset } from '@/utils/api'

const props = defineProps({
  show: { type: Boolean, default: false },
  title: { type: String, default: '提示' },
  content: { type: String, default: '' },
  okText: { type: String, default: '确认' },
  cancelText: { type: String, default: '取消' },
  showCancel: { type: Boolean, default: true },
  contentAlign: { type: String, default: 'center' },
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
/* 源站 .w-toast：宽 593rpx、圆角 38rpx、padding 24/30/32rpx */
.w-toast {
  position: fixed;
  left: 50%;
  top: 50%;
  z-index: 121;
  width: 593rpx;
  transform: translate(-50%, -50%);
  background: #fff;
  border-radius: 38rpx;
  padding: 24rpx 30rpx 32rpx;
  box-sizing: border-box;
}
/* 关闭行：右对齐 + 44rpx 图标 */
.toast-close {
  text-align: right;
}
.close-img {
  width: 44rpx;
  height: 44rpx;
}
/* 源站 .toast-title：40rpx/700/#000/居中 */
.toast-title {
  font-size: 40rpx;
  font-weight: 700;
  color: #000;
  text-align: center;
}
/* 源站 .toast-content：高 170rpx、上 padding 32rpx、28rpx/#000、flex 水平居中 */
.toast-content {
  height: 170rpx;
  padding-top: 32rpx;
  box-sizing: border-box;
  display: flex;
  justify-content: center;
  font-size: 28rpx;
  font-weight: 400;
  color: #000;
}
/* 源站 .toast-action：margin-top 20rpx、flex 居中 */
.toast-action {
  display: flex;
  justify-content: center;
  margin-top: 20rpx;
}
/* 源站 .toast-action > .z-btn：宽 220rpx；内联覆盖高 83rpx、圆角 42rpx */
.toast-btn {
  width: 220rpx;
  height: 83rpx;
  border-radius: 42rpx;
  font-size: 27rpx;
  font-family: MiSans-Demibold;
  display: flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
  box-sizing: border-box;
}
.toast-btn.cancel {
  background: #f3f4f8;
  color: #333;
  margin-right: 24rpx;
}
.toast-btn.submit {
  background: #718878;
  color: #fff;
}
</style>
