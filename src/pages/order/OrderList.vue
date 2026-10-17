<template>
  <view class="order-list-page" :class="{ batch: currentType === 2 && tabIndex === 0 }">
    <!-- 导航 -->
    <view class="navbar">
      <view class="navbar-left" @click="goBack">
        <img :src="asset('static/common/back_default.png')" mode="widthFix" />
      </view>
      <text class="navbar-title">我的订单</text>
    </view>

    <!-- 吸顶筛选 -->
    <view class="filter-fixed" :style="{ top: navBarHeight + 'px' }">
      <view class="main-tabs">
        <scroll-view scroll-x  class="nav-tabs-scroll" :show-scrollbar="false">
          <view class="nav-tabs-inner">
            <view
              v-for="(t, i) in tabList"
              :key="t.name"
              class="main-tab-item"
              :class="{ active: tabIndex === i }"
              @click="changeTab(i)"
            >
              <text class="MiSans-Medium tab-label">{{ t.name }}</text>
            </view>
          </view>
        </scroll-view>
      </view>

      <!-- 常规订单筛选 -->
      <view v-if="tabIndex === 0" class="filter-bar">
        <scroll-view scroll-x  class="filter-scroll" :show-scrollbar="false">
          <view class="filter-inner">
            <view
              v-for="(c, i) in orderMap"
              :key="c.name + '-' + c.type"
              class="filter-chip"
              :class="{ on: currenIndex === i }"
              @click="changOrderStatus(c)"
            >
              <text class="MiSans-Regular chip-text">{{ c.name }}</text>
            </view>
          </view>
        </scroll-view>
      </view>

      <!-- 寄售订单筛选 -->
      <view v-else-if="tabIndex === 1" class="filter-bar">
        <scroll-view scroll-x  class="filter-scroll" :show-scrollbar="false">
          <view class="filter-inner">
            <view
              v-for="c in consignStatusList"
              :key="'c-' + c.name"
              class="filter-chip"
              :class="{ on: consignStatus === c.status }"
              @click="changeConsignStatus(c)"
            >
              <text class="MiSans-Regular chip-text">{{ c.name }}</text>
            </view>
          </view>
        </scroll-view>
      </view>

      <!-- 委托订单筛选 -->
      <view v-else-if="tabIndex === 2" class="filter-bar">
        <scroll-view scroll-x  class="filter-scroll" :show-scrollbar="false">
          <view class="filter-inner">
            <view
              v-for="c in statusList"
              :key="'e-' + c.name"
              class="filter-chip"
              :class="{ on: search.status === c.status }"
              @click="changeStatus(c)"
            >
              <text class="MiSans-Regular chip-text">{{ c.name }}</text>
            </view>
          </view>
        </scroll-view>
      </view>

      <!-- 求购订单筛选 -->
      <view v-else-if="tabIndex === 3" class="filter-bar">
        <scroll-view scroll-x  class="filter-scroll" :show-scrollbar="false">
          <view class="filter-inner">
            <view
              v-for="c in begStatusList"
              :key="'b-' + c.name"
              class="filter-chip"
              :class="{ on: search.status === c.status }"
              @click="changeStatus(c)"
            >
              <text class="MiSans-Regular chip-text">{{ c.name }}</text>
            </view>
          </view>
        </scroll-view>
      </view>
    </view>

    <view class="filter-placeholder" :style="{ height: filterBlockHeight + 'px' }"></view>

    <!-- 列表 -->
    <template v-if="tabIndex === 0">
      <!-- 常规订单 -->
      <view v-if="currentType === 1" class="order-list">
        <view
          v-for="o in filteredOrders"
          :key="o.id"
          class="order-card"
          @click="toDetail(o)"
        >
          <view class="card-top flex flex-ai-center flex-js-sb">
            <view class="flex flex-ai-center card-top-left">
              <text class="MiSans-Regular time-text">{{ formatDate(o.updatetime) }}</text>
              <view v-if="payTagOf(o)" class="pay-tag flex flex-ai-center flex-js-center">
                <text class="MiSans-Regular pay-tag-text">{{ payTagOf(o) }}</text>
              </view>
            </view>
            <view class="status-badge" :class="statusTheme(o)">
              <text class="MiSans-Regular status-text">{{ statusLabel(o) }}</text>
            </view>
          </view>
          <view class="card-body flex flex-ai-stretch">
            <img class="goods-thumb" :src="thumbOf(o)" mode="aspectFill" />
            <view class="goods-meta flex flex-dir-col flex-js-sb flex-1">
              <view>
                <text class="MiSans-Medium goods-name text-overflow-2">{{ o.goods_name || '--' }}</text>
                <view class="code-pill flex flex-ai-center flex-js-center">
                  <text class="MiSans-Regular code-text">数量 ×{{ o.number || 1 }}</text>
                </view>
              </view>
              <view class="flex flex-ai-end flex-js-sb card-bottom">
                <view class="flex flex-ai-end">
                  <text class="MiSans-Regular price-label">支付金额</text>
                  <text class="MiSans-Demibold price-val">¥ {{ priceOf(o) }}</text>
                </view>
                <view class="flex flex-ai-center">
                  <view v-if="o.order_status === 2" class="ghost-btn flex flex-ai-center flex-js-center" @click.stop="cancelOrder(o)">
                    <text class="MiSans-Regular ghost-text">取消订单</text>
                  </view>
                  <view v-if="o.order_status === 1" class="pay-btn flex flex-ai-center flex-js-center" @click.stop="payOrder(o)">
                    <text class="MiSans-Medium pay-btn-text">去支付</text>
                  </view>
                </view>
              </view>
            </view>
          </view>
        </view>
        <view v-if="!filteredOrders.length" class="empty-box">
          <text class="MiSans-Regular empty-text">暂无订单</text>
        </view>
      </view>

      <!-- 批量付订单 -->
      <view v-else class="batch-order-list">
        <view class="pay-type-radio">
          <view
            class="item flex flex-ai-center"
            :class="{ active: batchPayWay === 'huifu' }"
            @click="batchPayWay = 'huifu'"
          >
            <text class="MiSans-Regular radio-label">汇付</text>
            <view class="radio-icon" :class="{ 'radio-on': batchPayWay === 'huifu' }"></view>
          </view>
        </view>
        <view
          v-for="o in cuurentBatchList"
          :key="o.id"
          class="order-card batch-card"
          @click="toDetail(o)"
        >
          <view class="card-top flex flex-ai-center flex-js-sb">
            <view class="flex flex-ai-center card-top-left">
              <text class="MiSans-Regular time-text">{{ formatDate(o.updatetime) }}</text>
            </view>
            <view class="status-badge" :class="statusTheme(o)">
              <text class="MiSans-Regular status-text">{{ statusLabel(o) }}</text>
            </view>
          </view>
          <view class="card-body flex flex-ai-stretch">
            <img class="goods-thumb" :src="thumbOf(o)" mode="aspectFill" />
            <view class="goods-meta flex flex-dir-col flex-js-sb flex-1">
              <view>
                <text class="MiSans-Medium goods-name text-overflow-2">{{ o.goods_name || '--' }}</text>
                <view class="code-pill flex flex-ai-center flex-js-center">
                  <text class="MiSans-Regular code-text">编号 #{{ o.collection_code || '--' }}</text>
                </view>
              </view>
              <view class="flex flex-ai-end flex-js-sb">
                <view class="flex flex-ai-end">
                  <text class="MiSans-Regular price-label">支付金额</text>
                  <text class="MiSans-Demibold price-val">¥ {{ priceOf(o) }}</text>
                </view>
              </view>
            </view>
          </view>
        </view>
        <view v-if="!cuurentBatchList.length" class="empty-box">
          <text class="MiSans-Regular empty-text">暂无批量付订单</text>
        </view>
      </view>
    </template>

    <!-- 寄售订单 -->
    <view v-else-if="tabIndex === 1" class="order-list">
      <view v-for="c in filteredConsigns" :key="c.id" class="order-card" @click="toConsign(c)">
        <view class="card-top flex flex-ai-center flex-js-sb">
          <view class="flex flex-ai-center card-top-left">
            <text class="MiSans-Regular time-text">{{ formatDate(c.createtime) }}</text>
          </view>
          <view class="status-badge" :class="c.status === 1 ? 'green' : 'gray'">
            <text class="MiSans-Regular status-text">{{ c.status === 1 ? '寄售中' : '已成交' }}</text>
          </view>
        </view>
        <view class="card-body flex flex-ai-stretch">
          <img class="goods-thumb" :src="thumbOf(c)" mode="aspectFill" />
          <view class="goods-meta flex flex-dir-col flex-js-sb flex-1">
            <view>
              <text class="MiSans-Medium goods-name text-overflow-2">{{ c.goods_name || '--' }}</text>
              <view class="code-pill flex flex-ai-center flex-js-center">
                <text class="MiSans-Regular code-text">编号 #{{ c.collection_code || '--' }}</text>
              </view>
            </view>
            <view class="flex flex-ai-end flex-js-sb">
              <view class="flex flex-ai-end">
                <text class="MiSans-Regular price-label">寄售价格</text>
                <text class="MiSans-Demibold price-val">¥ {{ c.price }}</text>
              </view>
              <view
                v-if="c.status === 1"
                class="ghost-btn flex flex-ai-center flex-js-center"
                @click.stop="cancelConsign(c)"
              >
                <text class="MiSans-Regular ghost-text">取消寄售</text>
              </view>
            </view>
          </view>
        </view>
      </view>
      <view v-if="!filteredConsigns.length" class="empty-box">
        <text class="MiSans-Regular empty-text">暂无寄售订单</text>
      </view>
    </view>

    <!-- 委托 / 求购订单 -->
    <view v-else class="order-list">
      <view
        v-for="o in filteredOrders"
        :key="o.id"
        class="order-card"
        @click="toDetail(o)"
      >
        <view class="card-top flex flex-ai-center flex-js-sb">
          <view class="flex flex-ai-center card-top-left">
            <text class="MiSans-Regular time-text">{{ formatDate(o.updatetime) }}</text>
          </view>
          <view class="status-badge" :class="statusTheme(o)">
            <text class="MiSans-Regular status-text">{{ statusLabel(o) }}</text>
          </view>
        </view>
        <view class="card-body flex flex-ai-stretch">
          <img class="goods-thumb" :src="thumbOf(o)" mode="aspectFill" />
          <view class="goods-meta flex flex-dir-col flex-js-sb flex-1">
            <view>
              <text class="MiSans-Medium goods-name text-overflow-2">{{ o.goods_name || '--' }}</text>
              <view class="code-pill flex flex-ai-center flex-js-center">
                <text class="MiSans-Regular code-text">数量 ×{{ o.number || 1 }}</text>
              </view>
            </view>
            <view class="flex flex-ai-end flex-js-sb">
              <view class="flex flex-ai-end">
                <text class="MiSans-Regular price-label">支付金额</text>
                <text class="MiSans-Demibold price-val">¥ {{ priceOf(o) }}</text>
              </view>
              <view v-if="o.order_status === 1" class="pay-btn flex flex-ai-center flex-js-center" @click.stop="payOrder(o)">
                <text class="MiSans-Medium pay-btn-text">去支付</text>
              </view>
            </view>
          </view>
        </view>
      </view>
      <view v-if="!filteredOrders.length" class="empty-box">
        <text class="MiSans-Regular empty-text">暂无委托订单</text>
      </view>
    </view>

    <!-- 批量付底部操作 -->
    <view v-if="tabIndex === 0 && currentType === 2 && list.length" class="batch-action flex flex-js-sb">
      <view class="batch-btn ghost flex flex-ai-center flex-js-center" @click="showCancel = true">
        <text class="MiSans-Medium ghost-btn-text">取消订单</text>
      </view>
      <view
        class="batch-btn primary flex flex-ai-center flex-js-center"
        :class="{ disabled: !checkIds.length }"
        @click="createPayOrder"
      >
        <text class="MiSans-Demibold primary-btn-text">确认</text>
      </view>
    </view>

    <!-- 取消确认弹窗 -->
    <view v-if="showCancel" class="modal-mask" @click="showCancel = false"></view>
    <view v-if="showCancel" class="modal">
      <view class="text-center ptb-20 font-color-dark font-w-500">您确定要取消该批付订单吗？</view>
      <view class="font-size-12 modal-tip">1.取消订单将会限制一段时间使用批量购买功能</view>
      <view class="font-size-12 modal-tip">2.累计取消3次将永久限制使用批量购买功能</view>
      <view class="modal-btns flex">
        <view class="modal-btn flex flex-ai-center flex-js-center" @click="showCancel = false">取消</view>
        <view class="modal-btn ok flex flex-ai-center flex-js-center" @click="submitCancel">确定</view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { fetchOrderList, fetchConsignList, asset } from '@/utils/api'
import { ossImg } from '@/api'

const router = useRouter()

const navBarHeight = ref(44)
const filterBlockHeight = ref(86)
const tabIndex = ref(0)
const currentType = ref(1)
const batchPayWay = ref('huifu')
const showCancel = ref(false)
const list = ref([])
const consigns = ref([])
const consignStatus = ref('')
const search = reactive({ page: 1, status: 0 })

const tabList = [
  { name: '常规订单' },
  { name: '寄售订单' },
  { name: '委托订单' },
  { name: '求购订单' },
]
const orderMap = [
  { name: '全部', status: 0, type: 1 },
  { name: '待付款', status: 1, type: 1 },
  { name: '已完成', status: 2, type: 1 },
  { name: '已取消', status: 3, type: 1 },
  { name: '进行中', status: 7, type: 1 },
  { name: '批量付', type: 2, status: 0 },
]
const consignStatusList = [
  { name: '全部', status: '' },
  { name: '寄售中', status: '1' },
  { name: '已成交', status: '2' },
]
const statusList = [
  { name: '全部', status: null },
  { name: '委托中', status: 2 },
  { name: '已成交', status: 3 },
  { name: '已取消', status: 4 },
]
const begStatusList = [
  { name: '全部', status: null },
  { name: '求购中', status: 2 },
  { name: '已成交', status: 3 },
  { name: '已取消', status: 4 },
]

const currenIndex = computed(
  () => orderMap.findIndex((c) => c.status === search.status && currentType.value === c.type)
)
const cuurentBatchList = computed(() =>
  currentType.value === 1 || !list.value.length
    ? []
    : list.value.filter((o) => o.income_type && o.income_type.includes(batchPayWay.value))
)
const checkIds = computed(() => cuurentBatchList.value.filter((o) => o.check).map((o) => o.id))

const filteredOrders = computed(() => {
  if (currentType.value !== 1) return []
  if (tabIndex.value === 0 && search.status) return list.value.filter((o) => o.order_status === search.status)
  return list.value
})
const filteredConsigns = computed(() => {
  if (!consignStatus.value) return consigns.value
  return consigns.value.filter((c) => String(c.status) === String(consignStatus.value))
})

function goBack() {
  if (window.history.length > 1) router.back()
  else router.push('/pages/my/my')
}
function changeTab(i) {
  tabIndex.value = i
  if (i === 0) {
    currentType.value = 1
    search.status = orderMap[currenIndex.value] ? orderMap[currenIndex.value].status : 0
  }
}
function changOrderStatus(c) {
  currentType.value = c.type
  search.status = c.status
}
function changeConsignStatus(c) {
  consignStatus.value = c.status
}
function changeStatus(c) {
  search.status = c.status
}

function payTagOf(o) {
  if (o.income_type && o.income_type.includes('huifu')) return '汇付'
  if (o.income_type && o.income_type.includes('yibao')) return '易宝'
  return ''
}
function thumbOf(o) {
  const src = o.listimg || (o.product && o.product.listimg) || ''
  if (!src) return ''
  return src.startsWith('http') ? src : ossImg(src.split('?')[0])
}
function priceOf(o) {
  return o.total_price || (parseFloat(o.price || 0) * (o.number || 1)).toFixed(2)
}
const STATUS_MAP = { 0: '已完成', 1: '待付款', 2: '进行中', 3: '已取消', 4: '已取消', 7: '进行中' }
function statusLabel(o) {
  return STATUS_MAP[o.order_status] || '--'
}
function statusTheme(o) {
  if (o.order_status === 1) return 'red'
  if (o.order_status === 3 || o.order_status === 4) return 'gray'
  return 'green'
}
function formatDate(ts) {
  if (!ts) return '--'
  const d = new Date(ts * 1000)
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(
    d.getMinutes()
  )}:${p(d.getSeconds())}`
}

function toDetail(o) {
  // 原站：常规/批量 -> defaultDetail；委托 -> entrust/info；求购 -> beg/info
  if (tabIndex.value === 2) {
    router.push({ path: '/pages/order/entrust/info', query: { id: o.id } })
  } else if (tabIndex.value === 3) {
    router.push({ path: '/pages/order/beg/info', query: { id: o.id } })
  } else {
    router.push({ path: '/pages/order/defaultDetail', query: { id: o.id } })
  }
}
function toConsign(c) {
  router.push({ path: '/pages/consignments/consignments', query: { id: c.id } })
}
function cancelOrder(o) {
  uni.showToast({ title: '原站触发取消确认', icon: 'none' })
}
function cancelConsign(c) {
  uni.showToast({ title: '原站触发取消寄售确认', icon: 'none' })
}
function payOrder(o) {
  uni.showToast({ title: '原站跳转收银台', icon: 'none' })
}
function createPayOrder() {
  if (!checkIds.value.length) return
  uni.showToast({ title: '原站批量付需勾选订单', icon: 'none' })
}
function submitCancel() {
  showCancel.value = false
  uni.showToast({ title: '已取消批付订单', icon: 'none' })
}

onMounted(async () => {
  list.value = await fetchOrderList({ page: 1, limit: 15, type: 1, status: 0 })
  consigns.value = await fetchConsignList({ page: 1, limit: 15 })
})
</script>

<style scoped>
@import '@/styles/atomic.css';

.order-list-page {
  min-height: 100vh;
  background: #f7f7f7;
  overflow-y: auto;
  padding-bottom: 60rpx;
}
.order-list-page.batch {
  padding-bottom: calc(56rpx + 92rpx + env(safe-area-inset-bottom));
}

.navbar {
  position: relative;
  height: 88rpx;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
}
.navbar-left {
  position: absolute;
  left: 26rpx;
  top: 0;
  bottom: 0;
  display: flex;
  align-items: center;
}
.navbar-left img {
  width: 34rpx;
}
.navbar-title {
  font-size: 32rpx;
  color: #1a2438;
  font-family: MiSans-Demibold;
}

.filter-placeholder {
  width: 100%;
  background: #fff;
}
.filter-fixed {
  position: fixed;
  left: 0;
  right: 0;
  z-index: 30;
  background: #fff;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.03);
}
.main-tabs {
  background: #fff;
}
.nav-tabs-scroll {
  width: 100%;
  white-space: nowrap;
}
.nav-tabs-inner {
  display: inline-flex;
  align-items: center;
  flex-wrap: nowrap;
  height: 88rpx;
  padding: 0 12rpx;
  white-space: nowrap;
  box-sizing: border-box;
}
.main-tab-item {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  height: 88rpx;
  padding: 0 24rpx;
  white-space: nowrap;
}
.main-tab-item .tab-label {
  font-size: 28rpx;
  color: #999;
  white-space: nowrap;
}
.main-tab-item.active .tab-label {
  color: #1a2438;
  font-family: MiSans-Demibold, sans-serif;
}
.main-tab-item.active::after {
  content: '';
  position: absolute;
  left: 50%;
  bottom: 10rpx;
  width: 40rpx;
  height: 6rpx;
  background: #1a2438;
  border-radius: 3rpx;
  transform: translateX(-50%);
}
.filter-bar {
  padding: 16rpx 0 12rpx;
  background: #fff;
}
.filter-scroll {
  width: 100%;
  white-space: nowrap;
}
.filter-inner {
  display: inline-flex;
  align-items: center;
  flex-wrap: nowrap;
  padding: 0 28rpx;
  white-space: nowrap;
}
.filter-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  height: 56rpx;
  padding: 0 28rpx;
  margin-right: 16rpx;
  background: #f3f6f8;
  border-radius: 12rpx;
  white-space: nowrap;
}
.filter-chip .chip-text {
  font-size: 24rpx;
  color: #666;
  white-space: nowrap;
}
.filter-chip.on {
  background: #e0f8ee;
}
.filter-chip.on .chip-text {
  color: #58c092;
}

.order-list-container,
.batch-order-list-container {
  padding: 20rpx 28rpx 40rpx;
}
.order-card {
  padding: 24rpx;
  margin-bottom: 20rpx;
  background: #fff;
  border-radius: 20rpx;
  box-sizing: border-box;
}
.card-top {
  margin-bottom: 20rpx;
}
.card-top-left {
  min-width: 0;
  flex: 1;
}
.time-text {
  font-size: 22rpx;
  color: #999;
}
.pay-tag {
  width: 32rpx;
  height: 32rpx;
  margin-left: 12rpx;
  border: 1rpx solid #c8c8c8;
  border-radius: 6rpx;
  font-size: 18rpx;
  color: #999;
  display: flex;
  align-items: center;
  justify-content: center;
}
.pay-tag-text {
  font-size: 18rpx;
  transform: scale(0.9);
}
.status-badge {
  padding: 4rpx 14rpx;
  border-radius: 8rpx;
  flex-shrink: 0;
}
.status-badge.gray {
  background: rgba(0, 0, 0, 0.06);
}
.status-badge.gray .status-text {
  color: #999;
}
.status-badge.green {
  background: rgba(106, 162, 123, 0.12);
}
.status-badge.green .status-text {
  color: #5a9a45;
}
.status-badge.red {
  background: rgba(250, 81, 81, 0.1);
}
.status-badge.red .status-text {
  color: #fa5151;
}
.status-text {
  font-size: 22rpx;
}
.card-body {
  display: flex;
  align-items: stretch;
}
.goods-thumb {
  width: 160rpx;
  height: 160rpx;
  border-radius: 12rpx;
  background: #333;
  flex-shrink: 0;
}
.goods-meta {
  min-width: 0;
  margin-left: 20rpx;
}
.goods-name {
  font-size: 28rpx;
  color: #1a2438;
  line-height: 1.4;
}
.code-pill {
  display: inline-flex;
  margin-top: 12rpx;
  height: 40rpx;
  padding: 0 16rpx;
  background: #f5f5f5;
  border-radius: 20rpx;
  font-size: 20rpx;
  color: #999;
}
.code-text {
  font-size: 20rpx;
  color: #999;
}
.card-bottom {
  margin-top: 16rpx;
}
.price-label {
  font-size: 24rpx;
  color: #666;
  margin-right: 8rpx;
}
.price-val {
  font-size: 28rpx;
  color: #1a2438;
}
.pay-btn {
  height: 56rpx;
  padding: 0 28rpx;
  background: #6aa27b;
  border-radius: 28rpx;
}
.pay-btn-text {
  font-size: 24rpx;
  color: #fff;
}
.ghost-btn {
  height: 56rpx;
  padding: 0 24rpx;
  background: #f5f5f5;
  border-radius: 28rpx;
}
.ghost-text {
  font-size: 24rpx;
  color: #666;
}

.pay-type-radio {
  display: flex;
  gap: 24rpx;
  margin-bottom: 20rpx;
}
.pay-type-radio .item {
  box-sizing: border-box;
  flex: 1;
  background-color: #f4f6fa;
  padding: 12rpx 20rpx;
  border-radius: 24rpx;
  font-size: 24rpx;
  color: #000;
}
.pay-type-radio .item.active {
  background: #fff;
  color: #555;
}
.radio-label {
  flex: 1;
  font-size: 24rpx;
}
.radio-icon {
  width: 32rpx;
  height: 32rpx;
  border-radius: 50%;
  border: 2rpx solid #c8c8c8;
  background: #fff;
  box-sizing: border-box;
}
.radio-on {
  border-color: #6aa27b;
  background: #6aa27b;
  box-shadow: inset 0 0 0 6rpx #fff;
}

.empty-box {
  padding: 120rpx 0;
  text-align: center;
}
.empty-text {
  font-size: 26rpx;
  color: #999;
}

.batch-action {
  position: fixed;
  left: 0;
  bottom: 0;
  z-index: 2;
  width: 100%;
  padding: 16rpx 28rpx calc(28rpx + env(safe-area-inset-bottom));
  background: #fff;
  box-sizing: border-box;
  gap: 20rpx;
}
.batch-btn {
  height: 88rpx;
  border-radius: 16rpx;
}
.batch-btn.ghost {
  width: 240rpx;
  background: #f3f6f8;
}
.batch-btn.primary {
  flex: 1;
  background: #6aa27b;
}
.batch-btn.primary.disabled {
  opacity: 0.45;
}
.ghost-btn-text {
  font-size: 28rpx;
  color: #1a2438;
}
.primary-btn-text {
  font-size: 28rpx;
  color: #fff;
}

.modal-mask {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.55);
  z-index: 40;
}
.modal {
  position: fixed;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 600rpx;
  background: #fff;
  border-radius: 20rpx;
  z-index: 41;
  padding-bottom: 20rpx;
  text-align: center;
  color: #1a2438;
  font-size: 28rpx;
}
.modal-tip {
  color: #666;
  padding: 0 30rpx;
  text-align: left;
  line-height: 1.6;
}
.modal-btns {
  margin-top: 30rpx;
  border-top: 1rpx solid #eee;
}
.modal-btn {
  flex: 1;
  height: 88rpx;
  color: #666;
  font-size: 30rpx;
}
.modal-btn.ok {
  color: #6aa27b;
}
</style>
