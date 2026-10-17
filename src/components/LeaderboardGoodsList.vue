<template>
  <!-- 藏品榜列表（原站 leaderboard/leaderboard 藏品 tab） -->
  <view class="list plr-16">
    <view
      v-for="(g, i) in goods"
      :key="g.id"
      class="goods-item flex flex-js-sb flex-ai-center"
      @click="$emit('view', g)"
    >
      <view class="left flex">
        <!-- 原站为 /static/good/rank{1..7}.png（源站 404），改用 CSS 奖牌 -->
        <view class="rank-badge flex flex-ai-center flex-js-center" :class="'medal-' + (i + 1)">
          <text class="rank-img">{{ i + 1 }}</text>
        </view>
        <img class="goods-thumb" :src="ossImg(g.listimg)" mode="aspectFill" />
        <view class="goods-meta flex flex-dir-col flex-js-sb">
          <text class="MiSans-Medium goods-name text-overflow">{{ g.name }}</text>
          <text class="MiSans-Regular goods-sub">发行{{ g.total_num }}/流通{{ g.flux }}</text>
          <view class="flex flex-ai-end">
            <text class="MiSans-Regular price-unit">¥</text>
            <text class="MiSans-Demibold price">{{ g.min_price }}</text>
          </view>
        </view>
      </view>
      <view class="right flex flex-ai-center flex-js-end">
        <!-- 原站 cw/rank_like|rank_unlike.png（源站 404），改用项目既有 like 图标 -->
        <img
          class="like-icon"
          :src="asset(g.is_like ? 'static/market/like_sel.png' : 'static/market/like_default.png')"
          mode="aspectFit"
          @click.stop="$emit('like', g)"
        />
      </view>
    </view>

    <view v-if="!goods.length" class="empty-box">
      <text class="MiSans-Regular empty-text">暂无榜单数据</text>
    </view>
  </view>
</template>

<script setup>
/**
 * 藏品榜列表（leaderboard/leaderboard 内嵌）。
 */
import { asset } from '@/utils/api'
import { ossImg } from '@/api'

defineOptions({ name: 'LeaderboardGoodsList' })

defineProps({ goods: { type: Array, default: () => [] } })
defineEmits(['view', 'like'])
</script>

<style scoped>
@import '@/styles/atomic.css';

.goods-item {
  margin-bottom: 12rpx;
  padding: 16rpx 30rpx;
  background: #fff;
}
.left {
  flex: 2;
}
.right {
  flex: 1;
}
.rank-badge {
  width: 60rpx;
  height: 76rpx;
  margin-right: 12rpx;
  flex-shrink: 0;
}
.rank-img {
  width: 60rpx;
  height: 60rpx;
  border-radius: 50%;
  font-size: 34rpx;
  font-weight: 700;
  color: #fff;
  text-align: center;
  line-height: 60rpx;
}
.medal-1 .rank-img {
  background: #d4a04a;
}
.medal-2 .rank-img {
  background: #9aa3ad;
}
.medal-3 .rank-img {
  background: #b4795a;
}
.medal-4 .rank-img,
.medal-5 .rank-img,
.medal-6 .rank-img,
.medal-7 .rank-img {
  background: #6b7690;
}
.medal-8 .rank-img {
  background: #c3cad6;
  color: #6b7690;
}
.goods-thumb {
  width: 100rpx;
  height: 132rpx;
  border-radius: 10rpx;
  background: #ddd;
  flex-shrink: 0;
}
.goods-meta {
  margin-left: 16rpx;
  min-width: 0;
  flex: 1;
}
.goods-name {
  max-width: 300rpx;
  font-size: 28rpx;
  color: #020202;
}
.goods-sub {
  margin: 10rpx 0;
  font-size: 20rpx;
  color: #030106;
}
.price-unit {
  font-size: 16rpx;
  color: #030106;
}
.price {
  margin-left: 8rpx;
  font-size: 34rpx;
  color: #030106;
}
.like-icon {
  width: 36rpx;
  height: 35rpx;
}
.empty-box {
  padding: 140rpx 0;
  text-align: center;
}
.empty-text {
  font-size: 26rpx;
  color: #999;
}
</style>