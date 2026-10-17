<template>
  <view class="draw-page">
    <PageNavbar title="抽签" />

    <view class="page-body">
      <!-- 主图 -->
      <view class="hero-card">
        <img class="hero-img" :src="ossImg(activity.listimg)" mode="aspectFill" />
      </view>

      <!-- 抽签时间线 -->
      <view class="section-card">
        <text class="MiSans-Demibold section-title">抽签时间线</text>
        <view class="timeline">
          <view class="timeline-track">
            <view v-for="(t, i) in timelineItems" :key="t.name" class="dot-col">
              <view class="dot" :class="{ on: i <= currentStep }"></view>
            </view>
          </view>
          <view class="timeline-labels">
            <view v-for="t in timelineItems" :key="t.name" class="label-col">
              <text class="MiSans-Regular label-name">{{ t.name }}</text>
              <text class="MiSans-Regular label-time">{{ t.time || '--' }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 我的抽签码 -->
      <view class="section-card">
        <text class="MiSans-Demibold section-title">我的抽签码</text>
        <view class="code-panel">
          <view class="code-tabs">
            <view class="code-tab" :class="{ on: activeCode === 0 }" @click="activeCode = 0">
              <text class="MiSans-Medium code-tab-text">抽签码</text>
            </view>
            <view class="code-tab" :class="{ on: activeCode === 1 }" @click="activeCode = 1">
              <text class="MiSans-Medium code-tab-text">中签码</text>
            </view>
          </view>

          <view v-if="currentCodeList.length" class="code-list">
            <view v-for="(c, i) in currentCodeList" :key="i" class="code-item">
              <text class="MiSans-Medium code-item-text">{{ c.code }}</text>
            </view>
          </view>
          <view v-else class="code-empty">
            <text class="MiSans-Regular code-empty-text">暂无{{ activeCode ? '中签' : '抽签' }}码</text>
          </view>
        </view>
      </view>

      <!-- 活动规则 -->
      <view class="section-card">
        <text class="MiSans-Demibold section-title">抽签活动规则</text>
        <view class="rich mt-12" v-html="drawRule"></view>
      </view>
    </view>

    <!-- 底部抽签按钮 -->
    <view class="footer">
      <view class="draw-btn" @click="onDraw">
        <text class="MiSans-Demibold draw-btn-text">{{ drawBtnText }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
/**
 * 原站 activity/draw —— 活动抽签
 * 结构：导航 + 主图 + 抽签时间线（4 节点）+ 我的抽签码（抽签码 / 中签码 tab + 码列表或空态）+ 活动规则富文本 + 底部固定抽签按钮。
 */
import { computed, onMounted, ref } from 'vue'
import PageNavbar from '@/components/PageNavbar.vue'
import { fetchActivityDraw } from '@/utils/api'
import { ossImg } from '@/api'

defineOptions({ name: 'ActivityDraw' })

const info = ref({})
const activeCode = ref(0)

onMounted(async () => {
  info.value = await fetchActivityDraw()
})

const activity = computed(() => info.value.activity || {})
const drawRule = computed(() => info.value.draw_rule || '')

const timelineItems = computed(() => [
  { name: '报名开始', time: activity.value.start_time },
  { name: '报名截止', time: activity.value.end_time },
  { name: '抽签开奖', time: activity.value.draw_time },
  { name: '结果公示', time: activity.value.open_time },
])

/** 当前所处时间线节点（用于高亮） */
const currentStep = computed(() => {
  const items = timelineItems.value
  const now = Date.now()
  let step = 0
  items.forEach((t, i) => {
    const ts = new Date(String(t.time).replace(/-/g, '/')).getTime()
    if (!Number.isNaN(ts) && ts <= now) step = i
  })
  return step
})

const currentCodeList = computed(() =>
  activeCode.value === 0 ? info.value.code_list || [] : info.value.win_code_list || []
)

const drawBtnText = computed(() => {
  if (currentCodeList.value.length) return '您已参与本次抽签'
  return '立即抽签'
})

function onDraw() {
  const list = info.value.code_list || []
  if (list.length) {
    window.uni && window.uni.showToast({ title: `恭喜你抽中抽签码 ${list[list.length - 1].code}`, icon: 'none' })
    return
  }
  window.uni && window.uni.showToast({ title: '请先完成实名认证', icon: 'none' })
}
</script>

<style scoped src="./ActivityDraw.css"></style>
