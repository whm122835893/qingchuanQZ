<template>
  <view class="regift-record-page">
    <view class="pt-20"></view>

    <view class="list mlr-32">
      <view v-for="r in list" :key="r.id" class="record-card">
        <view class="flex">
          <img class="thumb" :src="ossImg(r.goods_cover_image)" mode="aspectFill" />
          <view class="info-bar flex flex-dir-col flex-js-sb">
            <text class="MiSans-Medium goods-name text-overflow-2">{{ r.goods_name }}</text>
            <view class="code-pill flex flex-ai-center">
              <text class="MiSans-Regular code-text">{{ r.collection_code }}</text>
            </view>
            <view class="status flex flex-ai-center">
              <img class="status-icon" :src="asset('static/icon/rjs.png')" mode="aspectFit" />
              <text class="MiSans-Regular status-text">{{ r.status_text }}</text>
            </view>
          </view>
        </view>

        <view class="detail">
          <view class="detail-row flex flex-js-sb">
            <text class="MiSans-Regular detail-label">赠送者</text>
            <text class="MiSans-Regular detail-value">{{ r.from_user }}</text>
          </view>
          <view class="detail-row flex flex-js-sb">
            <text class="MiSans-Regular detail-label">转赠时间</text>
            <text class="MiSans-Regular detail-value">{{ r.create_time }}</text>
          </view>
          <view v-if="r.back_time" class="detail-row flex flex-js-sb">
            <text class="MiSans-Regular detail-label">退回时间：</text>
            <text class="MiSans-Regular detail-value">{{ r.back_time }}</text>
          </view>
          <view class="detail-row flex flex-js-sb">
            <text class="MiSans-Regular detail-label">记录单号：</text>
            <text class="MiSans-Regular detail-value">{{ r.order_no }}</text>
          </view>
        </view>
      </view>

      <view v-if="!list.length" class="empty-box">
        <text class="MiSans-Regular empty-text">暂无转赠记录</text>
      </view>
    </view>
  </view>
</template>

<script setup>
/**
 * 原站 regift/record —— 转赠记录
 * 每条卡片：藏品缩略图 + 名称 + 编号胶囊 + 状态 / 赠送者 / 转赠时间 / 退回时间 / 记录单号。
 * 原站该页无导航栏（从我的页面二级进入），故顶部只留留白。
 */
import { onMounted, ref } from 'vue'
import { asset, fetchRegiftRecord } from '@/utils/api'
import { ossImg } from '@/api'

defineOptions({ name: 'RegiftRecordPage' })

const list = ref([])

onMounted(async () => {
  list.value = await fetchRegiftRecord()
})
</script>

<style scoped>
@import '@/styles/atomic.css';

.regift-record-page {
  min-height: 100vh;
  background: #f7f7f7;
  padding-bottom: 60rpx;
  box-sizing: border-box;
}
.list {
  padding: 20rpx 32rpx;
  background: #f7f7f7;
  box-shadow: 0 4rpx 48rpx 8rpx rgba(11, 42, 113, 0.05);
}
.record-card {
  margin-bottom: 24rpx;
  padding: 24rpx;
  background: #fff;
  border-radius: 24rpx;
}
.thumb {
  width: 144rpx;
  height: 144rpx;
  border-radius: 24rpx;
  background: #333;
  flex-shrink: 0;
}
.info-bar {
  margin-left: 24rpx;
  min-width: 0;
  flex: 1;
}
.goods-name {
  width: 100%;
  font-size: 28rpx;
  color: #1a2438;
}
.code-pill {
  align-self: flex-start;
  height: 36rpx;
  padding: 0 16rpx;
  margin-top: 10rpx;
  background: #f5f6fa;
  border-radius: 36rpx;
}
.code-text {
  font-size: 20rpx;
  color: #999;
}
.status {
  margin-top: 14rpx;
}
.status-icon {
  width: 32rpx;
  height: 32rpx;
}
.status-text {
  margin-left: 8rpx;
  font-size: 28rpx;
  color: #1a2438;
}
.detail {
  margin-top: 40rpx;
  padding-top: 30rpx;
  border-top: 1rpx solid #eee;
}
.detail-row {
  padding: 10rpx 0;
}
.detail-label {
  font-size: 28rpx;
  color: #999;
}
.detail-value {
  font-size: 28rpx;
  color: #1a2438;
}
.empty-box {
  padding: 120rpx 0;
  text-align: center;
}
.empty-text {
  font-size: 26rpx;
  color: #999;
}
</style>