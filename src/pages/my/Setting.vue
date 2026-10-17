<template>
  <view class="setting-page pb-13 font-size-14">
    <PageNavbar title="设置" />

    <!-- 账号与安全 -->
    <view class="group flex flex-dir-col mlr-16 bg-color-white br-12 mt-12">
      <view
        v-for="(g, gi) in groups"
        :key="gi"
        class="card-view"
        :style="cardRadius(gi, gi === groups.length - 1)"
        @click="onTap(g)"
      >
        <view class="flex flex-ai-center flex-js-sb">
          <text class="MiSans-Regular flex-1 font-color-black ml-8">{{ g.label }}</text>
          <text v-if="g.value" class="MiSans-Regular font-size-12 font-color-999">{{ g.value }}</text>
          <img class="row-arrow" :src="asset('static/icon/arrow-right-black.png')" mode="aspectFit" />
        </view>
      </view>
    </view>

    <!-- 退出登录确认 -->
    <view v-if="showLogout" class="modal-mask" @click.self="showLogout = false">
      <view class="modal-box">
        <text class="modal-title">提示</text>
        <text class="modal-body">您确定要退出当前账号吗?</text>
        <view class="modal-btns">
          <view class="modal-btn" @click="showLogout = false">取消</view>
          <view class="modal-btn primary" @click="doLogout">确认</view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
/**
 * 原站 my/setting —— 设置
 * 三组入口：个人信息 / 实名认证·隐私设置·登录密码·操作密码·地址管理·关于我们 / 注销账号·退出登录。
 */
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import PageNavbar from '@/components/PageNavbar.vue'
import { asset } from '@/utils/api'

defineOptions({ name: 'MySettingPage' })

const router = useRouter()
const logoutOpen = ref(false)

/** 入口分组，path 与原站 jumpcatalog 目标一致；action 为本页内行为 */
const groups = [
  { label: '个人信息', path: '/pages/my/info' },
  { label: '实名认证', path: '/pages/certification/certification' },
  { label: '隐私设置', path: '/pages/my/privacy' },
  { label: '登录密码', path: '/pages/login/forgetPwd' },
  { label: '操作密码', path: '/pages/my/actionPwd/setPwd' },
  { label: '地址管理', path: '/pages/my/address/list' },
  { label: '关于我们', path: '/pages/my/about' },
  { label: '注销账号', path: '/pages/my/cancellation' },
  { label: '退出登录', action: 'logout' },
]

const showLogout = computed({
  get: () => logoutOpen.value,
  set: (v) => (logoutOpen.value = v),
})

/** 首尾行圆角：与原站 border-radius: 24rpx 24rpx 0 0 / 0 0 24rpx 24rpx 一致 */
function cardRadius(gi, isLast) {
  if (gi === 0 && isLast) return {}
  if (gi === 0) return { borderRadius: '24rpx 24rpx 0 0' }
  if (isLast) return { borderRadius: '0 0 24rpx 24rpx' }
  return {}
}

function onTap(g) {
  if (g.action === 'logout') {
    logoutOpen.value = true
    return
  }
  router.push(g.path)
}

function doLogout() {
  logoutOpen.value = false
  uni.showToast({ title: '原站退出登录需人机验证', icon: 'none' })
}
</script>

<style scoped>
@import '@/styles/atomic.css';

.setting-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 26rpx;
  box-sizing: border-box;
}
.group {
  overflow: hidden;
}
.card-view {
  height: 120rpx;
  padding: 0 32rpx;
  background: #fff;
  display: flex;
  align-items: center;
  box-sizing: border-box;
  border-bottom: 1px solid #f5f5f5;
}
.row-arrow {
  width: 13rpx;
  height: 22rpx;
  margin-left: 12rpx;
  flex-shrink: 0;
}
.modal-mask {
  position: fixed;
  inset: 0;
  z-index: 200;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
}
.modal-box {
  width: 600rpx;
  background: #fff;
  border-radius: 24rpx;
  padding: 48rpx 40rpx 32rpx;
  box-sizing: border-box;
  text-align: center;
}
.modal-title {
  display: block;
  font-size: 32rpx;
  font-weight: 600;
  color: #000;
}
.modal-body {
  display: block;
  margin: 24rpx 0 40rpx;
  font-size: 28rpx;
  color: #555;
}
.modal-btns {
  display: flex;
}
.modal-btn {
  flex: 1;
  height: 84rpx;
  line-height: 84rpx;
  font-size: 30rpx;
  color: #666;
  background: #f5f6fa;
  border-radius: 42rpx;
}
.modal-btn.primary {
  margin-left: 16rpx;
  color: #fff;
  background: #1a2438;
}
</style>
