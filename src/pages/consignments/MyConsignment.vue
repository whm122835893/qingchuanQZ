<template>
  <view class="order-list-page">
    <view class="tnav" style="background: #fff">
      <view class="tnav-left" @click="goBack">
        <img :src="asset('static/common/back_default.png')" mode="widthFix" />
      </view>
      <text class="tnav-title">我的寄售</text>
      <view class="tnav-right" @click="toSearch">
        <img class="search-icon" :src="asset('static/icon/search.png')" mode="aspectFit" />
      </view>
    </view>

    <view class="order-list">
      <view v-for="item in list" :key="item.id" class="order-card" @click="toDetail(item)">
        <view class="card-top flex flex-ai-center flex-js-sb">
          <view class="flex flex-ai-center" style="min-width: 0; flex: 1">
            <text class="MiSans-Regular time-text">{{ formatDate(item.createtime) }}</text>
            <view v-if="payTags(item).length" class="flex flex-ai-center" style="margin-left: 12rpx">
              <view v-for="tg in payTags(item)" :key="tg" class="pay-tag flex flex-ai-center flex-js-center">
                <text class="MiSans-Regular">{{ tg }}</text>
              </view>
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
              <view v-if="codeText(item)" class="code-pill flex flex-ai-center flex-js-center">
                <text class="MiSans-Regular">编号 #{{ codeText(item) }}</text>
              </view>
            </view>
            <view class="flex flex-ai-end flex-js-sb" style="margin-top: 16rpx">
              <view class="flex flex-ai-end">
                <text class="MiSans-Regular price-label">寄售价格</text>
                <text class="MiSans-Demibold price-val">¥ {{ item.price }}</text>
              </view>
              <view
                v-if="item.status === 1"
                class="ghost-btn flex flex-ai-center flex-js-center"
                @click.stop="openCancel(item)"
              >
                <text class="MiSans-Regular ghost-btn-text">取消寄售</text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <view v-if="!list.length" class="empty">暂无寄售记录</view>
    </view>

    <!-- 取消寄售确认 w-toast -->
    <view v-if="cancelConsignmentPop" class="toast-mask" @click.self="cancelConsignmentPop = false">
      <view class="toast-box">
        <text class="toast-content">确认取消此寄售？</text>
        <view class="toast-btns">
          <view class="modal-btn" @click="cancelConsignmentPop = false">取消</view>
          <view class="modal-btn primary" @click="cancelConsignment">确认</view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { fetchMyConsignment, asset } from '@/utils/api'
import { ossImg } from '@/api'

const router = useRouter()

const list = ref([])
const cancelConsignmentPop = ref(false)

const STATUS_MAP = { 1: '寄售中', 2: '已成交', 3: '已取消' }

function statusLabel(o) {
  return STATUS_MAP[o.status] || '寄售中'
}
function statusTheme(o) {
  if (o.status === 2) return 'green'
  if (o.status === 3) return 'gray'
  return 'red'
}
function payTags(o) {
  return o.pay_way === 'yibao' ? ['易宝'] : o.pay_way === 'huifu' ? ['汇付'] : []
}
function codeText(o) {
  return o.collection_code || ''
}
function thumbOf(o) {
  const src = o.listimg || o.main_image || ''
  return src ? (src.startsWith('http') ? src : ossImg(src)) : ''
}
function formatDate(ts) {
  if (!ts) return ''
  const d = new Date(Number(ts) * 1000)
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(
    d.getMinutes()
  )}:${p(d.getSeconds())}`
}
function goBack() {
  if (window.history.length > 1) router.back()
  else router.push('/pages/my/my')
}
function toSearch() {
  router.push('/pages/consignments/search')
}
function toDetail(item) {
  router.push({ path: '/pages/consignments/consignments', query: { id: item.id } })
}
function openCancel() {
  cancelConsignmentPop.value = true
}
function cancelConsignment() {
  cancelConsignmentPop.value = false
  uni.showToast({ title: '原站取消寄售需人机验证', icon: 'none' })
}

onMounted(async () => {
  list.value = await fetchMyConsignment({ page: 1 })
})
</script>

<style scoped>
@import '@/styles/atomic.css';
@import '@/styles/trade.css';

.order-list-page {
  padding-top: 88rpx;
}
.search-icon {
  width: 36rpx;
  height: 36rpx;
}
.empty {
  padding: 100rpx 0;
  text-align: center;
  font-size: 26rpx;
  color: #999;
}
</style>
