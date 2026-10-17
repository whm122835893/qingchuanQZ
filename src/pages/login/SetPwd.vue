<template>
  <view class="set-pwd-page">
    <view class="tnav flex flex-ai-center">
      <view class="tnav-left" @click="goBack">
        <img class="tnav-back" :src="asset('static/common/back_white.png')" mode="widthFix" />
      </view>
      <text class="tnav-title">设置密码</text>
    </view>

    <view class="login-center">
      <view class="title">
        <text class="title-main">设置新密码</text>
      </view>

      <view class="ipt-row flex flex-ai-center">
        <input
          v-model="form.newpassword"
          class="ipt flex-1"
          :password="ispwd"
          placeholder="请输入新密码"
          placeholder-class="ph"
        />
        <text v-if="form.newpassword" class="eye" @click="ispwd = !ispwd">{{ ispwd ? '隐藏' : '显示' }}</text>
      </view>

      <view class="ipt-row mt-20 flex flex-ai-center">
        <input
          v-model="form.re_password"
          class="ipt flex-1"
          :password="ispwd2"
          placeholder="请再次输入新密码"
          placeholder-class="ph"
        />
        <text v-if="form.re_password" class="eye" @click="ispwd2 = !ispwd2">{{ ispwd2 ? '隐藏' : '显示' }}</text>
      </view>

      <text class="hint">密码内需同时包含数字、字母，长度在6-12之间</text>

      <view class="login-btn flex flex-ai-center flex-js-center" @click="confirm">
        <text class="MiSans-Demibold btn-text">确认</text>
      </view>
    </view>
  </view>
</template>

<script setup>
/**
 * 原站 login/setPwd —— 设置新密码
 * 由 verification.vue 校验验证码后跳转而来，两行密码 + 规则提示 + 确认按钮。
 */
import { onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { asset } from '@/utils/api'

defineOptions({ name: 'LoginSetPwdPage' })

const route = useRoute()
const router = useRouter()
const form = reactive({ newpassword: '', re_password: '' })
const ispwd = ref(true)
const ispwd2 = ref(true)

function goBack() {
  if (window.history.length > 1) router.back()
  else router.push('/pages/login/login')
}

function confirm() {
  const p = form.newpassword
  if (!p) return uni.showToast({ title: '请输入新密码', icon: 'none' })
  if (p.length < 6 || p.length > 12) return uni.showToast({ title: '密码长度需在6-12之间', icon: 'none' })
  if (!/[0-9]/.test(p) || !/[a-zA-Z]/.test(p)) {
    return uni.showToast({ title: '密码内需同时包含数字、字母', icon: 'none' })
  }
  if (p !== form.re_password) return uni.showToast({ title: '两次输入的密码不一致', icon: 'none' })
  uni.showToast({ title: '密码设置成功', icon: 'success' })
  setTimeout(() => router.replace('/pages/login/login'), 800)
}

onMounted(() => {
  if (route.query.back === 'forget') form.newpassword = ''
})
</script>

<style scoped>
.set-pwd-page {
  min-height: 100vh;
  background: #16192b;
  background-image: linear-gradient(180deg, #232744 0%, #16192b 60%);
  padding-bottom: 80rpx;
  box-sizing: border-box;
}
.tnav {
  position: relative;
  height: 88rpx;
  padding: 0 32rpx;
}
.tnav-left {
  width: 60rpx;
  display: flex;
  align-items: center;
}
.tnav-back {
  width: 34rpx;
}
.tnav-title {
  position: absolute;
  left: 182rpx;
  right: 182rpx;
  text-align: center;
  font-size: 34rpx;
  color: #fff;
  font-family: MiSans-Demibold, sans-serif;
}
.login-center {
  padding: 120rpx 64rpx 0;
}
.title-main {
  display: block;
  font-size: 36rpx;
  font-weight: 600;
  color: #fff;
}
.ipt-row {
  height: 100rpx;
  margin-top: 60rpx;
  border-bottom: 1rpx solid rgba(255, 255, 255, 0.18);
}
.ipt {
  height: 98rpx;
  font-size: 32rpx;
  color: #fff;
}
.ph {
  color: #6b7280;
  font-size: 28rpx;
}
.eye {
  flex-shrink: 0;
  margin-left: 16rpx;
  font-size: 24rpx;
  color: #8a90a8;
}
.hint {
  display: block;
  margin-top: 24rpx;
  font-size: 24rpx;
  color: #8a90a8;
}
.login-btn {
  height: 94rpx;
  margin-top: 72rpx;
  border-radius: 48rpx;
  background: #7ac386;
}
.btn-text {
  font-size: 32rpx;
  color: #fff;
}
</style>