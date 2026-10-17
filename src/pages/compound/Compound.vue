<template>
  <view class="compound-page">
    <PageNavbar title="藏品合成" variant="dark">
      <template #right>
        <text class="MiSans-Medium nav-right" @click="go('/pages/compound/record')">活动记录</text>
      </template>
    </PageNavbar>

    <!-- 活动列表 -->
    <view class="methods-list">
      <view v-for="a in list" :key="a.id" class="act-card" @click="confirm(a)">
        <view class="card-main">
          <view class="thumb-wrap">
            <img class="thumb" :src="ossImg(a.listimg)" mode="aspectFill" />
            <view class="status-badge">
              <text class="MiSans-Regular badge-text">{{ statusBadge(a) }}</text>
            </view>
          </view>
          <view class="meta">
            <text class="MiSans-Demibold title text-overflow">{{ a.title || '--' }}</text>
            <text class="MiSans-Regular rule-link" @click.stop="go(a.rule_url || '/pages/rules/rules')">活动规则</text>
          </view>
          <view class="join-btn" :class="{ disabled: !canJoin(a) }">
            <text class="MiSans-Medium join-text">{{ btnText(a) }}</text>
          </view>
        </view>
        <view class="card-foot">
          <text class="MiSans-Regular foot-text">活动时间: {{ timeRange(a) }}</text>
        </view>
      </view>

      <view v-if="!list.length" class="empty-box">
        <img class="empty-img" :src="asset('static/empty/search1-empty.png')" mode="widthFix" />
        <text class="MiSans-Regular empty-text">暂无合成活动</text>
      </view>
    </view>

    <!-- 请选择合成材料 -->
    <view v-if="showPop" class="mask" @click="showPop = false">
      <view class="sheet" @click.stop>
        <text class="MiSans-Medium sheet-title">请选择合成材料</text>
        <scroll-view scroll-x  class="scheme-list">
          <view v-for="m in materialsList" :key="m.grp" class="scheme-item">
            <text class="MiSans-Regular scheme-title text-overflow">{{ m.title }}</text>
            <view class="scheme-btn" @click="toScheme(m)">
              <text class="MiSans-Medium scheme-btn-text">选择</text>
            </view>
          </view>
        </scroll-view>
      </view>
    </view>
  </view>
</template>

<script setup>
/**
 * 原站 compound/compound —— 藏品合成活动列表
 * 结构：深色导航（右侧「活动记录」）+ 活动卡（缩略图 + 状态角标 + 标题 + 活动规则 + 参与按钮 + 活动时间）+「请选择合成材料」底部弹层。
 */
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import PageNavbar from '@/components/PageNavbar.vue'
import { asset, fetchCompoundList } from '@/utils/api'
import { ossImg } from '@/api'

defineOptions({ name: 'CompoundPage' })

const router = useRouter()
const list = ref([])
const showPop = ref(false)

/** 原站以「合成方案分组」形式展示，这里按 mock 的活动条目生成可选材料分组 */
const materialsList = computed(() =>
  list.value.map((a, i) => ({ grp: `grp_${a.play_id || a.id}`, play_id: a.play_id || a.id, title: `${a.title} · 材料组 ${i + 1}` }))
)

onMounted(async () => {
  list.value = await fetchCompoundList()
})

function canJoin(a) {
  return a.status !== 0
}
function btnText(a) {
  return canJoin(a) ? '参与' : '未开始'
}
function statusBadge(a) {
  if (a.status === 0) return '未开始'
  return `已有${a.join_num || 0}人参与`
}
function timeRange(a) {
  return `${fmt(a.start_time)} 至 ${fmt(a.end_time)}`
}
function fmt(v) {
  if (!v) return '--'
  const d = new Date(Number(v) * 1000)
  if (Number.isNaN(d.getTime())) return String(v)
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())}`
}
function confirm(a) {
  if (!canJoin(a)) {
    window.uni && window.uni.showToast({ title: '您未获得合成资格', icon: 'none' })
    return
  }
  showPop.value = true
}
function toScheme(m) {
  showPop.value = false
  router.push({ path: '/pages/compound/schemeDetails', query: { play_id: m.play_id } })
}
function go(path) {
  router.push(path)
}
</script>

<style scoped>
@import '@/styles/atomic.css';

.compound-page {
  min-height: 100vh;
  background: #f7f7f7;
  padding-bottom: 60rpx;
  box-sizing: border-box;
}
.nav-right {
  font-size: 24rpx;
  color: #fff;
}

.methods-list {
  width: 100%;
  padding: 0 21rpx;
}
.act-card {
  margin-bottom: 15rpx;
  background: #fff;
  border-radius: 15rpx;
  overflow: hidden;
}
.card-main {
  display: flex;
  align-items: center;
  padding: 18rpx;
}
.thumb-wrap {
  position: relative;
  width: 120rpx;
  height: 120rpx;
  flex-shrink: 0;
  border-radius: 9rpx;
  overflow: hidden;
  background: #e8e8e8;
}
.thumb {
  width: 120rpx;
  height: 120rpx;
}
.status-badge {
  position: absolute;
  left: 6rpx;
  bottom: 6rpx;
  max-width: calc(100% - 12rpx);
  padding: 3rpx 7.5rpx;
  background: rgba(0, 0, 0, 0.55);
  border-radius: 6rpx;
}
.badge-text {
  font-size: 13.5rpx;
  color: #fff;
  white-space: nowrap;
}
.meta {
  margin-left: 15rpx;
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
}
.title {
  font-size: 22.5rpx;
  color: #1a2438;
  line-height: 1.3;
}
.rule-link {
  margin-top: 12rpx;
  font-size: 18rpx;
  color: #999;
  text-decoration: underline;
  align-self: flex-start;
}
.join-btn {
  margin-left: 12rpx;
  flex-shrink: 0;
  width: 87.75rpx;
  height: 69rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #2e2c33;
  border-radius: 34.5rpx;
}
.join-btn.disabled {
  background: #b9bcc2;
}
.join-text {
  font-size: 16.5rpx;
  color: #fff;
  text-align: center;
  line-height: 1.2;
  padding: 0 6rpx;
}
.card-foot {
  padding: 12rpx 18rpx;
  background: #f9f9f9;
}
.foot-text {
  font-size: 16.5rpx;
  color: #999;
}

.empty-box {
  padding: 160rpx 0 60rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.empty-img {
  width: 300rpx;
}
.empty-text {
  margin-top: 24rpx;
  font-size: 26rpx;
  color: #999;
}

.mask {
  position: fixed;
  inset: 0;
  z-index: 100;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: flex-end;
}
.sheet {
  width: 100%;
  padding: 32rpx 0 calc(24rpx + env(safe-area-inset-bottom));
  background: #fff;
  border-radius: 18rpx 18rpx 0 0;
}
.sheet-title {
  display: block;
  padding: 0 21rpx;
  font-size: 32rpx;
  color: #1a2438;
}
.scheme-list {
  width: 100%;
  max-height: 60vh;
  padding: 0 21rpx;
}
.scheme-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18rpx 15rpx;
  margin-top: 12rpx;
  background: #fff;
  border: 0.75rpx solid #f0f0f0;
  border-radius: 12rpx;
}
.scheme-title {
  flex: 1;
  font-size: 21rpx;
  color: #1a2438;
  padding-right: 15rpx;
}
.scheme-btn {
  width: 84rpx;
  height: 42rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #6aa27b;
  border-radius: 21rpx;
  flex-shrink: 0;
}
.scheme-btn-text {
  font-size: 24rpx;
  color: #fff;
}
</style>