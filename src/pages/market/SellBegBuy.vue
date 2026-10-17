<template>
  <view class="consign-page">
    <view class="tnav">
      <view class="tnav-left" @click="goBack">
        <img :src="asset('static/common/back_default.png')" mode="widthFix" />
      </view>
      <text class="tnav-title">以求购价出售</text>
    </view>

    <view class="page-body">
      <!-- 待售藏品 -->
      <view class="sec" style="margin-top: 0">
        <view class="flex flex-ai-center flex-js-sb" style="margin-bottom: 20rpx">
          <text class="MiSans-Demibold sec-title" style="margin-bottom: 0">待售藏品</text>
          <view
            v-if="userCollectionList.length"
            class="flex flex-ai-center"
            @click="showChoose = true"
          >
            <text class="MiSans-Regular change-text">更换藏品</text>
            <img class="change-arrow" :src="asset('static/wallet/arrow_right.png')" mode="aspectFit" />
          </view>
        </view>

        <view
          v-for="t in selectedList"
          :key="t.id + '-' + t.user_collection_id"
          class="goods-card flex flex-ai-stretch" style="margin-bottom: 20rpx"
        >
          <img class="goods-thumb" :src="thumbOf(t)" mode="aspectFill" />
          <view class="goods-info flex flex-dir-col flex-js-sb">
            <view class="flex flex-dir-col">
              <view class="flex flex-ai-center">
                <text class="MiSans-Medium text-overflow goods-name" style="max-width: 280rpx"
                  >{{ t.name || '--' }}</text
                >
                <view class="pay-tag flex flex-ai-center flex-js-center" style="margin-left: 10rpx">
                  <text class="MiSans-Regular pay-tag-text">{{ t.pay_way === 'huifu' ? '汇付' : '易宝' }}</text>
                </view>
              </view>
              <text class="MiSans-Regular code-text"
                >编号 #{{ t.collection_code || '--' }} / {{ t.total_num || 0 }}</text
              >
            </view>
            <view class="flex flex-ai-center flex-js-sb">
              <text class="MiSans-Regular own-text">拥有 {{ t.count || 0 }}</text>
              <view class="floor-badge flex flex-ai-center flex-js-center">
                <text class="MiSans-Regular floor-text">出售价 ¥{{ formatPrice(t.price) }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 预计收入 -->
      <view class="sec">
        <text class="MiSans-Demibold sec-title">预计收入</text>
        <view class="fee-row flex flex-js-sb flex-ai-center">
          <text class="MiSans-Regular fee-label">总售价</text>
          <view class="flex flex-ai-center">
            <text v-if="totalTips" class="MiSans-Regular tips">{{ totalTips }}</text>
            <text class="MiSans-Regular fee-value">¥ {{ formatPrice(info.total_price) }}</text>
          </view>
        </view>
        <view class="fee-row flex flex-js-sb flex-ai-center">
          <text class="MiSans-Regular fee-label"
            >综合服务费 ({{ info.platform_service_rate || 0 }}%)</text
          >
          <text class="MiSans-Regular fee-value">- ¥ {{ formatPrice(info.platform_service_price) }}</text>
        </view>
        <view class="fee-row flex flex-js-sb flex-ai-center">
          <text class="MiSans-Regular fee-label">预计收入所得</text>
          <text class="MiSans-Demibold total">≈ ¥ {{ formatPrice(info.estimated_income) }}</text>
        </view>
      </view>

      <!-- 以求购价出售说明 -->
      <view class="sec">
        <text class="MiSans-Demibold sec-title">以求购价出售说明</text>
        <view class="notice-list">
          <text class="MiSans-Regular notice-item"
            >1.成交顺序是以买方发起求购订单的金额由高至低的顺序成交。</text
          >
          <text class="MiSans-Regular notice-item"
            >2.买方求购订单的付款钱包和卖方收款账户钱包需要一致才可成交，如果不一致会导致无法成交。</text
          >
          <text class="MiSans-Regular notice-item">3.订单一旦成交，不可撤销。</text>
        </view>
        <view class="agree-row flex flex-ai-center" @click="agreed = !agreed">
          <img
            class="radio"
            :src="asset(agreed ? 'static/common/radio_sel.png' : 'static/common/radio_default.png')"
            mode="aspectFit"
          />
          <text class="MiSans-Regular agree-text"
            >我已阅读并同意<text class="agree-link" @click.stop="toAgreement('出售协议')">《出售协议》</text></text
          >
        </view>
      </view>
    </view>

    <view class="footer">
      <view
        class="submit-btn flex flex-ai-center flex-js-center"
        :class="{ disabled: !canSubmit }"
        @click="onSubmitTap"
      >
        <text class="MiSans-Demibold submit-text"
          >确认出售 · ¥{{ formatPrice(info.total_price) }}</text
        >
      </view>
    </view>

    <!-- 更换藏品 choose-sheet -->
    <view v-if="showChoose" class="modal-mask" style="align-items: flex-end" @click.self="showChoose = false">
      <view class="choose-sheet">
        <view class="flex flex-ai-center flex-js-sb">
          <text class="MiSans-Demibold sheet-title">请选择 {{ selected.length }} 个数字藏品</text>
          <view class="sheet-close" @click="showChoose = false"></view>
        </view>
        <scroll-view scroll-x  class="choose-scroll">
          <view
            v-for="t in userCollectionList"
            :key="t.id"
            class="choose-item flex flex-ai-center flex-js-sb"
            :class="{ active: t.check }"
            @click="toggleChoose(t)"
          >
            <view class="flex flex-dir-col" style="min-width: 0; flex: 1">
              <text class="MiSans-Medium text-overflow goods-name">{{ t.name || '--' }}</text>
              <text class="MiSans-Regular code-text"
                >编号 #{{ t.collection_code || '--' }} / {{ t.total_num || 0 }}</text
              >
            </view>
            <img
              class="radio"
              :src="asset(t.check ? 'static/common/radio_sel.png' : 'static/common/radio_default.png')"
              mode="aspectFit"
            />
          </view>
        </scroll-view>
        <view class="submit-btn flex flex-ai-center flex-js-center" style="margin-top: 24rpx" @click="verifyChoose">
          <text class="MiSans-Demibold submit-text">确认选择</text>
        </view>
      </view>
    </view>

    <!-- 确认出售 w-toast -->
    <view v-if="showTips" class="toast-mask" @click.self="showTips = false">
      <view class="toast-box">
        <text class="toast-title">¥{{ formatPrice(info.total_price) }}</text>
        <text class="toast-content">您确认以{{ info.total_price }}元出售吗？</text>
        <view class="toast-btns">
          <view class="modal-btn" @click="showTips = false">取消</view>
          <view class="modal-btn primary" @click="showTips = false; showPwd = true">确认</view>
        </view>
      </view>
    </view>

    <!-- 操作密码 password-authentification -->
    <view v-if="showPwd" class="modal-mask" @click.self="showPwd = false">
      <view class="auth-popup">
        <view class="auth-close" @click="showPwd = false"></view>
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
          <view class="num-key" @click="showPwd = false">取消</view>
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
import { fetchTradeBaseInfo, fetchUserCollectionList, asset } from '@/utils/api'
import { ossImg } from '@/api'

const route = useRoute()
const router = useRouter()

const info = ref({ total_price: '0.00', estimated_income: '0.00', platform_service_price: '0.00' })
const userCollectionList = ref([])
const selectedList = ref([])
const agreed = ref(false)
const showChoose = ref(false)
const showTips = ref(false)
const showPwd = ref(false)
const pwd = ref('')

const selected = computed(() => selectedList.value)
const totalTips = computed(() => '')
const canSubmit = computed(() => selectedList.value.length > 0 && agreed.value)

function formatPrice(v) {
  const n = parseFloat(v)
  return Number.isNaN(n) ? '0.00' : n.toFixed(2)
}
function thumbOf(t) {
  const src = t.main_image || t.listimg || ''
  return src ? (src.startsWith('http') ? src : ossImg(src)) : ''
}
function goBack() {
  if (window.history.length > 1) router.back()
  else router.push('/pages/myCollection/myCollection')
}
function toggleChoose(t) {
  t.check = !t.check
  selectedList.value = userCollectionList.value.filter((x) => x.check)
}
function verifyChoose() {
  if (!selectedList.value.length) {
    uni.showToast({ title: '请至少选择一个藏品', icon: 'none' })
    return
  }
  showChoose.value = false
  const total = selectedList.value.reduce((s, t) => s + (parseFloat(t.price) || 0), 0)
  info.value.total_price = total.toFixed(2)
  info.value.estimated_income = (total - parseFloat(info.value.platform_service_price || 0)).toFixed(2)
}
function toAgreement(name) {
  router.push({ path: '/pages/agreement/agreement', query: { title: name } })
}
function toForget() {
  showPwd.value = false
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
  showPwd.value = false
  pwd.value = ''
  uni.showToast({ title: '原站出售需人机验证', icon: 'none' })
}
function onSubmitTap() {
  if (!canSubmit.value) {
    uni.showToast({ title: '请选择藏品并同意协议', icon: 'none' })
    return
  }
  showTips.value = true
}

onMounted(async () => {
  const [base, mine] = await Promise.all([
    fetchTradeBaseInfo({ id: route.query.id || 226 }),
    fetchUserCollectionList(),
  ])
  if (base) info.value = { ...info.value, ...base }
  if (mine && mine.user_collection_list) {
    const list = mine.user_collection_list.map((x, i) => ({ ...x, check: i === 0 }))
    userCollectionList.value = list
    selectedList.value = list.filter((x) => x.check)
    if (selectedList.value.length) {
      const total = selectedList.value.reduce((s, t) => s + (parseFloat(t.price) || 0), 0)
      info.value.total_price = total.toFixed(2)
      info.value.platform_service_price = (total * 0.02).toFixed(2)
      info.value.estimated_income = (total - parseFloat(info.value.platform_service_price)).toFixed(2)
    }
  }
})
</script>

<style scoped>
@import '@/styles/atomic.css';
@import '@/styles/trade.css';

.change-text {
  font-size: 24rpx;
  color: #5a9a45;
}
.change-arrow {
  width: 12rpx;
  height: 20rpx;
  margin-left: 8rpx;
}
.pay-tag {
  height: 36rpx;
  padding: 0 10rpx;
  background: #eff7f2;
  border-radius: 6rpx;
}
.pay-tag-text {
  font-size: 20rpx;
  color: #4a6f2f;
}
.code-text {
  margin-top: 10rpx;
  font-size: 24rpx;
  color: #999;
}
.own-text {
  font-size: 22rpx;
  color: #999;
}
.tips {
  margin-right: 8rpx;
  font-size: 22rpx;
  color: #999;
}
.sheet-title {
  font-size: 32rpx;
  color: #1a2438;
}
.sheet-close {
  width: 36rpx;
  height: 36rpx;
  position: relative;
}
.sheet-close::before,
.sheet-close::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 50%;
  width: 28rpx;
  height: 3rpx;
  background: #999;
  transform: translate(-50%, -50%) rotate(45deg);
}
.sheet-close::after {
  transform: translate(-50%, -50%) rotate(-45deg);
}
.choose-scroll {
  height: 640rpx;
  margin-top: 24rpx;
}
.choose-item.active .goods-name {
  color: #5a9a45;
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
