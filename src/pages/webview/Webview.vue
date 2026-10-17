<template>
  <view class="webview-page">
    <PageNavbar :title="title" />
    <!--
      通用 webview 容器。原站为 <web-view :src="url"> 加载远程页面；
      本项目为独立复刻，禁止外链，src 只允许站内 hash 路由（白名单校验）。
    -->
    <iframe v-if="safeSrc" class="webview-frame" :src="safeSrc" frameborder="0"></iframe>
    <view v-else class="fallback flex flex-dir-col flex-ai-center">
      <img class="fallback-img" :src="asset('static/empty/search1-empty.png')" mode="widthFix" />
      <text class="MiSans-Regular fallback-text">{{ fallbackText }}</text>
    </view>
  </view>
</template>

<script setup>
/**
 * 原站 webview/webview —— 通用 webview 容器
 * 原站 src 来自路由参数（远程协议页 / 活动页）。
 * 本项目运行时不访问任何外部域名：src 仅接受站内 hash 路由（/#/pages/xxx），
 * 其余取值按站内已复刻页映射；无法映射时给出空状态提示。
 */
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import PageNavbar from '@/components/PageNavbar.vue'
import { asset } from '@/utils/api'

defineOptions({ name: 'WebviewPage' })

const route = useRoute()

/** 原站远程地址 → 站内已复刻页面的映射表 */
const LOCAL_MAP = {
  '/index/index/usageterms': '/#/pages/rules/rules?type=trade&title=用户服务协议',
  '/index/index/agreement': '/#/pages/rules/rules?type=privacy&title=隐私政策',
  '/order/consign/consignRule': '/#/pages/rules/rules?type=consign&title=寄售规则',
  '/wallet/withdraw/rule': '/#/pages/rules/rules?type=withdraw&title=提现规则',
  '/activity/rule': '/#/pages/rules/rules?type=activity&title=活动规则',
}

const title = computed(() => route.query.title || '详情')

const safeSrc = computed(() => {
  const raw = String(route.query.url || '')
  if (!raw) return ''
  if (LOCAL_MAP[raw]) return LOCAL_MAP[raw]
  // 已是站内 hash 路由则直接使用
  if (raw.startsWith('/#/pages/')) return raw
  return ''
})

const fallbackText = computed(() =>
  route.query.url ? '该页面暂未复刻，请从站内入口进入' : '未指定页面地址'
)
</script>

<style scoped>
@import '@/styles/atomic.css';

.webview-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #fff;
}
.webview-frame {
  flex: 1;
  width: 100%;
  border: none;
}
.fallback {
  padding-top: 160rpx;
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