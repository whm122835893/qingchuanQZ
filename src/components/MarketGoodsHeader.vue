<template>
  <view>
    <!-- 系列卡 -->
    <view class="hero-card flex flex-ai-center">
      <view class="hero-img-box flex flex-ai-center flex-js-center">
        <img class="hero-img" :src="mainImg" mode="aspectFill" />
      </view>
      <view class="hero-info flex flex-dir-col flex-js-sb">
        <view>
          <text class="MiSans-Demibold hero-name text-overflow">{{ product.name || '--' }}</text>
          <view class="flex flex-ai-center brand-row" @click="$emit('brand')">
            <img class="brand-icon" :src="asset('static/detail/pinpai.png')" mode="aspectFit" />
            <text class="MiSans-Regular brand-text">品牌方</text>
            <img class="brand-arrow" :src="asset('static/detail/pinpai_right.png')" mode="aspectFit" />
          </view>
        </view>
        <view class="flex flex-ai-center">
          <view class="mini-btn flex flex-ai-center flex-js-center" @click="$emit('mine')">
            <text class="MiSans-Regular mini-text">我拥有的</text>
            <img class="mini-icon" :src="asset('static/detail/yongyou.png')" mode="aspectFit" />
          </view>
          <view class="mini-btn flex flex-ai-center flex-js-center ml-12" @click="$emit('notice')">
            <text class="MiSans-Regular mini-text">相关公告</text>
            <img class="mini-icon" :src="asset('static/detail/notice.png')" mode="aspectFit" />
          </view>
        </view>
      </view>
    </view>

    <!-- 限量 / 流通 -->
    <view class="stat-row flex flex-js-sb">
      <view class="stat-block flex flex-dir-col flex-ai-center">
        <view class="stat-bar flex flex-ai-center flex-js-center">
          <text class="MiSans-Demibold stat-num">{{ product.total_num || 0 }} 份</text>
        </view>
        <text class="MiSans-Regular stat-label">限量/limited edition</text>
      </view>
      <view class="stat-block flex flex-dir-col flex-ai-center">
        <view class="stat-bar flex flex-ai-center flex-js-center">
          <text class="MiSans-Demibold stat-num">{{ product.flux || 0 }} 份</text>
        </view>
        <view class="flex flex-ai-center mt-10">
          <img class="help-icon" :src="asset('static/detail/help.png')" mode="aspectFit" />
          <text class="MiSans-Regular stat-label">流通/Circulation quantity</text>
        </view>
      </view>
    </view>

    <!-- tab -->
    <view class="mgh-tab-bar flex flex-ai-center flex-js-sb">
      <view
        v-for="t in tabs"
        :key="t.key"
        class="mgh-tab-item flex flex-ai-center flex-js-center"
        :class="{ active: tabCurrent === t.key }"
        @click="$emit('tab', t.key)"
      >
        <text class="MiSans-Medium mgh-tab-text">{{ t.name }}</text>
        <img
          v-if="tabCurrent === t.key"
          class="mgh-tab-hot"
          :src="asset('static/detail/hot.png')"
          mode="aspectFit"
        />
      </view>
    </view>
  </view>
</template>

<script setup>
import { asset } from '@/utils/api'

defineProps({
  product: { type: Object, default: () => ({}) },
  mainImg: { type: String, default: '' },
  tabs: { type: Array, default: () => [] },
  tabCurrent: { type: Number, default: 0 },
})
defineEmits(['brand', 'mine', 'notice', 'tab'])
</script>

<style scoped>
@import '@/styles/atomic.css';
.hero-card {
  /* 源站量测：margin 24px 14px 0、padding 0 10px、内容高 138px */
  margin: 46rpx 27rpx 0;
  height: 265rpx;
  padding: 0 19rpx;
  box-sizing: border-box;
}
.hero-img-box {
  /* 源站量测：138x138、圆角 13px */
  width: 265rpx;
  height: 265rpx;
  flex-shrink: 0;
  overflow: hidden;
  border-radius: 25rpx;
  opacity: 0.7;
}
.hero-img {
  width: 172rpx;
  height: 172rpx;
  border-radius: 16rpx;
  border: 3rpx solid #fff;
}
.hero-info {
  flex: 1;
  min-width: 0;
  /* 源站量测：margin-left 10px、padding 12px 0、内容高 119px */
  margin-left: 19rpx;
  padding: 23rpx 0;
  height: 229rpx;
  box-sizing: border-box;
}
.hero-name {
  font-size: 32rpx;
  color: #1a2438;
}
.brand-row {
  margin-top: 12rpx;
}
.brand-icon {
  width: 28rpx;
  height: 28rpx;
}
.brand-text {
  margin-left: 8rpx;
  font-size: 24rpx;
  color: #666;
}
.brand-arrow {
  width: 12rpx;
  height: 20rpx;
  margin-left: 8rpx;
}
.mini-btn {
  height: 40rpx;
  padding: 0 12rpx;
  border-radius: 5rpx;
  background: #fff;
}
.mini-text {
  font-size: 22rpx;
  color: #1a2438;
}
.mini-icon {
  width: 25rpx;
  height: 22rpx;
  margin-left: 8rpx;
}
.stat-row {
  /* 源站量测：margin 14px 14px 0 */
  margin: 27rpx 27rpx 0;
}
.stat-block {
  /* 源站量测：两栏各 174x51 / 容器 362 */
  width: 48.06%;
  height: 98rpx;
}
.stat-bar {
  /* 源站量测：173.8x33 */
  width: 100%;
  height: 66rpx;
  border-radius: 9rpx;
  background: #3a3a3a;
}
.stat-num {
  font-size: 28rpx;
  color: #fff;
}
.stat-label {
  margin-top: 10rpx;
  font-size: 20rpx;
  color: #999;
}
.help-icon {
  width: 24rpx;
  height: 24rpx;
  margin-right: 6rpx;
}
.mgh-tab-bar {
  position: relative;
  /* 源站量测：全宽 390、padding 0 6px、margin 12px 0 0、高 46px、flex-js-sb */
  margin: 23rpx 0 0;
  width: 100%;
  height: 88rpx;
  padding: 0 12rpx;
  box-sizing: border-box;
  justify-content: space-between;
  background: transparent;
  border-bottom: 1rpx solid #f3f6f8;
}
.mgh-tab-item {
  position: relative;
  /* 源站量测：每项 95x33、选中底色 #f3f6f8 */
  flex: 0 0 auto;
  width: 183rpx;
  height: 63rpx;
  border-radius: 12rpx;
}
.mgh-tab-item.active {
  border-radius: 12rpx;
  background: #f3f6f8;
}
.mgh-tab-text {
  font-size: 28rpx;
  color: #666;
}
.mgh-tab-item.active .mgh-tab-text {
  color: #8fb49b;
}
.mgh-tab-hot {
  position: absolute;
  top: 4rpx;
  right: 24rpx;
  width: 33rpx;
  height: 16rpx;
}
</style>