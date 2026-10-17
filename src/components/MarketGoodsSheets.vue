<template>
  <view>
    <!-- 快捷下单 sheet -->
    <view v-if="showCreate" class="sheet-mask" @click="$emit('update:showCreate', false)"></view>
    <view v-if="showCreate" class="fast-buy-sheet">
      <view class="flex flex-ai-center flex-js-sb">
        <text class="MiSans-Demibold sheet-title">快捷下单</text>
        <view class="sheet-close" @click="$emit('update:showCreate', false)"></view>
      </view>
      <view class="fast-goods flex flex-ai-center">
        <img class="fast-thumb" :src="mainImg" mode="aspectFill" />
        <view class="fast-meta">
          <text class="MiSans-Medium fast-name text-overflow">{{ product.name || '--' }}</text>
          <text class="MiSans-Regular fast-sub">地板价 {{ floorPriceText }}</text>
        </view>
      </view>
      <view class="pay-title-row">
        <text class="MiSans-Demibold pay-title">支付方式</text>
      </view>
      <view class="account-row flex flex-ai-center flex-js-sb" @click="$emit('toggle-pay')">
        <view class="flex flex-ai-center">
          <img class="account-icon" :src="asset('static/wallet/huifu.png')" mode="aspectFit" />
          <text class="MiSans-Medium account-name">汇付天下</text>
        </view>
        <view class="radio" :class="{ on: payChecked }"></view>
      </view>
      <view class="fast-tip">
        <text class="MiSans-Regular tip-text">
          注：快捷下单不含抢付功能。需进入商品详情点击「抢购中」使用抢单；付款后按平台到款顺序排队发放，未成交将原路退回付款账户。
        </text>
      </view>
      <view
        class="submit-btn flex flex-ai-center flex-js-center"
        :class="{ disabled: !payChecked }"
        @click="$emit('submit')"
      >
        <text class="MiSans-Demibold submit-text">确认下单</text>
      </view>
    </view>

    <!-- 相关公告 -->
    <view v-if="showNotice" class="notice-mask" @click="$emit('update:showNotice', false)"></view>
    <view v-if="showNotice" class="notice-sheet">
      <view class="flex flex-js-sb flex-ai-center">
        <text class="MiSans-Demibold notice-title">相关公告</text>
        <view class="sheet-close" @click="$emit('update:showNotice', false)"></view>
      </view>
      <scroll-view class="notice-scroll" scroll-y>
        <view v-for="n in noticeList" :key="n.id" class="notice-item" @click="$emit('notice-click', n)">
          <text class="notice-text">{{ n.title }}</text>
          <view class="flex flex-js-sb flex-ai-center mt-28">
            <view class="type-tag flex flex-js-center flex-ai-center" :class="'type-' + (n.imageType || 0)">
              <text class="MiSans-Regular type-text">{{ n.affiche_type }}</text>
            </view>
            <text class="MiSans-Regular notice-date">{{ formatDate(n.createtime) }}</text>
          </view>
        </view>
        <view v-if="!noticeList.length" class="flex-center notice-empty">
          <text class="MiSans-Regular empty-text">暂无数据~</text>
        </view>
      </scroll-view>
    </view>
  </view>
</template>

<script setup>
import { asset } from '@/utils/api'

defineProps({
  showCreate: { type: Boolean, default: false },
  showNotice: { type: Boolean, default: false },
  payChecked: { type: Boolean, default: true },
  product: { type: Object, default: () => ({}) },
  mainImg: { type: String, default: '' },
  floorPriceText: { type: String, default: '0.00' },
  noticeList: { type: Array, default: () => [] },
})
defineEmits(['update:showCreate', 'update:showNotice', 'toggle-pay', 'submit', 'notice-click'])

function formatDate(ts) {
  if (!ts) return '--'
  const d = new Date(Number(ts) * 1000)
  const p = (v) => String(v).padStart(2, '0')
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())}`
}
</script>

<style scoped>
@import '@/styles/atomic.css';
.sheet-mask,
.notice-mask {
  position: fixed;
  inset: 0;
  z-index: 90;
  background: rgba(0, 0, 0, 0.5);
}
.fast-buy-sheet,
.notice-sheet {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 91;
}
.fast-buy-sheet {
  padding: 24rpx 21rpx 18rpx;
  border-radius: 18rpx 18rpx 0 0;
  background: #fff;
}
.sheet-title,
.notice-title {
  font-size: 34rpx;
  color: #1a2438;
}
.sheet-close {
  width: 32rpx;
  height: 32rpx;
  position: relative;
}
.sheet-close::before,
.sheet-close::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 50%;
  width: 28rpx;
  height: 2rpx;
  background: #999;
}
.sheet-close::before {
  transform: translate(-50%, -50%) rotate(45deg);
}
.sheet-close::after {
  transform: translate(-50%, -50%) rotate(-45deg);
}
.fast-goods {
  margin-top: 28rpx;
}
.fast-thumb {
  width: 130rpx;
  height: 130rpx;
  border-radius: 10rpx;
}
.fast-meta {
  margin-left: 20rpx;
  min-width: 0;
  flex: 1;
}
.fast-name {
  font-size: 28rpx;
  color: #1a2438;
}
.fast-sub {
  display: block;
  margin-top: 8rpx;
  font-size: 22rpx;
  color: #999;
}
.pay-title-row {
  margin-top: 32rpx;
}
.pay-title {
  font-size: 28rpx;
  color: #1a2438;
}
.account-row {
  margin-top: 16rpx;
  height: 88rpx;
  padding: 0 21rpx;
  border-radius: 10rpx;
  background: #f3f6f8;
}
.account-icon {
  width: 40rpx;
  height: 40rpx;
}
.account-name {
  margin-left: 16rpx;
  font-size: 28rpx;
  color: #1a2438;
}
.radio {
  width: 28rpx;
  height: 28rpx;
  border-radius: 50%;
  border: 2rpx solid #c9ced6;
}
.radio.on {
  border-color: #6aa27b;
  background: #6aa27b;
}
.fast-tip {
  margin-top: 24rpx;
}
.tip-text {
  font-size: 22rpx;
  line-height: 1.6;
  color: #999;
}
.submit-btn {
  height: 80rpx;
  margin-top: 24rpx;
  border-radius: 10rpx;
  background: #6aa27b;
}
.submit-btn.disabled {
  opacity: 0.5;
}
.submit-text {
  font-size: 30rpx;
  color: #fff;
}
.notice-sheet {
  max-height: 70%;
  padding: 62rpx 18rpx 24rpx;
  border-radius: 32rpx 32rpx 0 0;
  background: #fff;
}
.notice-scroll {
  max-height: 800rpx;
  margin-top: 32rpx;
}
.notice-item {
  padding-bottom: 24rpx;
  margin-bottom: 32rpx;
  border-bottom: 1rpx solid #f0f0f0;
}
.notice-text {
  font-size: 30rpx;
  font-weight: 300;
  color: #161616;
}
.type-tag {
  height: 44rpx;
  padding: 0 12rpx;
  border-radius: 8rpx;
  font-size: 22rpx;
}
.type-0 { background: #f3f6f8; }
.type-1 { background: #e8f2e0; }
.type-2 { background: #fdf0e6; }
.type-3 { background: #e9eefb; }
.type-4 { background: #f6e9f3; }
.type-text {
  font-size: 22rpx;
  color: #555;
}
.notice-date {
  font-size: 24rpx;
  color: #adadb6;
}
.notice-empty {
  height: 200rpx;
}
.empty-text {
  font-size: 26rpx;
  color: #999;
}
</style>