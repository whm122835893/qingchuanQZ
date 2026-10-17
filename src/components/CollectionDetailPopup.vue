<template>
  <view v-if="show" class="pop-mask" @click="close"></view>
  <view v-if="show" class="pop-con">
    <!-- 头部 -->
    <view class="header flex flex-ai-center flex-js-sb">
      <text class="MiSans-Demibold header-title">持有详情</text>
      <view class="flex flex-ai-center">
        <view
          v-if="batchUp && !showCheck"
          class="action-pill flex flex-ai-center flex-js-center"
          @click="$emit('enter-batch')"
        >
          <text class="MiSans-Regular pill-text">批量寄售</text>
        </view>
        <view
          v-else-if="showCheck"
          class="action-pill flex flex-ai-center flex-js-center"
          @click="$emit('clear-batch')"
        >
          <text class="MiSans-Regular pill-text">取消选择</text>
        </view>
        <view
          v-if="batchUp"
          class="action-pill flex flex-ai-center flex-js-center"
          @click="confirmOff = true"
        >
          <text class="MiSans-Regular pill-text">一键下架</text>
        </view>
        <view class="close-btn" @click="close"></view>
      </view>
    </view>

    <!-- 藏品概览 -->
    <view class="summary flex flex-ai-center">
      <img class="thumb" :src="thumbSrc" mode="aspectFill" />
      <view class="flex flex-dir-col summary-main">
        <text class="MiSans-Medium text-overflow summary-name">{{
          collection.name || '--'
        }}</text>
        <text class="MiSans-Regular summary-sub">持有数量：{{ totalNum }}</text>
      </view>
      <view class="flex flex-dir-col flex-ai-end summary-side">
        <text class="MiSans-Demibold floor-price">{{ floorPriceText }}</text>
        <text class="MiSans-Regular summary-sub">市场地板价</text>
      </view>
      <view class="flex flex-dir-col flex-ai-end change-col">
        <view class="flex flex-ai-center">
          <img
            class="trend-icon"
            :src="changeNum >= 0 ? asset('static/my/zhang.png') : asset('static/my/die.png')"
            mode="aspectFit"
          />
          <text
            class="MiSans-Semibold change-text"
            :class="changeNum >= 0 ? 'up' : 'down'"
            >{{ changeText }}</text
          >
        </view>
        <text class="MiSans-Regular summary-sub">市场涨跌幅</text>
      </view>
    </view>

    <!-- 编号列表 -->
    <CollectionCodeList
      :list="list"
      :selected-ids="selectedIds"
      :show-check="showCheck"
      @toggle-check="$emit('toggle-check', $event)"
      @item-click="$emit('item-click', $event)"
    />

    <!-- 批量操作条 -->
    <view v-if="showCheck" class="batch-bar flex flex-js-sb flex-ai-center">
      <view
        class="batch-btn cancel flex flex-ai-center flex-js-center"
        @click="$emit('clear-batch')"
      >
        <text class="MiSans-Regular batch-text">取消寄售</text>
      </view>
      <view
        class="batch-btn confirm flex flex-ai-center flex-js-center"
        @click="$emit('to-resale', selectedIds)"
      >
        <text class="MiSans-Demibold batch-text">立即寄售({{ selectedIds.length }})</text>
      </view>
    </view>

    <!-- 一键下架确认 -->
    <ConfirmToast
      :show="confirmOff"
      content="确认一键下架该藏品全部寄售中的商品？"
      ok-text="确认下架"
      @update:show="confirmOff = false"
      @ok="onBatchOff"
    />
  </view>
</template>

<script setup>
import { computed } from 'vue'
import { asset } from '@/utils/api'
import { ossImg } from '@/api'
import CollectionCodeList from '@/components/CollectionCodeList.vue'
import ConfirmToast from '@/components/ConfirmToast.vue'

const props = defineProps({
  show: { type: Boolean, default: false },
  collection: { type: Object, default: () => ({}) },
  list: { type: Array, default: () => [] },
  selectedIds: { type: Array, default: () => [] },
  showCheck: { type: Boolean, default: false },
  batchUp: { type: Boolean, default: false },
  confirmOffModel: { type: Boolean, default: false },
})
const emit = defineEmits([
  'update:show',
  'update:confirmOffModel',
  'enter-batch',
  'clear-batch',
  'toggle-check',
  'item-click',
  'to-resale',
  'batch-off',
])

const confirmOff = computed({
  get: () => props.confirmOffModel,
  set: (v) => emit('update:confirmOffModel', v),
})

const totalNum = computed(() => props.list.length)
const thumbSrc = computed(() =>
  props.collection.listimg ? ossImg(props.collection.listimg) : ''
)
const floorPriceText = computed(() => {
  const v = Number(props.collection.floor_price || 0)
  return v > 0 ? `¥${v.toFixed(2)}` : '--'
})
const changeNum = computed(() => Number(props.collection.market_fluctuate_new || 0))
const changeText = computed(() => `${Math.abs(changeNum.value).toFixed(2)}%`)

function close() {
  emit('update:show', false)
}
function onBatchOff() {
  confirmOff.value = false
  emit('batch-off')
}
</script>

<style scoped>
@import '@/styles/atomic.css';

.pop-mask {
  position: fixed;
  inset: 0;
  z-index: 40;
  background: rgba(0, 0, 0, 0.55);
}
.pop-con {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 41;
  width: 100%;
  padding: 24rpx 21rpx calc(18rpx + env(safe-area-inset-bottom));
  background: #fff;
  border-radius: 24rpx 24rpx 0 0;
  box-sizing: border-box;
}

.header {
  padding-bottom: 18rpx;
  border-bottom: 1rpx solid #f0f0f0;
}
.header-title {
  font-size: 34rpx;
  color: #1a2438;
}
.action-pill {
  height: 39rpx;
  padding: 0 16rpx;
  margin-right: 16rpx;
  border: 1rpx solid #d8d8d8;
  border-radius: 20rpx;
}
.pill-text {
  font-size: 24rpx;
  color: #1a2438;
}
.close-btn {
  width: 34rpx;
  height: 34rpx;
  position: relative;
}
.close-btn::before,
.close-btn::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 50%;
  width: 26rpx;
  height: 3rpx;
  background: #333;
  transform: translate(-50%, -50%) rotate(45deg);
}
.close-btn::after {
  transform: translate(-50%, -50%) rotate(-45deg);
}

.summary {
  padding: 21rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}
.thumb {
  width: 72rpx;
  height: 72rpx;
  border-radius: 9rpx;
  background: #2f4f3a;
  flex-shrink: 0;
}
.summary-main {
  flex: 1.2;
  min-width: 0;
  margin-left: 16rpx;
}
.summary-side {
  flex: 0.8;
  margin-left: 8rpx;
}
.change-col {
  flex: 0.9;
  margin-left: 12rpx;
}
.summary-name {
  font-size: 28rpx;
  color: #1a2438;
}
.summary-sub {
  margin-top: 8rpx;
  font-size: 20rpx;
  color: #999;
}
.floor-price {
  font-size: 28rpx;
  color: #1a2438;
}
.trend-icon {
  width: 28rpx;
  height: 20rpx;
}
.change-text {
  margin-left: 4rpx;
  font-size: 24rpx;
}
.change-text.up {
  color: #e54d42;
}
.change-text.down {
  color: #22a06b;
}

.batch-bar {
  padding-top: 15rpx;
}
.batch-btn {
  height: 60rpx;
  border-radius: 30rpx;
}
.batch-btn.cancel {
  width: 180rpx;
  border: 1rpx solid #d8d8d8;
}
.batch-btn.confirm {
  width: 300rpx;
  background: #1a2438;
}
.batch-text {
  font-size: 28rpx;
  color: #1a2438;
}
.batch-btn.confirm .batch-text {
  color: #fff;
}

</style>