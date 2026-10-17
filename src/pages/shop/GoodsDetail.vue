<template>
  <view class="goods-detail-page">
    <PageNavbar :title="product.name || '商品详情'" />

    <!-- 主图 -->
    <view class="media-card">
      <img class="main-img" :src="ossImg(product.main_image || product.listimg)" mode="widthFix" />
      <view v-if="product.total_num" class="media-limit">
        <text class="MiSans-Regular limit-text">限量 {{ product.total_num }} 份</text>
      </view>
    </view>

    <!-- 价格与状态 -->
    <view class="info-card">
      <view class="price-row">
        <view class="crystal">
          <text class="MiSans-Demibold crystal-price">{{ info.crystal_price || 0 }}</text>
          <text class="MiSans-Regular crystal-label">龙晶</text>
        </view>
        <text class="MiSans-Regular status-text">{{ statusText }}</text>
      </view>
      <text class="MiSans-Medium goods-name">{{ product.name }}</text>
      <text class="MiSans-Regular sold-text">限量 {{ product.total_num }} 份 · 编号随机</text>
    </view>

    <!-- 商品详情（富文本） -->
    <view class="plr-16 ptb-12">
      <view class="detail-card">
        <text class="MiSans-Medium card-title">商品详情</text>
        <view class="rich mt-12" v-html="product.details || info.details || ''"></view>
      </view>
    </view>

    <view class="copyright">
      <img class="copyright-img" :src="asset('static/icon/copyright.png')" mode="widthFix" />
    </view>

    <!-- 底部固定操作栏 -->
    <view class="action-bar">
      <view class="action-left">
        <text class="MiSans-Regular balance-label">我的龙晶</text>
        <text class="MiSans-Demibold balance-num">{{ info.crystal_number || 0 }}</text>
      </view>
      <view class="action-btn" :class="{ off: disabled }" @click="onExchange">
        <text class="MiSans-Medium btn-text">{{ statusText }}</text>
      </view>
    </view>

    <!-- 兑换数量选择 -->
    <view v-if="countPop" class="mask" @click="countPop = false">
      <view class="sheet" @click.stop>
        <text class="MiSans-Medium sheet-title">兑换数量</text>
        <view class="stepper">
          <view class="step-btn" @click="minus">
            <text class="step-text">-</text>
          </view>
          <text class="MiSans-Medium step-num">{{ count }}</text>
          <view class="step-btn" @click="add">
            <text class="step-text">+</text>
          </view>
        </view>
        <text class="MiSans-Regular tip">单个商品兑换总数不得超过 {{ info.max_count || 1 }} 个</text>
        <view class="sheet-btn" @click="goExchange">
          <text class="MiSans-Medium sheet-btn-text">立即兑换</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
/**
 * 原站 shop/detail/goods —— 普通商品详情
 * 结构：主图 + 价格卡 + 商品详情富文本 + 底部固定「立即兑换」栏 + 兑换数量弹层。
 */
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import PageNavbar from '@/components/PageNavbar.vue'
import { asset, fetchShopGoodsDetail } from '@/utils/api'
import { ossImg } from '@/api'

defineOptions({ name: 'ShopGoodsDetail' })

const router = useRouter()
const info = ref({})
const product = ref({})
const countPop = ref(false)
const count = ref(1)

onMounted(async () => {
  const data = await fetchShopGoodsDetail()
  info.value = data.info || {}
  product.value = data.product || {}
})

const disabled = computed(() => info.value.exchange_status === 4 || info.value.exchange_status === 5)

const statusText = computed(() => {
  const s = info.value.exchange_status
  if (s === 1) return '设置购买提醒'
  if (s === 2) return '立即兑换'
  if (s === 4) return '已兑完'
  if (s === 5) return '水晶不足'
  return '立即兑换'
})

function onExchange() {
  if (disabled.value) return
  countPop.value = true
}
function minus() {
  if (count.value > 1) count.value -= 1
}
function add() {
  const max = info.value.max_count || 1
  if (count.value < max) count.value += 1
}
function goExchange() {
  countPop.value = false
  router.push({
    path: '/pages/shop/exchange',
    query: { id: product.value.id, count: count.value },
  })
}
</script>

<style scoped src="./GoodsDetail.css"></style>
