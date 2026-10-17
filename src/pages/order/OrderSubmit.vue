<template>
  <view class="page-bg-colorfull pa-16 order-submit" id="order-submit">
    <!-- 导航 -->
    <view class="navbar">
      <view class="navbar-left" @click="goBack">
        <img :src="asset('static/common/back_default.png')" mode="widthFix" />
      </view>
      <text class="navbar-title">确认订单</text>
    </view>

    <!-- 藏品行 -->
    <view class="bg-color-item flex pa-8 br-8 mb-16 goods-row">
      <img class="goods-img" :src="productImg" mode="aspectFill" />
      <view class="flex-1 plr-16 ptb-4 flex-dir-col flex flex-js-sb">
        <text class="font-color-black text-overflow-2 goods-name">{{
          product.name || '--'
        }}</text>
        <view class="font-color-minor flex-js-end flex">
          <view class="flex flex-ai-center">
            <view
              class="flex flex-js-center flex-ai-center font-size-20 step-btn"
              :style="{ color: orderBaseInfo.count <= 1 ? '#999' : '#000' }"
              @click="minus"
            >
              -
            </view>
            <input
              class="plr-4 font-color-black count-input" type="number"
              :value="orderBaseInfo.count"
              @input="changeCount"
            />
            <view
              class="flex flex-js-center flex-ai-center font-color-black font-size-20 step-btn"
              :style="{
                color: orderBaseInfo.count === orderBaseInfo.maxCount ? '#999' : '#000',
              }"
              @click="add"
            >
              + 
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 订单信息 -->
    <view class="br-8 bg-color-item pa-8 mb-8">
      <view
        v-if="publisherNick"
        class="flex flex-js-sb font-size-14 mb-16"
      >
        <text class="font-color-999">创作者:</text>
        <text class="font-color-black">{{ publisherNick }}</text>
      </view>
      <view class="flex flex-js-sb font-size-14 mb-16">
        <text class="font-color-999">藏品编号:</text>
        <text class="font-color-black">随机编号</text>
      </view>
      <view
        v-if="userInfo.ntf_url"
        class="flex flex-js-sb font-size-14 mb-16 flex-ai-center"
      >
        <text class="font-color-999">区块链地址:</text>
        <text class="font-color-black flex-1 text-right">{{ userInfo.ntf_url }}</text>
      </view>
      <view class="flex flex-js-sb font-size-14 flex-ai-center">
        <text class="font-color-999">订单金额:</text>
        <view v-if="orderType === 1 && orderBaseInfo.count > 1">
          <text class="font-size-10 font-color-black"
            >￥{{ product.price }}x{{ orderBaseInfo.count }}=</text
          >
          <text class="font-color-black">{{ totalPrice }}</text>
        </view>
        <text v-else class="font-color-black font-w-500 font-size-16">￥{{ totalPrice }}</text>
      </view>
    </view>

    <!-- 支付方式（原站 PayType） -->
    <view class="br-12 pay-type">
      <view
        v-for="p in basePayList"
        :key="p.key"
        class="plr-16 ptb-14 flex flex-ai-center pay-item"
        @click="changePayType(p)"
      >
        <text class="pl-12 font-color-black font-size-14 flex-1">{{ p.name }}</text>
        <view v-if="p.able" class="pay-check">
          <view v-if="payInfo.pay_type === p.pay_type && payInfo.pay_way === p.pay_way" class="check-on"></view>
          <view v-else class="check-off"></view>
        </view>
        <text v-else class="font-size-12 pay-disabled">未支持该支付通道收款</text>
      </view>
    </view>

    <!-- 底部操作 -->
    <view class="action bg-color-pageBg">
      <view class="btns flex flex-ai-center plr-16 flex-js-sb">
        <view class="font-color-black price">
          <text class="font-size-12">￥</text>
          <text class="font-size-20">{{ totalPrice }}</text>
        </view>
        <view class="pay-btn" :class="{ disabled: disable }" @click="submit">立即支付</view>
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

const product = ref({})
const orderType = ref(2)
const userInfo = ref({})
const orderBaseInfo = reactive({
  count: 1,
  maxCount: 1,
  order_type: 2,
  product: {},
})

// 原站 index.js 0689.basePayList
const basePayList = ref([
  {
    name: '汇付',
    icon: 'huifupay',
    key: 'huifu_pay_status',
    auth_key: 'huifu_account',
    pay_type: 4,
    pay_way: 'huifu',
    able: true,
  },
])
const payInfo = reactive({ pay_type: 4, pay_way: 'huifu' })

const totalPrice = computed(() =>
  ((product.value.price || 0) * (orderBaseInfo.count || 1)).toFixed(2)
)
const productImg = computed(() => {
  const p = orderBaseInfo.product || {}
  const src = p.main_image || p.listimg || ''
  if (!src) return ''
  return src.startsWith('http') ? src : ossImg(src)
})
const publisherNick = computed(() => {
  const p = orderBaseInfo.product || {}
  return p.publisher && p.publisher.user && p.publisher.user.nickname
})
const disable = computed(() => !localStorage.getItem('token'))

function goBack() {
  if (window.history.length > 1) router.back()
  else router.push('/pages/market/market')
}

function minus() {
  if (orderBaseInfo.count <= 1) return
  orderBaseInfo.count -= 1
}
function add() {
  if (orderBaseInfo.count >= orderBaseInfo.maxCount) return
  orderBaseInfo.count += 1
}
function changeCount(e) {
  const v = parseInt(e.target.value, 10)
  orderBaseInfo.count = Number.isNaN(v)
    ? 1
    : Math.min(Math.max(v, 1), orderBaseInfo.maxCount)
}
function changePayType(p) {
  payInfo.pay_type = p.pay_type
  payInfo.pay_way = p.pay_way
}

function submit() {
  if (disable.value) {
    uni.showToast({ title: '请先登录', icon: 'none' })
    return
  }
  uni.showToast({ title: '原站下单需人机验证', icon: 'none' })
}

onMounted(async () => {
  orderType.value = Number(route.query.type || 2)
  // 原站从 storage 读取 confirmOrder
  let cached = null
  try {
    cached = JSON.parse(localStorage.getItem('confirmOrder') || 'null')
  } catch (e) {
    cached = null
  }
  if (cached && cached.product) {
    orderBaseInfo.product = cached.product
    orderBaseInfo.count = cached.count || 1
    orderBaseInfo.maxCount = cached.maxCount || 1
    orderBaseInfo.order_type = cached.order_type || 2
    orderType.value = cached.type || orderType.value
    return
  }
  const id = route.query.id || 226
  const data = await fetchMarketDetail(id)
  if (data && data.product) {
    orderBaseInfo.product = data.product
    product.value = { ...data.product, price: data.price }
  }
})
</script>

<style scoped>
@import '@/styles/atomic.css';

.order-submit {
  min-height: 100vh;
  background: #f4f6fa;
  padding-bottom: 200rpx;
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

.goods-row {
  border-radius: 16rpx;
}
.goods-img {
  width: 166rpx;
  height: 166rpx;
  border-radius: 16rpx;
  background: #333;
  flex-shrink: 0;
}
.goods-name {
  font-size: 28rpx;
  line-height: 1.4;
}
.step-btn {
  width: 44rpx;
  height: 44rpx;
}
.count-input {
  width: 80rpx;
  text-align: center;
  font-size: 28rpx;
}

.pay-type {
  background-color: #e8e8e8;
  border-radius: 24rpx;
  margin-top: 32rpx;
}
.pay-item {
  border-bottom: 1px solid #d8d8d8;
}
.pay-item:last-child {
  border-bottom: none;
}
.check-on,
.check-off {
  width: 32rpx;
  height: 32rpx;
  border-radius: 50%;
  border: 3rpx solid #6aa27b;
  background: #6aa27b;
  box-sizing: border-box;
}
.check-off {
  background: #fff;
}
.pay-disabled {
  color: #999;
}

.action {
  position: fixed;
  width: 100%;
  left: 0;
  bottom: 0;
  padding-bottom: env(safe-area-inset-bottom);
}
.btns {
  width: 100%;
  height: 120rpx;
  background: #f4f6fa;
}
.price {
  font-family: HarmonyOS Sans SC-Bold, HarmonyOS Sans SC;
  font-weight: 700;
  color: #1a2438;
}
.pay-btn {
  width: 480rpx;
  height: 88rpx;
  line-height: 88rpx;
  text-align: center;
  background: #6aa27b;
  color: #fff;
  font-size: 30rpx;
  border-radius: 44rpx;
}
.pay-btn.disabled {
  opacity: 0.5;
}
</style>
