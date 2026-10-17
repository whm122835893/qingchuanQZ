<template>
  <view class="pwd-popup">
    <view class="flex flex-js-end">
      <img class="close" :src="asset('static/icon/dele.png')" mode="aspectFit" @click="close" />
    </view>
    <text class="MiSans-Demibold pwd-title">{{ title }}</text>

    <view class="flex flex-js-center code-wrap">
      <input
        class="code-input"
        type="number"
        maxlength="6"
        :placeholder="placeholder"
        placeholder-class="ph"
        @input="onInput"
      />
      <view class="code-cells">
        <view v-for="i in 6" :key="i" class="code-cell" :class="{ on: pwd.length >= i }"></view>
      </view>
    </view>

    <view class="MiSans-Regular pwd-tip" @click="$emit('forget')">
      忘记密码？使用 <text class="link">实名认证</text>
    </view>
  </view>
</template>

<script setup>
/**
 * 操作密码输入弹层（regift/regift 内嵌，对应原站 u-popup mode=center + u-code-input dot）。
 * 与项目内既有的 ActionPwdModal（注销场景，按钮文案固定为「确认注销」）区分开。
 */
import { asset } from '@/utils/api'

defineOptions({ name: 'RegiftPwdPopup' })

const props = defineProps({
  pwd: { type: String, default: '' },
  title: { type: String, default: '请输入操作密码' },
  placeholder: { type: String, default: '请输入6位操作密码' },
})
const emit = defineEmits(['close', 'forget', 'update', 'finish'])

function close() {
  emit('close')
}
function onInput(e) {
  const v = e.detail.value
  emit('update', v)
  // 与原站 u-code-input finish 一致：满 6 位自动提交
  if (v.length === 6) emit('finish', v)
}
</script>

<style scoped>
@import '@/styles/atomic.css';

.pwd-popup {
  position: fixed;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  z-index: 41;
  width: 600rpx;
  padding: 32rpx 40rpx 40rpx;
  background: #fff;
  border-radius: 20rpx;
  box-sizing: border-box;
}
.close {
  width: 32rpx;
  height: 32rpx;
}
.pwd-title {
  display: block;
  margin-top: 8rpx;
  text-align: center;
  font-size: 32rpx;
  color: #1a2438;
}
.code-wrap {
  position: relative;
  margin-top: 32rpx;
}
.code-input {
  position: absolute;
  left: -999rpx;
  height: 60rpx;
}
.code-cells {
  display: flex;
}
.code-cell {
  width: 56rpx;
  height: 56rpx;
  margin: 0 8rpx;
  border-radius: 50%;
  background: #dfe3ea;
}
.code-cell.on {
  background: #1a2438;
}
.ph {
  color: #bbb;
  font-size: 28rpx;
}
.pwd-tip {
  margin-top: 40rpx;
  text-align: center;
  font-size: 24rpx;
  color: #999;
}
.link {
  color: #5a9a45;
}
</style>