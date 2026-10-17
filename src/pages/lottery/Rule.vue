<template>
  <view class="rule-page">
    <PageNavbar title="活动规则" />

    <view class="content">
      <view class="title">
        <view class="line left"></view>
        <text class="MiSans-Demibold title-text">活动规则</text>
        <view class="line right"></view>
      </view>
      <view class="rich" v-html="ruleHtml"></view>
    </view>
  </view>
</template>

<script setup>
/**
 * 原站 lottery/rule —— 抽奖活动规则
 * 结构：导航 + 白色圆角规则卡（标题 + 富文本正文）。
 */
import { onMounted, ref } from 'vue'
import PageNavbar from '@/components/PageNavbar.vue'
import { fetchLotteryRule } from '@/utils/api'

defineOptions({ name: 'LotteryRule' })

const ruleHtml = ref('')

onMounted(async () => {
  const data = await fetchLotteryRule()
  ruleHtml.value = (data && (data.rule || data.content)) || ''
})
</script>

<style scoped>
@import '@/styles/atomic.css';

.rule-page {
  min-height: 100vh;
  background: #f4f5f8;
  padding: 0 24rpx 24rpx;
  box-sizing: border-box;
}

.content {
  width: 100%;
  min-height: 80vh;
  padding: 30rpx 42rpx;
  background: #fff;
  border-radius: 18rpx;
  box-sizing: border-box;
}
.title {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  margin-bottom: 16rpx;
}
.title-text {
  margin: 0 24rpx;
  font-size: 25.5rpx;
  color: #1a2438;
}
.line {
  flex: 1;
  height: 1.5rpx;
  background: #dcd7cd;
}
.rich {
  font-size: 26rpx;
  line-height: 48rpx;
  color: #505050;
  word-break: break-all;
}
</style>