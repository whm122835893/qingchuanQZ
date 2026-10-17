<template>
  <view class="consign-page">
    <PageNavbar title="转赠" />

    <view class="page-body">
      <!-- 藏品卡片 -->
      <view class="goods-card flex flex-ai-stretch">
        <img class="goods-thumb" :src="thumbSrc" mode="aspectFill" />
        <view class="goods-info flex flex-dir-col flex-js-sb">
          <view class="flex flex-dir-col">
            <text class="MiSans-Medium goods-name text-overflow">{{ collection.name || '--' }}</text>
            <text v-if="collection.types !== 1" class="MiSans-Regular goods-code">
              编号 #{{ collection.collection_code || '--' }}
            </text>
          </view>
          <view class="floor-badge flex flex-ai-center flex-js-center">
            <text class="MiSans-Regular floor-text">24小时未领将退回</text>
          </view>
        </view>
      </view>

      <!-- 赠送价格 / 选择用户 / 转赠说明 -->
      <RegiftFormSection
        v-model:price="form.price"
        v-model:phone="search.phone"
        :user="user"
        @search="searchUser"
      />
    </view>

    <!-- 底部提交 -->
    <view class="footer">
      <view
        class="submit-btn flex flex-ai-center flex-js-center"
        :class="{ disabled: !canSubmit }"
        @click="changeShowConfirm"
      >
        <text class="MiSans-Demibold submit-text">确认转赠</text>
      </view>
      <text class="MiSans-Regular tip-text">24小时内对方未领取，将退还给你</text>
    </view>

    <!-- 操作密码弹层 -->
    <view v-if="showConfirm" class="modal-mask" @click="showConfirm = false"></view>
    <RegiftPwdPopup
      v-if="showConfirm"
      :pwd="form.pay_password"
      @update="(v) => (form.pay_password = v)"
      @close="showConfirm = false"
      @finish="submit"
      @forget="toResetPwd"
    />
  </view>
</template>

<script setup>
/**
 * 原站 regift/regift —— 转赠发起
 * 结构：藏品卡片 / 赠送价格 / 选择用户（手机号或钱包地址搜索）/ 转赠说明 / 底部确认 + 操作密码弹层。
 */
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import PageNavbar from '@/components/PageNavbar.vue'
import RegiftFormSection from '@/components/RegiftFormSection.vue'
import RegiftPwdPopup from '@/components/RegiftPwdPopup.vue'
import { fetchUserCollectionList } from '@/utils/api'
import { ossImg } from '@/api'

defineOptions({ name: 'RegiftPage' })

const router = useRouter()
const collection = ref({})
const user = ref({})
const showConfirm = ref(false)
const form = reactive({ price: '', pay_password: '' })
const search = reactive({ phone: '' })

const thumbSrc = computed(() => ossImg(collection.value.listimg || ''))
const canSubmit = computed(() => !!form.price && !!user.value.id)

function searchUser() {
  const kw = search.phone.trim()
  if (!kw) return uni.showToast({ title: '请输入手机号或钱包地址', icon: 'none' })
  if (kw.length < 6) return uni.showToast({ title: '未找到该用户', icon: 'none' })
  // 原站为 /user/search 接口，本项目按输入命中 mock 中的演示用户
  user.value = {
    id: 1024,
    nickname: '链上摊主',
    avatar: '/uploads/20261014/863cd0a4f37a0c23f746fdff01bd6bc7.jpg',
    ntf_url: '0x9a3c...f28b',
  }
}
function changeShowConfirm() {
  if (!canSubmit.value) {
    return uni.showToast({ title: '请填写赠送价格并选择接收人', icon: 'none' })
  }
  form.pay_password = ''
  showConfirm.value = true
}
function submit(pwd) {
  form.pay_password = pwd
  showConfirm.value = false
  uni.showToast({ title: '转赠已提交', icon: 'none' })
  setTimeout(() => router.push('/pages/regift/record'), 800)
}
function toResetPwd() {
  router.push({ path: '/pages/my/actionPwd/getCode', query: { action: 'reset' } })
}

onMounted(async () => {
  const data = await fetchUserCollectionList()
  // mock 结构为 data.data 列表；兼容 user_collection_list 字段
  const list = (data && (data.user_collection_list || data.data)) || []
  collection.value = (Array.isArray(list) && list[0]) || {}
})
</script>

<style scoped>
@import '@/styles/atomic.css';

.consign-page {
  min-height: 100vh;
  background: #f7f7f7;
  padding-bottom: calc(200rpx + env(safe-area-inset-bottom));
  box-sizing: border-box;
}
.page-body {
  padding: 20rpx 28rpx;
}
.goods-card {
  padding: 24rpx;
  background: #fff;
  border-radius: 20rpx;
}
.goods-thumb {
  width: 160rpx;
  height: 160rpx;
  border-radius: 12rpx;
  background: #333;
  flex-shrink: 0;
}
.goods-info {
  margin-left: 20rpx;
  min-width: 0;
}
.goods-name {
  font-size: 30rpx;
  color: #1a2438;
  line-height: 1.4;
}
.goods-code {
  margin-top: 10rpx;
  font-size: 24rpx;
  color: #999;
}
.floor-badge {
  align-self: flex-start;
  height: 40rpx;
  padding: 0 16rpx;
  background: #eef5e6;
  border-radius: 20rpx;
}
.floor-text {
  font-size: 22rpx;
  color: #4a6f2f;
}
.footer {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 16rpx 28rpx calc(28rpx + env(safe-area-inset-bottom));
  background: #fff;
  text-align: center;
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
.tip-text {
  display: block;
  margin-top: 16rpx;
  font-size: 22rpx;
  color: #999;
}
.modal-mask {
  position: fixed;
  inset: 0;
  z-index: 40;
  background: rgba(0, 0, 0, 0.55);
}
</style>