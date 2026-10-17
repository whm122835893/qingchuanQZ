<template>
  <view class="cancellation-page plr-24" id="cancallation">
    <PageNavbar title="注销账号申请" />

    <text class="MiSans-Semibold page-title">注销账号</text>

    <view class="text-center mt-20">
      <view>
        <img class="warn-img" :src="asset('static/icon/xrg_t.png')" mode="aspectFit" />
      </view>
      <text class="MiSans-Semibold warn-title mt-15">您正在注销账号</text>
      <text class="warn-danger">请谨慎操作</text>
    </view>

    <!-- 帐号安全状态 -->
    <view class="mlr-8 bg-color-item pa-12 mt-20 pb-24 safe-card">
      <view class="pt-10 MiSans-Semibold safe-line">
        <img class="tips-icon" :src="asset('static/icon/product-tips.png')" mode="aspectFit" />
        <text> 帐号安全状态： </text>
      </view>
      <view class="mt-4 font-color-black safe-text">您的账号没有被盗风险及违规行为</view>

      <view class="pt-10 MiSans-Semibold safe-line">
        <img class="tips-icon" :src="asset('static/icon/product-tips.png')" mode="aspectFit" />
        <text> 帐号安全状态： </text>
      </view>
      <view class="mt-4 font-color-black safe-text">
        <text>1、无法登录；</text><br />
        <text> 2、所有信息将用于删除和清理（包括加入社区、账户余额、发布动态、聊天记录等）；</text><br />
        <text> 3、绑定手机/微信/AppleID/人脸认证等将会解绑；</text><br />
        <text> 4、其他不限于以上所列举的你的账号的资产和权益。</text>
      </view>
    </view>

    <view class="action flex flex-dir-col flex-ai-center">
      <view class="confirm-btn flex flex-ai-center flex-js-center" @click="showTips = true">
        <text class="MiSans-Demibold confirm-text">确认注销</text>
      </view>
    </view>

    <CancellationNoticeModal
      v-if="showTips"
      :checked="checked"
      @close="showTips = false"
      @toggle="checked = !checked"
      @confirm="handleConfirm"
    />

    <ActionPwdModal
      v-if="showAuth"
      :pwd="pwd"
      @close="showAuth = false"
      @update="pwd = $event"
      @confirm="submit"
    />
  </view>
</template>

<script setup>
/**
 * 原站 my/cancellation —— 注销账号申请
 * 流程：确认注销 → 勾选同意《青川注销协议》 → 注销账号 → 输入 6 位操作密码校验。
 */
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import PageNavbar from '@/components/PageNavbar.vue'
import CancellationNoticeModal from '@/components/CancellationNoticeModal.vue'
import ActionPwdModal from '@/components/ActionPwdModal.vue'
import { asset } from '@/utils/api'

defineOptions({ name: 'MyCancellationPage' })

const router = useRouter()

const showTips = ref(false)
const showAuth = ref(false)
const checked = ref(false)
const pwd = ref('')

function handleConfirm() {
  if (!checked.value) {
    uni.showToast({ title: '请先阅读并同意注销协议', icon: 'none' })
    return
  }
  showTips.value = false
  showAuth.value = true
}

function submit() {
  if (pwd.value.length !== 6) {
    uni.showToast({ title: '请输入6位操作密码', icon: 'none' })
    return
  }
  showAuth.value = false
  pwd.value = ''
  uni.showToast({ title: '原站注销申请需人机验证', icon: 'none' })
  setTimeout(() => router.push('/pages/my/my'), 800)
}
</script>

<style scoped>
@import '@/styles/atomic.css';

.cancellation-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 200rpx;
  box-sizing: border-box;
}
.page-title {
  display: block;
  font-size: 48rpx;
  color: #000;
}
.warn-img {
  width: 116rpx;
  height: 94rpx;
}
.warn-title {
  display: block;
  font-size: 28rpx;
  color: #000;
}
.warn-danger {
  font-size: 28rpx;
  color: red;
}
.safe-card {
  background: #fff;
  border-radius: 20rpx;
}
.safe-line {
  font-size: 32rpx;
  color: #000;
  display: flex;
  align-items: center;
}
/* 原站该行前缀为 /static/icon/product-tips.png（11rpx 见方提示点） */
.tips-icon {
  width: 11rpx;
  height: 11rpx;
  flex-shrink: 0;
  margin-right: 12rpx;
}
.safe-text {
  font-size: 28rpx;
  line-height: 1.8;
}
/* 底部固定操作条 */
.action {
  position: fixed;
  left: 0;
  width: 100%;
  bottom: 0;
  padding-left: 24rpx;
  padding-right: 24rpx;
  padding-top: 16rpx;
  padding-bottom: 48rpx;
  background: #fff;
  box-sizing: border-box;
}
.confirm-btn {
  width: 100%;
  height: 110rpx;
  background: #020202;
  border-radius: 55rpx;
}
.confirm-text {
  font-size: 36rpx;
  color: #fff;
}
</style>
