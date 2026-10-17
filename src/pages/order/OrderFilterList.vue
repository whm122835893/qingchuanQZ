<template>
  <view class="order-list-page">
    <view class="tnav" style="background: #fff">
      <view class="tnav-left" @click="goBack">
        <img :src="asset('static/common/back_default.png')" mode="widthFix" />
      </view>
      <text class="tnav-title">{{ title }}</text>
    </view>

    <view class="filter-placeholder" :style="{ height: filterBlockHeight }"></view>
    <view class="filter-fixed" :style="{ top: navBarHeight }">
      <view class="filter-bar">
        <scroll-view scroll-x  class="filter-scroll" :show-scrollbar="false">
          <view class="filter-inner">
            <view
              v-for="chip in statusList"
              :key="chip.name"
              class="filter-chip"
              :class="{ on: search.status === chip.status }"
              @click="changeStatus(chip)"
            >
              <text class="MiSans-Regular chip-text">{{ chip.name }}</text>
            </view>
          </view>
        </scroll-view>
      </view>
    </view>

    <view class="order-list">
      <view v-for="item in list" :key="item.id" class="order-card" @click="toDetail(item)">
        <view class="card-top flex flex-ai-center flex-js-sb">
          <view class="flex flex-ai-center" style="min-width: 0; flex: 1">
            <text class="MiSans-Regular time-text">{{ formatDate(item.updatetime) }}</text>
            <view v-if="payTagOf(item)" class="pay-tag flex flex-ai-center flex-js-center">
              <text class="MiSans-Regular">{{ payTagOf(item) }}</text>
            </view>
          </view>
          <view class="status-badge" :class="statusTheme(item)">
            <text class="MiSans-Regular status-text">{{ statusLabel(item) }}</text>
          </view>
        </view>

        <view class="card-body flex flex-ai-stretch">
          <img class="goods-thumb-s" :src="thumbOf(item)" mode="aspectFill" />
          <view class="goods-meta flex flex-dir-col flex-js-sb flex-1">
            <view>
              <text class="MiSans-Medium goods-name text-overflow-2">{{ item.goods_name || '--' }}</text>

              <!-- 已成交/已取消且数量>1 时展示进度 -->
              <view v-if="(item.order_status === 2 || item.order_status === 3) && item.number > 1">
                <view class="progress-bar">
                  <view
                    class="progress-inner"
                    :style="{ width: Math.min(100, (item.sale_number / item.number) * 100) + '%' }"
                  ></view>
                </view>
                <text class="progress-text"
                  >{{ modeText }}：{{ item.sale_number }}/{{ item.number }}</text
                >
              </view>
              <view v-else-if="item.collection_code">
                <text class="code-pill">编号 #{{ item.collection_code }}</text>
              </view>
            </view>

            <view class="flex flex-ai-end flex-js-sb" style="margin-top: 16rpx">
              <view class="flex flex-ai-end">
                <text class="MiSans-Regular price-label">{{ priceLabel }}</text>
                <text class="MiSans-Demibold price-val">¥ {{ item.price }}</text>
              </view>
              <view v-if="item.order_status === 2" class="ghost-btn flex flex-ai-center flex-js-center">
                <text class="MiSans-Regular ghost-btn-text">取消{{ modeText }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <view v-if="!list.length" class="empty">暂无订单</view>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { fetchEntrustList, fetchBegList, asset } from '@/utils/api'
import { ossImg } from '@/api'

const route = useRoute()
const router = useRouter()

const props = defineProps({
  // 'entrust' 委托 | 'beg' 求购；不传时按路由路径自动判断
  mode: { type: String, default: '' },
})
// 同一组件服务 /pages/order/entrust/list 与 /pages/order/beg/list
const isEntrust = computed(() => props.mode || route.path.includes('entrust'))
const title = computed(() => (isEntrust.value ? '我的委托' : '我的求购'))
const modeText = computed(() => (isEntrust.value ? '委托数量' : '求购数量'))
const priceLabel = computed(() => (isEntrust.value ? '委托价格' : '求购价格'))
const detailPath = computed(() => (isEntrust.value ? '/pages/order/entrust/info' : '/pages/order/beg/info'))
const listApi = computed(() => (isEntrust.value ? fetchEntrustList : fetchBegList))

// 原站 statusList：全部/委托中(或求购中)/已成交/已取消
const statusList = [
  { name: '全部', status: null },
  { name: isEntrust.value ? '委托中' : '求购中', status: 2 },
  { name: '已成交', status: 3 },
  { name: '已取消', status: 4 },
]

const list = ref([])
const search = reactive({ status: null })
// 原站 navBarHeight = (statusBarHeight||0) + 44；H5 无状态栏，取 44px 换算
const navBarHeight = 'calc(88rpx + env(safe-area-inset-top))'
const filterBlockHeight = computed(() => '124rpx')

const STATUS_MAP = { 2: '进行中', 3: '已成交', 4: '已取消' }

function statusLabel(o) {
  return STATUS_MAP[o.order_status] || '进行中'
}
function statusTheme(o) {
  if (o.order_status === 3) return 'green'
  if (o.order_status === 4) return 'gray'
  return 'red'
}
function payTagOf(o) {
  return o.pay_way === 'huifu' ? '汇付' : o.pay_way === 'yibao' ? '易宝' : ''
}
function thumbOf(o) {
  const src = o.listimg || o.main_image || ''
  if (!src) return ''
  return src.startsWith('http') ? src : ossImg(src)
}
function formatDate(ts) {
  if (!ts) return ''
  const d = new Date(Number(ts) * 1000)
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(
    d.getMinutes()
  )}:${p(d.getSeconds())}`
}

function changeStatus(chip) {
  search.status = chip.status
  load()
}
function toDetail(item) {
  router.push({ path: detailPath.value, query: { id: item.id } })
}
function goBack() {
  if (window.history.length > 1) router.back()
  else router.push('/pages/order/list')
}

async function load() {
  list.value = await listApi.value({ status: search.status, page: 1 })
}

onMounted(load)
</script>

<style scoped>
@import '@/styles/atomic.css';
@import '@/styles/trade.css';

.order-list-page {
  padding-top: 88rpx;
}
.empty {
  padding: 100rpx 0;
  text-align: center;
  font-size: 26rpx;
  color: #999;
}
</style>
