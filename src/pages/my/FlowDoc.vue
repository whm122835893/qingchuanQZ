<template>
  <view class="flow-doc-page page-bg-colorfull plr-16">
    <PageNavbar title="流转记录" />

    <view v-for="item in list" :key="item.id" class="item bg-color-item br-12 mb-12">
      <view class="left">
        <text class="font-size-14 font-color-textPrimary font-w-500"> {{ item.nickname }} </text>
        <text class="font-size-12 font-color-999 mt-8"> {{ formatTime(item.createtime) }} </text>
      </view>
      <view class="right font-color-textPrimary">{{ source(item) }}</view>
    </view>

    <!-- 空态 / 加载中 -->
    <view v-if="loading" class="state-wrap">
      <text class="font-size-12 font-color-999">加载中</text>
    </view>
    <view v-else-if="!list.length" class="state-wrap">
      <img class="state-img" :src="asset('static/empty/search-empty.png')" mode="widthFix" />
      <text class="font-size-12 font-color-999 mt-16">暂无流转记录</text>
    </view>
  </view>
</template>

<script setup>
/**
 * 原站 my/flowDoc —— 流转记录
 * 每行左侧为操作人昵称 + 时间，右侧为 source(source_type) 映射出的流转动作文案。
 * 原站 source() 对 source_type 1~6 均返回「转入」，此处保持一致。
 */
import { onMounted, ref } from 'vue'
import PageNavbar from '@/components/PageNavbar.vue'
import { asset, fetchFlowDoc } from '@/utils/api'

defineOptions({ name: 'FlowDocPage' })

const list = ref([])
const loading = ref(true)

onMounted(async () => {
  const data = await fetchFlowDoc()
  list.value = Array.isArray(data) ? data : []
  loading.value = false
})

/** 原站 source()：source_type 1-6 一律返回「转入」 */
function source() {
  return '转入'
}

function formatTime(ts) {
  if (!ts) return ''
  const d = new Date(Number(ts) * 1000)
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(
    d.getMinutes()
  )}:${p(d.getSeconds())}`
}
</script>

<style scoped>
@import '@/styles/atomic.css';

.flow-doc-page {
  min-height: 100vh;
  background: #f4f6fa;
  box-sizing: border-box;
}
/* 与原站 item 一致：左右分栏 */
.item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: 140rpx;
  padding: 0 48rpx 0 64rpx;
  box-sizing: border-box;
}
.item > .left {
  display: flex;
  flex-direction: column;
}
.item > .right {
  font-size: 28rpx;
}
.state-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 200rpx;
}
.state-img {
  width: 330rpx;
}
</style>
