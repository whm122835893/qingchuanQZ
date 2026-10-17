<template>
  <view class="sign-page">
    <PageNavbar title="每日签到" />

    <!-- 用户信息 + 连续签到 -->
    <view class="sign-date">
      <view class="user-row">
        <view class="user-info">
          <img class="avatar" :src="ossImg(user.avatar)" mode="aspectFill" />
          <view class="user-meta">
            <text class="MiSans-Medium username text-overflow">{{ user.nickname || '--' }}</text>
            <text class="MiSans-Regular uid">UID {{ user.id || '--' }}</text>
          </view>
        </view>
        <view class="sign-day">
          <text class="MiSans-Medium day-label"> 您已连续签到 </text>
          <text class="MiSans-Demibold day-num">{{ continuous }}</text>
          <text class="MiSans-Medium day-label"> 天 </text>
        </view>
      </view>
    </view>

    <!-- 签到日历 -->
    <view class="list-view">
      <text class="MiSans-Demibold view-title">{{ monthLabel }}</text>

      <view class="weeks">
        <text v-for="w in weekLabels" :key="w" class="MiSans-Regular week-text">{{ w }}</text>
      </view>

      <view class="days">
        <view v-for="d in days" :key="d.key" class="day-cell">
          <view v-if="d.day" class="day-box" :class="{ signed: d.signed, today: d.today }">
            <text class="MiSans-Regular day-text" :class="{ on: d.signed || d.today }">{{ d.day }}</text>
            <text v-if="d.signed" class="MiSans-Regular day-flag">已签</text>
          </view>
        </view>
      </view>

      <!-- 7 日连续奖励 -->
      <view class="reward-row">
        <view
          v-for="r in rewards"
          :key="r.day"
          class="reward-item"
          :class="{ got: r.day <= continuous }"
        >
          <text class="MiSans-Regular reward-day">第{{ r.day }}天</text>
          <text class="MiSans-Medium reward-num">{{ r.crystal }}</text>
        </view>
      </view>
    </view>

    <!-- 底部签到按钮 -->
    <view class="sign-btn-wrap">
      <view class="sign-btn" :class="{ done: signedToday }" @click="onSign">
        <text class="MiSans-Demibold sign-btn-text">{{ signedToday ? '已签到' : '立即签到' }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
/**
 * 原站 sign/index —— 每日签到
 * 结构：导航 + 用户信息（头像 / 昵称 / UID / 连续签到天数）+ 签到日历（当月网格 + 7 日连续奖励）+ 底部固定「立即签到」。
 * 说明：原站使用 uni-calendar 组件且顶部图 /static/icon/qidao_top.png 已 404，
 *      此处按当月网格 + 7 日连续签到奖励的等价结构实现。
 */
import { computed, onMounted, ref } from 'vue'
import PageNavbar from '@/components/PageNavbar.vue'
import { fetchSignInfo } from '@/utils/api'
import { ossImg } from '@/api'

defineOptions({ name: 'SignPage' })

const info = ref({})
const today = ref('')

const weekLabels = ['日', '一', '二', '三', '四', '五', '六']

onMounted(async () => {
  info.value = await fetchSignInfo()
  const d = new Date()
  today.value = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
})

const user = computed(() => info.value.user_info || {})
const continuous = computed(() => info.value.continuous_days || 0)
const rewards = computed(() => info.value.reward_list || [])
const signedToday = computed(() => !!info.value.sign_status)

const monthLabel = computed(() => {
  const d = new Date()
  return `${d.getFullYear()}年${d.getMonth() + 1}月`
})

/** 当月网格：补齐首日偏移，标记已签到与今天 */
const days = computed(() => {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth()
  const first = new Date(y, m, 1).getDay()
  const total = new Date(y, m + 1, 0).getDate()
  const signed = info.value.sign_days || []
  const out = []
  for (let i = 0; i < first; i++) out.push({ key: `b${i}`, day: 0 })
  for (let d = 1; d <= total; d++) {
    const key = `${y}-${m + 1}-${d}`
    out.push({ key, day: d, signed: signed.includes(d), today: key === today.value })
  }
  return out
})

function onSign() {
  if (signedToday.value) return
  const now = new Date()
  const d = now.getDate()
  info.value = {
    ...info.value,
    sign_status: 1,
    continuous_days: (info.value.continuous_days || 0) + 1,
    sign_days: [...(info.value.sign_days || []), d],
    crystal_number: (info.value.crystal_number || 0) + (rewards.value[0] || {}).crystal,
  }
  window.uni && window.uni.showToast({ title: '签到成功', icon: 'none' })
}
</script>

<style scoped src="./Sign.css"></style>
