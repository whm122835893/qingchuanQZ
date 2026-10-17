<template>
  <view class="verify-page">
    <!-- 深色沉浸式容器（原站 page-bg-colorfull） -->
    <view class="tnav flex flex-ai-center">
      <view class="tnav-left" @click="goBack">
        <img class="tnav-back" :src="asset('static/common/back_white.png')" mode="widthFix" />
      </view>
      <text class="tnav-title">验证码登录</text>
    </view>

    <view class="login-center">
      <view class="title">
        <text class="title-main">请输入验证码</text>
        <text class="hint">已发送至+86 {{ maskedMobile }}</text>
      </view>

      <view class="ipt-row flex flex-ai-center">
        <input
          v-model="code"
          class="ipt flex-1" type="number"
          maxlength="6"
          placeholder="请输入验证码"
          placeholder-class="ph"
          @keyup.enter="nextStep"
        />
        <text class="resend" :class="{ off: sending }" @click="resend">{{ tips }}</text>
      </view>

      <view class="login-btn flex flex-ai-center flex-js-center" @click="nextStep">
        <text class="MiSans-Demibold btn-text">下一步</text>
      </view>
    </view>
  </view>
</template>

<script setup>
/**
 * 原站 login/verification —— 验证码登录/验证
 * 手机号从路由 query 取（Login.vue「验证码登录」跳转时携带）。
 * 60s 倒计时重发；下一步原站跳 /pages/login/setPwd。
 */
import { computed, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { asset } from '@/utils/api'

defineOptions({ name: 'LoginVerificationPage' })

const route = useRoute()
const router = useRouter()

const code = ref('')
const tips = ref('(重新发送 60s)')
const sending = ref(true)
let timer = null

const maskedMobile = computed(() => {
  const m = String(route.query.mobile || '138****8888')
  return m.length === 11 ? m.replace(/^(\d{3})\d{4}(\d{4})$/, '$1****$2') : m
})

function goBack() {
  if (window.history.length > 1) router.back()
  else router.push('/pages/login/login')
}

function startCountdown() {
  if (timer) clearInterval(timer)
  let s = 60
  sending.value = true
  tips.value = '(重新发送 ' + s + 's)'
  timer = setInterval(() => {
    s -= 1
    if (s <= 0) {
      tips.value = '(重新发送)'
      sending.value = false
      clearInterval(timer)
      timer = null
    } else {
      tips.value = '(重新发送 ' + s + 's)'
    }
  }, 1000)
}

function resend() {
  if (sending.value) return
  uni.showToast({ title: '原站此处需通过滑块验证', icon: 'none' })
  startCountdown()
}

function nextStep() {
  if (!/^\d{6}$/.test(code.value)) {
    return uni.showToast({ title: '请输入6位验证码', icon: 'none' })
  }
  router.push({ path: '/pages/login/setPwd', query: { mobile: route.query.mobile || '' } })
}

onUnmounted(() => timer && clearInterval(timer))
</script>

<style scoped>
.verify-page {
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
.hint {
  display: block;
  margin-top: 16rpx;
  font-size: 24rpx;
  color: #8a90a8;
}
.ipt-row {
  height: 100rpx;
  margin-top: 72rpx;
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
.resend {
  flex-shrink: 0;
  margin-left: 16rpx;
  font-size: 24rpx;
  color: #7ac386;
}
.resend.off {
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