<template>
  <view class="product-page">
    <view class="u-navbar">
      <view class="u-navbar__content">
        <view class="market-back flex flex-js-center flex-ai-center" @click="goBack">
          <img :src="asset('static/common/back_default.png')" mode="widthFix" />
        </view>
        <text class="navbar-title MiSans-Demibold">藏品详情</text>
      </view>
    </view>

    <ProductBody :product="product" :introduce="introduce" @to-rule="goRule" />

    <view class="product-action">
      <view class="action flex-ai-center plr-16">
        <view class="price MiSans-Semibold">
          <text class="price-mark">¥</text>
          <text>{{ detail.price || '0.00' }}</text>
        </view>
        <!-- 数量步进（原站 u-number-box） -->
        <view class="num-box flex flex-ai-center">
          <view class="num-btn flex-center" @click="minus"><text>-</text></view>
          <text class="MiSans-Demibold num-text">{{ count }}</text>
          <view class="num-btn flex-center" @click="add"><text>+</text></view>
        </view>
        <view v-if="canBuy" class="buy-btn flex-center" @click="onBuy">立即购买</view>
        <view v-else class="buy-btn gray flex-center">已售罄</view>
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
const count = ref(1)

const product = computed(() => detail.value.product || {})
const introduce = computed(() => detail.value.introduce || '')
const maxCount = computed(() => product.value.total_num || 1)
const canBuy = computed(() => detail.value.sale_status !== 4 && product.value.is_lock !== 1)

function minus() {
  if (count.value > 1) count.value -= 1
}
function add() {
  if (count.value < maxCount.value) count.value += 1
}
function onBuy() {
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
function goBack() {
  if (window.history.length > 1) router.back()
  else router.push('/')
}

async function init() {
  const data = await fetchProductDetail({ id: route.query.id || 226 })
  if (data && data.product) detail.value = { ...data, sale_status: data.sale_status || 2 }
}
init()
</script>

<style scoped>
@import '@/styles/atomic.css';
.product-page {
  min-height: 100vh;
  background: #f4f6fa;
}
.u-navbar__content {
  height: 88rpx;
  display: flex;
  align-items: center;
  padding: 0 16rpx;
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
.navbar-title {
  font-size: 32rpx;
  color: #000;
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
  gap: 16rpx;
}
.price {
  font-size: 34rpx;
  color: #000;
}
.price-mark {
  font-size: 24rpx;
}
.num-box {
  height: 60rpx;
  border: 1rpx solid #e5e8ec;
  border-radius: 8rpx;
  overflow: hidden;
}
.num-btn {
  width: 52rpx;
  height: 60rpx;
  font-size: 28rpx;
  color: #333;
}
.num-text {
  min-width: 52rpx;
  text-align: center;
  font-size: 28rpx;
  color: #000;
}
.buy-btn {
  flex: 1;
  height: 78rpx;
  border-radius: 39rpx;
  background: #1a2438;
  font-size: 28rpx;
  color: #fff;
}
.buy-btn.gray {
  background: #d9dde3;
}
</style>