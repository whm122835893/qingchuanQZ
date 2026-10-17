<template>
  <view class="wall-details-page page-bg plr-16">
    <view class="navbar">
      <view class="navbar-left" @click="goBack">
        <img :src="asset('static/common/back_default.png')" mode="widthFix" />
      </view>
      <text class="navbar-title">{{ title }}</text>
    </view>

    <!-- 动态主体 -->
    <view class="bg-color-item br-16 ptb-12 plr-16">
      <view class="flex flex-ai-center">
        <img class="avatar" :src="avatarOf(info.profile)" mode="aspectFill" />
        <view class="pl-8 flex flex-dir-col flex-js-sb">
          <text class="font-color-white font-size-14">{{
            (info.profile && info.profile.nickname) || '--'
          }}</text>
          <text class="font-size-8 font-color-minor">{{ info.create_time }}</text>
        </view>
      </view>

      <view class="pt-12 font-size-14 font-color-999 content-text">{{ info.content }}</view>

      <view v-if="images.length" class="flex img-grid" :class="'grid-' + images.length">
        <img
          v-for="(im, i) in images"
          :key="i"
          class="grid-img"
          :src="im"
          mode="aspectFill"
          @click="preview(i)"
        />
      </view>
    </view>

    <!-- 评论列表 -->
    <WallCommentList :list="commentList" @reply="reply" @more="loadMore" />

    <!-- 底部评论输入条 -->
    <view class="action plr-16 flex flex-ai-center">
      <input
        class="flex-1 inp"
        :value="form.content"
        :placeholder="placeholder"
        placeholder-class="inp-ph" confirm-type="send"
        @input="onInput"
        @confirm="sendComment"
      />
      <view class="send-btn flex flex-ai-center flex-js-center" @click="sendComment">
        <text class="MiSans-Medium send-text">发送</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import WallCommentList from '@/components/WallCommentList.vue'
import { fetchRumorInfo, asset } from '@/utils/api'
import { ossImg } from '@/api'

const router = useRouter()

const title = ref('社区')
const info = ref({ profile: {}, images: [] })
const commentList = ref([])
const replyTo = ref(null)
const form = reactive({ content: '' })

const images = computed(() => (info.value.images || []).map((p) => ossImg(p)))

const placeholder = computed(() =>
  replyTo.value ? `回复 ${replyTo.value.profile.nickname}` : '说点什么...'
)

function avatarOf(p) {
  return p && p.avatar ? ossImg(p.avatar) : asset('static/tabBar/index.png')
}

function onInput(e) {
  form.content = e.target.value
}

function reply(c) {
  replyTo.value = c
}

function preview(i) {
  uni.previewImage({ urls: images.value, current: i })
}

function loadMore(c) {
  // 原站为分页拉取回复，此处 mock 仅一条，直接标记为已加载完
  c.has_more = false
}

function sendComment() {
  const txt = form.content.trim()
  if (!txt) {
    uni.showToast({ title: '请输入评论内容', icon: 'none' })
    return
  }
  uni.showToast({ title: replyTo.value ? '回复成功' : '评论成功', icon: 'none' })
  form.content = ''
  replyTo.value = null
}

function goBack() {
  if (window.history.length > 1) router.back()
  else router.push('/pages/community/community')
}

onMounted(async () => {
  const d = await fetchRumorInfo({})
  info.value = { profile: {}, images: [], ...d }
  commentList.value = d.comment_list || []
  title.value = d.title || '社区'
})
</script>

<style scoped>
@import '@/styles/atomic.css';

.wall-details-page {
  min-height: 100vh;
  background-color: #f4f6fa;
  padding-bottom: 160rpx;
  box-sizing: border-box;
}

.navbar {
  position: relative;
  height: 88rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.navbar-left {
  position: absolute;
  left: 0;
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

.avatar {
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  flex-shrink: 0;
}
.content-text {
  line-height: 1.7;
  word-break: break-all;
}

.img-grid {
  margin-top: 8rpx;
}
.grid-img {
  border-radius: 8rpx;
  background: #eee;
  margin-right: 8rpx;
  margin-top: 8rpx;
}
.grid-1 .grid-img {
  width: 343rpx;
  height: 257rpx;
}
.grid-2 .grid-img {
  width: 171rpx;
  height: 171rpx;
}
.grid-3 .grid-img {
  width: 115rpx;
  height: 115rpx;
}






.arrow::before {
  content: '';
  position: absolute;
  left: 2rpx;
  top: 7rpx;
  width: 10rpx;
  height: 2rpx;
  background: #999;
}
.arrow::after {
  content: '';
  position: absolute;
  right: 2rpx;
  top: 4rpx;
  width: 8rpx;
  height: 8rpx;
  border-top: 2rpx solid #999;
  border-right: 2rpx solid #999;
  transform: rotate(45deg);
}






.action {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 10;
  padding: 16rpx 24rpx calc(16rpx + env(safe-area-inset-bottom));
  background: #fff;
  border-top: 1rpx solid #f0f0f0;
}
.inp {
  height: 72rpx;
  padding: 0 24rpx;
  background: #f4f6fa;
  border-radius: 36rpx;
  font-size: 28rpx;
  color: #1a2438;
  box-sizing: border-box;
}
.inp-ph {
  color: #ababab;
  font-size: 28rpx;
}
.send-btn {
  height: 72rpx;
  padding: 0 32rpx;
  margin-left: 16rpx;
  background: #1a2438;
  border-radius: 36rpx;
  flex-shrink: 0;
}
.send-text {
  font-size: 28rpx;
  color: #fff;
}
</style>