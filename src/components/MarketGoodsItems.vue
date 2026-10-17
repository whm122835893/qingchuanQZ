<template>
  <view class="list-wrap">
    <!-- 在售 / 求购 -->
    <template v-if="tabCurrent === 0 || tabCurrent === 1">
      <view v-for="t in list" :key="t.id" class="cw-item" @click="toDetails(t)">
        <view class="flex flex-ai-center flex-js-sb">
          <view class="flex flex-ai-center row-head">
            <text class="MiSans-Medium cw-name text-overflow">{{ t.name }}</text>
            <view class="cw-tag flex flex-ai-center flex-js-center">
              <text class="MiSans-Regular cw-tag-text">汇</text>
            </view>
            <!-- 源站在售列表项：名称 + 「汇」支付标签 + 状态标签（如「寄售中」） -->
            <view
              v-if="statusText(t)"
              class="status-pill flex flex-ai-center flex-js-center"
            >
              <text class="MiSans-Demibold status-text">{{ statusText(t) }}</text>
            </view>
          </view>
          <view class="flex flex-ai-center price-wrap">
            <text class="MiSans-Demibold cw-price">¥ {{ fmt(t.min_price) }}</text>
            <view class="arrow"></view>
          </view>
        </view>
        <view class="flex flex-ai-center mt-8">
          <view class="code-pill flex flex-ai-center flex-js-center">
            <text class="MiSans-Regular code-text">#{{ t.collection_code || t.id || '--' }}</text>
          </view>
        </view>
        <view v-if="hashOf(t)" class="hash-bar flex flex-ai-center">
          <text class="MiSans-Regular hash-text">交易hash: {{ hashOf(t) }}</text>
        </view>
      </view>
    </template>

    <!-- 委托 -->
    <template v-else-if="tabCurrent === 2">
      <view v-for="t in list" :key="t.id" class="en-item flex">
        <view class="flex flex-dir-col flex-1">
          <view class="flex flex-js-sb">
            <view class="flex flex-ai-center">
              <text class="MiSans-Regular en-label">总价：</text>
              <text class="MiSans-Demibold en-strong">¥ {{ t.total_price }}</text>
            </view>
            <view class="flex flex-ai-center ml-6">
              <text class="MiSans-Regular en-label">单价：</text>
              <text class="MiSans-Demibold en-strong">¥ {{ t.price }}</text>
            </view>
          </view>
          <view class="flex flex-ai-center">
            <text class="MiSans-Regular en-label">数量：</text>
            <text class="MiSans-Demibold en-strong">{{ t.number }}</text>
          </view>
          <view class="flex flex-js-sb flex-1 mt-8">
            <view class="flex flex-ai-center">
              <text class="MiSans-Regular en-label">支付钱包:</text>
              <view class="pay-tag flex flex-ai-center flex-js-center ml-6">
                <text class="MiSans-Medium pay-tag-text">汇付</text>
              </view>
            </view>
          </view>
        </view>
      </view>
    </template>

    <!-- 成交 -->
    <template v-else>
      <view v-for="t in list" :key="t.id" class="deal-item">
        <view class="flex flex-ai-center flex-js-sb">
          <text class="MiSans-Medium deal-name text-overflow">{{ t.name }}#{{ t.collection_code || '--' }}</text>
          <text class="MiSans-Demibold deal-price">¥{{ fmt(t.price) }}</text>
        </view>
        <view class="flex flex-ai-center flex-js-sb mt-14">
          <view class="code-pill flex flex-ai-center flex-js-center">
            <text class="MiSans-Regular code-text">{{ t.time }}</text>
          </view>
        </view>
      </view>
    </template>

    <view v-if="!list.length" class="empty-box flex flex-dir-col flex-ai-center">
      <img
        v-if="tabCurrent === 0"
        class="empty-img"
        :src="asset('static/detail/market_out.png')"
        mode="widthFix"
      />
      <text v-else class="MiSans-Regular empty-text">暂无数据~</text>
    </view>
  </view>
</template>

<script setup>
import { asset } from '@/utils/api'

defineProps({
  list: { type: Array, default: () => [] },
  tabCurrent: { type: Number, default: 0 },
})
const emit = defineEmits(['to-detail'])

const fmt = (v) => Number(v || 0).toFixed(2)
const hashOf = (t) => t.trade_hash || ''

/** 源站在售列表项的状态标签文案（实测 status=1 → 「寄售中」）。 */
const STATUS_MAP = { 1: '寄售中', 2: '求购中', 3: '已成交' }
const statusText = (t) => STATUS_MAP[t.status] || ''

function toDetails(t) {
  emit('to-detail', t)
}
</script>

<style scoped>
@import '@/styles/atomic.css';
.list-wrap {
  /* 源站量测：.list-wrap 全宽 390、y=329（紧贴 tab-bar 底）、列表项 x=14 / 宽 362
     → 左右内边距 14px，顶部无间距 */
  margin-top: 0;
  padding: 0 27rpx;
}
.cw-item,
.en-item,
.deal-item {
  /* 源站量测：项 362x77、圆角 6px；首行 y=343（距顶 14px）、次行 y=371（行距 8px）
     → 上下内边距 14px、左右 0（左右 14px 由 .list-wrap 提供）。
     源站列表项 y: 329 / 406 / 483 → 项间距为 0，故 margin-bottom 归零。 */
  /* 28rpx×1.923≈14.5px，上下 29px + 内容 48px = 77px，对齐源站项高 */
  padding: 28rpx 0;
  margin-bottom: 0;
  border-radius: 12rpx;
  background: #fff;
  box-shadow: 0 4rpx 12rpx rgba(16, 16, 16, 0.04);
}
.row-head {
  flex: 1;
  min-width: 0;
}
.cw-name {
  max-width: 280rpx;
  font-size: 27rpx;
  color: #1a2438;
}
.cw-tag {
  /* 源站量测：21x15、无边框、居中文字 */
  flex-shrink: 0;
  height: 29rpx;
  padding: 0 10rpx;
  margin-left: 8rpx;
  box-sizing: border-box;
}
.cw-tag-text {
  font-size: 19rpx;
  line-height: 29rpx;
  color: #343434;
}
/* 源站量测：.status-pill 44x18、padding 0 6px、圆角 10px、margin-left 6px、背景透明 */
.status-pill {
  flex-shrink: 0;
  width: 85rpx;
  height: 35rpx;
  padding: 0 12rpx;
  margin-left: 11rpx;
  box-sizing: border-box;
  border-radius: 19rpx;
  background: transparent;
}
/* 源站量测：.status-text 30x13、10px、rgb(41,41,41) */
.status-text {
  flex-shrink: 0;
  font-size: 19rpx;
  line-height: 26rpx;
  color: #292929;
  white-space: nowrap;
}
.price-wrap {
  flex-shrink: 0;
  margin-left: 12rpx;
}
.cw-price {
  font-size: 29rpx;
  color: #1a2438;
}
/* 源站量测：右侧箭头图标 12x12，位于价格行右侧、垂直居中 */
.arrow {
  width: 23rpx;
  height: 23rpx;
  margin-left: 5rpx;
  box-sizing: border-box;
  border-top: 3rpx solid #cacdd3;
  border-right: 3rpx solid #cacdd3;
  transform: rotate(45deg);
}
.code-pill {
  /* 源站量测：#编号胶囊 62x20、圆角 6px。
     注意：global.css:1348 的全局 .code-pill 带 margin-top:16rpx / height:44rpx /
     background:#eee，此处需显式重置，否则行距被撑到 8+8=16px、行高变 28px。 */
  margin-top: 0;
  height: 38rpx;
  padding: 0 15rpx;
  border-radius: 12rpx;
  background: #f3f6f8;
  align-self: auto;
}
.code-text {
  font-size: 22rpx;
  color: #666;
}
.hash-bar {
  margin-top: 14rpx;
  padding: 10rpx 12rpx;
  border-radius: 6rpx;
  background: #f7f9fa;
}
.hash-text {
  font-size: 20rpx;
  color: #999;
}
.en-label {
  font-size: 22rpx;
  color: #777e90;
}
.en-strong {
  font-size: 26rpx;
  color: #1a2438;
}
.pay-tag {
  padding: 0 8rpx;
  border: 1rpx solid #333;
  border-radius: 4rpx;
}
.pay-tag-text {
  font-size: 22rpx;
  color: #343434;
}
.deal-name {
  flex: 1;
  min-width: 0;
  font-size: 28rpx;
  color: #1a2438;
}
.deal-price {
  margin-left: 12rpx;
  font-size: 30rpx;
  color: #1a2438;
}
.empty-box {
  padding: 45rpx 0 30rpx;
}
.empty-img {
  width: 420rpx;
}
.empty-text {
  font-size: 26rpx;
  color: #999;
}
</style>