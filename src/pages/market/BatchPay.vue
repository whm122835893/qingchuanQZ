<template>
  <view class="consign-page">
    <!-- 导航 -->
    <view class="navbar">
      <view class="navbar-left" @click="goBack">
        <img :src="asset('static/common/back_default.png')" mode="widthFix" />
      </view>
      <text class="navbar-title">批量购买</text>
    </view>

    <view class="page-body">
      <!-- 藏品卡 -->
      <view class="goods-card flex flex-ai-stretch">
        <img class="goods-thumb" :src="thumbSrc" mode="aspectFill" />
        <view class="goods-info flex flex-dir-col flex-js-sb">
          <view class="flex flex-dir-col">
            <text class="MiSans-Medium text-overflow goods-name">{{ product.name || '--' }}</text>
            <text class="MiSans-Regular goods-sub">限价上限 ¥{{ maxPriceText }}</text>
          </view>
          <view class="floor-badge flex flex-ai-center flex-js-center">
            <text class="MiSans-Regular floor-text">批量上限 {{ product.batch_pay_num || 0 }} 件</text>
          </view>
        </view>
      </view>

      <!-- 购买数量 -->
      <view class="section">
        <text class="MiSans-Demibold section-title">购买数量</text>
        <view class="qty-box flex flex-ai-center">
          <view class="qty-btn flex flex-ai-center flex-js-center" @click="minus">
            <text class="MiSans-Regular minus" :style="{ color: form.num <= 1 ? '#bbb' : '#1a2438' }">-</text>
          </view>
          <input class="MiSans-Demibold qty-input" type="number" :value="form.num" @input="changenum" />
          <view class="qty-btn flex flex-ai-center flex-js-center" @click="add">
            <text
              class="MiSans-Regular plus"
              :style="{ color: form.num >= maxNum ? '#bbb' : '#1a2438' }"
            >+</text>
          </view>
        </view>
      </view>

      <!-- 单价 -->
      <view class="section">
        <text class="MiSans-Demibold section-title">设置购买单价</text>
        <view class="price-input flex flex-ai-center">
          <text class="MiSans-Demibold price-yuan">¥</text>
          <input
            class="MiSans-Regular flex-1 price-field" type="number"
            placeholder="请输入购买单价"
            placeholder-class="price-ph"
            :value="form.price"
            @input="changeprice"
          />
        </view>
        <view class="fee-row flex flex-js-sb flex-ai-center">
          <text class="MiSans-Regular fee-label">价格范围</text>
          <text class="MiSans-Regular fee-value">¥ 0 - {{ maxPriceText }}</text>
        </view>
        <view class="fee-row flex flex-js-sb flex-ai-center">
          <text class="MiSans-Regular fee-label">预计合计</text>
          <text class="MiSans-Demibold total">¥ {{ totalPrice }}</text>
        </view>
      </view>

      <!-- 支付方式 -->
      <view class="section">
        <view class="flex flex-ai-end">
          <text class="MiSans-Demibold section-title no-mb">支付方式</text>
          <text class="MiSans-Regular pay-tip">*强烈建议勾选多个账户</text>
        </view>
        <view class="account-row flex flex-ai-center flex-js-sb" @click="toggleHuifu">
          <view class="flex flex-ai-center">
            <img class="account-icon" :src="asset('static/wallet/huifu.png')" mode="aspectFit" />
            <text class="MiSans-Medium account-name">汇付天下</text>
          </view>
          <view v-if="huifuSelected" class="radio-icon radio-on"></view>
          <view v-else class="open-btn flex flex-ai-center flex-js-center">
            <text class="MiSans-Regular open-btn-text">去开通</text>
          </view>
        </view>
      </view>

      <!-- 购买说明 -->
      <view class="section">
        <text class="MiSans-Demibold section-title">购买说明</text>
        <view class="notice-list">
          <text class="MiSans-Regular notice-item">1.批量购买将按您设置的单价与数量匹配市场寄售订单。</text>
          <text class="MiSans-Regular notice-item">2.单价需在允许价格范围内，数量不超过批量上限。</text>
          <text class="MiSans-Regular notice-item">3.未成交部分将原路退回至付款账户。</text>
        </view>
        <view class="agree-row flex flex-ai-center" @click="agreed = !agreed">
          <view class="radio-icon" :class="{ 'radio-on': agreed }"></view>
          <text class="MiSans-Regular agree-text"
            >我已阅读并同意<text class="agree-link" @click.stop="toAgreement">《购买协议》</text></text
          >
        </view>
      </view>
    </view>

    <view class="footer">
      <view
        class="submit-btn flex flex-ai-center flex-js-center"
        :class="{ disabled: disabled }"
        @click="onSubmitTap"
      >
        <text class="MiSans-Demibold submit-text">批量购买 · ¥{{ totalPrice }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { fetchMarketDetail, asset } from '@/utils/api'
import { ossImg } from '@/api'

const route = useRoute()
const router = useRouter()

const product = ref({ name: '--', batch_pay_num: 10 })
const form = reactive({ num: 1, price: '' })
const agreed = ref(false)
const huifuSelected = ref(true)

const maxNum = computed(() => product.value.batch_pay_num || 1)
const maxPriceText = computed(() => String(product.value.max_price || product.value.min_price || '0.00'))
const totalPrice = computed(
  () => ((parseFloat(form.price) || 0) * (form.num || 0)).toFixed(2)
)
const thumbSrc = computed(() => {
  const p = product.value
  const src = p.main_image || p.listimg || ''
  if (!src) return ''
  return src.startsWith('http') ? src : ossImg(src)
})
const disabled = computed(
  () => !form.price || Number(form.price) <= 0 || !agreed.value || !huifuSelected.value
)

function goBack() {
  if (window.history.length > 1) router.back()
  else router.push('/pages/market/market')
}

function minus() {
  if (form.num <= 1) return
  form.num -= 1
}
function add() {
  if (form.num >= maxNum.value) return
  form.num += 1
}
function changenum(e) {
  const v = parseInt(e.target.value, 10)
  form.num = Number.isNaN(v) ? 1 : Math.min(Math.max(v, 1), maxNum.value)
}
function changeprice(e) {
  form.price = e.target.value
}
function toggleHuifu() {
  huifuSelected.value = !huifuSelected.value
}
function toAgreement() {
  router.push({ path: '/pages/agreement/agreement', query: { title: '购买协议' } })
}
function onSubmitTap() {
  if (disabled.value) {
    uni.showToast({ title: '请完善购买信息', icon: 'none' })
    return
  }
  uni.showToast({ title: '原站下单需人机验证', icon: 'none' })
}

onMounted(async () => {
  const id = route.query.id || 226
  const data = await fetchMarketDetail(id)
  if (data && data.product) {
    product.value = {
      ...data.product,
      batch_pay_num: data.batch_pay_num || 10,
      max_price: data.max_price || data.price,
    }
    form.price = data.price || ''
  }
})
</script>

<style scoped>
@import '@/styles/atomic.css';

.consign-page {
  min-height: 100vh;
  background: #fff;
  padding-bottom: calc(140rpx + env(safe-area-inset-bottom));
  overflow-y: auto;
}
.navbar {
  position: relative;
  height: 88rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.navbar-left {
  position: absolute;
  left: 26rpx;
  top: 0;
  bottom: 0;
  display: flex;
  align-items: center;
}
.navbar-left img {
  width: 34rpx;
}
.navbar-title {
  font-size: 32rpx;
  font-weight: 700;
  color: #1a2438;
}
.page-body {
  padding: 24rpx 28rpx 40rpx;
}
.goods-card {
  padding: 24rpx;
  background: #f3f6f8;
  border-radius: 20rpx;
  box-sizing: border-box;
}
.goods-thumb {
  width: 286rpx;
  height: 286rpx;
  background: #333;
  border-radius: 20rpx;
  border: 2px solid #fff;
  flex-shrink: 0;
  box-sizing: border-box;
}
.goods-info {
  flex: 1;
  min-width: 0;
  margin-left: 24rpx;
  padding: 8rpx 0;
  box-sizing: border-box;
}
.goods-name {
  font-size: 30rpx;
  color: #1a2438;
}
.goods-sub {
  margin-top: 10rpx;
  font-size: 24rpx;
  color: #999;
}
.floor-badge {
  align-self: flex-end;
  height: 48rpx;
  padding: 0 20rpx;
  background: #eff7f2;
  border-radius: 24rpx;
}
.floor-text {
  font-size: 22rpx;
  color: #4a6f2f;
}
.section {
  margin-top: 40rpx;
}
.section-title {
  display: block;
  margin-bottom: 20rpx;
  font-size: 30rpx;
  color: #1a2438;
}
.section-title.no-mb {
  margin-bottom: 0;
}
.pay-tip {
  margin-left: 12rpx;
  font-size: 22rpx;
  color: #999;
}
.price-input {
  height: 88rpx;
  padding: 0 28rpx;
  border: 1px solid #e0e0e0;
  border-radius: 16rpx;
  background: #fff;
}
.price-yuan {
  font-size: 32rpx;
  color: #1a2438;
  margin-right: 12rpx;
}
.price-field {
  font-size: 28rpx;
  color: #1a2438;
}
.price-ph {
  color: #bbb;
  font-size: 28rpx;
}
.qty-box {
  height: 72rpx;
}
.qty-btn {
  width: 72rpx;
  height: 72rpx;
  background: #f5f5f5;
  border-radius: 12rpx;
}
.minus,
.plus {
  font-size: 36rpx;
}
.qty-input {
  width: 160rpx;
  height: 72rpx;
  margin: 0 12rpx;
  text-align: center;
  font-size: 30rpx;
  color: #1a2438;
  background: #f5f5f5;
  border-radius: 12rpx;
}
.fee-row {
  margin-top: 20rpx;
}
.fee-label {
  font-size: 26rpx;
  color: #666;
}
.fee-value {
  font-size: 26rpx;
  color: #1a2438;
}
.total {
  font-size: 28rpx;
  color: #e54d42;
}
.account-row {
  margin-top: 20rpx;
  height: 96rpx;
  padding: 0 28rpx;
  background: #eff7f2;
  border-radius: 16rpx;
}
.account-icon {
  width: 48rpx;
  height: 48rpx;
  flex-shrink: 0;
  border-radius: 10rpx;
  background: #fff;
}
.account-name {
  margin-left: 16rpx;
  font-size: 28rpx;
  color: #1a2438;
}
.radio-icon {
  width: 36rpx;
  height: 36rpx;
  flex-shrink: 0;
  border-radius: 50%;
  border: 2rpx solid #c8c8c8;
  background: #fff;
  box-sizing: border-box;
}
.radio-on {
  border-color: #6aa27b;
  background: #6aa27b;
  box-shadow: inset 0 0 0 6rpx #eff7f2;
}
.open-btn {
  height: 48rpx;
  padding: 0 20rpx;
  background: #5a9a45;
  border-radius: 24rpx;
}
.open-btn-text {
  font-size: 22rpx;
  color: #fff;
}
.notice-list {
  margin-top: 4rpx;
}
.notice-item {
  display: block;
  margin-bottom: 12rpx;
  font-size: 22rpx;
  color: #999;
  line-height: 1.6;
}
.agree-row {
  margin-top: 24rpx;
}
.agree-text {
  margin-left: 12rpx;
  font-size: 24rpx;
  color: #666;
}
.agree-link {
  color: #5a9a45;
}
.footer {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 10;
  padding: 16rpx 28rpx 24rpx;
  background: #fff;
}
.submit-btn {
  height: 88rpx;
  background: #6aa27b;
  border-radius: 16rpx;
}
.submit-btn.disabled {
  opacity: 0.45;
}
.submit-text {
  font-size: 30rpx;
  color: #fff;
}
</style>
