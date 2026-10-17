<template>
  <view class="detail-list-page">
    <PageNavbar title="龙晶明细" />

    <!-- 吸顶：种类 tab + 下拉筛选 -->
    <view class="screen-fixed">
      <view class="tab-row">
        <view
          v-for="(t, i) in kindList"
          :key="t.name"
          class="tab-item"
          :class="{ on: kindIndex === i }"
          @click="changeKind(i)"
        >
          <text class="MiSans-Medium tab-text">{{ t.name }}</text>
        </view>
      </view>
      <view class="select-row">
        <view
          v-for="(s, i) in sortList"
          :key="s.name"
          class="select-chip"
          :class="{ on: sortIndex === i }"
          @click="changeSort(i)"
        >
          <text class="MiSans-Regular chip-text">{{ s.name }}</text>
        </view>
      </view>
    </view>

    <!-- 明细列表 -->
    <view v-if="list.length" class="content">
      <view v-for="(r, i) in list" :key="r.id || i" class="item">
        <view class="item-left">
          <text class="MiSans-Regular memo text-overflow-2">{{ r.memo }}</text>
          <text class="MiSans-Regular time">{{ fmt(r.createtime) }}</text>
        </view>
        <view class="item-right">
          <view class="crystal">
            <text class="MiSans-Demibold crystal-num">{{ r.crystal }}</text>
          </view>
          <text class="MiSans-Regular model">{{ modelName(r.model) }}</text>
        </view>
      </view>
    </view>

    <view v-else class="empty-box">
      <img class="empty-img" :src="asset('static/empty/search1-empty.png')" mode="widthFix" />
      <text class="MiSans-Regular empty-text">暂无龙晶明细</text>
    </view>
  </view>
</template>

<script setup>
/**
 * 原站 shop/detailList —— 龙晶明细
 * 结构：吸顶 tab（时间/种类）+ 下拉筛选 + 明细列表（备注 + 时间 + 龙晶数 + 币种）。
 */
import { computed, onMounted, ref } from 'vue'
import PageNavbar from '@/components/PageNavbar.vue'
import { asset, fetchShopCrystalDetail } from '@/utils/api'

defineOptions({ name: 'ShopDetailList' })

const kindList = [
  { name: '全部', value: '' },
  { name: '收入', value: 'in' },
  { name: '支出', value: 'out' },
]
const sortList = [
  { name: '时间' },
  { name: '种类' },
]

const kindIndex = ref(0)
const sortIndex = ref(0)
const all = ref([])

const list = computed(() => {
  const v = kindList[kindIndex.value].value
  if (!v) return all.value
  return all.value.filter((x) => (v === 'in' ? Number(x.crystal) > 0 : Number(x.crystal) < 0))
})

onMounted(async () => {
  all.value = await fetchShopCrystalDetail()
})

function changeKind(i) {
  kindIndex.value = i
}
function changeSort(i) {
  sortIndex.value = i
}

/** 时间戳/字符串统一格式化为 yyyy.mm.dd hh:MM:ss */
function fmt(v) {
  if (!v) return ''
  const d = new Date(Number(v) * 1000)
  if (Number.isNaN(d.getTime())) return String(v)
  const p = (n, l = 2) => String(n).padStart(l, '0')
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}

function modelName(m) {
  if (m === 1 || m === '1') return '龙晶'
  if (m === 2 || m === '2') return '玄耀'
  return ''
}
</script>

<style scoped>
@import '@/styles/atomic.css';

.detail-list-page {
  min-height: 100vh;
  background: #f4f5f8;
  box-sizing: border-box;
}

.screen-fixed {
  position: sticky;
  top: 0;
  z-index: 20;
  padding: 20rpx 24rpx 24rpx;
  background: #f4f5f8;
}
.tab-row {
  display: flex;
  align-items: center;
}
.tab-item {
  flex: 0 0 auto;
  margin-right: 40rpx;
  padding-bottom: 8rpx;
}
.tab-item.on {
  border-bottom: 4rpx solid #1a2438;
}
.tab-text {
  font-size: 30rpx;
  color: #999;
  white-space: nowrap;
}
.tab-item.on .tab-text {
  color: #1a2438;
}
.select-row {
  display: flex;
  align-items: center;
  margin-top: 20rpx;
}
.select-chip {
  margin-right: 18rpx;
  padding: 12rpx 24rpx;
  background: #fff;
  border-radius: 12rpx;
}
.select-chip.on {
  background: #1a2438;
}
.chip-text {
  font-size: 24rpx;
  color: #505050;
}
.select-chip.on .chip-text {
  color: #fff;
}

.content {
  margin: 0 24rpx 24rpx;
  padding: 24rpx;
  background: #fff;
  border-radius: 15rpx;
}
.item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 120rpx;
  border-bottom: 1.5rpx solid #eee;
}
.item:last-child {
  border-bottom: none;
}
.item-left {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}
.memo {
  font-size: 28rpx;
  color: #1a2438;
}
.time {
  margin-top: 8rpx;
  font-size: 22rpx;
  color: #999;
}
.item-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  flex-shrink: 0;
  margin-left: 20rpx;
}
.crystal-num {
  font-size: 32rpx;
  color: #e26f1b;
}
.model {
  margin-top: 8rpx;
  font-size: 22rpx;
  color: #999;
}

.empty-box {
  padding: 160rpx 0 80rpx;
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
</style>