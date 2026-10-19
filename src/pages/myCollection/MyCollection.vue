<template>
  <view class="my-collection-page">
    <view class="navbar flex flex-ai-center flex-js-center">
      <view class="navbar-back flex flex-ai-center flex-js-center" @click="goBack">
        <img :src="asset('static/common/back_default.png')" mode="widthFix" />
      </view>
      <text class="MiSans-Demibold navbar-title">我的藏品</text>
    </view>

    <CollectionOverview
      :total-num="totalNum"
      :total-value="totalValue"
      :floor-text="floorText"
      :tabs="tabs"
      :types="types"
      @change="changeTab"
    />

    <!-- 藏品列表 -->
    <view class="list-wrap">
      <view v-if="!loading && !list.length" class="empty flex-center">
        <text class="MiSans-Regular empty-text">暂无藏品~</text>
      </view>
      <view
        v-for="item in list"
        :key="item.id"
        class="item-row flex"
        @click="openPop(item)"
      >
        <img class="pimg" :src="ossImg(item.listimg)" mode="aspectFill" />
        <view class="plr-8 flex-1 flex-dir-col">
          <text class="MiSans-Medium item-name text-overflow-2">{{
            cutName(item.name)
          }}</text>
          <view v-if="showPrice" class="flex flex-js-sb flex-ai-center item-meta">
            <text class="MiSans-Regular item-code">#{{ item.collection_code }}</text>
            <text class="MiSans-Medium item-price">
              {{ item.price }}<text class="MiSans-Regular"> 元</text>
            </text>
          </view>
        </view>
      </view>
    </view>

    <CollectionDetailPopup
      v-model:show="showPop"
      :id="activeId"
      :types="types"
      :summary="activeSummary"
      @opened="init"
    />
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { fetchMyCollectionList, asset } from '@/utils/api'
import { ossImg } from '@/api'
import CollectionDetailPopup from '@/components/CollectionDetailPopup.vue'
import CollectionOverview from '@/components/CollectionOverview.vue'

// tab 文案与顺序严格对齐源站：藏品 / 盲盒 / 已售出 / 已赠送
// types 枚举对齐源站 myCollection 页实证：藏品=2 / 盲盒=1 / 已售出=3 / 已赠送=4
// （与 my 页 antMycollection 同枚举；早期文件误作 藏品=1/盲盒=2，已修正）
const TABS = [
  { name: '藏品', types: 2 },
  { name: '盲盒', types: 1 },
  { name: '已售出', types: 3 },
  { name: '已赠送', types: 4 },
]

const router = useRouter()
const all = ref([])
const loading = ref(true)
const types = ref(2)
const keywords = ref('')
const showPop = ref(false)
const activeId = ref('')
const activeSummary = ref({})

const showPrice = computed(() => types.value !== 3 && types.value !== 4)

const list = computed(() => {
  const kw = keywords.value.trim()
  return all.value.filter((x) => {
    if (types.value === 1 && !x.blind_box_id) return false
    if (types.value === 3 && x.has_sold !== 1) return false
    if (types.value === 4 && x.has_sold !== 2) return false
    if (kw && !(x.name || '').includes(kw)) return false
    return true
  })
})

// 源站 u-tabs 不显示计数，tab 只渲染文案
const tabs = computed(() => TABS)

const totalNum = computed(() =>
  all.value.reduce((s, x) => s + (Number(x.count) || 0), 0)
)
const totalValue = computed(() =>
  all.value
    .reduce((s, x) => s + (Number(x.price) || 0) * (Number(x.count) || 0), 0)
    .toFixed(2)
)
const floorText = computed(() => {
  if (!all.value.length) return '0.00'
  return Math.min(...all.value.map((x) => Number(x.price) || 0)).toFixed(2)
})

const cutName = (n) => (n && n.length > 10 ? n.slice(0, 10) + '...' : n || '')

function changeTab(t) {
  types.value = t
  keywords.value = ''
}

function openPop(item) {
  activeId.value = item.collection_id || item.id
  activeSummary.value = item
  showPop.value = true
}

function goBack() {
  if (window.history.length > 1) router.back()
  else router.push('/pages/my/my')
}

async function init() {
  loading.value = true
  all.value = await fetchMyCollectionList({})
  loading.value = false
}
init()
</script>

<style scoped>
@import '@/styles/atomic.css';
.my-collection-page {
  min-height: 100vh;
  background: #f4f6fa;
  padding-bottom: 40rpx;
}
.navbar {
  position: relative;
  height: 88rpx;
  background: #fff;
}
.navbar-back {
  position: absolute;
  left: 26rpx;
  top: 0;
  bottom: 0;
  width: 60rpx;
}
.navbar-back img {
  width: 34rpx;
}
.navbar-title {
  font-size: 32rpx;
  color: #000;
}











.list-wrap {
  margin-top: 16rpx;
  padding: 0 16rpx;
  background: #fff;
}
.item-row {
  padding: 21rpx 0;
  border-bottom: 1rpx solid #f5f5f5;
}
.item-row:last-child {
  border-bottom: 0;
}
.pimg {
  width: 130rpx;
  height: 130rpx;
  border-radius: 8rpx;
  background: #f4f6fa;
}
.item-name {
  font-size: 27rpx;
  color: #000;
  line-height: 34rpx;
}
.item-meta {
  margin-top: 20rpx;
}
.item-code {
  font-size: 21rpx;
  color: #999;
}
.item-price {
  font-size: 26rpx;
  color: #e04b28;
}
.empty {
  height: 400rpx;
}
.empty-text {
  font-size: 26rpx;
  color: #999;
}
</style>