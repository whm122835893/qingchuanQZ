<template>
  <view class="gift-page page-bg-colorfull plr-16">
    <view class="tnav">
      <view class="tnav-left" @click="goBack">
        <img :src="asset('static/common/back_default.png')" mode="widthFix" />
      </view>
      <text class="tnav-title">赠送记录</text>
    </view>

    <view class="list bg-color-item pa-12 br-8">
      <view
        v-for="(item, i) in list"
        :key="i"
        class="ptb-8 flex font-color-black font-size-12 flex-js-sb item"
      >
        <view>
          <view class="font-color-black font-w-bold mb-10 font-size-14 flex flex-center">
            <text class="mr-4">{{ name }}</text>
            <text>#{{ item.collection_code }}</text>
            <text class="font-color-black font-size-12">/{{ item.total_num }}</text>
          </view>
          <text class="font-color-999">{{ item.time }}</text>
        </view>
        <view class="flex flex-center">
          <view class="font-size-16 flex flex-ai-end font-w-bold">
            <text class="font-size-12">￥</text>
            <text>{{ item.price }}</text>
          </view>
        </view>
      </view>

      <view v-if="!list.length" class="empty">暂无赠送记录</view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { fetchGiftRecord, asset } from '@/utils/api'

const route = useRoute()
const router = useRouter()

const list = ref([])
const name = computed(() => route.query.name || '赛博铁牛')

function goBack() {
  if (window.history.length > 1) router.back()
  else router.push('/pages/my/my')
}

onMounted(async () => {
  list.value = await fetchGiftRecord()
})
</script>

<style scoped>
@import '@/styles/atomic.css';

.gift-page {
  min-height: 100vh;
  background: #eef4f0;
}
.list {
  background: #fff;
  border-radius: 16rpx;
}
.item {
  border-bottom: 1px solid #f5f5f5;
}
.item:last-child {
  border-bottom: none;
}
.empty {
  padding: 80rpx 0;
  text-align: center;
  font-size: 26rpx;
  color: #999;
}
</style>
