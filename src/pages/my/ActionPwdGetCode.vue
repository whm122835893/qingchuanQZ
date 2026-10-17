<template>
  <view class="auth-page" :style="{ backgroundImage: `url(${asset('static/common/auth_bg.png')})` }">
    <view class="nav-back" @click="goBack">
      <img class="back-icon" :src="asset('static/common/back_default.png')" mode="widthFix" />
    </view>

    <!-- action=set：输入当前操作密码 -->
    <template v-if="action === 'set'">
      <view class="hero">
        <text class="MiSans-Demibold hero-line">你好，</text>
        <text class="MiSans-Demibold hero-line">请输入当前操作密码</text>
      </view>

      <view class="pwd-boxes flex flex-js-center" style="margin-top: 72rpx">
        <view class="code-input flex flex-ai-center flex-js-center">
          <view
            v-for="i in 6"
            :key="i"
            class="code-dot"
            :class="{ on: oldPwd.length >= i }"
          ></view>
        </view>
      </view>

      <view class="links flex flex-ai-center flex-js-center" style="margin-top: 40rpx" @click="reset">
        <text class="MiSans-Regular forget">忘记密码？</text>
        <text class="MiSans-Regular link">去验证手机号</text>
      </view>
    </template>

    <!-- action=reset：验证手机号找回 -->
    <template v-else>
      <view class="hero">
        <text class="MiSans-Demibold hero-line">你好，</text>
        <text class="MiSans-Demibold hero-line">验证手机号找回操作密码</text>
      </view>

      <view class="form">
        <view class="field flex flex-ai-center">
          <text class="MiSans-Regular label">手机号</text>
          <input
            class="MiSans-Regular input flex-1"
            :value="userInfo.mobile || ''"
            disabled
            placeholder="请输入手机号码"
            placeholder-class="ph"
          />
        </view>
        <view class="field flex flex-ai-center">
          <text class="MiSans-Regular label">验证码</text>
          <input
            v-model="code"
            class="MiSans-Regular input flex-1" type="number"
            maxlength="6"
            placeholder="请输入手机验证码"
            placeholder-class="ph"
          />
          <text class="MiSans-Regular link" @click="sendCode">{{ countDown ? `${countDown}s后重新发送` : '获取验证码' }}</text>
        </view>
      </view>

      <view class="btn-primary flex flex-ai-center flex-js-center" :class="{ disabled: !code }" @click="submit">
        <text class="MiSans-Demibold btn-text">确认</text>
      </view>
    </template>
  </view>
</template>

<script setup>
/**
 * 原站 my/actionPwd/getCode —— 找回操作密码
 * 两种模式（由路由 query.action 决定）：
 *   set   校验当前操作密码（6 位数字），可「忘记密码」跳转到 reset
 *   reset 验证手机号 + 短信验证码后重设
 */
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { asset } from '@/utils/api'
import { fetchUserInfo } from '@/utils/api'

defineOptions({ name: 'ActionPwdGetCodePage' })

const route = useRoute()
const router = useRouter()

const action = computed(() => (route.query.action === 'reset' ? 'reset' : 'set'))
const userInfo = ref({})
const oldPwd = ref('')
const code = ref('')
const countDown = ref(0)
let timer = null

function goBack() {
  if (window.history.length > 1) router.back()
  else router.push('/pages/my/setting')
}

function reset() {
  router.replace({ path: '/pages/my/actionPwd/getCode', query: { action: 'reset' } })
}

function sendCode() {
  if (countDown.value > 0) return
  // 原站点击获取验证码会先走人机验证（w-jy-verify），验证通过才发短信
  uni.showToast({ title: '原站发送验证码需人机验证', icon: 'none' })
  countDown.value = 60
  timer = setInterval(() => {
    countDown.value -= 1
    if (countDown.value <= 0 && timer) {
      clearInterval(timer)
      timer = null
    }
  }, 1000)
}

function submit() {
  if (!code.value) {
    uni.showToast({ title: '请输入手机验证码', icon: 'none' })
    return
  }
  uni.showToast({ title: '原站校验需人机验证', icon: 'none' })
}

onMounted(async () => {
  const data = await fetchUserInfo()
  if (data) userInfo.value = data
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<style scoped>
@import '@/styles/atomic.css';

/* 与原站 auth-page 一致：背景图铺顶，底部安全区留白 */
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
/* 6 位密码格：原站 u-code-input dot 模式 */
.pwd-boxes {
  width: 100%;
}
.code-input {
  width: 100%;
  gap: 16rpx;
}
.code-dot {
  flex: 1;
  height: 88rpx;
  background: #f3f6f8;
  border-radius: 16rpx;
}
.code-dot.on {
  background: #7ac386;
}
.links {
  margin-top: 28rpx;
}
.forget {
  font-size: 26rpx;
  color: #666;
}
.link {
  font-size: 26rpx;
  color: #7ac386;
  flex-shrink: 0;
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
