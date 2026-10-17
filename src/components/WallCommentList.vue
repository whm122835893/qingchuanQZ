<template>
  <view class="mt-25 comment">
    <view v-for="c in list" :key="c.id" class="flex mb-12">
      <img class="c-avatar" :src="avatarOf(c.profile)" mode="aspectFill" />
      <view class="pl-8 flex-1">
        <text class="font-size-14 font-color-dark">{{ c.profile.nickname }}</text>
        <view class="mt-4 font-size-12 c-content">{{ c.content }}</view>
        <view class="font-size-10 font-color-minor flex">
          <text class="mr-8">{{ c.create_time }}</text>
          <text class="reply-link" @click="$emit('reply', c)">回复</text>
        </view>

        <view v-for="r in c.reply || []" :key="r.id" class="mtb-8 flex reply-item">
          <img class="r-avatar" :src="avatarOf(r.profile)" mode="aspectFill" />
          <view class="pl-4">
            <view class="nickname font-size-12 flex flex-ai-center font-color-black">
              <text>{{ r.profile.nickname }}</text>
              <template v-if="r.reply_id !== c.id">
                <view class="font-size-10 mlr-4 arrow"></view>
                <text>{{ r.reply_profile.nickname }}</text>
              </template>
            </view>
            <view class="font-color-black font-size-12 ptb-4">{{ r.content }}</view>
            <view class="font-size-10 font-color-minor flex">
              <text class="mr-8">{{ r.create_time }}</text>
              <text class="reply-link" @click="$emit('reply', r)">回复</text>
            </view>
          </view>
        </view>

        <view
          v-if="c.has_more"
          class="font-size-10 font-color-convention text-center more-btn"
          @click="$emit('more', c)"
        >
          加载更多
        </view>
      </view>
    </view>

    <view v-if="!list.length" class="empty-box">
      <text class="MiSans-Regular empty-text">还没有评论</text>
    </view>
  </view>
</template>

<script setup>
import { asset } from '@/utils/api'
import { ossImg } from '@/api'

defineProps({
  list: { type: Array, default: () => [] },
})
defineEmits(['reply', 'more'])

const avatarOf = (p) =>
  p && p.avatar ? ossImg(p.avatar) : asset('static/tabBar/index.png')
</script>

<style scoped>
@import '@/styles/atomic.css';
.c-avatar {
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  background: #f4f6fa;
}
.c-content {
  color: #333;
  line-height: 36rpx;
}
.reply-link {
  color: #6aa27b;
}
.r-avatar {
  width: 48rpx;
  height: 48rpx;
  border-radius: 50%;
  background: #f4f6fa;
}
.reply-item {
  padding: 8rpx;
  border-radius: 8rpx;
  background: #f7f7f7;
}
.arrow {
  width: 10rpx;
  height: 10rpx;
  border-top: 2rpx solid #999;
  border-right: 2rpx solid #999;
  transform: rotate(45deg);
}
.more-btn {
  padding: 12rpx 0;
}
.empty-box {
  height: 240rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.empty-text {
  font-size: 26rpx;
  color: #999;
}
</style>