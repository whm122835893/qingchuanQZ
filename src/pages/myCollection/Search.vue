<template>
  <view class="mc-search-page">
    <view class="navbar flex flex-ai-center">
      <view class="back-btn flex flex-ai-center flex-js-center" @click="goBack">
        <img :src="asset('static/common/back_default.png')" mode="widthFix" />
      </view>
      <view class="search-con">
        <view class="ipt flex flex-ai-center">
          <img class="ipt-icon" :src="asset('static/icon/search.png')" mode="widthFix" />
          <input
            class="ipt-input MiSans-Regular" v-model="keywords"
            placeholder="搜索内容"
            confirm-type="search"
            @confirm="doSearch"
          />
          <view v-if="keywords" class="ipt-clear" @click="keywords = ''"></view>
        </view>
      </view>
    </view>

    <view class="searc-list">
      <view v-if="!keywords" class="hint-wrap flex-center">
        <text class="MiSans-Regular hint-text">输入藏品名称或编号搜索</text>
      </view>
      <view
        v-for="item in result"
        :key="item.id"
        class="item flex flex-ai-center"
        @click="goDetail(item)"
      >
        <img class="item-thumb" :src="ossImg(item.listimg)" mode="aspectFill" />
        <view class="pl-8 flex-1 flex-dir-col">
          <view class="flex flex-w name-row">
            <text
              v-for="(seg, i) in splitName(item.name)"
              :key="i"
              class="MiSans-Regular name-seg"
              :class="{ hit: keywords.includes(seg) }"
              >{{ seg }}</text
            >
          </view>
          <view class="flex flex-js-sb flex-ai-center mt-6">
            <text class="MiSans-Regular item-code">#{{ item.collection_code }}</text>
            <text class="MiSans-Medium item-price">{{ item.price }} 元</text>
          </view>
        </view>
      </view>
      <view v-if="keywords && !result.length" class="hint-wrap flex-center">
        <text class="MiSans-Regular hint-text">暂无数据~</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { fetchMyCollectionList, asset } from '@/utils/api'
import { ossImg } from '@/api'

const router = useRouter()
const all = ref([])
const keywords = ref('')

const result = computed(() => {
  const kw = keywords.value.trim()
  if (!kw) return []
  const upper = kw.toUpperCase()
  return all.value.filter(
    (x) =>
      (x.name || '').includes(kw) ||
      (x.collection_code || '').toUpperCase().includes(upper)
  )
})

function splitName(name) {
  return (name || '').split('')
}

function doSearch() {
  /* 结果由 computed 实时派生，无需额外请求 */
}

function goDetail(item) {
  router.push(`/pages/myCollection/collectionDetails?id=${item.collection_id}&code=${item.collection_code}`)
}

function goBack() {
  if (window.history.length > 1) router.back()
  else router.push('/pages/myCollection/myCollection')
}

async function init() {
  all.value = await fetchMyCollectionList({})
}
init()
</script>

<style scoped>
@import '@/styles/atomic.css';
.mc-search-page {
  min-height: 100vh;
  background: #fff;
}
.navbar {
  padding: 0 16rpx;
  height: 88rpx;
}
.back-btn {
  width: 56rpx;
  height: 56rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.55);
}
.back-btn img {
  width: 17rpx;
}
.search-con {
  flex: 1;
  margin-left: 16rpx;
}
.ipt {
  height: 64rpx;
  padding: 0 20rpx;
  border-radius: 32rpx;
  background: #f4f6fa;
}
.ipt-icon {
  width: 28rpx;
}
.ipt-input {
  flex: 1;
  margin-left: 10rpx;
  font-size: 26rpx;
  color: #000;
}
.ipt-clear {
  width: 28rpx;
  height: 28rpx;
  border-radius: 50%;
  background: #c9ced6;
  position: relative;
}
.ipt-clear::before,
.ipt-clear::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 50%;
  width: 14rpx;
  height: 2rpx;
  background: #fff;
}
.ipt-clear::before {
  transform: translate(-50%, -50%) rotate(45deg);
}
.ipt-clear::after {
  transform: translate(-50%, -50%) rotate(-45deg);
}
.searc-list {
  padding: 0 16rpx;
}
.item {
  padding: 21rpx 0;
  border-bottom: 1rpx solid #f5f5f5;
}
.item-thumb {
  width: 100rpx;
  height: 100rpx;
  border-radius: 8rpx;
  background: #f4f6fa;
}
.name-row {
  flex-wrap: wrap;
}
.name-seg {
  font-size: 27rpx;
  color: #666;
}
.name-seg.hit {
  color: #000;
  font-weight: 500;
}
.item-code {
  font-size: 21rpx;
  color: #999;
}
.item-price {
  font-size: 26rpx;
  color: #e04b28;
}
.hint-wrap {
  height: 400rpx;
}
.hint-text {
  font-size: 26rpx;
  color: #999;
}
</style>