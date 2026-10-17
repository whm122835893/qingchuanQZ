<template>
  <view class="chat-page">
    <PageNavbar :title="title" />

    <!-- 消息列表 -->
    <scroll-view scroll-y  class="msg-scroll" :scroll-into-view="scrollIntoView" scroll-with-animation>
      <view v-if="messages.length">
        <view v-for="(m, i) in messages" :id="'msg-' + i" :key="m.id || i">
          <!-- 时间分隔 -->
          <view v-if="m.show_date" class="date-line flex flex-js-center">
            <text class="MiSans-Regular date-text">{{ m.date_text }}</text>
          </view>

          <!-- 自己发的 -->
          <view v-if="m.is_self" class="msg-row flex flex-js-end">
            <view class="bubble self">
              <text class="MiSans-Regular bubble-text">{{ m.content }}</text>
            </view>
            <img class="avatar" :src="m.avatar" mode="aspectFill" />
          </view>

          <!-- 别人发的 -->
          <view v-else class="msg-row flex">
            <img class="avatar" :src="m.avatar" mode="aspectFill" />
            <view class="msg-col flex flex-dir-col">
              <text class="MiSans-Regular nick">{{ m.nickname || '用户' }}</text>
              <view class="bubble other">
                <text class="MiSans-Regular bubble-text">{{ m.content }}</text>
              </view>
            </view>
          </view>
        </view>
        <view id="msg-bottom" class="bottom-space"></view>
      </view>

      <view v-else class="empty-box flex flex-js-center">
        <img class="empty-img" :src="asset('static/empty/message-empty.png')" mode="widthFix" />
      </view>
    </scroll-view>

    <!-- 底部输入栏 -->
    <view class="input-bar">
      <view class="flex flex-ai-center">
        <view class="tool-btn flex flex-ai-center flex-js-center" @click="onTool('语音')">
          <text class="MiSans-Regular tool-text">语音</text>
        </view>
        <input
          v-model="inputText"
          class="msg-input MiSans-Regular" placeholder="说点什么..."
          placeholder-class="ph" confirm-type="send"
          @confirm="sendMessage"
        />
        <view class="tool-btn flex flex-ai-center flex-js-center" @click="onTool('表情')">
          <text class="MiSans-Regular tool-text">表情</text>
        </view>
        <view class="tool-btn flex flex-ai-center flex-js-center" @click="onTool('更多')">
          <text class="more-plus">+</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
/**
 * 原站 community/chat —— 社区聊天页
 * 原站为长连接实时消息，本项目不接WebSocket，改为读取本地 mock 消息列表 + 本地追加发送，
 * 结构（气泡左右分置、日期分隔、底部工具栏 + 输入框 + 发送）与原站一致。
 */
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import PageNavbar from '@/components/PageNavbar.vue'
import { asset, fetchChatMessages } from '@/utils/api'
import { ossImg } from '@/api'

defineOptions({ name: 'CommunityChatPage' })

const route = useRoute()
const title = computed(() => route.query.title || '青川藏家交流群')
const messageList = ref([])
const inputText = ref('')
const scrollIntoView = ref('')
const userAvatar = ref('')

/** 头像兜底：mock 中头像为 /uploads/... 裸路径，必须经 ossImg 映射到本地副本 */
const DEFAULT_AVATAR = asset('static/logo/logo.png')
/** 渲染用列表：所有头像统一走 ossImg，杜绝裸路径 404 */
const messages = computed(() =>
  messageList.value.map((m) => ({
    ...m,
    avatar: m.avatar ? ossImg(m.avatar) : userAvatar.value || DEFAULT_AVATAR,
  }))
)

function onTool(name) {
  uni.showToast({ title: '原站' + name + '功能需APP端支持', icon: 'none' })
}

function sendMessage() {
  const text = inputText.value.trim()
  if (!text) return
  messageList.value.push({
    id: Date.now(),
    is_self: true,
    nickname: '我',
    content: text,
    avatar: '',
    show_date: false,
  })
  inputText.value = ''
  scrollIntoView.value = ''
  requestAnimationFrame(() => {
    scrollIntoView.value = 'msg-bottom'
  })
}

onMounted(async () => {
  const list = await fetchChatMessages()
  messageList.value = Array.isArray(list) ? list : []
  const selfMsg = messageList.value.find((m) => m && m.is_self)
  userAvatar.value = selfMsg && selfMsg.avatar ? ossImg(selfMsg.avatar) : DEFAULT_AVATAR
})
</script>

<style scoped>
@import '@/styles/atomic.css';

.chat-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f4f6fa;
  box-sizing: border-box;
}
.msg-scroll {
  flex: 1;
  min-height: 0;
}
.bottom-space {
  height: 40rpx;
}
.date-line {
  padding: 20rpx 0 8rpx;
}
.date-text {
  font-size: 22rpx;
  color: #b0b0b0;
}
.msg-row {
  padding: 16rpx 24rpx;
}
.avatar {
  width: 72rpx;
  height: 72rpx;
  border-radius: 12rpx;
  background: #333;
  flex-shrink: 0;
}
.bubble {
  max-width: 70%;
  padding: 20rpx 24rpx;
  border-radius: 12rpx;
}
.bubble.self {
  margin-right: 16rpx;
  background: #d6f0dd;
}
.bubble.other {
  background: #fff;
}
.bubble-text {
  font-size: 28rpx;
  line-height: 40rpx;
  color: #333;
}
.msg-col {
  margin-left: 16rpx;
  max-width: 70%;
}
.nick {
  margin-bottom: 8rpx;
  font-size: 22rpx;
  color: #999;
}
.empty-box {
  padding-top: 240rpx;
}
.empty-img {
  width: 660rpx;
}
.input-bar {
  flex-shrink: 0;
  padding-bottom: env(safe-area-inset-bottom);
  background: #fff;
  border-top: 1rpx solid #ececec;
}
.msg-input {
  flex: 1;
  height: 72rpx;
  margin: 0 12rpx;
  padding: 0 20rpx;
  background: #f4f6fa;
  border-radius: 36rpx;
  font-size: 26rpx;
  color: #333;
}
.ph {
  color: #b0b0b0;
  font-size: 26rpx;
}
.tool-btn {
  height: 72rpx;
  padding: 0 16rpx;
  flex-shrink: 0;
}
.tool-btn + .msg-input,
.msg-input + .tool-btn {
  margin-left: 12rpx;
}
.tool-text {
  font-size: 22rpx;
  color: #666;
}
.more-plus {
  font-size: 36rpx;
  line-height: 1;
  color: #666;
}
</style>