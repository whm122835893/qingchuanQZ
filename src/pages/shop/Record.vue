<template>
  <view class="record-page">
    <PageNavbar title="兑换记录" />

    <view class="pa-16">
      <view v-for="(r, i) in list" :key="r.id || i" class="item" @click="toDetail(r)">
        <img class="thumb" :src="ossImg(r.list_image)" mode="aspectFill" />
        <view class="right">
          <view class="right-col">
            <text class="MiSans-Medium goods-name text-overflow">{{ r.goods_name }}</text>
            <view class="crystal-row">
              <text class="MiSans-Demibold crystal-num">{{ r.crystal_number }}</text>
              <text class="MiSans-Regular crystal-label">龙晶</text>
            </view>
            <text class="MiSans-Regular time">{{ fmt(r.create_time) }}</text>
          </view>
          <img class="arrow" :src="asset('static/icon/arrow-right.png')" mode="widthFix" />
        </view>
      </view>

      <view v-if="!list.length" class="empty-box">
        <img class="empty-img" :src="asset('static/empty/search1-empty.png')" mode="widthFix" />
        <text class="MiSans-Regular empty-text">暂无兑换记录</text>
      </view>
    </view>
  </view>
</template>

<script setup>
/**
 * 原站 shop/record —— 兑换记录
 * 结构：导航 + 记录列表（缩略图 + 商品名 + 龙晶数 + 时间 + 右箭头），点击跳订单详情。
 */
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import PageNavbar from '@/components/PageNavbar.vue'
import { asset, fetchShopExchangeRecord } from '@/utils/api'
import { ossImg } from '@/api'

defineOptions({ name: 'ShopRecord' })

const router = useRouter()
const list = ref([])

onMounted(async () => {
  list.value = await fetchShopExchangeRecord()
})

function fmt(v) {
  if (!v) return ''
  const d = new Date(Number(v) * 1000)
  if (Number.isNaN(d.getTime())) return String(v)
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}

function toDetail(r) {
  router.push({ path: '/pages/order/defaultDetail', query: { id: r.order_id, orderType: 4 } })
}
</script>

<style scoped>
@import '@/styles/atomic.css';

.record-page {
  min-height: 100vh;
  background: #f4f5f8;
  box-sizing: border-box;
}

.item {
  display: flex;
  align-items: center;
  width: 100%;
  height: 150rpx;
  padding: 13.5rpx;
  margin-bottom: 18rpx;
  background: #fff;
  border-radius: 12rpx;
}
.thumb {
  width: 166rpx;
  height: 166rpx;
  border-radius: 8rpx;
  background: #f0f1f4;
  flex-shrink: 0;
}
.right {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex: 1;
  min-width: 0;
  height: 100%;
  margin-left: 28rpx;
}
.right-col {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}
.goods-name {
  font-size: 30rpx;
  color: #1a2438;
}
.crystal-row {
  display: flex;
  align-items: baseline;
  margin-top: 24rpx;
}
.crystal-num {
  font-size: 32rpx;
  color: #e26f1b;
}
.crystal-label {
  margin-left: 8rpx;
  font-size: 20rpx;
  color: #e26f1b;
}
.time {
  margin-top: 8rpx;
  font-size: 20rpx;
  color: #999;
}
.arrow {
  width: 26rpx;
  margin-left: 16rpx;
  flex-shrink: 0;
}

.empty-box {
  padding: 180rpx 0 80rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.empty-img {
  width: 300rpx;
}
.empty-text {
  margin-top: 24rpx;
  font-size: 26rpx;
  color: #999;
}
</style>