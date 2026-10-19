<template>
  <view class="result2-page">
    <PageNavbar title="盲盒结果" />

    <!-- 单格结果（居中） -->
    <view class="content">
      <img class="rarity" :src="ossImg(info.rarity_icon)" mode="aspectFit" />
      <img class="main-img" :src="ossImg(info.main_image || info.listimg)" mode="aspectFit" />
      <text class="MiSans-Demibold name text-overflow">{{ info.name }}</text>
      <view class="code-row">
        <text class="MiSans-Regular code-label">藏品编号：</text>
        <text class="MiSans-Medium code-value">#{{ info.collection_code }}</text>
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
 * 原站 blindBox/result2 —— 盲盒结果（单格）
 * 结构：导航 + 单个结果居中展示（稀有度图标 + 藏品图 + 名称 + 藏品编号）+ 底部双按钮。
 * 数据来源照抄源站：index 页逐个拆开后 setStorageSync('blindBoxResult') 再 redirect 到本页；
 * 直接访问本页（无 storage）时按路由 query.openid 调 openBox 拉取。
 */
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PageNavbar from '@/components/PageNavbar.vue'
import { fetchBlindBoxResultOne, fetchOpenBox } from '@/utils/api'
import { ossImg } from '@/api'

defineOptions({ name: 'BlindBoxResult2' })

const router = useRouter()
const route = useRoute()
const info = ref({})

onMounted(async () => {
  const raw = localStorage.getItem('blindBoxResult')
  if (raw) {
    try {
      const parsed = JSON.parse(raw)
      if (parsed && parsed.id) {
        info.value = parsed
        return
      }
    } catch (e) {
      /* 落空则走接口 */
    }
  }
  const openid = route.query.openid
  if (openid) {
    const res = await fetchOpenBox({ openid })
    info.value = (res && res.data) || {}
    return
  }
  info.value = await fetchBlindBoxResultOne()
})

function goMyCollection() {
  router.push('/pages/myCollection/myCollection')
}
function goIndex() {
  router.push('/pages/index/index')
}
</script>

<style scoped>
@import '@/styles/atomic.css';

.result2-page {
  min-height: 100vh;
  background: #f4f5f8;
  padding-bottom: 200rpx;
  box-sizing: border-box;
}

.content {
  padding: 80rpx 48rpx 40rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.rarity {
  width: 160rpx;
  height: 118rpx;
}
.main-img {
  width: 400rpx;
  height: 400rpx;
  margin-top: 32rpx;
}
.name {
  margin-top: 32rpx;
  font-size: 32rpx;
  color: #1a2438;
  text-align: center;
}
.code-row {
  display: flex;
  align-items: center;
  margin-top: 16rpx;
}
.code-label {
  font-size: 24rpx;
  color: #999;
}
.code-value {
  font-size: 24rpx;
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