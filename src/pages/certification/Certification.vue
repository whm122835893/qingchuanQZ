<template>
  <view class="cert-page">
    <PageNavbar title="实名认证" />

    <!-- 未认证：认证表单 -->
    <view v-if="String(userInfo.real_name_authentication) === '0'" class="cert-form-page">
      <view class="form-card">
        <view class="field">
          <text class="MiSans-Medium field-label">姓名</text>
          <view class="input-box flex flex-ai-center">
            <input
              v-model="form.real_name"
              class="MiSans-Regular field-input" placeholder="请输入真实姓名"
              placeholder-class="ph"
            />
          </view>
        </view>
        <view class="field mt-28">
          <text class="MiSans-Medium field-label">身份证号码</text>
          <view class="input-box flex flex-ai-center">
            <input
              v-model="form.id_card"
              class="MiSans-Regular field-input" placeholder="请输入有效身份证号"
              placeholder-class="ph"
            />
          </view>
        </view>
        <view class="form-tip">
          <text class="MiSans-Regular tip-text">实名信息认证后不可修改，请仔细核对后再提交</text>
        </view>
      </view>

      <view class="footer">
        <view
          class="submit-btn flex flex-ai-center flex-js-center"
          :class="{ disabled: !able }"
          @click="onSubmitTap"
        >
          <text class="MiSans-Demibold submit-text">立即认证</text>
        </view>
      </view>
    </view>

    <!-- 已认证：认证结果卡 -->
    <view v-else class="cert-card-page">
      <view class="status-block flex flex-dir-col flex-ai-center">
        <text class="MiSans-Demibold status-title">已实名认证</text>
        <text class="MiSans-Regular status-desc">您的实名信息已通过核验</text>
      </view>
      <view class="info-card">
        <view class="info-row flex flex-js-sb">
          <text class="MiSans-Regular row-label">姓名</text>
          <text class="MiSans-Demibold row-value">{{ userInfo.real_name || '--' }}</text>
        </view>
        <view class="info-divider"></view>
        <view class="info-row flex flex-js-sb">
          <text class="MiSans-Regular row-label">身份证号码</text>
          <text class="MiSans-Demibold row-value">{{ maskedIdCard }}</text>
        </view>
      </view>
    </view>

    <!-- 提交二次确认 -->
    <view v-if="showModal" class="modal-mask" @click="showModal = false"></view>
    <view v-if="showModal" class="modal">
      <text class="MiSans-Demibold modal-title">确认提交</text>
      <text class="MiSans-Regular modal-content">实名信息认证后不可修改，请核验信息无误后再提交</text>
      <view class="modal-btns flex">
        <view class="modal-btn flex flex-ai-center flex-js-center" @click="showModal = false">取消</view>
        <view class="modal-btn ok flex flex-ai-center flex-js-center" @click="changeBtn">认证</view>
      </view>
    </view>
  </view>
</template>

<script setup>
/**
 * 原站 certification/certification —— 实名认证
 * 按userInfo.real_name_authentication 分两态：0 表单（姓名 + 身份证号），非0 已认证信息卡。
 * 二次确认弹层与原站 w-toast 语义一致。
 */
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import PageNavbar from '@/components/PageNavbar.vue'
import { fetchUserInfo } from '@/utils/api'

defineOptions({ name: 'CertificationPage' })

const router = useRouter()
const userInfo = ref({})
const showModal = ref(false)
const form = reactive({ real_name: '', id_card: '' })

const able = computed(() => !!form.real_name.trim() && /^\d{17}[\dXx]$/.test(form.id_card.trim()))
const maskedIdCard = computed(() => {
  const s = userInfo.value.id_card || ''
  return s.length === 18 ? s.slice(0, 6) + '********' + s.slice(-4) : s || '--'
})

function onSubmitTap() {
  if (!form.real_name.trim()) return uni.showToast({ title: '请输入真实姓名', icon: 'none' })
  if (!/^\d{17}[\dXx]$/.test(form.id_card.trim())) {
    return uni.showToast({ title: '请输入有效身份证号', icon: 'none' })
  }
  showModal.value = true
}

function changeBtn() {
  showModal.value = false
  uni.showToast({ title: '实名认证已提交', icon: 'none' })
  setTimeout(() => router.push('/pages/certification/certificationStatus?status=1'), 800)
}

onMounted(async () => {
  userInfo.value = await fetchUserInfo()
})
</script>

<style scoped>
@import '@/styles/atomic.css';

.cert-page {
  min-height: 100vh;
  background: #f4f6fa;
  box-sizing: border-box;
}
.cert-form-page {
  padding: 24rpx 28rpx;
}
.form-card {
  padding: 32rpx;
  background: #fff;
  border-radius: 16rpx;
}
.field-label {
  display: block;
  font-size: 28rpx;
  color: #1a2438;
  margin-bottom: 16rpx;
}
.input-box {
  height: 88rpx;
  padding: 0 24rpx;
  background: #f5f6fa;
  border-radius: 12rpx;
}
.field-input {
  flex: 1;
  font-size: 28rpx;
  color: #1a2438;
}
.ph {
  color: #bbb;
  font-size: 28rpx;
}
.form-tip {
  margin-top: 28rpx;
}
.tip-text {
  font-size: 22rpx;
  color: #999;
}
.footer {
  padding: 60rpx 0 calc(28rpx + env(safe-area-inset-bottom));
}
.submit-btn {
  height: 88rpx;
  border-radius: 16rpx;
  background: #6aa27b;
}
.submit-btn.disabled {
  opacity: 0.45;
}
.submit-text {
  font-size: 30rpx;
  color: #fff;
}
.cert-card-page {
  padding: 60rpx 28rpx;
}
.status-block {
  padding: 40rpx 0 60rpx;
}
.status-title {
  font-size: 40rpx;
  color: #1a2438;
}
.status-desc {
  margin-top: 16rpx;
  font-size: 26rpx;
  color: #999;
}
.info-card {
  padding: 8rpx 32rpx;
  background: #fff;
  border-radius: 16rpx;
}
.info-row {
  height: 100rpx;
}
.row-label {
  font-size: 28rpx;
  color: #999;
}
.row-value {
  font-size: 28rpx;
  color: #1a2438;
}
.info-divider {
  height: 1rpx;
  background: #f0f2f5;
}
.modal-mask {
  position: fixed;
  inset: 0;
  z-index: 40;
  background: rgba(0, 0, 0, 0.55);
}
.modal {
  position: fixed;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  z-index: 41;
  width: 600rpx;
  padding: 48rpx 40rpx 32rpx;
  background: #fff;
  border-radius: 24rpx;
  box-sizing: border-box;
  text-align: center;
}
.modal-title {
  display: block;
  font-size: 32rpx;
  color: #1a2438;
}
.modal-content {
  display: block;
  margin-top: 20rpx;
  font-size: 26rpx;
  line-height: 40rpx;
  color: #666;
}
.modal-btns {
  margin-top: 40rpx;
}
.modal-btn {
  flex: 1;
  height: 84rpx;
  font-size: 30rpx;
  color: #666;
}
.modal-btn.ok {
  color: #6aa27b;
  font-family: MiSans-Demibold, sans-serif;
}
</style>