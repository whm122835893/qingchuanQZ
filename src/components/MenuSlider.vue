<template>
  <!--
    源站 my 页 MenuSlider（data-v-4106be5d）侧边抽屉，逐值复刻：
    u-popup mode:left + scroll-view.drawer；未登录点击菜单 emit need-login（源站 uni.$emit showLogin）；
    退出登录弹窗为 w-modal 契约（data-v-3e927648，btnType colorful）。
  -->
  <view>
    <!-- 左侧抽屉 -->
    <view v-if="show" class="slider-mask" @click="close"></view>
    <view class="slider-panel" :class="{ open: show }">
      <scroll-view class="drawer" scroll-y="true">
        <view style="height: 0"></view>
        <view style="height: 40rpx"></view>

        <!-- 头像 + 昵称 -->
        <view class="profile flex flex-dir-col flex-ai-center" @click="jump('/pages/my/info')">
          <img class="avatar" :src="avatarSrc" mode="aspectFill" alt="" />
          <text class="MiSans-Medium nickname">{{ displayName }}</text>
        </view>

        <!-- 账号 -->
        <view class="section">
          <text class="section-title MiSans-Medium">账号</text>
          <view class="row flex flex-ai-center flex-js-sb" @click="jump('/pages/my/info')">
            <text class="MiSans-Regular row-text">个人信息</text>
            <img class="arrow" :src="asset('static/icon/arrow-right.png')" mode="aspectFit" alt="" />
          </view>
        </view>

        <!-- 安全与设置 -->
        <view class="section">
          <text class="section-title MiSans-Medium">安全与设置</text>
          <view class="row flex flex-ai-center flex-js-sb" @click="jump('/pages/certification/certification')">
            <text class="MiSans-Regular row-text">实名认证</text>
            <img class="arrow" :src="asset('static/icon/arrow-right.png')" mode="aspectFit" alt="" />
          </view>
          <view class="row flex flex-ai-center flex-js-sb" @click="jump('/pages/my/privacy')">
            <text class="MiSans-Regular row-text">隐私设置</text>
            <img class="arrow" :src="asset('static/icon/arrow-right.png')" mode="aspectFit" alt="" />
          </view>
          <view class="row flex flex-ai-center flex-js-sb" @click="jump('/pages/login/forgetPwd')">
            <text class="MiSans-Regular row-text">登录密码</text>
            <img class="arrow" :src="asset('static/icon/arrow-right.png')" mode="aspectFit" alt="" />
          </view>
          <view class="row flex flex-ai-center flex-js-sb" @click="jump('/pages/my/actionPwd/setPwd')">
            <text class="MiSans-Regular row-text">操作密码</text>
            <img class="arrow" :src="asset('static/icon/arrow-right.png')" mode="aspectFit" alt="" />
          </view>
          <view class="row flex flex-ai-center flex-js-sb" @click="jump('/pages/my/address/list')">
            <text class="MiSans-Regular row-text">地址管理</text>
            <img class="arrow" :src="asset('static/icon/arrow-right.png')" mode="aspectFit" alt="" />
          </view>
        </view>

        <!-- 关于 -->
        <view class="section">
          <text class="section-title MiSans-Medium">关于</text>
          <view class="row flex flex-ai-center flex-js-sb" @click="jump('/pages/my/about')">
            <text class="MiSans-Regular row-text">关于我们</text>
            <img class="arrow" :src="asset('static/icon/arrow-right.png')" mode="aspectFit" alt="" />
          </view>
        </view>

        <!-- 账号操作 -->
        <view class="section">
          <text class="section-title MiSans-Medium">账号操作</text>
          <view class="row flex flex-ai-center flex-js-sb" @click="jump('/pages/my/cancellation')">
            <text class="MiSans-Regular row-text">注销账号</text>
            <img class="arrow" :src="asset('static/icon/arrow-right.png')" mode="aspectFit" alt="" />
          </view>
          <view class="row flex flex-ai-center flex-js-sb" @click="showLogoutFn">
            <text class="MiSans-Regular row-text" style="color: #eb2a2a">退出登录</text>
            <img class="arrow" :src="asset('static/icon/arrow-right.png')" mode="aspectFit" alt="" />
          </view>
        </view>

        <view style="height: 80rpx"></view>
      </scroll-view>
    </view>

    <!-- 退出登录确认：w-modal 契约（isLogin 才渲染，与源站一致） -->
    <view v-if="isLogin && showLogout" class="modal-mask" @click.self="showLogout = false">
      <view class="w-modal">
        <view class="toast-title">您确定要退出当前账号吗?</view>
        <view class="toast-action">
          <view class="modal-btn cancel" @click="showLogout = false">取消</view>
          <view class="modal-btn submit" @click="doLogout">确认</view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { asset } from '@/utils/api'
import { setToken } from '@/api'

const props = defineProps({
  /** 抽屉开关（源站 v-model = menuShow，openMenu 由 My 页 openDrawer 调用） */
  show: { type: Boolean, default: false },
  isLogin: { type: Boolean, default: false },
  userInfo: { type: Object, default: () => ({}) },
})
const emit = defineEmits(['update:show', 'need-login'])

const router = useRouter()
const showLogout = ref(false)

function close() {
  emit('update:show', false)
}

/** 源站 avatarSrc：avatar 存在且非占位 → http 直用 / 否则 ossUrl 拼接；兜底 logo */
const avatarSrc = computed(() => {
  const a = props.userInfo && props.userInfo.avatar
  if (a && a !== '/defautAvatar.png') {
    return String(a).indexOf('http') === 0 ? a : asset(a)
  }
  return asset('static/logo/logo.png')
})

/** 源站 displayName：登录显示昵称兜底「用户」，未登录「请登录」 */
const displayName = computed(() =>
  props.isLogin ? (props.userInfo && props.userInfo.nickname) || '用户' : '请登录'
)

/** 源站 jump：登录 → 关抽屉跳转；未登录 → showLogin 事件 */
function jump(url) {
  if (props.isLogin) {
    close()
    router.push(url)
  } else {
    close()
    emit('need-login')
  }
}

/** 源站 showLogoutFn：登录才弹确认 */
function showLogoutFn() {
  if (props.isLogin) {
    showLogout.value = true
  } else {
    close()
    emit('need-login')
  }
}

/** 源站 logoutRes(true) → store logout（清态回登录）；本地等价 = 清 token + 回登录页 */
function doLogout() {
  showLogout.value = false
  close()
  setToken('')
  router.replace('/pages/login/login')
}
</script>

<style scoped>
@import '@/styles/atomic.css';

/* 遮罩 + 左滑面板（u-popup mode:left 默认行为） */
.slider-mask {
  position: fixed;
  inset: 0;
  z-index: 120;
  background: rgba(0, 0, 0, 0.6);
}
.slider-panel {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  z-index: 121;
  transform: translateX(-100%);
  transition: transform 0.25s ease;
}
.slider-panel.open {
  transform: translateX(0);
}

/* 以下逐值 = 源站 .drawer[data-v-4106be5d] 全套 */
.drawer {
  width: 560rpx;
  height: 100vh;
  background: #f5f5f5;
  padding: 0 28rpx;
  box-sizing: border-box;
  overflow-y: auto;
  display: block;
}
.profile {
  padding: 16rpx 0 8rpx;
}
.avatar {
  width: 128rpx;
  height: 128rpx;
  border-radius: 50%;
  background: #eee;
}
.nickname {
  margin-top: 20rpx;
  font-size: 30rpx;
  color: #1a2438;
  max-width: 400rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.section {
  background: #fff;
  border-radius: 20rpx;
  margin-top: 24rpx;
  padding: 8rpx 0;
  overflow: hidden;
}
.section-title {
  display: block;
  padding: 20rpx 28rpx 8rpx;
  font-size: 24rpx;
  color: #999;
}
.row {
  height: 96rpx;
  padding: 0 28rpx;
}
.row-text {
  font-size: 28rpx;
  color: #1a2438;
}
.arrow {
  width: 13rpx;
  height: 22rpx;
  flex-shrink: 0;
}

/* 退出确认弹窗 = 源站 .w-modal[data-v-3e927648] 全套 */
.modal-mask {
  position: fixed;
  inset: 0;
  z-index: 130;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
}
.w-modal {
  width: 670rpx;
  padding: 60rpx 40rpx 40rpx;
  border-radius: 16rpx;
  background-color: #f4f6fa;
  box-sizing: border-box;
}
.toast-title {
  font-size: 32rpx;
  color: #000;
  text-align: center;
}
.toast-action {
  display: flex;
  justify-content: space-between;
  margin-top: 112rpx;
}
.modal-btn {
  width: 286rpx;
  height: 85rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 31rpx;
  white-space: nowrap;
  border-radius: 46rpx;
}
.modal-btn.cancel {
  background: #dadada;
  margin-right: 25rpx;
  color: #2e2e2e;
}
.modal-btn.submit {
  background: #718878;
  color: #fff;
}
</style>
