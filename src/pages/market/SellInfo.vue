<template>
  <view class="market-list bg-color-pageBg page-bg-colorfull ptb-16">
    <!-- 导航 -->
    <view class="tnav">
      <view class="tnav-left" @click="goBack">
        <img :src="asset('static/common/back_default.png')" mode="widthFix" />
      </view>
      <text class="tnav-title">{{ title }}</text>
    </view>

    <view class="plr-24">
      <!-- 今日行情 -->
      <view class="total-info bg-color-item plr-12 ptb-8 flex flex-js-sb flex-ai-center">
        <view class="flex flex-center">
          <img class="main-thumb" :src="thumbSrc" mode="aspectFill" />
          <text class="MiSans-Regular name ml-10">{{ product.name || '--' }}</text>
        </view>
        <view class="font-size-10 font-color-999">
          <view class="flex flex-ai-center">
            <view class="flex flex-dir-col font-size-10">
              <text>今日最高</text>
              <text class="mt-4 high">￥{{ info.today_highest_price }}</text>
            </view>
            <view class="flex flex-dir-col font-size-10 ml-8">
              <text>今日成交量</text>
              <text class="mt-4">{{ info.today_volume }}</text>
            </view>
          </view>
          <view class="flex flex-ai-center mt-10">
            <view class="flex flex-dir-col font-size-10">
              <text>今日最低</text>
              <text class="mt-4 high">￥{{ info.today_lowest_price }}</text>
            </view>
            <view class="flex flex-dir-col font-size-10 ml-8">
              <text>今日地板价</text>
              <text class="mt-4 low">￥{{ info.floor_price }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 成交记录 -->
      <text class="mtb-20 plr-16 MiSans-Demibold dark block">成交记录</text>

      <view class="plr-16 list mt-10">
        <view
          v-for="(item, i) in list"
          :key="i"
          class="plr-12 ptb-12 flex font-color-black font-size-12 flex-js-sb item mb-10"
        >
          <view>
            <view class="font-color-black font-w-bold mb-10 font-size-14 flex flex-center">
              <text class="mr-4">{{ product.name }}</text>
              <text>#{{ item.collection_code }}</text>
              <text class="font-color-black font-size-12">/{{ item.total_num }}</text>
            </view>
            <text v-if="search.status === 1" class="font-color-999">{{ item.time }}</text>
          </view>
          <view class="flex flex-center">
            <view class="price-wrap flex flex-ai-end">
              <text class="font-size-12">￥</text>
              <text class="font-size-14 font-w-bold">{{ item.price }}</text>
            </view>
            <text class="font-color-999 ml-8">{{ item.num }}单</text>
          </view>
        </view>

        <view v-if="!list.length" class="empty">暂无成交记录</view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { fetchSellInfo, asset } from '@/utils/api'
import { ossImg } from '@/api'

const route = useRoute()
const router = useRouter()

const info = ref({})
const product = ref({})
const list = ref([])
const title = ref('寄售详情')
const search = reactive({ status: 1 })

const thumbSrc = computed(() => {
  const p = product.value
  const src = p.main_image || p.listimg || ''
  if (!src) return ''
  return src.startsWith('http') ? src : ossImg(src)
})

function goBack() {
  if (window.history.length > 1) router.back()
  else router.push('/pages/market/market')
}

onMounted(async () => {
  const data = await fetchSellInfo({ id: route.query.id || 226 })
  if (data) {
    info.value = data
    product.value = data.product || { name: data.name, main_image: data.img }
    list.value = data.list || []
    title.value = product.value.name || '寄售详情'
  }
})
</script>

<style scoped>
@import '@/styles/atomic.css';

.market-list {
  min-height: 100vh;
  background: #eef4f0;
}
.main-thumb {
  width: 126rpx;
  height: 126rpx;
  border-radius: 10rpx;
  position: relative;
  background: #333;
}
.name {
  font-size: 28rpx;
  color: #1a2438;
}
.high {
  color: #de1010;
}
.low {
  color: #19de10;
}
.dark {
  color: #1a2438;
}
.item {
  background: #fff;
  border-radius: 12rpx;
}
.price-wrap {
  color: #1a2438;
}
.empty {
  padding: 80rpx 0;
  text-align: center;
  font-size: 26rpx;
  color: #999;
}
</style>
