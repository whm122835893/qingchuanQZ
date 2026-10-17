<template>
  <view class="container wallet-page">
    <!-- 顶部导航（沉浸式，青绿底） -->
    <view class="navbar">
      <view class="navbar-left" @click="goBack">
        <img class="back-icon" :src="asset('static/common/back_white.png')" mode="widthFix" />
      </view>
      <text class="navbar-title">我的钱包</text>
    </view>

    <view class="navbar-holder"></view>

    <!-- 提示条 -->
    <view class="notice-bar flex flex-ai-center flex-js-center">
      <text class="MiSans-Regular notice-text">
        <text class="notice-star">*</text> 所有资金均由第三方支付机构进行支付、结算
      </text>
    </view>

    <!-- 钱包卡片 -->
    <view class="card-list">
      <view
        v-for="(c, i) in cards"
        :key="i"
        class="wallet-card"
        @click="goCard(c)"
      >
        <view class="card-top flex flex-ai-center" :style="{ background: c.topBg }">
          <img class="card-icon" :src="c.icon" mode="widthFix" />
          <view class="flex flex-dir-col">
            <text class="MiSans-Demibold card-title">{{ c.title }}</text>
            <text class="MiSans-Regular card-sub">{{ c.sub }}</text>
          </view>
        </view>
        <view class="card-bottom flex flex-ai-center flex-js-sb" :style="{ background: c.bottomBg }">
          <text class="MiSans-Regular card-bal">余额</text>
          <img class="card-arrow" :src="asset('static/wallet/arrow_right.png')" mode="widthFix" />
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { useRouter } from 'vue-router'

defineOptions({ name: 'WalletPage' })

const router = useRouter()
const asset = (p) => import.meta.env.BASE_URL + p.replace(/^\//, '')

/** 三张钱包卡片，配色与原站一致 */
const cards = [
  {
    title: '汇付天下',
    sub: '汇付天下',
    icon: asset('static/wallet/huifu.png'),
    topBg: '#f0e8f8',
    bottomBg: '#7d6aaa',
    path: '',
  },
  {
    title: '易宝账户 2.0',
    sub: '免费开通，提现免费',
    icon: asset('static/wallet/yibao.png'),
    topBg: '#e4f0f6',
    bottomBg: '#4a8eb0',
    path: '',
  },
  {
    title: '易宝钱包 2.0',
    sub: '累计提现 D+1到账',
    icon: asset('static/wallet/yibao.png'),
    topBg: '#eef3e8',
    bottomBg: '#6b9a4a',
    path: '',
  },
]

function goBack() {
  if (window.history.length > 1) router.back()
  else router.push('/pages/my/my')
}

function goCard(c) {
  // 原站各钱包渠道的跳转在交易链路后续阶段实现
}
</script>

<style scoped>
.wallet-page {
  display: block;
  width: 100%;
  box-sizing: border-box;
  padding: 0 0 41px;
  min-height: 100vh;
  background: #e8efe6;
}
/* 顶部导航：沉浸式固定，高 44 */
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  height: 44px;
  display: flex;
  align-items: center;
}
.navbar-left {
  width: 34px;
  height: 44px;
  padding: 0 13px;
}
.back-icon {
  width: 8px;
  height: 14px;
}
.navbar-title {
  position: absolute;
  left: 91px;
  right: 91px;
  text-align: center;
  font-size: 17px;
  line-height: 23px;
  color: #fff;
}
.navbar-holder {
  height: 44px;
}
/* 提示条：mt146 h33 */
.notice-bar {
  height: 33px;
  margin-top: 146px;
  padding: 0 12px;
  background: #4a6b55;
}
.notice-text {
  font-size: 12px;
  line-height: 14px;
  color: #fff;
}
.notice-star {
  color: #fff;
}
/* 卡片列表：padding 18 18 0 */
.card-list {
  padding: 18px 18px 0;
}
.wallet-card {
  height: 117px;
  margin-bottom: 14px;
  border-radius: 12px;
  overflow: hidden;
}
.card-top {
  height: 72px;
  padding: 0 14px;
}
.card-icon {
  width: 37px;
  height: 37px;
  background: #fff;
  border-radius: 8px;
  flex-shrink: 0;
}
.card-title {
  margin-left: 10px;
  font-size: 16px;
  line-height: 19.5px;
  color: #1a2438;
}
.card-sub {
  margin-top: 4px;
  font-size: 12px;
  line-height: 14.3px;
  color: #999;
}
.card-bottom {
  height: 45px;
  padding: 0 16px;
}
.card-bal {
  font-size: 13px;
  color: #fff;
}
.card-arrow {
  width: 7px;
  height: 14px;
}
</style>