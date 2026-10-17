<template>
  <view class="mcap-page">
    <!-- 沉浸式深色头图 -->
    <view class="head">
      <view class="tnav flex flex-ai-center">
        <view class="tnav-left" @click="goBack">
          <img class="tnav-back" :src="asset('static/common/back_white.png')" mode="widthFix" />
        </view>
        <text class="tnav-title">市值排行榜</text>
      </view>

      <view class="content-box pa-24">
        <view class="flex flex-ai-center flex-js-sb">
          <text class="MiSans-Regular update">每日{{ info.update_time }}更新</text>
          <view class="flex flex-ai-center" @click="show = true">
            <text class="MiSans-Regular q-text">排行说明</text>
          </view>
        </view>

        <view class="col-head flex">
          <text class="c-no">排名</text>
          <text class="c-name">藏品</text>
          <text class="c-val text-right">市值(CNY)</text>
          <text class="c-chg text-right">涨跌幅</text>
        </view>

        <scroll-view scroll-y  class="list-scroll">
          <view
            v-for="(g, i) in list"
            :key="g.id"
            class="col-row flex flex-ai-center"
            @click="toGoods(g)"
          >
            <text class="c-no">{{ i + 1 }}</text>
            <img class="thumb" :src="ossImg(g.listimg)" mode="aspectFill" />
            <view class="c-name flex flex-dir-col flex-js-sb">
              <text class="MiSans-Medium name text-overflow">{{ g.name }}</text>
              <text class="MiSans-Regular sub">流通{{ g.flux }}/{{ g.total_num }} · ¥{{ g.min_price }}</text>
            </view>
            <text class="c-val text-right">{{ formatValue(g.market_value) }}</text>
            <text class="c-chg text-right" :class="chgClass(g.market_fluctuate)">
              {{ g.market_fluctuate > 0 ? '+' : '' }}{{ g.market_fluctuate }}%
            </text>
          </view>

          <view v-if="!list.length" class="empty-box">
            <text class="MiSans-Regular empty-text">暂无排行数据</text>
          </view>
        </scroll-view>
      </view>
    </view>

    <!-- 排行说明弹窗 -->
    <view v-if="show" class="modal-mask" @click="show = false"></view>
    <view v-if="show" class="modal">
      <text class="MiSans-Demibold modal-title">市值排行榜规则</text>
      <scroll-view scroll-y  class="modal-scroll">
        <text class="MiSans-Regular modal-content">{{ info.market_desc }}</text>
      </scroll-view>
      <view class="modal-btn flex flex-ai-center flex-js-center" @click="show = false">
        <text class="MiSans-Demibold btn-text">知道了</text>
      </view>
    </view>
  </view>
</template>

<script setup>
/**
 * 原站 marketCapRanking/marketCapRanking —— 市值排行榜
 * 深色沉浸式头图 + 「每日更新 / 排行说明」行 + 四列榜单（排名 / 藏品 / 市值 / 涨跌幅）。
 */
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { asset, fetchMarketCapRanking } from '@/utils/api'
import { ossImg } from '@/api'

defineOptions({ name: 'MarketCapRankingPage' })

const router = useRouter()
const info = ref({})
const list = ref([])
const show = ref(false)

function goBack() {
  if (window.history.length > 1) router.back()
  else router.push('/pages/index/index')
}
function formatValue(v) {
  const n = Number(v || 0)
  return n >= 10000 ? (n / 10000).toFixed(2) + '万' : String(n)
}
function chgClass(v) {
  return Number(v) > 0 ? 'up' : Number(v) < 0 ? 'down' : 'flat'
}
function toGoods(g) {
  router.push({ path: '/pages/market/detail', query: { id: g.id } })
}

onMounted(async () => {
  const data = await fetchMarketCapRanking()
  info.value = data.info || {}
  list.value = data.list || []
})
</script>

<style scoped>
@import '@/styles/atomic.css';

.mcap-page {
  min-height: 100vh;
  background: #f4f6fa;
  box-sizing: border-box;
}
.head {
  background: #232744;
  padding-bottom: 30rpx;
}
.tnav {
  position: relative;
  height: 88rpx;
  padding: 0 32rpx;
}
.tnav-left {
  width: 60rpx;
  display: flex;
  align-items: center;
}
.tnav-back {
  width: 34rpx;
}
.tnav-title {
  position: absolute;
  left: 182rpx;
  right: 182rpx;
  text-align: center;
  font-size: 34rpx;
  color: #fff;
  font-family: MiSans-Demibold, sans-serif;
}
.content-box {
  border-radius: 16rpx;
  background: #2c3150;
}
.update,
.q-text {
  font-size: 24rpx;
  color: #fff;
}
.q-text {
  margin-left: 8rpx;
}
.col-head {
  margin-top: 30rpx;
  padding: 0 8rpx;
  height: 60rpx;
  align-items: center;
}
.col-head text {
  font-size: 22rpx;
  color: #8a90a8;
}
.list-scroll {
  height: 780rpx;
}
.col-row {
  padding: 16rpx 8rpx;
  border-top: 1rpx solid rgba(255, 255, 255, 0.08);
}
.c-no {
  width: 60rpx;
  flex-shrink: 0;
  font-size: 24rpx;
  color: #8a90a8;
  text-align: center;
}
.thumb {
  width: 80rpx;
  height: 80rpx;
  margin-left: 12rpx;
  border-radius: 8rpx;
  background: #3d4363;
  flex-shrink: 0;
}
.c-name {
  flex: 1;
  min-width: 0;
  margin-left: 16rpx;
}
.name {
  font-size: 26rpx;
  color: #fff;
}
.sub {
  margin-top: 8rpx;
  font-size: 20rpx;
  color: #8a90a8;
}
.c-val {
  width: 140rpx;
  flex-shrink: 0;
  font-size: 26rpx;
  color: #fff;
}
.c-chg {
  width: 120rpx;
  flex-shrink: 0;
  font-size: 24rpx;
}
.c-chg.up {
  color: #f0554e;
}
.c-chg.down {
  color: #3ad32a;
}
.c-chg.flat {
  color: #8a90a8;
}
.empty-box {
  padding: 140rpx 0;
  text-align: center;
}
.empty-text {
  font-size: 26rpx;
  color: #8a90a8;
}
.modal-mask {
  position: fixed;
  inset: 0;
  z-index: 40;
  background: rgba(0, 0, 0, 0.55);
}
.modal {
  position: fixed;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  z-index: 41;
  width: 540rpx;
  padding: 40rpx 32rpx 32rpx;
  background: #fff;
  border-radius: 16rpx;
  box-sizing: border-box;
}
.modal-title {
  display: block;
  text-align: center;
  font-size: 32rpx;
  color: #1a2438;
}
.modal-scroll {
  max-height: 60vh;
  margin-top: 24rpx;
}
.modal-content {
  font-size: 26rpx;
  line-height: 44rpx;
  color: #666;
}
.modal-btn {
  height: 80rpx;
  margin-top: 32rpx;
  border-radius: 40rpx;
  background: #165dff;
}
.btn-text {
  font-size: 28rpx;
  color: #fff;
}
</style>