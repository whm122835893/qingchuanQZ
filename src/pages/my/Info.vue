<template>
  <view class="info-page pb-13 font-size-14 pt-30" id="my-info">
    <PageNavbar title="个人信息" />

    <view class="card-list" style="position: relative; top: -30rpx">
      <view class="card-view">
        <text class="MiSans-Regular flex-1 font-color-black">头像</text>
        <img class="avatar" :src="avatarSrc" mode="widthFix" @click="onChangeAvatar" />
      </view>
      <view class="card-view" @click="showNickname = true">
        <view class="flex flex-ai-center flex-js-sb" style="width: 100%">
          <text class="MiSans-Regular flex-1 font-color-black">昵称</text>
          <text class="MiSans-Regular font-size-12 font-color-black">{{ userInfo.nickname || '--' }}</text>
          <img class="row-arrow" :src="asset('static/icon/arrow-right-black.png')" mode="aspectFit" />
        </view>
      </view>
      <view class="card-view">
        <view class="flex flex-ai-center flex-js-sb" style="width: 100%">
          <text class="MiSans-Regular flex-1 font-color-black">手机号</text>
          <text class="MiSans-Regular font-size-12 font-color-black">{{ maskedMobile }}</text>
          <img class="row-arrow" :src="asset('static/icon/arrow-right-black.png')" mode="aspectFit" />
        </view>
      </view>
    </view>

    <!-- 修改昵称 -->
    <view v-if="showNickname" class="modal-mask" @click.self="showNickname = false">
      <view class="modal-box">
        <text class="modal-title">修改昵称</text>
        <input
          v-model="nicknameForm.nickname"
          class="nick-input" placeholder="请输入呢称"
          placeholder-class="ph"
        />
        <view class="modal-btns">
          <view class="modal-btn" @click="showNickname = false">取消</view>
          <view class="modal-btn primary" @click="updateNickname">确认</view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
/**
 * 原站 my/info —— 个人信息
 * 三行：头像（点击更换，走原站 w-crop 裁剪）/ 昵称（弹窗修改）/ 手机号（原站只读展示）。
 * 头像裁剪组件依赖 canvas 与相册权限，此处保留入口并给出原站一致的提示。
 */
import { computed, onMounted, reactive, ref } from 'vue'
import PageNavbar from '@/components/PageNavbar.vue'
import { asset } from '@/utils/api'
import { ossImg } from '@/api'
import { fetchUserInfo } from '@/utils/api'

defineOptions({ name: 'MyInfoPage' })

const userInfo = ref({})
const showNickname = ref(false)
const nicknameForm = reactive({ nickname: '' })

const avatarSrc = computed(() => {
  const a = userInfo.value.avatar
  if (!a) return asset('static/icon/logo.png')
  return a.startsWith('http') ? a : ossImg(a)
})
/** 原站字段 hide_mobile 优先，其次脱敏展示 mobile */
const maskedMobile = computed(() => {
  const u = userInfo.value
  if (u.hide_mobile) return u.hide_mobile
  const m = u.mobile || u.username || ''
  return m.length === 11 ? m.replace(/^(\d{3})\d{4}(\d{4})$/, '$1****$2') : m || '--'
})

function onChangeAvatar() {
  // 原站点击头像唤起相册选图 + w-crop 裁剪，裁剪后上传
  uni.showToast({ title: '原站更换头像需相册权限', icon: 'none' })
}

function updateNickname() {
  const v = nicknameForm.nickname.trim()
  if (!v) {
    uni.showToast({ title: '请输入昵称', icon: 'none' })
    return
  }
  userInfo.value = { ...userInfo.value, nickname: v }
  showNickname.value = false
  uni.showToast({ title: '昵称已更新', icon: 'none' })
}

onMounted(async () => {
  const data = await fetchUserInfo()
  if (data) userInfo.value = data
})
</script>

<style scoped>
@import '@/styles/atomic.css';

.info-page {
  min-height: 100vh;
  background: #f4f6fa;
  padding-top: 30rpx;
  padding-bottom: 26rpx;
  box-sizing: border-box;
}
.card-list {
  background: #fff;
}
.card-view {
  height: 120rpx;
  padding: 0 32rpx;
  display: flex;
  align-items: center;
  background: #fff;
  box-sizing: border-box;
  margin-bottom: 1px;
}
.avatar {
  width: 120rpx;
  border-radius: 50%;
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
}
.modal-title {
  display: block;
  text-align: center;
  font-size: 32rpx;
  font-weight: 600;
  color: #000;
  margin-bottom: 24rpx;
}
.nick-input {
  height: 84rpx;
  padding: 0 32rpx;
  background: #f5f6fa;
  border-radius: 12rpx;
  font-size: 28rpx;
  color: #222;
  box-sizing: border-box;
}
.ph {
  color: #bbb;
  font-size: 28rpx;
}
.modal-btns {
  display: flex;
  margin-top: 40rpx;
}
.modal-btn {
  flex: 1;
  height: 84rpx;
  line-height: 84rpx;
  text-align: center;
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
