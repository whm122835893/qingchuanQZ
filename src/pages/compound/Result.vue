<template>
  <view class="result-page">
    <PageNavbar title="合成结果" />

    <!-- 结果礼盒（原站 result_box.png 已下线，用 CSS 绘制礼盒） -->
    <view class="box-wrap">
      <view class="box">
        <view class="box-lid"></view>
        <view class="box-body">
          <text class="MiSans-Demibold box-text">合成成功</text>
        </view>
        <view class="box-ribbon"></view>
      </view>
    </view>

    <!-- 结果清单 -->
    <view class="content">
      <view v-for="(r, i) in result" :key="i" class="card">
        <text class="MiSans-Demibold card-name">{{ r.name }}</text>
        <view class="card-value">
          <template v-if="r.type === 'C'">
            <text class="MiSans-Regular card-text"> # </text>
            <text class="MiSans-Demibold card-strong">{{ r.user_collection_code }}</text>
            <text class="MiSans-Regular card-text"> /{{ r.total_num }} </text>
          </template>
          <template v-else-if="r.type === 'M'">
            <text class="MiSans-Regular card-text"> X </text>
            <text class="MiSans-Demibold card-strong">{{ r.number }}</text>
          </template>
          <template v-else>
            <text class="MiSans-Regular card-text"> X </text>
            <text class="MiSans-Demibold card-strong">{{ r.single_quantity }}</text>
            <text class="MiSans-Regular card-text"> {{ r.name }}</text>
          </template>
        </view>
      </view>
    </view>

    <!-- 底部 -->
    <view class="footer">
      <view class="btns">
        <view class="btn plain" @click="goMyCollection">
          <text class="MiSans-Medium btn-text">我的藏品</text>
        </view>
        <view class="btn" @click="back">
          <text class="MiSans-Medium btn-text">再合一次</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
/**
 * 原站 compound/result —— 合成结果
 * 结构：导航 + 礼盒图 + 结果卡列表（藏品 C / 材料 M / 龙晶 S 三种类型）+ 底部「我的藏品 / 再合一次」。
 * 原站礼盒图 /static/compound/result_box.png 已 404，改用等尺寸 CSS 绘制。
 */
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import PageNavbar from '@/components/PageNavbar.vue'
import { fetchCompoundResult } from '@/utils/api'

defineOptions({ name: 'CompoundResult' })

const router = useRouter()
const result = ref([])

onMounted(async () => {
  const data = await fetchCompoundResult()
  result.value = (data && data.result) || []
})

function goMyCollection() {
  router.push('/pages/myCollection/myCollection')
}
function back() {
  if (window.history.length > 1) router.back()
  else router.push('/pages/compound/compound')
}
</script>

<style scoped>
@import '@/styles/atomic.css';

.result-page {
  min-height: 100vh;
  background: #f6f6f6;
  padding-bottom: 200rpx;
  box-sizing: border-box;
}

/* CSS 绘制的礼盒（原站图片已下线） */
.box-wrap {
  padding-top: 40rpx;
  display: flex;
  justify-content: center;
}
.box {
  position: relative;
  width: 400rpx;
  height: 300rpx;
}
.box-lid {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 420rpx;
  height: 90rpx;
  background: #f5a623;
  border-radius: 12rpx;
}
.box-body {
  position: absolute;
  top: 78rpx;
  left: 50%;
  transform: translateX(-50%);
  width: 360rpx;
  height: 210rpx;
  background: #e08a12;
  border-radius: 12rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.box-ribbon {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 44rpx;
  height: 290rpx;
  background: #d94f4f;
}
.box-text {
  position: relative;
  z-index: 2;
  font-size: 32rpx;
  color: #fff;
}

.content {
  width: 100%;
  margin-top: 40rpx;
  padding: 24rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.card {
  width: 100%;
  margin-top: 24rpx;
  padding: 18rpx 24rpx;
  background: #fff;
  border-radius: 12rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-sizing: border-box;
}
.card-name {
  font-size: 18rpx;
  color: #1a2438;
  max-width: 40%;
}
.card-value {
  display: flex;
  align-items: center;
  max-width: 58%;
}
.card-text {
  font-size: 18rpx;
  color: #1a2438;
}
.card-strong {
  font-size: 20rpx;
  color: #1a2438;
}

.footer {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 0 30rpx calc(20rpx + env(safe-area-inset-bottom));
  background: #f6f6f6;
}
.btns {
  display: flex;
  align-items: center;
}
.btn {
  flex: 1;
  height: 69rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #6aa27b;
  border-radius: 37.5rpx;
}
.btn.plain {
  margin-right: 12rpx;
  background: #fff;
  border: 1rpx solid #6aa27b;
}
.btn-text {
  font-size: 28rpx;
  color: #fff;
}
.btn.plain .btn-text {
  color: #6aa27b;
}
</style>