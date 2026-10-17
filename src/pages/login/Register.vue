<template>
  <view class="auth-page">
    <view class="auth-inner">
      <view class="nav-back" @click="goBack">
        <img class="back-icon" :src="asset('static/common/back_default.png')" mode="widthFix" />
      </view>

      <view class="hero">
        <text class="MiSans-Demibold hero-line">你好，</text>
        <text class="MiSans-Demibold hero-line">欢迎注册QingChuan!</text>
      </view>

      <view class="form">
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
          <text class="MiSans-Regular label">登录密码</text>
          <input
            v-model="form.password"
            class="MiSans-Regular input flex-1"
            :password="ispwd"
            placeholder="请输入登录密码"
            placeholder-class="ph"
          />
          <text v-if="form.password" class="eye" @click="ispwd = !ispwd">{{ ispwd ? '隐藏' : '显示' }}</text>
        </view>
        <view class="field flex flex-ai-center">
          <text class="MiSans-Regular label">确认密码</text>
          <input
            v-model="form.re_password"
            class="MiSans-Regular input flex-1"
            :password="ispwd2"
            placeholder="请再次输入登录密码"
            placeholder-class="ph"
          />
          <text v-if="form.re_password" class="eye" @click="ispwd2 = !ispwd2">{{ ispwd2 ? '隐藏' : '显示' }}</text>
        </view>

        <text class="MiSans-Regular tip">密码格式：字母(区分大小写)、数字、符号，至少包含两种，密码长度大于等于8位数</text>

        <view class="field flex flex-ai-center">
          <text class="MiSans-Regular label">验证码</text>
          <input
            v-model="form.code"
            class="MiSans-Regular input flex-1" type="number"
            maxlength="6"
            placeholder="请输入验证码"
            placeholder-class="ph"
          />
          <text class="MiSans-Regular link" @click="sendCode">{{ tips }}</text>
        </view>

        <view class="field flex flex-ai-center">
          <text class="MiSans-Regular label">邀请码</text>
          <input
            v-model="form.inviter_code"
            class="MiSans-Regular input flex-1" placeholder="请输入邀请码（选填）"
            placeholder-class="ph"
          />
        </view>

        <view class="links flex flex-ai-center" @click="goLogin">
          <text class="MiSans-Regular links-text">已有账号？</text>
          <text class="MiSans-Regular link">去登录</text>
        </view>

        <view class="btn-primary flex flex-ai-center flex-js-center" @click="doRegister">
          <text class="MiSans-Demibold btn-text">注册</text>
        </view>
        <view class="btn-secondary flex flex-ai-center flex-js-center" @click="goLogin">
          <text class="MiSans-Regular btn-text dark">去登录</text>
        </view>
      </view>

      <view class="agree flex flex-ai-center" @click="checked = !checked">
        <img
          class="agree-icon"
          :src="asset(checked ? 'static/market/radio_sel.png' : 'static/market/radio_default.png')"
          mode="aspectFit"
        />
        <view class="MiSans-Regular agree-text">
          <text>我已同意青川平台</text>
          <text class="link" @click.stop="toAgreement('使用条款')">《使用条款》</text>
          <text class="link" @click.stop="toAgreement('隐私协议')">《隐私协议》</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
/**
 * 原站 login/register —— 注册
 * 复用 Login.vue 的 auth-page 视觉（背景图 auth_bg / 同款 field 输入行 / 同款主次按钮 / 底部协议）。
 * 字段：手机号 + 登录密码 + 确认密码 + 验证码（60s 倒计时）+ 邀请码（选填）。
 * 原站接w-jy-verify 极验滑块与 geetest 兜底验证码，此处仅保留入口提示，不引入第三方风控组件。
 */
import { onUnmounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { asset } from '@/utils/api'

defineOptions({ name: 'RegisterPage' })

const router = useRouter()
const form = reactive({ mobile: '', password: '', re_password: '', code: '', inviter_code: '' })
const ispwd = ref(true)
const ispwd2 = ref(true)
const checked = ref(true)
const tips = ref('获取验证码')
let timer = null

function goBack() {
  if (window.history.length > 1) router.back()
  else router.push('/')
}
function goLogin() {
  router.push('/pages/login/login')
}
function toAgreement(title) {
  router.push({ path: '/pages/agreement/agreement', query: { title } })
}

function sendCode() {
  if (timer) return
  if (!form.mobile) return uni.showToast({ title: '请输入手机号码', icon: 'none' })
  if (form.mobile.length !== 11) return uni.showToast({ title: '手机号格式不正确', icon: 'none' })
  uni.showToast({ title: '原站此处需通过滑块验证', icon: 'none' })
  let s = 60
  tips.value = '重新发送 ' + s + 's'
  timer = setInterval(() => {
    s -= 1
    tips.value = s > 0 ? '重新发送 ' + s + 's' : '重新发送'
    if (s <= 0) {
      clearInterval(timer)
      timer = null
    }
  }, 1000)
}

function doRegister() {
  if (!form.mobile) return uni.showToast({ title: '请输入手机号码', icon: 'none' })
  if (!form.password) return uni.showToast({ title: '请输入登录密码', icon: 'none' })
  if (form.password !== form.re_password) return uni.showToast({ title: '两次输入的密码不一致', icon: 'none' })
  if (!form.code) return uni.showToast({ title: '请输入验证码', icon: 'none' })
  if (!checked.value) return uni.showToast({ title: '请先同意使用条款与隐私协议', icon: 'none' })
  uni.showToast({ title: '注册成功', icon: 'success' })
  setTimeout(() => router.replace('/pages/login/login'), 800)
}

onUnmounted(() => timer && clearInterval(timer))
</script>

<style scoped>
.auth-page {
  width: 100%;
  min-height: 100vh;
  box-sizing: border-box;
  background: #fff url('/static/common/auth_bg.png') no-repeat 0 0 / 100% auto;
}
.auth-inner {
  padding: 0 48rpx;
  min-height: 100vh;
}
.nav-back {
  height: 84rpx;
  padding: 24rpx 0;
}
.back-icon {
  width: 34rpx;
}
.hero {
  margin-top: 40rpx;
}
.hero-line {
  display: block;
  font-size: 48rpx;
  line-height: 64rpx;
  color: #1a2438;
}
.form {
  margin-top: 74rpx;
}
.field {
  height: 118rpx;
  border-bottom: 1rpx solid #f3fcf9;
}
.label {
  width: 144rpx;
  font-size: 28rpx;
  line-height: 38rpx;
  color: #333;
}
.input {
  flex: 1;
  height: 116rpx;
  font-size: 28rpx;
  color: #333;
}
.ph {
  color: #c0c8c4;
  font-size: 28rpx;
}
.eye {
  font-size: 24rpx;
  color: #999;
  flex-shrink: 0;
  padding-left: 12rpx;
}
.tip {
  display: block;
  padding: 16rpx 0 24rpx;
  font-size: 22rpx;
  line-height: 32rpx;
  color: #999;
}
.links {
  margin-top: 28rpx;
}
.links-text {
  font-size: 26rpx;
  color: #666;
}
.link {
  margin-left: 8rpx;
  font-size: 26rpx;
  line-height: 36rpx;
  color: #7ac386;
}
.btn-primary {
  height: 94rpx;
  margin-top: 74rpx;
  border-radius: 48rpx;
  background: #7ac386;
}
.btn-secondary {
  height: 94rpx;
  margin-top: 28rpx;
  border-radius: 48rpx;
  background: #f6f8fa;
}
.btn-text {
  font-size: 50rpx;
  color: #fff;
}
.btn-text.dark {
  font-size: 50rpx;
  color: #333;
}
.agree {
  position: absolute;
  left: 48rpx;
  right: 48rpx;
  bottom: 260rpx;
  min-height: 37rpx;
}
.agree-icon {
  width: 28rpx;
  height: 28rpx;
  margin-right: 12rpx;
  flex-shrink: 0;
}
.agree-text {
  font-size: 22rpx;
  line-height: 37rpx;
  color: #999;
}
</style>