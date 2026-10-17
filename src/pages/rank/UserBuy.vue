<template>
  <view class="user-buy-page">
    <!-- 原站该页为沉浸式（titleStyle 白字），顶部深色渐变 -->
    <view class="tnav flex flex-ai-center">
      <view class="tnav-left" @click="goBack">
        <img class="tnav-back" :src="asset('static/common/back_white.png')" mode="widthFix" />
      </view>
      <text class="tnav-title">用户购买榜</text>
    </view>

    <view class="list plr-26">
      <view v-for="(r, i) in list" :key="r.id" class="item flex">
        <text class="rank-num">{{ i + 1 }}</text>
        <img class="thumb" :src="ossImg(r.goods_cover_image)" mode="aspectFill" />
        <view class="meta flex flex-dir-col flex-js-sb flex-1">
          <text class="MiSans-Medium name text-overflow">{{ r.goods_name }}</text>
          <text class="MiSans-Regular sub">购入均价：￥{{ r.total_price }}</text>
          <text class="MiSans-Regular sub">购入数量：{{ r.num }}</text>
          <text class="MiSans-Regular sub">{{ formatDate(r.createtime) }}</text>
        </view>
        <view class="right flex flex-dir-col flex-js-center flex-ai-end">
          <view class="buy-btn flex flex-ai-center flex-js-center" @click.stop="toBuy(r)">
            <text class="MiSans-Medium buy-btn-text">去购买</text>
          </view>
          <text class="MiSans-Regular count">{{ r.count }}人已去购买</text>
        </view>
      </view>

      <view v-if="!list.length" class="empty-box">
        <text class="MiSans-Regular empty-text">暂无购买记录</text>
      </view>
    </view>
  </view>
</template>

<script setup>
/**
 * 原站 rank/userBuy —— 用户购买榜
 * 每行：排名 + 藏品缩略图 + 名称/均价/数量/时间 + 去购买按钮 + 跟买人数。
 */
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { asset, fetchUserBuyRank } from '@/utils/api'
import { ossImg } from '@/api'

defineOptions({ name: 'UserBuyRankPage' })

const router = useRouter()
const list = ref([])

function goBack() {
  if (window.history.length > 1) router.back()
  else router.push('/pages/index/index')
}
function formatDate(ts) {
  if (!ts) return '--'
  if (typeof ts === 'string') return ts
  const d = new Date(ts * 1000)
  const p = (n) => String(n).padStart(2, '0')
  return `${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}
function toBuy() {
  router.push('/pages/kline/buy')
}

onMounted(async () => {
  list.value = await fetchUserBuyRank()
})
</script>

<style scoped>
@import '@/styles/atomic.css';

.user-buy-page {
  min-height: 100vh;
  background: #1a2438;
  padding-bottom: 60rpx;
  box-sizing: border-box;
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
.list {
  padding-top: 8rpx;
}
.item {
  padding: 16rpx 0;
}
.rank-num {
  width: 44rpx;
  flex-shrink: 0;
  font-size: 24rpx;
  color: #8a94a8;
  text-align: center;
}
.thumb {
  width: 180rpx;
  height: 180rpx;
  border-radius: 24rpx;
  background: #333c52;
  flex-shrink: 0;
}
.meta {
  margin-left: 24rpx;
  min-width: 0;
  padding: 6rpx 0;
}
.name {
  font-size: 26rpx;
  color: #fff;
}
.sub {
  margin-top: 10rpx;
  font-size: 22rpx;
  color: #c3cad6;
}
.right {
  margin-left: 12rpx;
  flex-shrink: 0;
}
.buy-btn {
  height: 56rpx;
  padding: 0 24rpx;
  border-radius: 28rpx;
  background: #6aa27b;
}
.buy-btn-text {
  font-size: 24rpx;
  color: #fff;
}
.count {
  margin-top: 16rpx;
  font-size: 22rpx;
  color: #8a94a8;
}
.empty-box {
  padding: 140rpx 0;
  text-align: center;
}
.empty-text {
  font-size: 26rpx;
  color: #8a94a8;
}
</style>