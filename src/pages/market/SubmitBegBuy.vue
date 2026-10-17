<template>
  <view class="consign-page">
    <view class="tnav">
      <view class="tnav-left" @click="goBack">
        <img :src="asset('static/common/back_default.png')" mode="widthFix" />
      </view>
      <text class="tnav-title">发起求购</text>
    </view>

    <view class="page-body">
      <!-- 藏品卡 -->
      <view class="goods-card flex flex-ai-stretch">
        <img class="goods-thumb" :src="thumbSrc" mode="aspectFill" />
        <view class="goods-info flex flex-dir-col flex-js-sb">
          <view class="flex flex-dir-col">
            <text class="MiSans-Medium text-overflow goods-name">{{ info.name || '--' }}</text>
            <text class="MiSans-Regular goods-sub">市场参考单价 ¥{{ refPriceText }}</text>
          </view>
          <view class="floor-badge flex flex-ai-center flex-js-center">
            <text class="MiSans-Regular floor-text">最高求购价 {{ maxPriceText }}</text>
          </view>
        </view>
      </view>

      <!-- 求购数量 -->
      <view class="sec">
        <text class="MiSans-Demibold sec-title">求购数量</text>
        <view class="qty-box flex flex-ai-center">
          <view class="qty-btn flex flex-ai-center flex-js-center" @click="minus">
            <text class="MiSans-Regular minus" :style="{ color: form.number <= 1 ? '#bbb' : '#1a2438' }"
              >-</text
            >
          </view>
          <input
            class="MiSans-Demibold qty-input" type="number"
            :value="form.number"
            @input="changenum"
          />
          <view class="qty-btn flex flex-ai-center flex-js-center" @click="add">
            <text class="MiSans-Regular plus" :style="{ color: form.number >= maxNum ? '#bbb' : '#1a2438' }"
              >+</text
            >
          </view>
        </view>
      </view>

      <!-- 设置求购单价 -->
      <view class="sec">
        <text class="MiSans-Demibold sec-title">设置求购单价</text>
        <view class="price-input flex flex-ai-center">
          <text class="MiSans-Demibold price-yuan">¥</text>
          <input
            class="MiSans-Regular flex-1 price-field" type="number"
            :placeholder="placeholderTips"
            placeholder-class="price-ph"
            :value="form.price"
            @input="priceInput"
          />
        </view>
        <view class="fee-row flex flex-js-sb flex-ai-center">
          <text class="MiSans-Regular fee-label">合计预付</text>
          <text class="MiSans-Demibold total">¥ {{ totalPrice }}</text>
        </view>
      </view>

      <!-- 支付方式 -->
      <view class="sec">
        <view class="flex flex-ai-end">
          <text class="MiSans-Demibold sec-title no-mb">支付方式</text>
          <text class="MiSans-Regular pay-tip">*强烈建议勾选多个账户</text>
        </view>
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
          <view v-else class="open-btn flex flex-ai-center flex-js-center" @click.stop="toOpen">
            <text class="MiSans-Regular open-btn-text">去开通</text>
          </view>
        </view>
      </view>

      <!-- 求购说明 -->
      <view class="sec">
        <text class="MiSans-Demibold sec-title">求购说明</text>
        <view class="notice-list">
          <text class="MiSans-Regular notice-item"
            >1.自发求购订单您可选择求购信息的有效时长，当前默认选择为7天。在有效期限内，您的求购信息会展示给持有该藏品且有意出售的卖家。</text
          >
          <text class="MiSans-Regular notice-item"
            >2.若在期限内有卖家接受您的求购条件，系统将自动匹配并推进交易结算，若期限结束仍未成功匹配，已冻结的相应资金会解冻并退回您的账户。</text
          >
        </view>
        <view class="agree-row flex flex-ai-center" @click="agreed = !agreed">
          <img
            class="radio"
            :src="asset(agreed ? 'static/common/radio_sel.png' : 'static/common/radio_default.png')"
            mode="aspectFit"
          />
          <text class="MiSans-Regular agree-text"
            >我已阅读并同意<text class="agree-link" @click.stop="toAgreement('求购协议')">《求购协议》</text></text
          >
        </view>
      </view>
    </view>

    <view class="footer">
      <view
        class="submit-btn flex flex-ai-center flex-js-center"
        :class="{ disabled: disable || !agreed }"
        @click="onSubmitTap"
      >
        <text class="MiSans-Demibold submit-text">立即求购 · ¥{{ totalPrice }}</text>
      </view>
    </view>

    <view v-if="showPriceTips" class="toast-mask" @click.self="showPriceTips = false">
      <view class="toast-box">
        <text class="toast-content">您的出价高于或者等于目前市场最低价，你可以直接购买该藏品。</text>
        <view class="toast-btns">
          <view class="modal-btn" @click="showPriceTips = false">取消</view>
          <view class="modal-btn primary" @click="tipAction">去购买</view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { fetchTradeBaseInfo, asset } from '@/utils/api'
import { ossImg } from '@/api'

const route = useRoute()
const router = useRouter()

const info = ref({})
const form = reactive({ price: '', number: 1 })
const agreed = ref(false)
const huifuOpened = ref(true)
const huifuSelected = ref(true)
const showPriceTips = ref(false)

const maxNum = computed(() => info.value.batch_pay_num || 10)
const placeholderTips = computed(() =>
  form.price && Number(form.price) > Number(maxPriceText.value) ? '不能高于最高求购价' : '请输入求购单价'
)
const thumbSrc = computed(() => {
  const src = (info.value.product && info.value.product.main_image) || info.value.main_image || ''
  return src ? (src.startsWith('http') ? src : ossImg(src)) : ''
})
const refPriceText = computed(() => info.value.price || '0.00')
const maxPriceText = computed(() => info.value.max_price || info.value.price || '0.00')
const totalPrice = computed(() => ((parseFloat(form.price) || 0) * (form.number || 0)).toFixed(2))
const disable = computed(() => !form.price || Number(form.price) <= 0)

function goBack() {
  if (window.history.length > 1) router.back()
  else router.push('/pages/market/detail')
}
function priceInput(e) {
  form.price = e.target.value
}
function minus() {
  if (form.number <= 1) return
  form.number -= 1
}
function add() {
  if (form.number >= maxNum.value) return
  form.number += 1
}
function changenum(e) {
  const v = parseInt(e.target.value, 10)
  form.number = Number.isNaN(v) ? 1 : Math.min(Math.max(v, 1), maxNum.value)
}
function toggleHuifu() {
  if (!huifuOpened.value) return
  huifuSelected.value = !huifuSelected.value
}
function toOpen() {
  router.push('/pages/wallet/wallet')
}
function toAgreement(name) {
  router.push({ path: '/pages/agreement/agreement', query: { title: name } })
}
function tipAction() {
  showPriceTips.value = false
  router.push({ path: '/pages/market/detail', query: { id: route.query.id || 226 } })
}
function onSubmitTap() {
  if (disable.value || !agreed.value || !huifuSelected.value) {
    uni.showToast({ title: '请完善求购信息', icon: 'none' })
    return
  }
  if (Number(form.price) >= Number(info.value.floor_price || 0)) {
    showPriceTips.value = true
    return
  }
  uni.showToast({ title: '原站求购需人机验证', icon: 'none' })
}

onMounted(async () => {
  const data = await fetchTradeBaseInfo({ id: route.query.id || 226 })
  if (data) {
    info.value = data
    form.price = data.price || ''
  }
})
</script>

<style scoped>
@import '@/styles/atomic.css';
@import '@/styles/trade.css';
</style>
