<template>
  <view class="invite-detail-page">
    <PageNavbar title="被邀请人清单" />

    <view class="table-head flex">
      <text class="nickName">昵称</text>
      <text class="join_time">加入时间</text>
      <text class="index_pay_time">首次交易日期</text>
      <text class="all_pay_price">总交易金额</text>
      <text class="month_pay_price">本自然月交易金额</text>
    </view>

    <view v-for="u in list" :key="u.id" class="table-row flex">
      <text class="nickName text-overflow">{{ u.nickname }}</text>
      <text class="join_time">{{ u.jointime }}</text>
      <text class="index_pay_time">{{ u.first_transaction_time }}</text>
      <text class="all_pay_price">{{ u.user_transaction }}</text>
      <text class="month_pay_price">{{ u.month_transaction }}</text>
    </view>

    <view v-if="!list.length" class="empty-box">
      <text class="MiSans-Regular empty-text">暂无被邀请人</text>
    </view>
  </view>
</template>

<script setup>
/**
 * 原站 rebate/rebateInviteDetail —— 被邀请人清单
 * 五列固定宽度横向排布：昵称 / 加入时间 / 首次交易日期 / 总交易金额 / 本自然月交易金额。
 */
import { onMounted, ref } from 'vue'
import PageNavbar from '@/components/PageNavbar.vue'
import { fetchRebateInviteDetail } from '@/utils/api'

defineOptions({ name: 'RebateInviteDetailPage' })

const list = ref([])

onMounted(async () => {
  list.value = await fetchRebateInviteDetail()
})
</script>

<style scoped>
@import '@/styles/atomic.css';

.invite-detail-page {
  min-height: 100vh;
  background: #f4f6fa;
  padding: 0 20rpx 60rpx;
  box-sizing: border-box;
}
.table-head,
.table-row {
  align-items: center;
  padding: 0 8rpx;
}
.table-head {
  height: 80rpx;
}
.table-row {
  min-height: 80rpx;
  margin-bottom: 8rpx;
  background: #fff;
  border-radius: 8rpx;
  font-size: 22rpx;
  color: #1a2438;
}
.nickName {
  width: 150rpx;
  flex-shrink: 0;
}
.join_time {
  width: 140rpx;
  flex-shrink: 0;
}
.index_pay_time {
  width: 160rpx;
  flex-shrink: 0;
}
.all_pay_price {
  width: 150rpx;
  flex-shrink: 0;
  text-align: right;
}
.month_pay_price {
  width: 180rpx;
  flex-shrink: 0;
  text-align: right;
}
.table-head text {
  font-size: 22rpx;
  color: #999;
}
.empty-box {
  padding: 120rpx 0;
  text-align: center;
}
.empty-text {
  font-size: 26rpx;
  color: #999;
}
</style>