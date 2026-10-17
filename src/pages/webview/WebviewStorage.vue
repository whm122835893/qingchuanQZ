<template>
  <view class="storage-page">
    <!--
      原站 webview/webview-storage 是与 webview 配套的本地存储说明页，
      结构同样是一个 <web-view>（本页无导航栏）。
      与 Webview.vue 一致：src 只允许站内 hash 路由，禁止任何外部域名。
    -->
    <iframe v-if="safeSrc" class="storage-frame" :src="safeSrc" frameborder="0"></iframe>
    <view v-else class="fallback flex flex-dir-col flex-ai-center">
      <img class="fallback-img" :src="asset('static/empty/search1-empty.png')" mode="widthFix" />
      <text class="MiSans-Regular fallback-text">{{ fallbackText }}</text>
    </view>
  </view>
</template>

<script setup>
/**
 * 原站 webview/webview-storage —— webview 存储页
 * 原站为 <web-view :src="src">（uni-app 各端 webview 的本地存储载体），
 * 路由 query.src 指向远程说明页；本项目改为加载站内已复刻的隐私/存储说明页。
 */
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { asset } from '@/utils/api'

defineOptions({ name: 'WebviewStoragePage' })

const route = useRoute()

/** 原站地址 → 站内页面映射（与 Webview.vue 同一白名单策略） */
const LOCAL_MAP = {
  '/index/index/agreement': '/#/pages/rules/rules?type=privacy&title=隐私政策',
  '/index/index/usageterms': '/#/pages/rules/rules?type=trade&title=用户服务协议',
}

const safeSrc = computed(() => {
  const raw = String(route.query.src || route.query.url || '')
  if (!raw) return LOCAL_MAP['/index/index/agreement']
  if (LOCAL_MAP[raw]) return LOCAL_MAP[raw]
  if (raw.startsWith('/#/pages/')) return raw
  return ''
})

const fallbackText = computed(() => '该页面暂未复刻，请从站内入口进入')
</script>

<style scoped>
@import '@/styles/atomic.css';

.storage-page {
  width: 100%;
  height: 100vh;
  background: #fff;
}
.storage-frame {
  width: 100%;
  height: 100%;
  border: none;
}
.fallback {
  padding-top: 200rpx;
}
.fallback-img {
  width: 500rpx;
}
.fallback-text {
  margin-top: 32rpx;
  font-size: 26rpx;
  color: #999;
}
</style>