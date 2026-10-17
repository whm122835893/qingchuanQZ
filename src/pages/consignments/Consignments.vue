<template>
  <view class="consign-page">
    <view class="tnav">
      <view class="tnav-left" @click="goBack">
        <img :src="asset('static/common/back_default.png')" mode="widthFix" />
      </view>
      <text class="tnav-title">寄售藏品</text>
    </view>

    <view class="page-body">
      <!-- 藏品卡 -->
      <view class="goods-card flex flex-ai-stretch">
        <img class="goods-thumb" :src="thumbSrc" mode="aspectFill" />
        <view class="goods-info flex flex-dir-col flex-js-sb">
          <view class="flex flex-dir-col">
            <text class="MiSans-Medium text-overflow goods-name">{{ name || '--' }}</text>
            <text class="MiSans-Regular goods-sub">编号 #{{ collectionCode || '--' }}</text>
          </view>
          <view class="floor-badge flex flex-ai-center flex-js-center" @click="onFloorTap">
            <text class="MiSans-Regular floor-text">当前寄售地板价 {{ floorPriceText }}</text>
            <img class="arrow" :src="asset('static/wallet/arrow_right.png')" mode="aspectFit" />
          </view>
        </view>
      </view>

      <!-- 设置单价/预计收入 -->
      <view class="sec">
        <text class="MiSans-Demibold sec-title">设置单价/预计收入</text>
        <view class="price-input flex flex-ai-center">
          <text class="MiSans-Demibold price-yuan">¥</text>
          <input
            class="MiSans-Regular flex-1 price-field" type="number"
            placeholder="请输入寄售的价格"
            placeholder-class="price-ph"
            :value="sellingPrice"
            @input="iptSellingPrice"
          />
        </view>
        <view class="fee-row flex flex-js-sb flex-ai-center">
          <text class="MiSans-Regular fee-label">总售价</text>
          <text class="MiSans-Regular fee-value">¥ {{ totalPriceText }}</text>
        </view>
        <view class="fee-row flex flex-js-sb flex-ai-center" @click="servicePop = true">
          <text class="MiSans-Regular fee-label">服务费 ({{ ratePercent }}%)</text>
          <text class="MiSans-Regular fee-value">- ¥ {{ servicePrice }}</text>
        </view>
        <view class="fee-row flex flex-js-sb flex-ai-center">
          <text class="MiSans-Regular fee-label">预计收入所得</text>
          <text class="MiSans-Demibold total">≈ ¥ {{ incomeText }}</text>
        </view>
      </view>

      <!-- 支付方式 -->
      <view class="sec">
        <text class="MiSans-Demibold sec-title">支付方式</text>
        <view class="account-row flex flex-ai-center flex-js-sb" @click="toggleHuifu">
          <view class="flex flex-ai-center">
            <img class="account-icon" :src="asset('static/wallet/huifu.png')" mode="aspectFit" />
            <text class="MiSans-Medium account-name">汇付天下</text>
          </view>
          <img
            v-if="huifuOpened"
            class="radio"
            :src="asset(huifuSelected ? 'static/common/radio_sel.png' : 'static/common/radio_default.png')"
            mode="aspectFit"
          />
          <view v-else class="open-btn flex flex-ai-center flex-js-center" @click.stop="openHuiFuWallet">
            <text class="MiSans-Regular open-btn-text">去开通</text>
          </view>
        </view>
      </view>

      <!-- 寄售须知 -->
      <view class="sec">
        <text class="MiSans-Demibold sec-title">寄售须知</text>
        <view class="notice-list">
          <text class="MiSans-Regular notice-item"
            >1.您作为卖方在平台出售数字藏品应按照国家税收法律法规依法纳税，平台将根据相关法律代扣代缴相关税款。</text
          >
          <text class="MiSans-Regular notice-item"
            >2.您出售数字藏品将按成交金额收取{{ ratePercent }}%的服务费，服务费将从您的交易金额中直接扣除。</text
          >
          <text class="MiSans-Regular notice-item"
            >3.请确保您的数字藏品符合平台规则及法律法规，如有违规行为平台有权下架并追究责任。</text
          >
          <text class="MiSans-Regular notice-item"
            >4.您同意授权平台使用您的交易数据用于风控、统计分析等合法用途。</text
          >
        </view>
        <view class="agree-row flex flex-ai-center" @click="agreed = !agreed">
          <img
            class="radio"
            :src="asset(agreed ? 'static/common/radio_sel.png' : 'static/common/radio_default.png')"
            mode="aspectFit"
          />
          <text class="MiSans-Regular agree-text"
            >我已阅读并同意<text class="agree-link" @click.stop="toAgreement('寄售协议')">《寄售协议》</text></text
          >
        </view>
      </view>
    </view>

    <view class="footer">
      <view
        class="submit-btn flex flex-ai-center flex-js-center"
        :class="{ disabled: isDisabled }"
        @click="onSubmitTap"
      >
        <text class="MiSans-Demibold submit-text">立即寄售</text>
      </view>
    </view>

    <!-- 服务费说明 w-toast -->
    <view v-if="servicePop" class="toast-mask" @click.self="servicePop = false">
      <view class="toast-box">
        <text class="toast-title">{{ ratePercent }}%</text>
        <text class="toast-content">服务费 ({{ ratePercent }}%)</text>
        <view class="toast-btns">
          <view class="modal-btn primary" @click="servicePop = false">我知道了</view>
        </view>
      </view>
    </view>

    <!-- 确认寄售 w-toast -->
    <view v-if="showPop" class="toast-mask" @click.self="showPop = false">
      <view class="toast-box">
        <text class="toast-content">您确认以{{ sellingPrice }}元出售吗?</text>
        <view class="toast-btns">
          <view class="modal-btn" @click="showPop = false">取消</view>
          <view class="modal-btn primary" @click="popConfim">确认</view>
        </view>
      </view>
    </view>

    <!-- 低于地板价 20% 二次确认 w-modal -->
    <view v-if="showPop2" class="modal-mask" @click.self="showPop2 = false">
      <view class="modal-box">
        <text class="modal-title">再次确认</text>
        <view class="modal-body">
          <text class="low-price">{{ sellingPrice }}</text>
          <view class="mtb-12">您的寄售价格低于目前市场最低价20%以上,确认寄售吗?</view>
          <view class="flex mt-8" style="display: flex; justify-content: center">
            <text class="fee-label">目前最低价位：</text>
            <text class="price2">{{ lowPrice }}</text>
          </view>
          <view class="flex mt-8" style="display: flex; justify-content: center">
            <text class="fee-label">中文金额：</text>
            <text style="color: #ff8c05">{{ lowPriceText }}</text>
          </view>
          <text class="hint">（市场价格实时变动中,最低价格仅供参考）</text>
        </view>
        <view class="modal-btns">
          <view class="modal-btn" @click="showPop2 = false">取消</view>
          <view class="modal-btn primary" @click="showPop2 = false; showPop3 = true">确认</view>
        </view>
      </view>
    </view>

    <!-- 最终确认 w-toast -->
    <view v-if="showPop3" class="toast-mask" @click.self="showPop3 = false">
      <view class="toast-box">
        <text class="toast-title">最终确认</text>
        <text class="toast-content"
          >您的寄售价格低于目前市场最低价20%,确认寄售后造成的损失将由您个人承担,确认寄售?</text
        >
        <view class="toast-btns">
          <view class="modal-btn" @click="showPop3 = false">取消</view>
          <view class="modal-btn primary" @click="showPop3 = false; pwdPop = true">确认</view>
        </view>
      </view>
    </view>

    <!-- 操作密码 password-authentification -->
    <view v-if="pwdPop" class="modal-mask" @click.self="pwdPop = false">
      <view class="auth-popup">
        <view class="auth-close" @click="pwdPop = false"></view>
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
          <view class="num-key" @click="pwdPop = false">取消</view>
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
import { fetchTradeBaseInfo, asset } from '@/utils/api'
import { ossImg } from '@/api'

const route = useRoute()
const router = useRouter()

const info = ref({})
const sellingPrice = ref('')
const agreed = ref(false)
const huifuOpened = ref(true)
const huifuSelected = ref(true)
const servicePop = ref(false)
const showPop = ref(false)
const showPop2 = ref(false)
const showPop3 = ref(false)
const pwdPop = ref(false)
const pwd = ref('')

const name = computed(() => info.value.name || (info.value.product && info.value.product.name) || '')
const collectionCode = computed(
  () => (info.value.product && info.value.product.collection_code) || info.value.collection_code || ''
)
const ratePercent = computed(() => info.value.rate || info.value.platform_service_rate || 2)
const lowPrice = computed(() => info.value.low_price || info.value.lowest_price || '0.00')
const lowPriceText = computed(() => info.value.low_price_text || '')
const floorPriceText = computed(() => info.value.floor_price || '0.00')

const thumbSrc = computed(() => {
  const src =
    (info.value.product && info.value.product.main_image) || info.value.main_image || ''
  return src ? (src.startsWith('http') ? src : ossImg(src)) : ''
})
const totalPriceText = computed(() => (parseFloat(sellingPrice.value) || 0).toFixed(2))
const servicePrice = computed(
  () => ((parseFloat(sellingPrice.value) || 0) * (Number(ratePercent.value) || 0) / 100).toFixed(2)
)
const incomeText = computed(
  () => ((parseFloat(sellingPrice.value) || 0) - parseFloat(servicePrice.value)).toFixed(2)
)
const isDisabled = computed(() => !sellingPrice.value || !agreed.value || !huifuSelected.value)

function goBack() {
  if (window.history.length > 1) router.back()
  else router.push('/pages/market/market')
}
function iptSellingPrice(e) {
  sellingPrice.value = e.target.value
}
function toggleHuifu() {
  if (!huifuOpened.value) return
  huifuSelected.value = !huifuSelected.value
}
function openHuiFuWallet() {
  router.push('/pages/wallet/wallet')
}
function onFloorTap() {
  router.push({ path: '/pages/market/sellInfo', query: { id: route.query.id || 226 } })
}
function toAgreement(name) {
  router.push({ path: '/pages/agreement/agreement', query: { title: name } })
}
function toForget() {
  pwdPop.value = false
  router.push('/pages/my/setting')
}
function pressKey(k) {
  if (pwd.value.length >= 6) return
  pwd.value += k
  if (pwd.value.length === 6) setTimeout(confim, 150)
}
function onDotTap(i) {
  if (i > pwd.value.length) return
  pwd.value = pwd.value.slice(0, i - 1)
}
function confim() {
  pwdPop.value = false
  pwd.value = ''
  uni.showToast({ title: '原站寄售需人机验证', icon: 'none' })
}
function popConfim() {
  showPop.value = false
  // 低于地板价 20% 时进入二次确认
  if (parseFloat(sellingPrice.value) < parseFloat(floorPriceText.value) * 0.8) {
    showPop2.value = true
  } else {
    pwdPop.value = true
  }
}
function onSubmitTap() {
  if (isDisabled.value) {
    uni.showToast({ title: '请完善寄售信息', icon: 'none' })
    return
  }
  showPop.value = true
}

onMounted(async () => {
  const data = await fetchTradeBaseInfo({ id: route.query.id || 226 })
  if (data) {
    info.value = data
    sellingPrice.value = data.price || ''
  }
})
</script>

<style scoped>
@import '@/styles/atomic.css';
@import '@/styles/trade.css';

.arrow {
  width: 12rpx;
  height: 20rpx;
  margin-left: 8rpx;
}
.low-price {
  font-size: 40rpx;
  color: #1a2438;
  font-weight: 700;
}
.price2 {
  font-size: 24rpx;
  color: #1a2438;
  font-weight: 700;
}
.hint {
  display: block;
  margin-top: 12rpx;
  font-size: 22rpx;
  color: #999;
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
