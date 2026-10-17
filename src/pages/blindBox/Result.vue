<template>
  <view class="result-page">
    <PageNavbar title="盲盒结果" />

    <!-- 多格开盒结果 -->
    <view class="content">
      <view v-for="(c, i) in list" :key="i" class="item">
        <img class="thumb" :src="ossImg(c.listimg)" mode="aspectFill" />
        <view class="info">
          <text class="MiSans-Medium name text-overflow">{{ c.name }}</text>
          <view class="code-row">
            <text class="MiSans-Regular code-label">藏品编号:</text>
            <text class="MiSans-Medium code-value">#{{ c.collection_code }}</text>
          </view>
        </view>
        <img class="rarity" :src="ossImg(c.rarity_icon)" mode="aspectFit" />
      </view>

      <view class="hint">
        <text class="MiSans-Regular hint-text">商品陆续从链上转入个人中心，如有延迟请耐心等待</text>
      </view>
    </view>

    <!-- 底部 -->
    <view class="footer">
      <view class="btns">
        <view class="btn plain" @click="goMyCollection">
          <text class="MiSans-Medium btn-text">我的数字藏品</text>
        </view>
        <view class="btn" @click="goIndex">
          <text class="MiSans-Medium btn-text">继续购买</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
/**
 * 原站 blindBox/result —— 盲盒结果（多格）
 * 结构：导航 + 结果列表（缩略图 + 名称 + 藏品编号 + 稀有度图标）+ 提示 + 底部双按钮。
 */
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import PageNavbar from '@/components/PageNavbar.vue'
import { fetchBlindBoxResult } from '@/utils/api'
import { ossImg } from '@/api'

defineOptions({ name: 'BlindBoxResult' })

const router = useRouter()
const list = ref([])

onMounted(async () => {
  list.value = await fetchBlindBoxResult()
})

function goMyCollection() {
  if (window.history.length > 1) router.back()
  else router.push('/pages/myCollection/myCollection')
}
function goIndex() {
  router.push('/pages/index/index')
}
</script>

<style scoped>
@import '@/styles/atomic.css';

.result-page {
  min-height: 100vh;
  background: #f4f5f8;
  padding-bottom: 200rpx;
  box-sizing: border-box;
}

.content {
  padding: 24rpx 32rpx;
}
.item {
  display: flex;
  align-items: center;
  padding: 24rpx;
  margin-bottom: 20rpx;
  background: #fff;
  border-radius: 12rpx;
}
.thumb {
  width: 118rpx;
  height: 118rpx;
  border-radius: 8rpx;
  background: #f0f1f4;
  flex-shrink: 0;
}
.info {
  flex: 1;
  min-width: 0;
  margin: 0 20rpx;
  display: flex;
  flex-direction: column;
}
.name {
  font-size: 28rpx;
  color: #1a2438;
}
.code-row {
  display: flex;
  align-items: center;
  margin-top: 16rpx;
}
.code-label {
  font-size: 24rpx;
  color: #1a2438;
}
.code-value {
  margin-left: 8rpx;
  font-size: 24rpx;
  color: #999;
}
.rarity {
  width: 118rpx;
  height: 110rpx;
  flex-shrink: 0;
}

.hint {
  padding: 24rpx 0;
}
.hint-text {
  font-size: 22rpx;
  color: #999;
}

.footer {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  background: #fff;
}
.btns {
  display: flex;
  align-items: center;
  padding: 20rpx 40rpx;
}
.btn {
  flex: 1;
  height: 76rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #e26f1b;
  border-radius: 38rpx;
}
.btn.plain {
  margin-right: 20rpx;
  background: #fff;
  border: 1rpx solid #e26f1b;
}
.btn-text {
  font-size: 28rpx;
  color: #fff;
}
.btn.plain .btn-text {
  color: #e26f1b;
}
</style>