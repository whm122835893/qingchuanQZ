<template>
  <view class="box-index-page">
    <PageNavbar title="我的盲盒" />

    <!-- 中部：盲盒图 + 数量 + 一键开启 -->
    <view class="content">
      <view class="con">
        <view class="listimg">
          <img class="l-img" :src="ossImg(info.listimg || info.main_image)" mode="aspectFit" />
        </view>
        <view class="num-view">
          <text class="MiSans-Medium num-text">共有 {{ info.num || 0 }} 个</text>
        </view>
        <view class="open-btn" @click="openAll">
          <text class="MiSans-Medium open-text">一键开启</text>
        </view>
        <text class="MiSans-Regular tip">一次最多打开10个盲盒</text>
      </view>
    </view>

    <!-- 底部：立即寄售 / 逐个拆开 -->
    <view class="bg-btns">
      <view class="btn-row">
        <view class="btn plain" @click="goConsign">
          <text class="MiSans-Medium btn-text">立即寄售</text>
        </view>
        <view class="btn" @click="takeApart">
          <text class="MiSans-Medium btn-text">逐个拆开</text>
        </view>
      </view>
    </view>

    </view>
</template>

<script setup>
/**
 * 原站 blindBox/index —— 我的盲盒
 * 结构：导航 + 中部盲盒图/数量/一键开启 + 底部「立即寄售 / 逐个拆开」。
 * 开盒接线照抄源站（pages-blindBox-index 模块 dba4）：
 *   一键开启 → openBoxs(openid) → 存 blindBoxResultList → redirect result（多格）
 *   逐个拆开 → openBox(openid)  → 存 blindBoxResult    → redirect result2（单格）
 * openid 取 myBox 响应的 user_collection_id（源站 storage blindBoxInfo.blindBoxId 的等价字段）。
 */
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import PageNavbar from '@/components/PageNavbar.vue'
import { fetchBlindBoxMyBox, fetchOpenBox, fetchOpenBoxs } from '@/utils/api'
import { ossImg } from '@/api'

defineOptions({ name: 'BlindBoxIndex' })

const router = useRouter()
const info = ref({})

onMounted(async () => {
  info.value = await fetchBlindBoxMyBox()
})

/** 源站 open()：$u.throttle 之外先判 num，openBoxs 后存 storage 跳多格结果页 */
async function openAll() {
  if (!info.value.num) return
  const openid = info.value.user_collection_id || info.value.blindBoxId
  if (!openid) return
  uni.showLoading({ title: '请求中...' })
  try {
    const res = await fetchOpenBoxs({ openid })
    localStorage.setItem('blindBoxResultList', JSON.stringify((res && res.data) || []))
    router.push('/pages/blindBox/result')
  } catch (e) {
    /* 源站 catch 为空 */
  } finally {
    uni.hideLoading()
  }
}

/** 源站 takeApart()：openBox 后存 storage 跳单格结果页 */
async function takeApart() {
  if (!info.value.num) return
  const openid = info.value.user_collection_id || info.value.blindBoxId
  if (!openid) return
  uni.showLoading({ title: '请求中...' })
  try {
    const res = await fetchOpenBox({ openid })
    localStorage.setItem('blindBoxResult', JSON.stringify((res && res.data) || {}))
    router.push('/pages/blindBox/result2')
  } catch (e) {
    /* 源站 catch 为空 */
  } finally {
    uni.hideLoading()
  }
}

function goConsign() {
  router.push({ path: '/pages/consignments/consignments', query: { id: info.value.id, pageType: 1 } })
}
</script>

<style scoped>
@import '@/styles/atomic.css';

.box-index-page {
  position: relative;
  min-height: 100vh;
  background: #f4f5f8;
  padding-bottom: 200rpx;
  box-sizing: border-box;
}

.content {
  position: relative;
  height: 900rpx;
}
.con {
  position: absolute;
  top: 240rpx;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.listimg {
  width: 450rpx;
  height: 400rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.l-img {
  width: 400rpx;
  height: 400rpx;
}
.num-view {
  margin-top: 24rpx;
}
.num-text {
  font-size: 30rpx;
  color: #333;
}
.open-btn {
  margin-top: 32rpx;
  width: 375rpx;
  height: 66rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #e26f1b;
  border-radius: 33rpx;
}
.open-text {
  font-size: 30rpx;
  color: #fff;
}
.tip {
  margin-top: 16rpx;
  font-size: 24rpx;
  color: #666;
}

.bg-btns {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  background: #fff;
}
.btn-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 40rpx;
}
.btn {
  width: 240rpx;
  height: 69rpx;
  line-height: 69rpx;
  text-align: center;
  background: #e26f1b;
  border-radius: 37rpx;
}
.btn.plain {
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