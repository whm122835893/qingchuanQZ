<template>
  <view class="order-detail-page" id="order-details">
    <!-- 导航 -->
    <view class="tnav" style="background: transparent">
      <view class="tnav-left" @click="goBack">
        <img :src="asset('static/common/back_default.png')" mode="widthFix" />
      </view>
      <text class="tnav-title">{{ title }}</text>
    </view>

    <view class="page-body">
      <!-- OrderStatus -->
      <view class="status-hero">
        <text class="status-hero-title">{{ statusTitle }}</text>
        <text class="status-hero-desc">{{ statusDesc }}</text>
      </view>

      <!-- GoodsBar -->
      <view class="goods-bar">
        <img class="goods-thumb-s" :src="thumbSrc" mode="aspectFill" />
        <view class="goods-meta flex flex-dir-col flex-js-sb">
          <text class="MiSans-Medium goods-name text-overflow-2">{{ order.goods_name || '--' }}</text>
          <text class="MiSans-Regular price-val">¥ {{ order.price || '0.00' }}</text>
        </view>
      </view>

      <!-- GoodsInfo -->
      <view class="goods-info">
        <view class="detail-card">
          <view class="detail-head flex flex-ai-center flex-js-sb">
            <text class="MiSans-Regular head-label">订单编号</text>
            <view class="flex flex-ai-center" @click="copyText(displaySn)">
              <text class="MiSans-Regular head-sn">{{ displaySn }}</text>
              <img class="copy-white" :src="asset('static/icon/copy-white.png')" mode="aspectFit" />
            </view>
          </view>

          <view class="detail-body">
            <view v-if="multiCodes.length" class="row-line flex flex-js-sb flex-ai-center">
              <text class="MiSans-Regular row-label">商品编号</text>
              <view class="flex flex-w flex-js-end code-list">
                <text v-for="(c, i) in multiCodes" :key="i" class="MiSans-Regular row-value"
                  >#{{ c }}</text
                >
              </view>
            </view>
            <view class="row-line flex flex-js-sb flex-ai-center">
              <text class="MiSans-Regular row-label">订单金额</text>
              <text class="MiSans-Regular row-value">¥ {{ orderAmount }}</text>
            </view>
            <view v-if="discountAmount > 0" class="row-line flex flex-js-sb flex-ai-center">
              <text class="MiSans-Regular row-label">优惠金额</text>
              <text class="MiSans-Regular row-value">- ¥ {{ order.discount_amount }}</text>
            </view>
            <view class="row-line flex flex-js-sb flex-ai-center">
              <text class="MiSans-Regular row-label">支付金额</text>
              <text class="MiSans-Demibold pay-value">¥ {{ payAmount }}</text>
            </view>
            <view v-if="order.num || order.number" class="row-line flex flex-js-sb flex-ai-center">
              <text class="MiSans-Regular row-label">订单数量</text>
              <text class="MiSans-Regular row-value">{{ order.num || order.number }}</text>
            </view>
            <view v-if="order.createtime" class="row-line flex flex-js-sb flex-ai-center">
              <text class="MiSans-Regular row-label">创建时间</text>
              <text class="MiSans-Regular row-value">{{ formatDate(order.createtime) }}</text>
            </view>
            <view v-if="payWayLabel && !isPendingPay" class="row-line flex flex-js-sb flex-ai-center">
              <text class="MiSans-Regular row-label">{{ payWayTitle }}</text>
              <text class="MiSans-Regular row-value">{{ payWayLabel }}</text>
            </view>
            <view v-if="order.remark" class="remark-block">
              <text class="MiSans-Regular row-label">备注</text>
              <text class="MiSans-Regular remark-text">{{ order.remark }}</text>
            </view>
            <view v-if="order.card && order.card.length" class="card-block">
              <view
                v-for="(c, i) in order.card"
                :key="i"
                class="row-line flex flex-js-sb flex-ai-center"
              >
                <view class="flex-1">
                  <view class="flex flex-js-sb flex-ai-center">
                    <text class="MiSans-Regular row-label"
                      >E卡卡号{{ order.card.length === 1 ? '' : i + 1 }}</text
                    >
                    <view class="flex flex-ai-center" @click="copyText(c.card_sn)">
                      <text class="MiSans-Regular row-value">{{ c.card_sn }}</text>
                      <img class="copy-dark" :src="asset('static/icon/copy-dark.png')" mode="aspectFit" />
                    </view>
                  </view>
                  <view class="flex flex-js-sb flex-ai-center" style="margin-top: 16rpx">
                    <text class="MiSans-Regular row-label"
                      >E卡密码{{ order.card.length === 1 ? '' : i + 1 }}</text
                    >
                    <text class="MiSans-Regular row-value">{{ c.card_keys }}</text>
                  </view>
                </view>
              </view>
            </view>
          </view>
        </view>

        <!-- 待付款：选择支付方式 -->
        <view v-if="isPendingPay" class="sec">
          <text class="MiSans-Demibold sec-title">选择支付方式</text>
          <view class="pay-card flex flex-ai-center flex-js-sb" @click="selectHuifu">
            <view class="flex flex-ai-center">
              <img class="pay-icon" :src="asset('static/wallet/huifu.png')" mode="aspectFit" />
              <text class="MiSans-Medium pay-name">汇付天下</text>
            </view>
            <img class="radio" :src="asset('static/common/radio_sel.png')" mode="aspectFit" />
          </view>
        </view>

        <view class="sec">
          <text class="MiSans-Demibold sec-title">说明</text>
          <view class="notice-card">
            <text class="MiSans-Regular notice-line">1.超时未支付，系统会自动取消。</text>
            <text class="MiSans-Regular notice-line"
              >2.同一账号一段时间内累计取消3次订单，将会被限购一段时间。</text
            >
          </view>
        </view>
      </view>
    </view>

    <!-- OrderAction / MarkeyOrderAction -->
    <view v-if="order.order_status" class="order-action">
      <template v-if="order.order_status === 1">
        <view class="agree-row flex flex-ai-center" @click="agreed = !agreed">
          <img
            class="radio"
            :src="asset(agreed ? 'static/common/radio_sel.png' : 'static/common/radio_default.png')"
            mode="aspectFit"
          />
          <text class="MiSans-Regular agree-text"
            >我已阅读并同意QingChuan<text class="agree-link" @click.stop="toNotice">《购买须知》</text></text
          >
        </view>
        <view class="action-bar flex flex-ai-center flex-js-sb">
          <text class="MiSans-Demibold action-price">¥ {{ payPrice }}</text>
          <view class="flex flex-ai-center" style="flex-shrink: 0">
            <view class="ghost-btn flex flex-ai-center flex-js-center" @click="showCancelToast = true">
              <text class="MiSans-Medium ghost-btn-text">取消订单</text>
            </view>
            <view
              class="pay-btn flex flex-ai-center flex-js-center"
              :class="{ disabled: !agreed }" style="margin-left: 16rpx"
              @click="onPayTap"
            >
              <text class="MiSans-Demibold pay-btn-text">立即支付</text>
            </view>
          </view>
        </view>
      </template>

      <template v-else>
        <view class="action-bar flex flex-ai-center flex-js-sb">
          <!-- 已成交/进行中：取消 + 继续xxx -->
          <template v-if="order.order_status === 2">
            <view class="ghost-btn flex flex-ai-center flex-js-center" @click="showCancelToast = true">
              <text class="MiSans-Medium ghost-btn-text">取消订单</text>
            </view>
            <view class="pay-btn flex flex-ai-center flex-js-center" style="flex: 1" @click="toContinue">
              <text class="MiSans-Demibold pay-btn-text">{{ continueText }}</text>
            </view>
          </template>
          <!-- 转入中 -->
          <view
            v-else-if="order.order_status === 7"
            class="pay-btn flex flex-ai-center flex-js-center" style="flex: 1"
          >
            <text class="MiSans-Demibold pay-btn-text">转入中</text>
          </view>
          <!-- 已取消 -->
          <template v-else-if="order.order_status === 3">
            <view class="ghost-btn flex flex-ai-center flex-js-center" @click="toCollection">
              <text class="MiSans-Medium ghost-btn-text">我的收藏</text>
            </view>
            <view class="pay-btn flex flex-ai-center flex-js-center" style="flex: 1" @click="toContinue">
              <text class="MiSans-Demibold pay-btn-text">{{ continueText }}</text>
            </view>
          </template>
          <!-- 其他完成态 -->
          <view v-else class="pay-btn flex flex-ai-center flex-js-center" style="flex: 1" @click="toContinue">
            <text class="MiSans-Demibold pay-btn-text">{{ continueText }}</text>
          </view>
        </view>
      </template>
    </view>

    <!-- 取消订单确认（w-modal 等价） -->
    <view v-if="showCancelToast" class="modal-mask" @click.self="showCancelToast = false">
      <view class="modal-box">
        <text class="modal-title">提示</text>
        <text class="modal-body">确认取消该订单？</text>
        <view class="modal-btns">
          <view class="modal-btn" @click="showCancelToast = false">取消</view>
          <view class="modal-btn primary" @click="doCancel">确认</view>
        </view>
      </view>
    </view>

    <!-- 操作密码（password-authentification / u-popup 等价） -->
    <view v-if="showPayPass" class="modal-mask" @click.self="showPayPass = false">
      <view class="auth-popup">
        <view class="auth-close" @click="showPayPass = false"></view>
        <text class="auth-title">请输入操作密码</text>
        <text class="auth-forget" @click="toForget">忘记密码？</text>
        <view class="pwd-dots">
          <view
            v-for="i in 6"
            :key="i"
            class="pwd-dot"
            :class="{ on: pwd.length >= i }"
            @click="onDotTap(i)"
          ></view>
        </view>
        <view class="num-pad">
          <view v-for="n in 9" :key="n" class="num-key" @click="pressKey(String(n))">{{ n }}</view>
          <view class="num-key" @click="showPayPass = false">取消</view>
          <view class="num-key" @click="pressKey('0')">0</view>
          <view class="num-key" @click="pwd = pwd.slice(0, -1)">删除</view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { fetchOrderDetail, asset } from '@/utils/api'
import { ossImg } from '@/api'

const route = useRoute()
const router = useRouter()

const props = defineProps({
  // 'default' | 'market' | 'regift'；不传时按路由路径自动判断
  variant: { type: String, default: '' },
})
// entrust/beg 详情页底部的「继续委托 / 继续求购」文案与原站一致
const isEntrustPath = computed(
  () => (props.variant || route.path).includes('entrust')
)
const isBegPath = computed(() => (props.variant || route.path).includes('beg'))
const continueText = computed(() => (isEntrustPath.value ? '继续委托' : isBegPath.value ? '继续求购' : '继续购买'))
const title = computed(() => '订单详情')

const order = ref({})
const agreed = ref(false)
const showCancelToast = ref(false)
const showPayPass = ref(false)
const pwd = ref('')
const selectedPayWay = ref('huifu')

const thumbSrc = computed(() => {
  const src = order.value.listimg || order.value.main_image || ''
  if (!src) return ''
  return src.startsWith('http') ? src : ossImg(src)
})
const displaySn = computed(() => order.value.order_sn || order.value.order_id || '--')
const multiCodes = computed(() =>
  order.value.collection_code ? String(order.value.collection_code).split(',') : []
)
const orderAmount = computed(() => order.value.total_price || order.value.price || '0.00')
const discountAmount = computed(() => parseFloat(order.value.discount_amount) || 0)
const payAmount = computed(() => order.value.pay_price || orderAmount.value)
const payPrice = computed(() => order.value.pay_price || orderAmount.value)
const isPendingPay = computed(() => order.value.order_status === 1)
const payWayTitle = computed(() => (order.value.pay_way === 'yibao' ? '易宝支付' : '汇付天下'))
const payWayLabel = computed(
  () => order.value.pay_way === 'yibao' ? '易宝' : order.value.pay_way === 'huifu' ? '汇付天下' : ''
)

const STATUS_TEXT = {
  0: ['交易完成', '您的订单已完成'],
  1: ['待付款', '请在有效时间内完成支付'],
  2: ['进行中', '平台正在为您撮合交易'],
  3: ['已取消', '订单已取消'],
  4: ['已取消', '订单已取消'],
  7: ['转入中', '藏品正在转入您的账户'],
}
const statusTitle = computed(() => (STATUS_TEXT[order.value.order_status] || ['订单详情', ''])[0])
const statusDesc = computed(() => (STATUS_TEXT[order.value.order_status] || ['', ''])[1])

function formatDate(ts) {
  if (!ts) return ''
  const d = new Date(Number(ts) * 1000)
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(
    d.getMinutes()
  )}:${p(d.getSeconds())}`
}
function copyText(t) {
  if (!t) return
  if (navigator.clipboard) navigator.clipboard.writeText(t)
  uni.showToast({ title: '已复制', icon: 'none' })
}
function goBack() {
  if (window.history.length > 1) router.back()
  else router.push('/pages/order/list')
}
function selectHuifu() {
  selectedPayWay.value = 'huifu'
}
function toNotice() {
  router.push({ path: '/pages/agreement/agreement', query: { title: '购买须知' } })
}
function toForget() {
  showPayPass.value = false
  router.push('/pages/my/setting')
}
function toCollection() {
  router.push('/pages/myCollection/myCollection')
}
function toContinue() {
  router.push('/pages/market/market')
}
function doCancel() {
  showCancelToast.value = false
  uni.showToast({ title: '原站取消订单需人机验证', icon: 'none' })
}
function onPayTap() {
  if (!agreed.value) {
    uni.showToast({ title: '请先阅读并同意购买须知', icon: 'none' })
    return
  }
  showPayPass.value = true
}
function pressKey(k) {
  if (pwd.value.length >= 6) return
  pwd.value += k
  if (pwd.value.length === 6) setTimeout(onPassRes, 150)
}
function onDotTap(i) {
  if (i > pwd.value.length) return
  pwd.value = pwd.value.slice(0, i - 1)
}
function onPassRes() {
  showPayPass.value = false
  pwd.value = ''
  uni.showToast({ title: '原站支付需人机验证', icon: 'none' })
}

onMounted(async () => {
  const data = await fetchOrderDetail({ id: route.query.id || 9001 })
  if (data) order.value = data
})
</script>

<style scoped>
@import '@/styles/atomic.css';
@import '@/styles/trade.css';

.order-detail-page {
  padding-top: 0;
}
.tnav {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  z-index: 30;
}
.page-body {
  padding-top: 120rpx;
}
.pay-name {
  margin-left: 16rpx;
  font-size: 28rpx;
  color: #1a2438;
}
.code-list {
  max-width: 420rpx;
  gap: 8rpx;
}
.num-pad {
  display: flex;
  flex-wrap: wrap;
  margin-top: 30rpx;
  border-top: 1rpx solid #f2f2f2;
  padding-top: 20rpx;
}
.num-key {
  width: 33.33%;
  height: 88rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  color: #1a2438;
}
</style>
