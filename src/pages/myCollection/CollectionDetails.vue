<template>
  <view class="collection-details-page">
    <!-- 主图卡片（原站 w-product-details-card） -->
    <view class="product-card">
      <view class="img-wrap flex flex-js-center flex-ai-center">
        <img class="main-img" :src="mainImg" mode="aspectFill" @click="preview" />
      </view>
      <view class="info-wrap flex flex-dir-col flex-ai-center">
        <text class="MiSans-Demibold name text-overflow">{{ product.name || '--' }}</text>
        <view class="flex flex-ai-center limit-row">
          <view class="limit-tag flex flex-ai-center flex-js-center MiSans-Regular">限量</view>
          <view class="flex flex-ai-center flex-js-center MiSans-Regular font-size-11 plr-13">
            {{ product.total_num || 0 }}
          </view>
        </view>
      </view>
    </view>

    <!-- 编号 / 总序号 / 当前售价 / 链上凭证 -->
    <view class="detail-body">
      <view class="tech-card flex flex-dir-col">
        <view class="code-row flex flex-ai-center flex-js-sb">
          <text class="MiSans-Regular tech-label">藏品编号</text>
          <text class="MiSans-Medium code-value">#{{ info.collection_code || '--' }}</text>
        </view>
        <view
          v-for="row in techRows"
          :key="row.label"
          class="tech-row flex flex-ai-center flex-js-sb"
        >
          <text class="MiSans-Regular tech-label">{{ row.label }}</text>
          <text class="MiSans-Regular tech-value text-overflow">{{ row.value }}</text>
        </view>
        <view class="tech-row flex flex-ai-center flex-js-sb">
          <text class="MiSans-Regular tech-label">当前售价</text>
          <text class="MiSans-Demibold price-value">¥{{ info.price || '0.00' }}</text>
        </view>
      </view>

      <!-- 交易记录入口 -->
      <view class="entry-card">
        <view class="entry-row flex flex-ai-center flex-js-sb" @click="goOrder">
          <text class="MiSans-Regular entry-label">交易记录</text>
          <view class="flex flex-ai-center">
            <text class="MiSans-Regular entry-value">共 {{ info.today_volume || 0 }} 笔</text>
            <view class="arrow"></view>
          </view>
        </view>
        <view class="entry-row flex flex-ai-center flex-js-sb" @click="goSellInfo">
          <text class="MiSans-Regular entry-label">寄售详情</text>
          <view class="arrow"></view>
        </view>
        <view class="entry-row flex flex-ai-center flex-js-sb" @click="goKline">
          <text class="MiSans-Regular entry-label">行情走势</text>
          <view class="arrow"></view>
        </view>
      </view>

      <!-- 购买须知 -->
      <view class="buy-need">
        <text class="MiSans-Demibold buy-title">购买须知</text>
        <text class="MiSans-Regular buy-text">{{ BUY_TIP }}</text>
      </view>
    </view>

    <CollectionActionBar
      :buttons="buttons"
      :confirm-cancel="confirmCancel"
      @action="onAction"
      @confirm="doCancel"
      @update:confirm-cancel="confirmCancel = $event"
    />
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { fetchCollectionInfo, asset } from '@/utils/api'
import { ossImg } from '@/api'
import CollectionActionBar from '@/components/CollectionActionBar.vue'

const BUY_TIP =
  '为更好服务青川平台的各位用户，青川特此公告数字藏品的二次交易细则。鉴于不同属性的数字艺术的二次交易细则各有不同，请各位用户务必审慎阅读并同意相关规则后进行相应操作，以免造成不必要损失。'

const route = useRoute()
const router = useRouter()
const info = ref({ product: {}, user: {} })
const confirmCancel = ref(false)

const product = computed(() => info.value.product || {})
const mainImg = computed(() => {
  const p = product.value
  const src = p.main_image || p.listimg || ''
  if (!src) return asset('static/collection/top_bg.png')
  return src.startsWith('http') ? src : ossImg(src)
})

const techRows = computed(() => {
  const rows = [
    { label: '总序号', value: `${info.value.serial_num || '--'} / ${info.value.series_total || product.value.total_num || '--'}` },
    { label: '藏品持有者', value: info.value.user_hash_text || '--' },
    { label: '创作者', value: '青川' },
    { label: '认证时间', value: fmtDate(info.value.createtime) },
  ]
  return rows
})

const buttons = computed(() => {
  const p = product.value
  const st = info.value.status
  if (info.value.user_hash) {
    const list = []
    if (st === 10) list.push({ text: '赠送中', disabled: true })
    if (st === 2 && p.is_lock === 1) list.push({ text: '锁定中', disabled: true })
    if (p.weither_regift === 0 && st === 1) list.push({ text: '转赠', type: 'regift' })
    if (p.can_compose === 1 && !p.is_lock && st === 1) list.push({ text: '合成', type: 'compose' })
    if (p.weither_resale === 0 && st === 1) list.push({ text: '立即寄售', type: 'resale' })
    if (st === 2 && p.is_lock !== 1) list.push({ text: '取消寄售', type: 'cancel' })
    if (st === 1 && p.is_lock !== 1 && p.weither_regift === 1 && p.weither_resale === 1 && p.can_compose === 0)
      list.push({ text: '尚未开启寄售', disabled: true })
    return list.length ? list : [{ text: '上链中', disabled: true }]
  }
  return [{ text: '上链中', disabled: true }]
})

function fmtDate(ts) {
  if (!ts) return '--'
  const d = new Date(Number(ts) * 1000)
  const p = (v) => String(v).padStart(2, '0')
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())}`
}

function preview() {
  if (mainImg.value) uni.previewImage({ urls: [mainImg.value], current: mainImg.value })
}

function onAction(b) {
  if (b.disabled) return
  if (b.type === 'cancel') {
    confirmCancel.value = true
    return
  }
  if (b.type === 'compose') {
    router.push('/pages/compound/compound')
    return
  }
  if (b.type === 'regift') {
    router.push('/pages/regift/regift')
    return
  }
  if (b.type === 'resale') {
    router.push('/pages/consignments/consignments')
    return
  }
  uni.showToast({ title: b.text })
}

function doCancel() {
  confirmCancel.value = false
  info.value.status = 1
  uni.showToast({ title: '已取消寄售' })
}

function goOrder() {
  router.push('/pages/order/orderSubmit')
}
function goSellInfo() {
  router.push('/pages/market/sellInfo')
}
function goKline() {
  router.push('/pages/kline/buy')
}

async function init() {
  const data = await fetchCollectionInfo({ id: route.query.id || 226 })
  if (data && data.product) info.value = data
}
init()
</script>

<style scoped>
@import '@/styles/atomic.css';
.collection-details-page {
  min-height: 100vh;
  background: #f4f6fa;
  padding-bottom: 160rpx;
}
.product-card {
  background: #fff;
  padding: 40rpx 0 30rpx;
}
.img-wrap {
  width: 100%;
  height: 420rpx;
}
.main-img {
  width: 340rpx;
  height: 340rpx;
  border-radius: 16rpx;
  background: #f4f6fa;
}
.info-wrap {
  margin-top: 20rpx;
}
.name {
  font-size: 34rpx;
  color: #000;
}
.limit-row {
  margin-top: 12rpx;
}
.limit-tag {
  height: 28rpx;
  padding: 0 8rpx;
  border-radius: 6rpx;
  background: #e2e2e2;
  font-size: 20rpx;
  color: #535353;
}
.detail-body {
  margin-top: 20rpx;
  padding: 0 16rpx;
}
.tech-card,
.entry-card,
.buy-need {
  padding: 12rpx 24rpx;
  background: #fff;
  border-radius: 12rpx;
}
.entry-card {
  margin-top: 20rpx;
}
.buy-need {
  margin-top: 20rpx;
  padding: 30rpx;
  border: 1rpx solid #bfccc8;
}
.buy-title {
  font-size: 30rpx;
  color: #000;
}
.buy-text {
  display: block;
  margin-top: 16rpx;
  font-size: 24rpx;
  line-height: 40rpx;
  color: #666;
}
.tech-row,
.code-row,
.entry-row {
  min-height: 88rpx;
  border-bottom: 1rpx solid #f5f5f5;
}
.tech-row:last-child,
.entry-row:last-child {
  border-bottom: 0;
}
.tech-label,
.entry-label {
  font-size: 26rpx;
  color: #999;
}
.tech-value,
.entry-value {
  max-width: 440rpx;
  font-size: 26rpx;
  color: #333;
}
.code-value {
  font-size: 30rpx;
  color: #000;
}
.price-value {
  font-size: 30rpx;
  color: #e04b28;
}
.arrow {
  width: 14rpx;
  height: 14rpx;
  margin-left: 10rpx;
  border-top: 2rpx solid #c9ced6;
  border-right: 2rpx solid #c9ced6;
  transform: rotate(45deg);
}







</style>