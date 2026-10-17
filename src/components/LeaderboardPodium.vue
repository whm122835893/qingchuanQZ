<template>
  <!-- 用户榜前三名领奖台（原站 TPL 4：2-1-3 布局，中间冠军略高） -->
  <view class="podium flex flex-ai-end flex-js-sa">
    <view v-if="list.length > 1" class="podium-col flex flex-dir-col flex-ai-center">
      <view class="avatar-box two">
        <img class="avatar" :src="ossImg(list[1].avatar)" mode="aspectFill" />
      </view>
      <text class="MiSans-Regular pod-name text-overflow">{{ list[1].nickname }}</text>
      <text class="MiSans-Regular pod-sub">{{ metricName }}</text>
      <text class="MiSans-Medium pod-val">{{ metricOf(list[1]) }}</text>
    </view>

    <view class="podium-col flex flex-dir-col flex-ai-center">
      <view class="avatar-box one">
        <img class="avatar" :src="ossImg(list[0].avatar)" mode="aspectFill" />
      </view>
      <text class="MiSans-Medium pod-name text-overflow">{{ list[0].nickname }}</text>
      <text class="MiSans-Regular pod-sub">{{ metricName }}</text>
      <text class="MiSans-Demibold pod-val">{{ metricOf(list[0]) }}</text>
    </view>

    <view v-if="list.length > 2" class="podium-col flex flex-dir-col flex-ai-center">
      <view class="avatar-box three">
        <img class="avatar" :src="ossImg(list[2].avatar)" mode="aspectFill" />
      </view>
      <text class="MiSans-Regular pod-name text-overflow">{{ list[2].nickname }}</text>
      <text class="MiSans-Regular pod-sub">{{ metricName }}</text>
      <text class="MiSans-Regular pod-val">{{ metricOf(list[2]) }}</text>
    </view>
  </view>
</template>

<script setup>
/**
 * 排行榜前三名领奖台（leaderboard/leaderboard 内嵌）。
 */
import { ossImg } from '@/api'

defineOptions({ name: 'LeaderboardPodium' })

defineProps({
  list: { type: Array, default: () => [] },
  metricName: { type: String, default: '' },
  metricOf: { type: Function, required: true },
})
</script>

<style scoped>
@import '@/styles/atomic.css';

.podium {
  padding: 0 20rpx;
  margin-bottom: 24rpx;
}
.podium-col {
  width: 30%;
  margin-bottom: 32rpx;
}
.avatar-box {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  margin-bottom: 24rpx;
  background: #dfe3ea;
}
.avatar-box.one {
  width: 132rpx;
  height: 132rpx;
  border: 4rpx solid #d4a04a;
}
.avatar-box.two,
.avatar-box.three {
  width: 108rpx;
  height: 108rpx;
}
.avatar-box.two {
  border: 4rpx solid #9aa3ad;
}
.avatar-box.three {
  border: 4rpx solid #b4795a;
}
.avatar {
  width: 100%;
  height: 100%;
  border-radius: 50%;
}
.pod-name {
  max-width: 200rpx;
  margin-top: 24rpx;
  font-size: 26rpx;
  color: #000;
}
.pod-sub {
  margin-top: 14rpx;
  font-size: 24rpx;
  color: #666;
}
.pod-val {
  margin-top: 14rpx;
  font-size: 28rpx;
  color: #000;
}
</style>