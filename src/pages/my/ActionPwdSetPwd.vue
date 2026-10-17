<template>
  <view class="auth-page" :style="{ backgroundImage: `url(${asset('static/common/auth_bg.png')})` }">
    <view class="nav-back" @click="goBack">
      <img class="back-icon" :src="asset('static/common/back_default.png')" mode="widthFix" />
    </view>

    <view class="hero">
      <text class="MiSans-Demibold hero-line">你好，</text>
      <text class="MiSans-Demibold hero-line">请设置操作密码</text>
    </view>

    <view class="form">
      <view class="field flex flex-ai-center">
        <text class="MiSans-Regular label">操作密码</text>
        <input
          v-model="form.password"
          class="MiSans-Regular input flex-1" type="number"
          maxlength="6"
          :password="ispwd"
          placeholder="请输入6位数字"
          placeholder-class="ph"
        />
        <text v-if="form.password" class="eye-btn" @click="ispwd = !ispwd">{{ ispwd ? '隐藏' : '显示' }}</text>
      </view>

      <view class="field flex flex-ai-center">
        <text class="MiSans-Regular label">确认密码</text>
        <input
          v-model="form.re_password"
          class="MiSans-Regular input flex-1" type="number"
          maxlength="6"
          :password="ispwd2"
          placeholder="请再次输入6位数字"
          placeholder-class="ph"
        />
        <text v-if="form.re_password" class="eye-btn" @click="ispwd2 = !ispwd2">{{ ispwd2 ? '隐藏' : '显示' }}</text>
      </view>

      <view class="field flex flex-ai-center">
        <text class="MiSans-Regular label">手机号</text>
        <input
          v-model="form.mobile"
          class="MiSans-Regular input flex-1" type="number"
          maxlength="11"
          placeholder="请输入手机号码"
          placeholder-class="ph"
        />
      </view>

      <view class="field flex flex-ai-center">
        <text class="MiSans-Regular label">验证码</text>
        <input
          v-model="form.captcha"
          class="MiSans-Regular input flex-1" type="number"
          maxlength="6"
          placeholder="请输入手机验证码"
          placeholder-class="ph"
        />
        <text class="MiSans-Regular link" @click="getCode">{{ tips }}</text>
      </view>
    </view>

    <text class="MiSans-Regular tip">操作密码为6位数字，请妥善保管，用于转赠、寄售等敏感操作验证</text>

    <view class="btn-primary flex flex-ai-center flex-js-center" :class="{ disabled: !disabled }" @click="submit">
      <text class="MiSans-Demibold btn-text">确认</text>
    </view>
  </view>
</template>

<script setup>
/**
 * 原站 my/actionPwd/setPwd —— 设置操作密码
 * 字段：操作密码 / 确认密码（均 6 位，带明文切换）/ 手机号 / 短信验证码。
 * 原站倒计时文案由 u-code 组件给出：发送中为「Xs后重新发送」，结束后为「重新发送」。
 */
import { computed, onUnmounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { asset } from '@/utils/api'

defineOptions({ name: 'ActionPwdSetPwdPage' })

const router = useRouter()

const form = reactive({ password: '', re_password: '', mobile: '', captcha: '' })
const ispwd = ref(true)
const ispwd2 = ref(true)
const seconds = ref(60)
const isSend = ref(true)
let timer = null

const disabled = computed(
  () => form.password.length === 6 && form.password === form.re_password && !!form.mobile && !!form.captcha
)
const tips = computed(() => (isSend.value ? '重新发送' : `${seconds.value}s后重新发送`))

function goBack() {
  if (window.history.length > 1) router.back()
  else router.push('/pages/my/setting')
}

function getCode() {
  if (!isSend.value) return
  // 原站点击后先走人机验证（w-jy-verify），通过才发送短信并启动倒计时
  uni.showToast({ title: '原站发送验证码需人机验证', icon: 'none' })
  isSend.value = false
  seconds.value = 60
  timer = setInterval(() => {
    seconds.value -= 1
    if (seconds.value <= 0) {
      clearInterval(timer)
      timer = null
      isSend.value = true
    }
  }, 1000)
}

function submit() {
  if (!disabled.value) {
    uni.showToast({ title: '请完整填写并核对密码', icon: 'none' })
    return
  }
  uni.showToast({ title: '原站设置操作密码需人机验证', icon: 'none' })
}

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<style scoped>
@import '@/styles/atomic.css';

/* 与原站 auth-page 一致 */
.auth-page {
  min-height: 100vh;
  background-color: #fff;
  background-repeat: no-repeat;
  background-size: 100% 100%;
  background-position: top;
  padding: 0 48rpx 48rpx;
  box-sizing: border-box;
  position: relative;
}
.nav-back {
  padding: 24rpx 0;
  width: 60rpx;
}
.back-icon {
  width: 34rpx;
}
.hero {
  margin-top: 40rpx;
  display: flex;
  flex-direction: column;
}
.hero-line {
  font-size: 48rpx;
  color: #1a2438;
  line-height: 1.35;
}
.form {
  margin-top: 72rpx;
}
.field {
  height: 114rpx;
  border-bottom: 1px solid #f3fcf9;
}
.label {
  width: 140rpx;
  flex-shrink: 0;
  font-size: 28rpx;
  color: #333;
}
.input {
  font-size: 28rpx;
  color: #333;
  height: 100%;
}
.ph {
  color: #bbb;
  font-size: 28rpx;
}
.link {
  font-size: 26rpx;
  color: #7ac386;
  flex-shrink: 0;
}
.tip {
  display: block;
  margin-top: 16rpx;
  font-size: 20rpx;
  color: #bbb;
  line-height: 1.5;
}
.eye-btn {
  font-size: 24rpx;
  color: #999;
  flex-shrink: 0;
  padding-left: 16rpx;
}
.btn-primary {
  margin-top: 72rpx;
  height: 92rpx;
  background: #7ac386;
  border-radius: 48rpx;
}
.btn-primary.disabled {
  opacity: 0.45;
}
.btn-text {
  font-size: 25rpx;
  color: #fff;
}
</style>
