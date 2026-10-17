<template>
  <view class="container container my-page">
    <view class="my-body">
      <!-- 顶栏：菜单 / 扫码 / 消息 -->
      <view class="flex flex-ai-center flex-js-sb top-bar">
        <img class="top-icon" :src="asset('static/my/more_left.png')" mode="widthFix" @click="goDrawers" />
        <view class="flex flex-ai-center">
          <img class="top-icon" :src="asset('static/my/scan.png')" mode="widthFix" @click="goScan" />
          <img class="top-icon" :src="asset('static/my/msg.png')" mode="widthFix" @click="goMsg" />
        </view>
      </view>

      <!-- 资产 / 收益 -->
      <view class="asset-box">
        <text class="MiSans-Bold asset-title">资产/收益</text>

        <view class="flex flex-js-sb asset-row">
          <view class="flex flex-dir-col flex-1">
            <view class="flex flex-ai-center">
              <text class="MiSans-Regular asset-label">总资产预估(元)</text>
              <view class="asset-eye flex flex-ai-center flex-js-center" @click="toggleEye">
                <img class="eye-icon" :src="eyeIcon" mode="widthFix" />
              </view>
            </view>
            <text class="MiSans-Bold asset-value">{{ showEye ? '--' : assetText }}</text>
          </view>
        </view>

        <!-- 图例 -->
        <view class="legend-bar flex flex-ai-center">
          <view class="flex flex-ai-center">
            <view class="legend-dot legend-dot-a"></view>
            <text class="MiSans-Regular legend-text">总资产累计变化</text>
          </view>
          <view class="flex flex-ai-center">
            <view class="legend-dot legend-dot-b"></view>
            <view class="legend-dot legend-dot-c"></view>
            <text class="MiSans-Regular legend-text">每日收益正负</text>
          </view>
        </view>
      </view>

      <!-- 快捷菜单 5 项 -->
      <view class="flex flex-js-sb menu-row">
        <view
          v-for="(m, i) in menus"
          :key="i"
          class="flex flex-dir-col flex-ai-center menu-item"
          @click="goMenu(m)"
        >
          <img class="menu-icon" :src="m.icon" mode="widthFix" />
          <text class="MiSans-Regular menu-label">{{ m.text }}</text>
        </view>
      </view>

      <!-- 藏品分类 -->
      <scroll-view scroll-x  class="cate-scroll" :show-scrollbar="false">
        <view class="cate-list flex">
          <view
            v-for="(c, i) in cates"
            :key="i"
            class="cate-item"
            :class="{ active: currentCate === i }"
            @click="currentCate = i"
          >
            <text class="MiSans-Medium cate-text">{{ c }}</text>
            <view v-if="currentCate === i" class="cate-line"></view>
          </view>
        </view>
      </scroll-view>

      <!-- 搜索 -->
      <view class="search-bar flex flex-ai-center" @click="goSearch">
        <img class="search-icon" :src="asset('static/my/search.png')" mode="widthFix" />
        <text class="MiSans-Regular flex-1 search-ph">请输入关键词</text>
      </view>

      <!-- 藏品列表（原站当前账号该分类无数据） -->
      <view class="goods-box">
        <view class="flex flex-dir-col flex-ai-center empty-box">
          <img class="empty-img" :src="asset('static/empty/market-empty.png')" mode="widthFix" />
        </view>
      </view>
    </view>

    <AppTabBar :value="4" />
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppTabBar from '@/components/AppTabBar.vue'

defineOptions({ name: 'MyPage' })

const router = useRouter()
const asset = (p) => import.meta.env.BASE_URL + p.replace(/^\//, '')

const showEye = ref(false)

// 总资产预估：源站无持仓时显示 0
const totalAsset = ref(0)
const assetText = computed(() => String(totalAsset.value))
const currentCate = ref(4)

const eyeIcon = ref(asset('static/my/search.png'))

const menus = [
  { text: '我的订单', icon: 'static/my/order.png', path: '/pages/order/list' },
  { text: '我的钱包', icon: 'static/my/wallet.png', path: '/pages/wallet/wallet' },
  { text: '邀请好友', icon: 'static/my/invite.png', path: '/pages/invitation/invitation' },
  { text: '在线客服', icon: 'static/my/kefu.png', path: '' },
  { text: '分享App', icon: 'static/my/share.png', path: '/pages/index/downloadApp' }
]

const cates = ['绘画', '卡牌', '建模', '卡券', '藏品', '盲盒', '已售', '元素']

function toggleEye() { showEye.value = !showEye.value }
function goDrawers() { /* 原站侧边抽屉在后续阶段实现 */ }
function goScan() { /* 原站扫码在后续阶段实现 */ }
function goMsg() { router.push('/pages/community/community') }
function goSearch() { router.push('/pages/market/search') }
function goMenu(m) { if (m.path) router.push(m.path) }
</script>

<style scoped>

.my-page {
  display: block;
  width: 100%;
  box-sizing: border-box;
  padding-left: 0;
  padding-right: 0;
}

.my-page {
  min-height: 100vh;
  /* 底部固定 tabbar 高 160rpx，页面必须留出同等底部内边距，否则最后一行内容被遮挡 */
  padding-bottom: 160rpx;
  background: #fff url('/static/my/my_bg.png') no-repeat 50% 0 / 100% auto;
}
.my-body {
  min-height: 658px;
}
/* 顶栏：y74 h26 */
.top-bar {
  margin-top: 74px;
  height: 26px;
  padding: 6px 14px 0;
}
.top-icon {
  width: 20px;
  height: 20px;
}
.top-icon + .top-icon {
  margin-left: 14px;
}
/* 资产区 */
/* 源站量测：顶栏图标底 y100 → 「资产/收益」标题 y114，间距 14px */
.asset-box {
  margin-top: 14px;
}
.asset-title {
  display: block;
  margin-left: 14px;
  font-size: 20px;
  line-height: 27px;
  color: #1a2438;
}
.asset-row {
  margin-top: 0;
  height: 56px;
  margin: 14px 0 0;
  padding: 0 14px;
}
.asset-label {
  font-size: 11px;
  line-height: 14px;
  color: #999;
}
.asset-eye {
  width: 24px;
  height: 20px;
  margin-left: 4px;
}
.eye-icon {
  width: 16px;
  height: 16px;
}
.asset-value {
  margin-top: 7px;
  font-size: 26px;
  line-height: 32px;
  color: #1a2438;
}
/* 图例条：h29 mt12 灰底圆角6 */
.legend-bar {
  height: 29px;
  margin: 12px 14px 0;
  padding: 0 10px;
  background: #f5f5f5;
  border-radius: 6px;
}
/* 源站量测：图例色块统一 5x5、圆角 1px（非圆形） */
.legend-dot {
  width: 5px;
  height: 5px;
  border-radius: 1px;
}
.legend-dot-a {
  background: #8f9bb3;
}
.legend-dot-b {
  background: #e54d42;
}
.legend-dot-c {
  margin-left: 2px;
  background: #22a06b;
}
.legend-text {
  margin-left: 4px;
  font-size: 11px;
  color: #999;
}
/* 快捷菜单：y252 h67 */
/* 源站量测：图例条底 y252 → 快捷菜单 y252，紧贴无间距 */
.menu-row {
  height: 67px;
  margin-top: 0;
  padding: 0 10px;
}
.menu-item {
  width: 74px;
  height: 45px;
}
.menu-icon {
  width: 17px;
  height: 19px;
}
.menu-label {
  margin-top: 12px;
  font-size: 11px;
  line-height: 14px;
  color: #333;
}
/* 分类：h33 mt8 */
.cate-scroll {
  width: 100%;
  /* 源站量测：分类条 h35，y327 */
  height: 35px;
  margin-top: 8px;
}
.cate-list {
  flex-direction: row;
  padding: 0 14px;
}
.cate-item {
  position: relative;
  height: 35px;
  margin-right: 18px;
  padding: 6px 0 8px;
  /* 源站每项等宽 28px、间距 18px（x=14/60/106/152...）。flex 项无固有宽度会按内容协商，
     选中项因下划线占位被压到 22px，导致后续项整体左移，故显式固定宽度。 */
  flex: 0 0 auto;
  width: 28px;
  text-align: center;
}
.cate-text {
  font-size: 14px;
  line-height: 19px;
  color: #999;
}
.cate-item.active .cate-text {
  color: #1a2438;
}
.cate-line {
  position: absolute;
  bottom: 0;
  left: 5px;
  width: 18px;
  height: 3px;
  background: #1a2438;
  border-radius: 1px;
}
/* 搜索：h35 mt10 灰底 */
.search-bar {
  height: 35px;
  margin: 10px 14px 0;
  padding: 0 12px;
  background: #f5f5f5;
  border-radius: 18px;
}
.search-icon {
  width: 16px;
  height: 16px;
}
.search-ph {
  margin-left: 6px;
  font-size: 12px;
  line-height: 16.8px;
  color: #333;
}
/* 空状态 */
.empty-box {
  padding: 120px 0 0;
}
.empty-img {
  width: 140px;
  height: 140px;
}
</style>