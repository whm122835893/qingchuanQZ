<template>
  <view class="vip-page flex-1 flex flex-dir-col flex-ai-center plr-16">
    <PageNavbar title="VIP权益中心" variant="dark" />

    <img class="vip-logo" :src="asset('static/vip/logo-white.png')" mode="aspectFit" />

    <view class="title-wrap">
      <img class="title-img" :src="asset('static/vip/title.png')" mode="aspectFit" />
    </view>

    <!-- 已开通：倒计时卡 -->
    <view v-if="isVip" class="vip-kt flex flex-dir-col flex-center mtb-30">
      <img class="kt-title" :src="asset('static/vip/vip-kt-title.png')" mode="aspectFit" />
      <view class="time flex flex-center">
        <view class="time__item">{{ timeData.days }}</view>
        <view class="time__doc">天</view>
        <view class="time__item">{{ timeData.hours }}</view>
        <view class="time__doc">时</view>
        <view class="time__item">{{ timeData.minutes }}</view>
        <view class="time__doc">分</view>
        <view class="time__item">{{ timeData.seconds }}</view>
      </view>
    </view>

    <img class="vip-title2 mtb-20" :src="asset('static/vip/title2.png')" mode="aspectFit" />
    <img class="vip-icons" :src="asset('static/vip/icons.png')" mode="widthFix" />

    <view v-if="!isVip" class="footer flex flex-center">
      <view class="btn flex flex-center" @click="show = true"></view>
    </view>

    <VipAgreementModal
      v-if="show"
      :paragraphs="AGREEMENT"
      :agreed="agreed"
      @close="show = false"
      @toggle="toggleAgree"
      @scrolled="scrolledToBottom = true"
      @confirm="openVip"
    />
  </view>
</template>

<script setup>
/**
 * 原站 my/vip —— VIP权益中心
 * 未开通：底部固定「立即开通」按钮 → 弹出开通协议（需下滑到底部才能勾选同意）。
 * 已开通（userInfo.vip_time 且剩余时间 > 0）：展示 424x90 卡片内的 天/时/分/秒 倒计时。
 */
import { computed, onMounted, onUnmounted, ref } from 'vue'
import PageNavbar from '@/components/PageNavbar.vue'
import VipAgreementModal from '@/components/VipAgreementModal.vue'
import { asset } from '@/utils/api'
import { fetchUserInfo } from '@/utils/api'

defineOptions({ name: 'MyVipPage' })

const userInfo = ref({})
const havetime = ref(0)
const show = ref(false)
/** 原站 u-checkbox 的 disabled：未下滑到底部时不可勾选 */
const agreed = ref(false)
const scrolledToBottom = ref(false)
const timeData = ref({ days: '00', hours: '00', minutes: '00', seconds: '00' })
let timer = null

const isVip = computed(() => !!userInfo.value.vip_time && havetime.value > 0)

/** 原站开通协议正文（u-parse 渲染） */
const AGREEMENT = [
  '一、VIP权益服务由青川数字艺术平台（以下简称"本平台"）提供，用户开通后可在有效期内享受本平台提供的会员专属服务。',
  '二、VIP权益包括但不限于市场手续费优惠、寄售优先展示、专属客服通道及活动优先报名资格，具体权益以本平台公示为准。',
  '三、VIP有效期自开通成功之日起计算，到期后权益自动失效，已使用的权益不予退还。',
  '四、如本平台终止服务，已开通但未使用的VIP权益将按剩余有效期折算处理。',
  '五、开通VIP即视为您已阅读并同意本协议全部内容。如有疑问，请联系平台客服。',
]

const pad = (n) => String(n).padStart(2, '0')

function tick() {
  const total = Math.max(havetime.value - 1, 0)
  havetime.value = total
  const h = Math.floor((total % 86400) / 3600)
  const m = Math.floor((total % 3600) / 60)
  timeData.value = {
    days: pad(Math.floor(total / 86400)),
    hours: pad(h),
    minutes: m,
    seconds: total % 60,
  }
}

/** 协议未下滑到底部时禁止勾选，与原站 isDisabled 行为一致 */
function toggleAgree() {
  if (!scrolledToBottom.value) {
    uni.showToast({ title: '请下滑协议完成阅读', icon: 'none' })
    return
  }
  agreed.value = !agreed.value
}

function openVip() {
  if (!agreed.value) {
    uni.showToast({ title: '请先阅读并同意协议', icon: 'none' })
    return
  }
  show.value = false
  uni.showToast({ title: '原站开通VIP需人机验证', icon: 'none' })
}

onMounted(async () => {
  const data = await fetchUserInfo()
  if (data) userInfo.value = data
  // 原站 havetime 由 vip_time 倒推；本项目无后端，取一个展示态剩余秒数
  havetime.value = 3 * 86400 + 5 * 3600 + 42 * 60 + 18
  tick()
  timer = setInterval(tick, 1000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<style scoped>
@import '@/styles/atomic.css';

/* 与原站 container-1 一致：黑底 */
.vip-page {
  position: relative;
  min-height: 1625rpx;
  background-color: #000;
  background-size: 750rpx auto;
  background-repeat: no-repeat;
  background-position: top center;
  padding-bottom: 200rpx;
  box-sizing: border-box;
}
.vip-logo {
  width: 112rpx;
  height: 134rpx;
  margin-top: 100rpx;
  margin-bottom: 100rpx;
}
.title-wrap {
  position: relative;
  width: 100%;
  height: 32rpx;
}
.title-img {
  position: absolute;
  top: -40rpx;
  left: calc(50% - 132rpx);
  width: 271rpx;
  height: 72rpx;
  z-index: 2;
}
/* 倒计时卡：vip-bg-kt 为 680x287 卡片底图 */
.vip-kt {
  width: 680rpx;
  height: 288rpx;
  background: url('/static/vip/vip-bg-kt.png') no-repeat;
  background-size: 100% 100%;
  color: #fff;
}
.kt-title {
  width: 424rpx;
  height: 90rpx;
  margin-bottom: 34rpx;
}
.time {
  display: flex;
  align-items: center;
}
.time .time__item {
  width: 80rpx;
  height: 80rpx;
  border-radius: 4px;
  background-color: #fff;
  color: #cf8b05;
  font-size: 30rpx;
  text-align: center;
  line-height: 80rpx;
}
.time .time__doc {
  color: #a4a4a4;
  font-size: 30rpx;
  margin: 0 14rpx;
}
.vip-title2 {
  width: 314rpx;
  height: 48rpx;
}
.vip-icons {
  width: 680rpx;
}
/* 底部固定开通条 */
.footer {
  position: fixed;
  left: 0;
  bottom: 0;
  width: 100%;
  height: 172rpx;
  align-items: center;
  justify-content: center;
}
.footer .btn {
  width: 700rpx;
  height: 122rpx;
  background: url('/static/vip/btn.png') no-repeat;
  background-size: 100% 100%;
}
</style>
