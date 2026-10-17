<template>
  <view class="container community-page">
    <!-- 顶部标题 -->
    <view class="header">
      <text class="MiSans-Bold header-title">聊天室</text>
    </view>

    <view class="content">
      <!-- 消息 / 通讯录 -->
      <view class="tab-wrap flex flex-ai-center">
        <view
          v-for="(t, i) in tabs"
          :key="i"
          class="tab-item flex flex-ai-center flex-js-center"
          :class="{ active: current === i }"
          @click="current = i"
        >
          <img class="tab-icon" :src="t.icon" mode="widthFix" />
          <text class="MiSans-Medium tab-text" :style="{ color: current === i ? '#FFFFFF' : '#1A2438' }">{{ t.text }}</text>
        </view>
      </view>

      <!-- 弹幕 banner -->
      <view class="banner-box">
        <view class="danmaku-banner">
          <view class="flex flex-ai-center flex-js-center">
            <text class="MiSans-Regular banner-tip">暂无弹幕</text>
          </view>
        </view>
      </view>

      <!-- 消息列表 / 通讯录列表（原站当前账号无数据，显示空状态） -->
      <view class="list-box">
        <view class="flex flex-dir-col flex-ai-center empty-box">
          <img class="empty-img" :src="emptyImg" mode="widthFix" />
          <text class="MiSans-Regular empty-text">暂无消息</text>
        </view>
      </view>
    </view>

    <AppTabBar :value="3" />
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import AppTabBar from '@/components/AppTabBar.vue'

defineOptions({ name: 'CommunityPage' })

const asset = (p) => import.meta.env.BASE_URL + p.replace(/^\//, '')

const current = ref(0)

const tabs = [
  { text: '消息', icon: asset('static/shequ/msg.png') },
  { text: '通讯录', icon: asset('static/shequ/contact.png') }
]

const emptyImg = computed(() =>
  current.value === 0 ? asset('static/empty/message-empty.png') : asset('static/empty/search1-empty.png')
)
</script>

<style scoped>
.community-page {
  display: block;
  width: 100%;
  /* 底部固定 tabbar 高 160rpx */
  padding: 0 0 160rpx;
  box-sizing: border-box;
  min-height: 100vh;
  background: #fff url('/static/shequ/shequ_bg.png') no-repeat 0 0 / 100% 100%;
}
/* header：高 126px，底部对齐标题 */
.header {
  height: 126px;
  padding: 0 0 12px 16px;
  display: flex;
  align-items: flex-end;
  /* 全局 .container .header 引用了源站已下线的 /static/cw/lj_bg.png，此处覆盖为无背景图 */
  background-image: none;
}
.header-title {
  font-size: 20px;
  line-height: 27px;
  color: #1a2438;
}
/* content：白底 + 顶部圆角 + 阴影（原站 .content 专属规则） */
.content {
  position: relative;
  z-index: 2;
  height: calc(100vh - 126px);
  padding: 10px 23px;
  background: #fff;
  box-shadow: 0 -15rpx 48rpx 0 rgba(29, 21, 31, 0.43);
  border-radius: 51rpx 51rpx 0 0;
}
/* tab 切换条：白底圆角 24px，内 padding 4px */
.tab-wrap {
  padding: 4px;
  background: #fff;
  border-radius: 24px;
}
.tab-item {
  height: 37px;
  padding: 0 12px;
  margin-right: 9px;
  border-radius: 20px;
  border: 1px solid transparent;
  white-space: nowrap;
  flex-shrink: 0;
}
.tab-item.active {
  background: #76897b;
  border-color: #76897b;
}
.tab-icon {
  width: 18px;
  height: 18px;
}
.tab-text {
  margin-left: 5px;
  font-size: 14px;
  line-height: 19px;
}
/* 弹幕 banner：h114，背景图 */
.banner-box {
  margin-top: 12px;
}
.danmaku-banner {
  position: relative;
  height: 114px;
  background: #fff url('/static/shequ/banner.png') no-repeat 50% 50% / 100% 100%;
}
.banner-tip {
  font-size: 12px;
  line-height: 16px;
  color: rgba(255, 255, 255, 0.7);
}
/* 空状态：margin-top 62px */
.empty-box {
  margin-top: 62px;
}
.empty-img {
  width: 171px;
  height: 172px;
}
.empty-text {
  margin-top: 8px;
  font-size: 12px;
  color: #999;
}
</style>