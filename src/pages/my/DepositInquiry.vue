<template>
  <view class="deposit-page page-bg" id="dep-uiry">
    <PageNavbar title="充值查询" />

    <view class="back-color-fff mlr-12 mt-12 pa-12 query-card">
      <view>
        <text class="MiSans-Regular field-label">请输入区块链信息</text>
        <textarea
          v-model="value1"
          class="MiSans-Regular input-area mt-10" placeholder="可输入合约地址"
          placeholder-class="ph"
        />
      </view>

      <view class="mt-10">
        <text class="MiSans-Regular mb-10 field-label">查询结果</text>
        <view class="result-box">
          <text v-if="!result" class="MiSans-Regular result-empty">这里显示查询结果</text>
          <text v-else class="MiSans-Regular result-text">{{ result }}</text>
        </view>
      </view>

      <view class="query-btn flex flex-ai-center flex-js-center mt-30" @click="query">
        <text class="MiSans-Medium query-text">查询</text>
      </view>
    </view>
  </view>
</template>

<script setup>
/**
 * 原站 my/depositinquiry —— 充值/区块链信息查询
 * 原站为两段 u--textarea（输入合约地址 + 回显查询结果），
 * 此处保留输入区与结果区，并按原站「查询结果」标题下的空态展示占位文案。
 */
import { ref } from 'vue'
import PageNavbar from '@/components/PageNavbar.vue'

defineOptions({ name: 'DepositInquiryPage' })

const value1 = ref('')
const result = ref('')

function query() {
  if (!value1.value.trim()) {
    uni.showToast({ title: '请输入合约地址', icon: 'none' })
    return
  }
  // 原站查询请求走链上节点，此处无外网依赖，仅给出与原站一致的空结果语义
  result.value = ''
  uni.showToast({ title: '原站查询需链上节点连接', icon: 'none' })
}
</script>

<style scoped>
@import '@/styles/atomic.css';

.deposit-page {
  min-height: 100vh;
  background: #f4f6fa;
  box-sizing: border-box;
}
.query-card {
  height: 100vh;
  border-radius: 16rpx;
  box-sizing: border-box;
}
.field-label {
  display: block;
  font-size: 28rpx;
  color: #000;
}
.input-area {
  display: block;
  width: 100%;
  height: 200rpx;
  margin-top: 20rpx;
  padding: 20rpx;
  background: #f5f6fa;
  border-radius: 12rpx;
  font-size: 26rpx;
  color: #333;
  box-sizing: border-box;
}
.ph {
  color: #bbb;
  font-size: 26rpx;
}
.result-box {
  margin-top: 20rpx;
  min-height: 200rpx;
  padding: 20rpx;
  background: #f5f6fa;
  border-radius: 12rpx;
  box-sizing: border-box;
}
.result-empty {
  font-size: 26rpx;
  color: #bbb;
}
.result-text {
  font-size: 26rpx;
  color: #333;
  line-height: 1.8;
  word-break: break-all;
}
.query-btn {
  height: 92rpx;
  background: #7ac386;
  border-radius: 46rpx;
}
.query-text {
  font-size: 30rpx;
  color: #fff;
}
</style>
