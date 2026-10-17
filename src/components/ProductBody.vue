<template>
  <view>
    <!-- 主图卡片（原站 w-product-details-card） -->
    <view class="product-card">
      <view class="img-wrap flex flex-js-center flex-ai-center">
        <img class="main-img" :src="mainImg" mode="aspectFill" />
      </view>
      <view class="info-wrap flex flex-dir-col flex-ai-center">
        <text class="MiSans-Demibold name text-overflow">{{ product.name || '--' }}</text>
        <view class="flex flex-ai-center limit-row">
          <view class="limit-tag flex flex-ai-center flex-js-center MiSans-Regular">限量</view>
          <view class="flex flex-ai-center flex-js-center MiSans-Regular font-size-11 plr-13">
            {{ product.total_num || 0 }}
          </view>
        </view>
      </view>
    </view>

    <view class="detail-body">
      <view class="flex flex-dir-col tech-card">
        <view class="tech-row flex flex-ai-center flex-js-sb">
          <text class="MiSans-Regular tech-label">创作者</text>
          <text class="MiSans-Regular tech-value text-overflow">{{ publisherNick }}</text>
        </view>
        <view class="tech-row flex flex-ai-center flex-js-sb">
          <text class="MiSans-Regular tech-label">品牌方</text>
          <text class="MiSans-Regular tech-value text-overflow">{{ publisherName }}</text>
        </view>
        <view class="tech-row flex flex-ai-center flex-js-sb">
          <text class="MiSans-Regular tech-label">所属专辑</text>
          <text class="MiSans-Regular tech-value text-overflow">{{ seriesName }}</text>
        </view>
        <view class="tech-row flex flex-ai-center flex-js-sb">
          <text class="MiSans-Regular tech-label">已售</text>
          <text class="MiSans-Regular tech-value">{{ product.sale_total_num || 0 }} 份</text>
        </view>
      </view>

      <!-- 商品介绍（原站 w-product-introduce） -->
      <view v-if="introduce" class="intro-card">
        <text class="MiSans-Demibold intro-title">商品介绍</text>
        <view class="intro-body MiSans-Regular" v-html="introduce"></view>
      </view>

      <!-- 购买须知概率卡（原站 w-product-buy-need） -->
      <view v-if="list.length" class="buy-need">
        <text class="MiSans-Demibold buy-title">购买须知</text>
        <view
          v-for="c in list"
          :key="c.id"
          class="prob-item flex flex-ai-center mt-12"
        >
          <img class="prob-thumb" :src="ossImg(c.listimg)" mode="aspectFill" />
          <view class="flex-1 flex flex-dir-col flex-js-sb pl-8 prob-meta">
            <text class="MiSans-Medium prob-name text-overflow">{{ c.name }}</text>
            <view class="flex font-size-12 prob-sub">
              <view class="flex flex-ai-center">
                <text class="font-color-minor">概率：</text>
                <text class="font-color-textPrimary">{{ c.probability }}%</text>
              </view>
              <view class="ml-20 flex flex-ai-center">
                <text class="font-color-minor">总量：</text>
                <text class="font-color-textPrimary">{{ c.show_total_num }}份</text>
              </view>
            </view>
          </view>
          <img class="prob-rarity" :src="ossImg(c.rarity_icon)" mode="aspectFit" />
        </view>
        <view class="rule-entry flex flex-ai-center flex-js-center" @click="$emit('to-rule')">
          <text class="MiSans-Regular rule-entry-text">查看完整购买规则</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue'
import { asset } from '@/utils/api'
import { ossImg } from '@/api'

const props = defineProps({
  product: { type: Object, default: () => ({}) },
  introduce: { type: String, default: '' },
})
defineEmits(['to-rule'])

const mainImg = computed(() => {
  const p = props.product || {}
  const src = p.main_image || p.listimg || ''
  if (!src) return asset('static/collection/top_bg.png')
  return src.startsWith('http') ? src : ossImg(src)
})
const list = computed(() => props.product.collectionlist || [])
const publisherNick = computed(
  () =>
    (props.product.publisher &&
      props.product.publisher.user &&
      props.product.publisher.user.nickname) ||
    '青川'
)
const publisherName = computed(
  () => (props.product.publisher && props.product.publisher.name) || '青川'
)
const seriesName = computed(
  () => (props.product.series && props.product.series.name) || '--'
)
</script>

<style scoped>
@import '@/styles/atomic.css';
.product-card {
  background: #fff;
  padding: 40rpx 0 30rpx;
}
.img-wrap {
  width: 100%;
  height: 420rpx;
}
.main-img {
  width: 340rpx;
  height: 340rpx;
  border-radius: 16rpx;
  background: #f4f6fa;
}
.info-wrap {
  margin-top: 20rpx;
}
.name {
  font-size: 34rpx;
  color: #000;
}
.limit-row {
  margin-top: 12rpx;
}
.limit-tag {
  height: 28rpx;
  padding: 0 8rpx;
  border-radius: 6rpx;
  background: #e2e2e2;
  font-size: 20rpx;
  color: #535353;
}
.detail-body {
  margin-top: 26rpx;
  padding: 0 16rpx 160rpx;
}
.tech-card,
.intro-card,
.buy-need {
  padding: 12rpx 24rpx;
  background: #fff;
  border-radius: 12rpx;
}
.intro-card,
.buy-need {
  margin-top: 20rpx;
  padding: 30rpx;
}
.buy-need {
  border: 1rpx solid #bfccc8;
  border-radius: 35rpx;
}
.intro-title,
.buy-title {
  font-size: 30rpx;
  color: #000;
}
.intro-body {
  margin-top: 16rpx;
  font-size: 26rpx;
  line-height: 42rpx;
  color: #555;
}
.tech-row {
  min-height: 88rpx;
  border-bottom: 1rpx solid #f5f5f5;
}
.tech-row:last-child {
  border-bottom: 0;
}
.tech-label {
  font-size: 26rpx;
  color: #999;
}
.tech-value {
  max-width: 440rpx;
  font-size: 26rpx;
  color: #333;
}
.prob-item {
  padding: 12rpx;
  background: #f7fbfa;
  border: 1rpx solid #bfccc8;
  border-radius: 25rpx;
}
.prob-thumb {
  width: 118rpx;
  height: 118rpx;
  border-radius: 8rpx;
  background: #eee;
}
.prob-meta {
  height: 118rpx;
}
.prob-name {
  font-size: 26rpx;
  color: #222;
}
.prob-sub {
  font-size: 24rpx;
}
.prob-rarity {
  width: 110rpx;
  height: 110rpx;
}
.rule-entry {
  margin-top: 24rpx;
  height: 72rpx;
  border-radius: 36rpx;
  background: #f4f6fa;
}
.rule-entry-text {
  font-size: 26rpx;
  color: #333;
}
</style>