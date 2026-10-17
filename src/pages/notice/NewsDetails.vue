<template>
  <view class="news-details-page">
    <view class="navbar">
      <view class="navbar-left" @click="goBack">
        <img :src="asset('static/common/back_default.png')" mode="widthFix" />
      </view>
      <text class="navbar-title">潮玩有话说</text>
    </view>

    <view class="plr-16">
      <view v-if="info.content" class="flex mt-8">
        <view
          class="flex flex-js-center flex-ai-center avatar-box"
        >
          <img class="avatar" :src="asset('static/logo/logo.png')" mode="aspectFit" />
        </view>
        <view class="flex flex-dir-col author-col">
          <view class="flex flex-dir-col">
            <text class="MiSans-Medium news-title text-overflow-2">{{ info.title }}</text>
          </view>
          <!-- 富文本正文（原站 u-parse） -->
          <view class="MiSans-Regular news-body" v-html="info.content"></view>
          <view class="flex time-row">
            <text class="topic-family time-text">{{ shortTime }}</text>
          </view>
        </view>
      </view>

      <view v-else class="empty-box">
        <text class="MiSans-Regular empty-text">暂无内容</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { fetchNewsDetail, asset } from '@/utils/api'

const router = useRouter()

const info = ref({})

const shortTime = computed(() => {
  if (!info.value.createtime) return ''
  const d = new Date(Number(info.value.createtime) * 1000)
  const p = (n) => String(n).padStart(2, '0')
  return `${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
})

function goBack() {
  if (window.history.length > 1) router.back()
  else router.push('/pages/notice/notice')
}

onMounted(async () => {
  info.value = await fetchNewsDetail({})
})
</script>

<style scoped>
.news-details-page {
  min-height: 100vh;
  background: #fff;
  padding-bottom: 60rpx;
}

.navbar {
  position: relative;
  height: 88rpx;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1rpx solid #f5f5f5;
}
.navbar-left {
  position: absolute;
  left: 26rpx;
  top: 0;
  bottom: 0;
  display: flex;
  align-items: center;
}
.navbar-left img {
  width: 34rpx;
}
.navbar-title {
  font-size: 32rpx;
  color: #1a2438;
  font-family: MiSans-Demibold;
}

.avatar-box {
  width: 73rpx;
  height: 73rpx;
  background-color: #f5f5f5;
  border-radius: 37rpx;
  flex-shrink: 0;
  margin-right: 32rpx;
  overflow: hidden;
}
.avatar {
  width: 42rpx;
  height: 42rpx;
  border-radius: 50%;
}
.author-col {
  width: 100%;
  min-width: 0;
}
.news-title {
  font-size: 32rpx;
  font-weight: 500;
  color: #000;
  line-height: 1.5;
}
.news-body {
  margin-top: 15rpx;
  font-size: 26rpx;
  color: #333;
  line-height: 1.75;
  word-break: break-all;
}
.news-body :deep(p) {
  margin: 0 0 20rpx;
}
.news-body :deep(strong) {
  font-weight: 600;
}
.time-row {
  margin-top: 34rpx;
}
.time-text {
  font-size: 24rpx;
  color: #919191;
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