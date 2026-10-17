<template>
  <view class="box-detail-page">
    <PageNavbar :title="product.name || '藏品介绍'" />

    <!-- 主图 -->
    <view class="media-card">
      <img class="main-img" :src="ossImg(product.main_image || product.listimg)" mode="widthFix" />
      <view class="media-limit">
        <text class="MiSans-Regular limit-text">限量 {{ product.total_num }} 份</text>
      </view>
    </view>

    <!-- 名称 + 价格 -->
    <view class="info-card">
      <text class="MiSans-Medium goods-name">{{ product.name }}</text>
      <view class="price-row">
        <view class="crystal">
          <text class="MiSans-Demibold crystal-price">{{ info.crystal_price || 0 }}</text>
          <text class="MiSans-Regular crystal-label">龙晶</text>
        </view>
        <text class="MiSans-Regular status-text">编号随机</text>
      </view>
    </view>

    <!-- 藏池概率 -->
    <view v-if="pool.length" class="plr-16 ptb-12">
      <view class="section-card">
        <text class="MiSans-Medium section-title">藏品介绍</text>
        <view v-for="c in pool" :key="c.id" class="pool-item">
          <img class="pool-thumb" :src="ossImg(c.listimg)" mode="aspectFill" />
          <view class="pool-meta">
            <text class="MiSans-Medium pool-name text-overflow-2">{{ c.name }}</text>
            <view class="pool-tags">
              <text class="MiSans-Regular pool-tag">概率：{{ c.probability }}%</text>
              <text class="MiSans-Regular pool-tag">总量：{{ c.show_total_num }}</text>
            </view>
          </view>
          <img class="rarity-icon" :src="ossImg(c.rarity_icon)" mode="aspectFit" />
        </view>
      </view>
    </view>

    <!-- 藏品名称 / 创作者 信息 -->
    <view class="plr-16 ptb-12">
      <view class="section-card">
        <text class="MiSans-Medium section-title">藏品信息</text>
        <view class="kv">
          <text class="MiSans-Regular kv-k">藏品名称</text>
          <text class="MiSans-Regular kv-v">{{ product.name }}</text>
        </view>
        <view v-if="publisher" class="kv">
          <text class="MiSans-Regular kv-k">创作者</text>
          <text class="MiSans-Regular kv-v">{{ publisher }}</text>
        </view>
        <view class="kv">
          <text class="MiSans-Regular kv-k">申购规则</text>
          <text class="MiSans-Regular kv-v">限量发行，售完即止</text>
        </view>
      </view>
    </view>

    <!-- 购买须知 -->
    <view class="plr-16 ptb-12">
      <view class="section-card">
        <text class="MiSans-Medium section-title">购买须知</text>
        <view class="rich mt-12" v-html="info.details || product.details || ''"></view>
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
      <view class="action-btn" :class="{ off: disabled }" @click="goExchange">
        <text class="MiSans-Medium btn-text">{{ statusText }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
/**
 * 原站 shop/detail/box —— 盲盒商品详情
 * 结构：主图 + 价格卡 + 藏池概率列表 + 藏品信息 + 购买须知 + 底部「立即兑换」。
 */
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import PageNavbar from '@/components/PageNavbar.vue'
import { asset, fetchShopBoxDetail } from '@/utils/api'
import { ossImg } from '@/api'

defineOptions({ name: 'ShopBoxDetail' })

const router = useRouter()
const info = ref({})
const product = ref({})

onMounted(async () => {
  const data = await fetchShopBoxDetail()
  info.value = data.info || {}
  product.value = data.product || {}
})

const pool = computed(() => product.value.collectionlist || [])
const publisher = computed(() => {
  const p = product.value.publisher
  if (!p) return ''
  return (p.user && p.user.nickname) || p.name || ''
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

function goExchange() {
  if (disabled.value) return
  router.push({ path: '/pages/shop/exchange', query: { id: product.value.id, count: 1 } })
}
</script>

<style scoped src="./BoxDetail.css"></style>
