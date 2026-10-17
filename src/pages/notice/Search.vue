<template>
  <view class="notice-search-page">
    <view class="navbar">
      <view class="navbar-left" @click="goBack">
        <img :src="asset('static/common/back_default.png')" mode="widthFix" />
      </view>
      <view class="search-box">
        <img class="search-icon" :src="asset('static/icon/search.png')" mode="aspectFit" />
        <input
          class="MiSans-Regular search-input" type="text"
          :value="form.search"
          placeholder="请输入搜索内容"
          placeholder-class="search-ph" confirm-type="search"
          @input="onInput"
          @confirm="doSearch(form.search)"
        />
        <view v-if="form.search" class="clear-btn" @click="form.search = ''"></view>
      </view>
    </view>

    <!-- 搜索历史（localStorage，最多 10 条） -->
    <SearchHistoryPanel
      v-if="showHistory"
      :history="history"
      @pick="doSearch"
      @clear="clearHistory"
    />

    <!-- 搜索结果 -->
    <view v-else class="list plr-16 mt-12">
      <view
        v-for="item in list"
        :key="item.id"
        class="flex flex-ai-center result-item"
        @click="goDetail(item)"
      >
        <view class="flex flex-dir-col flex-1">
          <text class="text-overflow-2 MiSans-Demibold result-title">{{ item.title }}</text>
          <view class="flex flex-js-sb flex-ai-center meta-row">
            <view
              class="flex flex-js-center flex-ai-center type-tag"
              :class="'type-' + typeIndex(item.affiche_type)"
            >
              <text class="MiSans-Regular type-text">{{ item.affiche_type }}</text>
            </view>
            <view class="flex ml-10">
              <text class="MiSans-Regular time-text">{{ formatDate(item.createtime) }}</text>
            </view>
          </view>
        </view>
      </view>

      <view v-if="!list.length" class="empty-box">
        <text class="MiSans-Regular empty-text">未找到相关公告</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { fetchAfficheList, asset } from '@/utils/api'
import SearchHistoryPanel from '@/components/SearchHistoryPanel.vue'

const router = useRouter()

const HISTORY_KEY = 'noticeSearchHistory'
const MAX_HISTORY = 10

const form = reactive({ search: '' })
const history = ref(readHistory())
const list = ref([])
const loading = ref(false)

const showHistory = computed(() => !form.search.trim() && loading.value === false)

function readHistory() {
  try {
    const arr = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]')
    return Array.isArray(arr) ? arr.slice(0, MAX_HISTORY) : []
  } catch (e) {
    return []
  }
}
function saveHistory(k) {
  const h = [k, ...history.value.filter((x) => x !== k)].slice(0, MAX_HISTORY)
  history.value = h
  localStorage.setItem(HISTORY_KEY, JSON.stringify(h))
}
function clearHistory() {
  history.value = []
  localStorage.removeItem(HISTORY_KEY)
}

function typeIndex(type) {
  const map = { 官方公告: 0, 运营公告: 1, 寄售公告: 2, 限价公告: 0, 求购公告: 3, 活动公告: 4 }
  return map[type] !== undefined ? map[type] : 0
}
function formatDate(ts) {
  if (!ts) return ''
  const d = new Date(Number(ts) * 1000)
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

function onInput(e) {
  form.search = e.target.value
}

async function doSearch(k) {
  const kw = (k || form.search || '').trim()
  form.search = kw
  if (!kw) {
    list.value = []
    return
  }
  saveHistory(kw)
  loading.value = true
  const all = await fetchAfficheList({ page: 1, list_rows: 30 })
  list.value = all.filter(
    (x) =>
      (x.title || '').includes(kw) || (x.affiche_type || '').includes(kw)
  )
  loading.value = false
}

function goDetail(item) {
  router.push({
    path: '/pages/notice/noticeDetails',
    query: { id: item.id, category: item.affiche_type },
  })
}

function goBack() {
  if (window.history.length > 1) router.back()
  else router.push('/pages/notice/notice')
}

onMounted(async () => {
  await fetchAfficheList({ page: 1, list_rows: 15 })
})
</script>

<style scoped>
@import '@/styles/atomic.css';

.notice-search-page {
  min-height: 100vh;
  background: #fff;
}

.navbar {
  position: relative;
  height: 88rpx;
  background: #fff;
  display: flex;
  align-items: center;
  padding: 0 24rpx;
  box-sizing: border-box;
}
.navbar-left {
  width: 40rpx;
  display: flex;
  align-items: center;
  flex-shrink: 0;
}
.navbar-left img {
  width: 34rpx;
}
.search-box {
  flex: 1;
  min-width: 0;
  height: 64rpx;
  margin-left: 16rpx;
  padding: 0 20rpx;
  background: #f5f5f5;
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
  min-width: 0;
  font-size: 26rpx;
  color: #000;
}
.search-ph {
  color: #bbb;
  font-size: 26rpx;
}
.clear-btn {
  width: 32rpx;
  height: 32rpx;
  border-radius: 50%;
  background: #ccc;
  position: relative;
  flex-shrink: 0;
}
.clear-btn::before,
.clear-btn::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 50%;
  width: 18rpx;
  height: 2rpx;
  background: #fff;
  transform: translate(-50%, -50%) rotate(45deg);
}
.clear-btn::after {
  transform: translate(-50%, -50%) rotate(-45deg);
}









.result-item {
  border-bottom: 1rpx solid #f0f0f0;
  padding-bottom: 24rpx;
  margin-bottom: 32rpx;
}
.result-title {
  font-weight: 300;
  font-size: 30rpx;
  color: #161616;
  width: 100%;
  line-height: 1.5;
}
.meta-row {
  margin-top: 28rpx;
}
.type-tag {
  border-radius: 8rpx;
  font-size: 22rpx;
  padding: 0 12rpx;
  height: 44rpx;
  white-space: nowrap;
  flex-shrink: 0;
}
.type-text {
  font-size: 22rpx;
}
.type-0 { background: rgba(0, 181, 120, 0.1); border: 1rpx solid #00b578; }
.type-0 .type-text { color: #00b578; }
.type-1 { background: rgba(255, 143, 31, 0.1); border: 1rpx solid #ff8f1f; }
.type-1 .type-text { color: #ff8f1f; }
.type-2 { background: rgba(0, 133, 255, 0.1); border: 1rpx solid #0085ff; }
.type-2 .type-text { color: #0085ff; }
.type-3 { background: rgba(0, 181, 120, 0.1); border: 1rpx solid #00b578; }
.type-3 .type-text { color: #00b578; }
.type-4 { background: #dce5fa; border: 1rpx solid #3556e9; }
.type-4 .type-text { color: #3556e9; }
.time-text {
  font-size: 24rpx;
  color: #adadb6;
}

.empty-box {
  padding: 140rpx 0;
  text-align: center;
}
.empty-text {
  font-size: 26rpx;
  color: #999;
}
</style>