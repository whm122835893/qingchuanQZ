<template>
  <view class="product-page">
    <view class="u-navbar">
      <view class="u-navbar__content">
        <view class="market-back flex flex-js-center flex-ai-center" @click="goBack">
          <img :src="asset('static/common/back_default.png')" mode="widthFix" />
        </view>
      </view>
    </view>

    <ProductBody :product="product" :introduce="introduce" @to-rule="goRule" />

    <!-- 底部操作条（原站 w-product-action） -->
    <view class="product-action">
      <view class="action flex-ai-center plr-16">
        <view v-if="saleStatus !== 4" class="price MiSans-Semibold">
          <text class="price-mark">¥</text>
          <text>{{ detail.price || '0.00' }}</text>
        </view>
        <view
          v-if="saleStatus === 1"
          class="action-btn flex flex-dir-col flex-center MiSans-Regular"
          @click="onSub"
        >
          <text>{{ detail.is_sub ? '取消提醒' : '设置购买提醒' }}</text>
          <text class="count-down">{{ countDownText }}</text>
        </view>
        <view
          v-else-if="saleStatus === 2"
          class="btn-action"
          @click="onBuy"
        >
          立即抢购
        </view>
        <view
          v-else-if="saleStatus === 4"
          class="btn-action gray"
          @click="goMarket"
        >
          已售罄，去市场看看
        </view>
      </view>
    </view>

    <!-- 确认购买弹层 -->
    <view v-if="showSheet" class="sheet-mask" @click="showSheet = false"></view>
    <view v-if="showSheet" class="buy-sheet">
      <view class="flex flex-ai-center flex-js-sb">
        <text class="MiSans-Demibold sheet-title">确认购买</text>
        <view class="sheet-close" @click="showSheet = false"></view>
      </view>
      <text class="MiSans-Regular sheet-sub">付款后将按平台到款顺序排队发放</text>
      <view class="sheet-body">
        <view class="qty-row flex flex-ai-center flex-js-sb">
          <text class="MiSans-Regular qty-label">购买数量</text>
          <view class="qty-box flex flex-ai-center">
            <view class="qty-btn flex-center" @click="minus"><text>-</text></view>
            <text class="MiSans-Demibold qty-num">{{ count }}</text>
            <view class="qty-btn flex-center" @click="add"><text>+</text></view>
          </view>
        </view>
        <view class="fee-row flex flex-js-sb flex-ai-center">
          <text class="MiSans-Regular fee-label">合计</text>
          <text class="MiSans-Demibold total-price">¥ {{ totalPrice }}</text>
        </view>
        <view class="submit-btn flex-center" @click="onSubmit">
          <text class="MiSans-Demibold submit-text">立即下单</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { fetchProductDetail, asset } from '@/utils/api'
import ProductBody from '@/components/ProductBody.vue'

const route = useRoute()
const router = useRouter()
const detail = ref({ product: {} })
const showSheet = ref(false)
const count = ref(1)

const product = computed(() => detail.value.product || {})
const introduce = computed(() => detail.value.introduce || '')
const saleStatus = computed(() => detail.value.sale_status || 1)
const maxCount = computed(() => product.value.total_num || 1)
const totalPrice = computed(
  () => ((Number(detail.value.price) || 0) * count.value).toFixed(2)
)
const countDownText = computed(() => {
  const t = Number(detail.value.count_down) - Date.now()
  if (t <= 0) return '已结束'
  const h = Math.floor(t / 3600000)
  const m = Math.floor((t % 3600000) / 60000)
  const s = Math.floor((t % 60000) / 1000)
  const p = (v) => String(v).padStart(2, '0')
  return `${p(h)}:${p(m)}:${p(s)}`
})

function minus() {
  if (count.value > 1) count.value -= 1
}
function add() {
  if (count.value < maxCount.value) count.value += 1
}
function onSub() {
  detail.value.is_sub = detail.value.is_sub ? 0 : 1
  uni.showToast({ title: detail.value.is_sub ? '已设置提醒' : '已取消提醒' })
}
function onBuy() {
  showSheet.value = true
}
function onSubmit() {
  showSheet.value = false
  localStorage.setItem(
    'confirmOrder',
    JSON.stringify({
      product: product.value,
      count: count.value,
      order_type: 2,
      type: 1,
      maxCount: maxCount.value,
    })
  )
  router.push('/pages/order/orderSubmit')
}
function goRule() {
  router.push(`/pages/product/ruleDetail?id=${product.value.id}`)
}
function goMarket() {
  router.push('/pages/market/market')
}
function goBack() {
  if (window.history.length > 1) router.back()
  else router.push('/')
}

async function init() {
  const data = await fetchProductDetail({ id: route.query.id || 226 })
  if (data && data.product) detail.value = data
}
init()
</script>

<style scoped>
@import '@/styles/atomic.css';
.product-page {
  min-height: 100vh;
  background: #f4f6fa;
}
.market-back {
  width: 56rpx;
  height: 56rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.55);
}
.market-back img {
  width: 17rpx;
}
.product-action {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 16rpx;
  background: #fff;
}
.action-container {
  gap: 20rpx;
}
.price {
  font-size: 34rpx;
  color: #000;
}
.price-mark {
  font-size: 24rpx;
}
.btn-action {
  flex: 1;
  height: 78rpx;
  line-height: 78rpx;
  text-align: center;
  border-radius: 39rpx;
  background: #1a2438;
  font-size: 28rpx;
  color: #fff;
}
.btn-action.gray {
  background: #d9dde3;
}
.action-btn {
  flex: 1;
  height: 78rpx;
  border-radius: 39rpx;
  background: #1a2438;
  font-size: 22rpx;
  color: #fff;
}
.count-down {
  font-size: 26rpx;
}
.sheet-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 90;
}
.buy-sheet {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 91;
  padding: 32rpx;
  border-radius: 24rpx 24rpx 0 0;
  background: #fff;
}
.sheet-title {
  font-size: 34rpx;
  color: #1a2438;
}
.sheet-close {
  width: 32rpx;
  height: 32rpx;
  position: relative;
}
.sheet-close::before,
.sheet-close::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 50%;
  width: 28rpx;
  height: 2rpx;
  background: #999;
}
.sheet-close::before {
  transform: translate(-50%, -50%) rotate(45deg);
}
.sheet-close::after {
  transform: translate(-50%, -50%) rotate(-45deg);
}
.sheet-sub {
  display: block;
  margin-top: 8rpx;
  font-size: 22rpx;
  color: #999;
}
.sheet-body {
  margin-top: 28rpx;
}
.qty-row {
  height: 88rpx;
}
.qty-label,
.fee-label {
  font-size: 26rpx;
  color: #666;
}
.qty-box {
  border: 1rpx solid #e5e8ec;
  border-radius: 8rpx;
  overflow: hidden;
}
.qty-btn {
  width: 56rpx;
  height: 56rpx;
  font-size: 28rpx;
  color: #333;
}
.qty-num {
  min-width: 60rpx;
  text-align: center;
  font-size: 28rpx;
  color: #000;
}
.fee-row {
  height: 88rpx;
  border-top: 1rpx solid #f0f0f0;
}
.total-price {
  font-size: 30rpx;
  color: #e04b28;
}
.submit-btn {
  height: 84rpx;
  margin-top: 24rpx;
  border-radius: 42rpx;
  background: #1a2438;
}
.submit-text {
  font-size: 30rpx;
  color: #fff;
}
</style>