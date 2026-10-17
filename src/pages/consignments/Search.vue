<template>
  <view class="search-page page-bg-colorfull">
    <view class="tnav">
      <view class="tnav-left" @click="goBack">
        <img :src="asset('static/common/back_default.png')" mode="widthFix" />
      </view>
      <view class="search-box">
        <img class="search-icon" :src="asset('static/icon/search.png')" mode="aspectFit" />
        <input
          class="search-input"
          :value="keyword"
          placeholder="请输入搜索内容"
          placeholder-class="search-ph"
          @input="onKeyword"
          @focus="hasFocus = true"
          @blur="hasFocus = false"
        />
        <view v-if="keyword" class="clear-icon" @click="keyword = ''"></view>
      </view>
    </view>

    <!-- 搜索历史 -->
    <view v-if="showHistory" class="history">
      <view class="flex flex-js-sb flex-ai-center pt-16 pb-24">
        <text class="MiSans-Regular his-title">搜索历史</text>
        <view class="del-icon" @click="clearHistory"></view>
      </view>
      <view class="flex flex-w">
        <view
          v-for="(h, i) in history"
          :key="i"
          class="his-item"
          @click="doSearch(h)"
        >
          <text class="MiSans-Regular his-text">{{ h }}</text>
        </view>
        <view v-if="!history.length" class="his-empty">暂无搜索历史</view>
      </view>
    </view>

    <!-- 搜索结果 -->
    <view v-else class="plr-16">
      <view v-if="list.length" class="order-list-"" style="padding: 20rpx 0 40rpx">
        <view v-for="item in list" :key="item.id" class="order-card" @click="toDetail(item)">
          <view class="card-top flex flex-ai-center flex-js-sb">
            <text class="MiSans-Regular time-text">{{ formatDate(item.createtime) }}</text>
            <view class="status-badge" :class="statusTheme(item)">
              <text class="MiSans-Regular status-text">{{ statusLabel(item) }}</text>
            </view>
          </view>
          <view class="card-body flex flex-ai-stretch">
            <img class="goods-thumb-s" :src="thumbOf(item)" mode="aspectFill" />
            <view class="goods-meta flex flex-dir-col flex-js-sb flex-1">
              <view>
                <text class="MiSans-Medium goods-name text-overflow-2">{{ item.goods_name || '--' }}</text>
                <view v-if="item.collection_code" class="code-pill flex flex-ai-center flex-js-center">
                  <text class="MiSans-Regular">编号 #{{ item.collection_code }}</text>
                </view>
              </view>
              <view class="flex flex-ai-end" style="margin-top: 16rpx">
                <text class="MiSans-Regular price-label">寄售价格</text>
                <text class="MiSans-Demibold price-val">¥ {{ item.price }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>
      <view v-else class="empty">未找到相关寄售</view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { fetchMyConsignment, asset } from '@/utils/api'
import { ossImg } from '@/api'

const router = useRouter()

const keyword = ref('')
const hasFocus = ref(false)
const history = ref(readHistory())
const list = ref([])

const showHistory = computed(() => !keyword.value)

const STATUS_MAP = { 1: '寄售中', 2: '已成交', 3: '已取消' }

function readHistory() {
  try {
    return JSON.parse(localStorage.getItem('consignSearchHistory') || '[]')
  } catch (e) {
    return []
  }
}
function saveHistory(k) {
  const h = [k, ...history.value.filter((x) => x !== k)].slice(0, 10)
  history.value = h
  localStorage.setItem('consignSearchHistory', JSON.stringify(h))
}
function clearHistory() {
  history.value = []
  localStorage.removeItem('consignSearchHistory')
}
function statusLabel(o) {
  return STATUS_MAP[o.status] || '寄售中'
}
function statusTheme(o) {
  if (o.status === 2) return 'green'
  if (o.status === 3) return 'gray'
  return 'red'
}
function thumbOf(o) {
  const src = o.listimg || o.main_image || ''
  return src ? (src.startsWith('http') ? src : ossImg(src)) : ''
}
function formatDate(ts) {
  if (!ts) return ''
  const d = new Date(Number(ts) * 1000)
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}
function onKeyword(e) {
  keyword.value = e.target.value
}
async function doSearch(k) {
  keyword.value = k
  if (k) saveHistory(k)
  const all = await fetchMyConsignment({ page: 1 })
  list.value = all.filter(
    (x) =>
      !k ||
      (x.goods_name || '').includes(k) ||
      (x.collection_code || '').includes(k)
  )
}
function toDetail(item) {
  router.push({ path: '/pages/consignments/consignments', query: { id: item.id } })
}
function goBack() {
  if (window.history.length > 1) router.back()
  else router.push('/pages/consignments/myConsignment')
}

onMounted(async () => {
  list.value = await fetchMyConsignment({ page: 1 })
})
</script>

<style scoped>
@import '@/styles/atomic.css';
@import '@/styles/trade.css';

.search-page {
  min-height: 100vh;
  background: #eef4f0;
}
.tnav {
  justify-content: flex-start;
  padding-left: 26rpx;
}
.search-box {
  position: absolute;
  left: 80rpx;
  right: 28rpx;
  height: 64rpx;
  padding: 0 20rpx;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 32rpx;
  display: flex;
  align-items: center;
}
.search-icon {
  width: 30rpx;
  height: 30rpx;
  flex-shrink: 0;
  margin-right: 12rpx;
}
.search-input {
  flex: 1;
  font-size: 26rpx;
  color: #1a2438;
}
.search-ph {
  color: #bbb;
  font-size: 26rpx;
}
.clear-icon {
  width: 32rpx;
  height: 32rpx;
  border-radius: 50%;
  background: #ccc;
  position: relative;
  flex-shrink: 0;
}
.clear-icon::before,
.clear-icon::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 50%;
  width: 18rpx;
  height: 2rpx;
  background: #fff;
  transform: translate(-50%, -50%) rotate(45deg);
}
.clear-icon::after {
  transform: translate(-50%, -50%) rotate(-45deg);
}
.history {
  padding: 0 28rpx;
}
.his-title {
  font-size: 28rpx;
  color: #1a2438;
}
.del-icon {
  width: 32rpx;
  height: 32rpx;
  position: relative;
}
.del-icon::before {
  content: '';
  position: absolute;
  left: 2rpx;
  top: 6rpx;
  width: 28rpx;
  height: 22rpx;
  border: 2rpx solid #999;
  border-top: none;
  border-radius: 0 0 4rpx 4rpx;
}
.del-icon::after {
  content: '';
  position: absolute;
  left: 8rpx;
  top: 0;
  width: 16rpx;
  height: 2rpx;
  background: #999;
}
.his-item {
  display: inline-flex;
  align-items: center;
  height: 56rpx;
  padding: 0 24rpx;
  margin-right: 16rpx;
  margin-bottom: 20rpx;
  background: #fff;
  border-radius: 28rpx;
}
.his-text {
  font-size: 24rpx;
  color: #1a2438;
}
.his-empty,
.empty {
  padding: 80rpx 0;
  font-size: 26rpx;
  color: #999;
}
</style>
