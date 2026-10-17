<template>
  <view class="draw-result-page">
    <view class="pa-16">
      <!-- 未开奖 -->
      <view v-if="!info.draw_complete" class="notice-box">
        <text class="MiSans-Regular notice-text">结果暂未公布，敬请期待！</text>
      </view>

      <!-- 已开奖 -->
      <view v-else class="result-wrap">
        <template v-if="successList.length">
          <!-- 原站 draw_yes.png 已 404，改用 CSS 绘制的成功标记 -->
          <view class="mark yes">
            <text class="MiSans-Demibold mark-text">中签</text>
          </view>
          <text class="MiSans-Demibold result-title">恭喜您，中签啦！</text>
          <view class="code-list">
            <view v-for="(c, i) in successList" :key="i" class="list-box">
              <text class="MiSans-Regular code-text">{{ c.code }}</text>
            </view>
          </view>
        </template>
        <template v-else>
          <view class="mark no">
            <text class="MiSans-Demibold mark-text">未中</text>
          </view>
          <text class="MiSans-Demibold result-title">很遗憾，未中签！</text>
          <text class="MiSans-Regular result-tip">不要灰心，下次再试！</text>
        </template>
      </view>
    </view>
  </view>
</template>

<script setup>
/**
 * 原站 draw/drawResult/drawResult —— 抽签结果
 * 结构：无导航栏的结果页（draw_complete=0 显示「结果暂未公布」；有 success_code 显示中签图 + 成功码列表；否则显示未中签）。
 * 说明：原站 /static/img/icon/draw_yes.png、draw_no.png 已 404，改用 CSS 绘制的标记块。
 */
import { computed, onMounted, ref } from 'vue'
import { fetchDrawResult } from '@/utils/api'

defineOptions({ name: 'DrawResult' })

const info = ref({})

onMounted(async () => {
  info.value = await fetchDrawResult()
})

const successList = computed(() => {
  const s = info.value.success_code
  if (!s) return info.value.success_list || []
  return [{ code: s }]
})
</script>

<style scoped>
@import '@/styles/atomic.css';

.draw-result-page {
  min-height: 100vh;
  background: #fff;
  box-sizing: border-box;
}

.notice-box {
  padding: 36rpx 42rpx;
  background: #fff;
  border-radius: 20rpx;
  box-shadow: 0 0 40rpx rgba(0, 0, 0, 0.06);
}
.notice-text {
  font-size: 28rpx;
  color: #666;
}

.result-wrap {
  margin-top: 64rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* CSS 绘制的成功 / 失败标记（原站图片已下线） */
.mark {
  width: 225rpx;
  height: 225rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.mark.yes {
  background: #e26f1b;
  box-shadow: 0 0 48rpx rgba(226, 111, 27, 0.28);
}
.mark.no {
  background: #b9bcc2;
  box-shadow: 0 0 48rpx rgba(185, 188, 194, 0.28);
}
.mark-text {
  font-size: 44rpx;
  color: #fff;
  letter-spacing: 0.04em;
}

.result-title {
  margin-top: 32rpx;
  font-size: 36rpx;
  color: #1a2438;
}
.result-tip {
  margin-top: 20rpx;
  font-size: 28rpx;
  color: #999;
}

.code-list {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  margin-top: 8rpx;
}
.list-box {
  margin: 20rpx 10rpx 0;
  padding: 12rpx 22rpx;
  background: #f7f8fa;
  border-radius: 8rpx;
}
.code-text {
  font-size: 28rpx;
  color: #1a2438;
}
</style>