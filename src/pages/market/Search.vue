<template>
  <view class="market-search-page">
    <view class="diy-nav plr-16 flex flex-ai-center">
      <img class="nav-back" :src="asset('static/common/back_default.png')" mode="widthFix" @click="goBack" />
      <view class="ipt flex flex-ai-center">
        <input
          class="ipt-input MiSans-Regular" v-model="keywords"
          placeholder="搜索关键词..."
          confirm-type="search"
          @confirm="doSearch"
        />
        <view v-if="keywords" class="ipt-clear" @click="clearKeyword"></view>
        <img v-else class="ipt-suffix" :src="asset('static/market/search.png')" mode="aspectFit" @click="doSearch" />
      </view>
    </view>

    <!-- 表头 -->
    <view class="head-row flex flex-ai-center">
      <text class="head-col col-name">藏品</text>
      <text class="head-col col-mid">成交量</text>
      <text class="head-col col-mid">地板价</text>
      <text class="head-col col-chg">涨跌幅</text>
    </view>

    <view class="rows-wrap">
      <view v-for="t in list" :key="t.id" class="market-row flex flex-ai-center" @click="toDetail(t)">
        <view class="flex flex-ai-center name-col">
          <img class="row-thumb" :src="ossImg(thumbOf(t))" mode="aspectFill" />
          <view class="flex flex-dir-col pl-8 meta-col">
            <view class="flex flex-ai-center">
              <text class="MiSans-Medium row-name text-overflow">{{ nameOf(t) }}</text>
              <img
                class="like-icon"
                :src="t.is_like ? asset('static/market/like_sel.png') : asset('static/market/like_default.png')"
                mode="aspectFit"
                @click.stop="targetLike(t)"
              />
            </view>
            <view v-if="t.is_out === 1" class="out-tag flex flex-ai-center flex-js-center">
              <text class="MiSans-Regular out-text">已退市</text>
            </view>
            <text class="MiSans-Regular meta-line">发行 {{ t.total_num || 0 }}</text>
            <text class="MiSans-Regular meta-line">流通 {{ t.flux || 0 }}</text>
            <text class="MiSans-Regular meta-line">成交 {{ t.deal_num || 0 }}</text>
          </view>
        </view>
        <view class="flex flex-js-center price-col">
          <text class="MiSans-Demibold price-text">{{ priceOf(t) }}</text>
        </view>
        <view class="flex flex-ai-center flex-js-end chg-col">
          <img
            class="chg-icon"
            :src="changeNum(t) >= 0 ? asset('static/market/market_zhang.png') : asset('static/market/die.png')"
            mode="aspectFit"
          />
          <text
            class="MiSans-Semibold chg-text"
            :style="{ color: changeNum(t) >= 0 ? '#e54d42' : '#22a06b' }"
            >{{ formatChange(t) }}</text
          >
        </view>
      </view>

      <view v-if="!list.length" class="end-row flex-center">
        <text class="MiSans-Regular end-text">{{ keywords ? '暂无数据~' : '我已经到底了' }}</text>
      </view>
      <view v-else class="end-row flex-center">
        <text class="MiSans-Regular end-text">我已经到底了</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { fetchMarketList, asset } from '@/utils/api'
import { ossImg } from '@/api'

const router = useRouter()
const all = ref([])
const keywords = ref('')

const list = computed(() => {
  const kw = keywords.value.trim()
  if (!kw) return all.value
  return all.value.filter((t) => (nameOf(t) || '').includes(kw))
})

const nameOf = (t) => (t.product && t.product.name) || t.name || '藏品名称'
const thumbOf = (t) => (t.product && t.product.listimg) || t.listimg || ''
const priceOf = (t) =>
  t.is_out === 1 ? '--' : '¥ ' + Number(t.min_price || 0).toFixed(2)
const changeNum = (t) => Number(t.market_fluctuate_new || 0)
const formatChange = (t) => {
  const n = changeNum(t)
  return `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`
}

function targetLike(t) {
  t.is_like = t.is_like === 1 ? 0 : 1
  uni.showToast({ title: t.is_like ? '已收藏' : '已取消收藏' })
}

function doSearch() {
  /* 结果由 computed 实时派生 */
}
function clearKeyword() {
  keywords.value = ''
}
function toDetail(t) {
  router.push(`/pages/market/detail?id=${(t.product && t.product.id) || t.id}`)
}
function goBack() {
  if (window.history.length > 1) router.back()
  else router.push('/pages/market/market')
}

async function init() {
  all.value = await fetchMarketList({})
}
init()
</script>

<style scoped>
@import '@/styles/atomic.css';
.market-search-page {
  min-height: 100vh;
  background: #fff;
}
.diy-nav {
  height: 88rpx;
  padding: 0 32rpx 0 16rpx;
}
.nav-back {
  width: 17rpx;
  flex-shrink: 0;
}
.ipt {
  flex: 1;
  margin-left: 20rpx;
  height: 64rpx;
  padding: 0 20rpx;
  border: 1rpx solid #e5e8ec;
  border-radius: 32rpx;
}
.ipt-input {
  flex: 1;
  font-size: 26rpx;
  color: #000;
}
.ipt-clear {
  width: 28rpx;
  height: 28rpx;
  border-radius: 50%;
  background: #4a4a4a;
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
.ipt-suffix {
  width: 32rpx;
  height: 32rpx;
}
.head-row {
  padding: 24rpx;
}
.head-col {
  font-size: 22rpx;
  color: #999;
}
.col-name {
  flex: 1.6;
}
.col-mid {
  flex: 1;
  text-align: center;
}
.col-chg {
  flex: 0.9;
  text-align: right;
}
.rows-wrap {
  padding: 0 24rpx;
}
.market-row {
  padding: 21rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}
.name-col {
  flex: 1.6;
  min-width: 0;
}
.row-thumb {
  width: 88rpx;
  height: 88rpx;
  border-radius: 12rpx;
  background: #eee;
  flex-shrink: 0;
}
.meta-col {
  min-width: 0;
}
.row-name {
  max-width: 160rpx;
  font-size: 26rpx;
  color: #1a2438;
}
.like-icon {
  width: 28rpx;
  height: 26rpx;
  margin-left: 8rpx;
  flex-shrink: 0;
}
.out-tag {
  margin-top: 8rpx;
  padding: 0 8rpx;
  height: 28rpx;
  border-radius: 4rpx;
  background: #999;
}
.out-text {
  font-size: 18rpx;
  color: #fff;
}
.meta-line {
  margin-top: 4rpx;
  font-size: 20rpx;
  color: #999;
}
.price-col {
  flex: 1;
}
.price-text {
  font-size: 26rpx;
  color: #1a2438;
}
.chg-col {
  flex: 0.9;
}
.chg-icon {
  width: 24rpx;
  height: 18rpx;
}
.chg-text {
  margin-left: 4rpx;
  font-size: 24rpx;
}
.end-row {
  padding: 24rpx 0 40rpx;
}
.end-text {
  font-size: 24rpx;
  color: #bbb;
}
</style>