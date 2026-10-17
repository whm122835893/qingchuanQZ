<template>
  <view class="container auth-page">
    <view class="auth-inner">
      <!-- 返回 -->
      <view class="nav-back" @click="goBack">
        <img class="back-icon" :src="asset('static/common/back_default.png')" mode="widthFix" />
      </view>

      <!-- 标题 -->
      <view class="hero">
        <text class="MiSans-Demibold hero-line">你好，</text>
        <text class="MiSans-Demibold hero-line">欢迎登录QingChuan!</text>
      </view>

      <!-- 表单 -->
      <view class="form">
        <view class="field flex flex-ai-center">
          <text class="MiSans-Regular label">手机号</text>
          <input
            v-model="form.account"
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
            placeholder="请输入登录密码"
            placeholder-class="ph"
            @keyup.enter="doLogin"
          />
        </view>

        <view class="links flex flex-ai-center flex-js-sb">
          <view class="flex flex-ai-center">
            <text class="MiSans-Regular">没有账号？</text>
            <text class="MiSans-Regular link" @click="goRegister">去注册</text>
          </view>
          <text class="MiSans-Regular link" @click="goForget">忘记密码</text>
        </view>

        <view class="btn-primary flex flex-ai-center flex-js-center" @click="doLogin">
          <text class="MiSans-Demibold">登录</text>
        </view>

        <view class="btn-secondary flex flex-ai-center flex-js-center" @click="goCodeLogin">
          <text class="MiSans-Regular">验证码登录</text>
        </view>
      </view>

      <!-- 协议 -->
      <view class="agree flex flex-ai-center">
        <img class="agree-icon" :src="asset('static/market/radio_sel.png')" mode="widthFix" @click="agreed = !agreed" />
        <view class="MiSans-Regular agree-text">
          <text>我已同意青川平台</text>
          <text class="link">《使用条款》</text>
          <text class="link">《隐私协议》</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '@/api'

defineOptions({ name: 'LoginPage' })

const router = useRouter()
const asset = (p) => import.meta.env.BASE_URL + p.replace(/^\//, '')

const form = reactive({ account: '', password: '' })
const agreed = ref(true)

async function doLogin() {
  if (!form.account) return uni.showToast({ title: '请输入手机号码', icon: 'none' })
  if (!form.password) return uni.showToast({ title: '请输入登录密码', icon: 'none' })
  try {
    const res = await api.login({ account: form.account, password: form.password })
    if (res && res.code === 1) {
      // 原站 token 位于 data.userinfo.token
      const info = (res.data && (res.data.userinfo || res.data.info)) || {}
      localStorage.setItem('token', info.token || '')
      uni.showToast({ title: '登录成功', icon: 'success' })
      setTimeout(() => router.back(), 800)
    } else {
      uni.showToast({ title: (res && res.msg) || '登录失败', icon: 'none' })
    }
  } catch (e) {
    uni.showToast({ title: '网络异常，请稍后重试', icon: 'none' })
  }
}

function goBack() {
  if (window.history.length > 1) router.back()
  else router.push('/')
}
function goRegister() { router.push('/pages/login/register') }
function goForget() { router.push('/pages/login/forgetPwd') }
function goCodeLogin() { router.push('/pages/login/verification') }
</script>

<style scoped>
.auth-page {
  display: block;
  width: 100%;
  box-sizing: border-box;
  padding: 0;
  min-height: 100vh;
  background: #fff url('/static/common/auth_bg.png') no-repeat 0 0 / 100% auto;
}
.auth-inner {
  padding: 0 24px;
  min-height: 100vh;
}
/* 返回按钮：h42 */
.nav-back {
  height: 42px;
  padding: 12px 0;
}
.back-icon {
  width: 8px;
  height: 14px;
}
/* 标题：mt20 */
.hero {
  margin-top: 20px;
}
.hero-line {
  display: block;
  font-size: 24px;
  line-height: 32.4px;
  color: #1a2438;
}
/* 表单：mt37 */
.form {
  margin-top: 37px;
}
.field {
  height: 59px;
  border-bottom: 1px solid #f3fcf9;
}
.label {
  width: 72px;
  font-size: 14px;
  line-height: 19px;
  color: #333;
}
.input {
  flex: 1;
  height: 58px;
  font-size: 14px;
  color: #333;
}
.ph {
  color: #c0c8c4;
  font-size: 14px;
}
/* 链接行：mt14 */
.links {
  height: 18px;
  margin-top: 14px;
  font-size: 13px;
  color: #4a4a4a;
}
.link {
  margin-left: 4px;
  font-size: 13px;
  line-height: 18px;
  color: #7ac386;
}
/* 主按钮：mt37 h47 */
.btn-primary {
  height: 47px;
  margin-top: 37px;
  background: #7ac386;
  border-radius: 24px;
}
.btn-secondary {
  height: 47px;
  margin-top: 14px;
  background: #f6f8fa;
  border-radius: 24px;
}
/* 协议：绝对定位底部 */
.agree {
  position: absolute;
  left: 24px;
  right: 24px;
  bottom: 130px;
  height: 18.4px;
}
.agree-icon {
  width: 14px;
  height: 14px;
  margin-right: 6px;
}
.agree-text {
  font-size: 11px;
  line-height: 18.4px;
  color: #999;
}
</style>