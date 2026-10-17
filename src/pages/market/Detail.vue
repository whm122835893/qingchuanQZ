<template>
  <view class="market-detail-page" id="market-details">
    <!-- 顶部导航（原站 w-navbar navType=market：圆形半透明返回按钮） -->
    <view class="u-navbar">
      <view class="u-navbar__content" :style="{ height: navHeight + 'px' }">
        <view class="u-navbar__left" @click="goBack">
          <view class="market-back flex flex-js-center flex-ai-center">
            <img :src="asset('static/common/back_default.png')" mode="widthFix" />
          </view>
        </view>
      </view>
    </view>

    <!-- 藏品主图卡片（原站 w-product-details-card） -->
    <view
      class="product-card"
      :style="{ backgroundImage: `url(${asset('static/collection/top_bg.png')})` }"
    >
      <view class="img-wrap flex flex-js-center flex-ai-center">
        <img class="main-img" :src="mainImg" mode="aspectFill" @click="preview" />
      </view>
      <view class="info-wrap flex flex-dir-col flex-ai-center">
        <view
          class="flex flex-ai-center flex-js-center preview-btn"
          @click="preview"
        >
          <img :src="asset('static/collection/preview.png')" mode="aspectFit" />
        </view>
        <text class="MiSans-Demibold name text-overflow">{{ product.name || '藏品名称' }}</text>
        <view class="flex flex-ai-center limit-row">
          <view class="limit-tag flex flex-ai-center flex-js-center MiSans-Regular">限量</view>
          <view
            class="flex flex-ai-center flex-js-center MiSans-Regular font-size-11 plr-13 limit-num"
          >
            {{ product.total_num || 0 }}
          </view>
        </view>
      </view>
    </view>

    <!-- 信息卡片 -->
    <view class="flex flex-dir-col plr-12 detail-body">
      <view class="flex flex-dir-col mt-8 detail-inner">
        <!-- w-product-info-list：所属专辑 / 合约地址 / 认证标识 -->
        <view class="flex flex-dir-col">
          <view
            v-for="row in infoList"
            :key="row.key"
            class="tech-row flex flex-ai-center"
          >
            <text class="MiSans-Regular tech-label">{{ row.label }}</text>
            <text class="MiSans-Regular tech-value text-overflow">{{ row.value }}</text>
          </view>
        </view>

        <!-- w-product-box：创作者 / 品牌方（源站恒显示，取 product.publisher） -->
        <view class="flex flex-dir-col">
          <view class="tech-row flex flex-ai-center">
            <text class="MiSans-Regular tech-label">创作者</text>
            <text class="MiSans-Regular tech-value text-overflow">{{ publisherName }}</text>
          </view>
          <view class="tech-row flex flex-ai-center">
            <text class="MiSans-Regular tech-label">品牌方</text>
            <text class="MiSans-Regular tech-value text-overflow">{{ publisherName }}</text>
          </view>
        </view>
      </view>

      <!-- w-product-buy-need：购买须知 -->
      <view class="buy-need">
        <text class="MiSans-Demibold">购买须知</text>
        <view class="MiSans-Regular body">
          <text class="normal">
            为更好服务青川平台的各位用户，青川特此公告数字藏品的二次交易细则。鉴于不同属性的数字艺术的二次交易细则各有不同，请各位用户务必审慎阅读并同意相关规则后进行相应操作，以免造成不必要损失。
          </text>
          <view class="buy-need-line"></view>
          <text class="danger">
            1、本商品为在线数字化商品，一经出售，不支持七天无理由退换货。
          </text>
          <text class="normal">
            2、数字藏品为虚拟数字商品，购买前请完成实名认证未满18周岁人群禁止购买。
          </text>
          <text class="normal">
            3、依据我国法律要求，特定条件下的数字藏品的二次交易不支持任何形式的变相炒作，我们坚决反对数字藏品炒作、场外交易、欺诈，或以任何其他非法、侵权方式使用的违法违规行为，请大家注意甄别上述涉嫌网络欺诈的行为及其相关风险。
          </text>
          <text class="normal">
            4、如您为参与任何活动或获得任何赋能而转让(出售赠与等)、受让、合成、兑换、使用、处置、销毁相关数字藏品，您授权同意青川平台向活动举办方、赋能提供方、数字藏品发售方等提供您的联系方式、藏品信息、藏品数量、收货地址(如需)等必要信息。
          </text>
        </view>
      </view>
    </view>

    <!-- w-market-action：底部操作条 -->
    <view class="market-action">
      <view class="market-action-container plr-16 ptb-8 flex flex-ai-center">
        <view v-if="info.status === 1" class="font-color-black MiSans-Demibold price-block">
          <text class="font-size-12">￥</text>
          <text class="font-size-22">{{ info.price }}</text>
        </view>
        <view v-else class="font-color-black MiSans-Demibold"></view>

        <view
          v-if="info.status === 1"
          class="plr-10 MiSans-Demibold z-btn btn-size-l"
          @click="submitOrder(1)"
          >立即购买</view
        >
        <view v-else-if="info.status === 2" class="flex-1 act-btn gray">已出售</view>
        <view v-else-if="info.status === 3" class="flex-1 act-btn gray">已下架</view>
        <view v-else-if="info.status === 4 && info.rush_status !== 1" class="flex-1 act-btn gray">
          抢购中
        </view>
        <view v-else-if="info.status === 4 && info.rush_status === 1" class="plr-10 MiSans-Demibold z-btn btn-size-l" @click="submitOrder(2)">
          抢购中
        </view>
      </view>
    </view>

    <!-- 确认购买弹层（u-popup bottom + orderSubmitPop） -->
    <view v-if="showSheet" class="sheet-mask" @click="showSheet = false"></view>
    <view v-if="showSheet" class="buy-sheet">
      <view class="flex flex-ai-center flex-js-sb">
        <text class="MiSans-Demibold sheet-title">确认购买</text>
        <view class="sheet-close" @click="showSheet = false"></view>
      </view>
      <text class="MiSans-Regular sheet-sub">付款后将按平台到款顺序排队发放</text>
      <view class="sheet-body">
        <view class="goods-card flex flex-ai-center">
          <img class="goods-thumb" :src="mainImg" mode="aspectFill" />
          <view class="flex flex-dir-col flex-1 goods-meta">
            <text class="MiSans-Medium text-overflow goods-name">{{ product.name || '--' }}</text>
            <view class="flex flex-ai-center flex-js-sb goods-row">
              <text class="MiSans-Demibold unit-price">¥ {{ unitPrice }}</text>
              <view v-if="orderBaseInfo.order_type === 1" class="qty-box flex flex-ai-center">
                <view
                  class="qty-btn flex flex-ai-center flex-js-center"
                  @click="minus"
                >
                  <text class="MiSans-Regular">-</text>
                </view>
                <input
                  class="MiSans-Demibold qty-input" type="number"
                  :value="orderBaseInfo.count"
                  @input="changeCount"
                />
                <view class="qty-btn flex flex-ai-center flex-js-center" @click="add">
                  <text class="MiSans-Regular"> + </text>
                </view>
              </view>
            </view>
          </view>
        </view>
        <view class="fee-row flex flex-js-sb flex-ai-center">
          <text class="MiSans-Regular fee-label">合计</text>
          <text class="MiSans-Demibold total-price">¥ {{ totalPrice }}</text>
        </view>
        <view v-if="!isLogin" class="pay-section">
          <text class="MiSans-Demibold pay-title">支付方式</text>
          <view class="account-row flex flex-ai-center flex-js-sb" @click="toggleHuifu">
            <view class="flex flex-ai-center">
              <img class="account-icon" :src="asset('static/wallet/huifu.png')" mode="aspectFit" />
              <text class="MiSans-Medium account-name">汇付天下</text>
            </view>
            <view v-if="huifuSelected" class="radio-icon radio-on"></view>
            <view v-else class="open-btn flex flex-ai-center flex-js-center">
              <text class="MiSans-Regular open-btn-text">去开通</text>
            </view>
          </view>
          <view class="tip-box">
            <text class="MiSans-Regular tip-text">
              付款后将按平台到款顺序排队发放，未成交将原路退回付款账户。
            </text>
          </view>
        </view>
        <view
          class="submit-btn flex flex-ai-center flex-js-center"
          :class="{ disabled: submitDisabled }"
          @click="onSubmitTap"
        >
          <text class="MiSans-Demibold submit-text">
            {{ isLogin ? '立即下单' : '立即支付 · ¥' + totalPrice }}
          </text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { fetchMarketDetail, asset } from '@/utils/api'
import { ossImg } from '@/api'

const route = useRoute()
const router = useRouter()

const navHeight = 44
const statusBarHeight = 0

const info = ref({
  product: { publisher: {}, collectionlist: [] },
  user: {},
  user_collection: {},
})
const loading = ref(false)
const showSheet = ref(false)
const huifuSelected = ref(true)
const isLogin = ref(!!localStorage.getItem('token'))

const orderBaseInfo = reactive({ count: 1, maxCount: 1, order_type: 2 })

const product = computed(() => info.value.product || {})
const unitPrice = computed(() => info.value.price || '0.00')
const totalPrice = computed(
  () => (parseFloat(unitPrice.value || 0) * (orderBaseInfo.count || 1)).toFixed(2)
)
const mainImg = computed(() => {
  const p = product.value
  const src = p.main_image || p.listimg || ''
  if (!src) return ''
  return src.startsWith('http') ? src : ossImg(src)
})
const publisherName = computed(
  () => (product.value.publisher && product.value.publisher.name) || '青川'
)

const LABEL_MAP = { series_name: '所属专辑', user_hash: '合约地址', rz_code: '认证标识' }
const infoList = computed(() => {
  const d = info.value
  const src = {
    series_name: d.series_name,
    user_hash: d.user_collection && d.user_collection.user_hash_text,
    rz_code: d.user_collection && d.user_collection.rz_code,
  }
  return Object.keys(src)
    .map((k) => ({ label: LABEL_MAP[k], key: k, value: src[k] }))
    .filter((x) => x.label && x.value)
})

const submitDisabled = computed(() => !isLogin.value)

function goBack() {
  if (window.history.length > 1) router.back()
  else router.push('/pages/market/market')
}

function preview() {
  if (mainImg.value) window.open(mainImg.value, '_blank')
}

async function getInfo() {
  if (loading.value) return
  loading.value = true
  const id = route.query.id || 226
  try {
    const data = await fetchMarketDetail(id)
    if (data && data.product) {
      info.value = data
      info.value.product.goods_type = data.goods_type
      info.value.product.price = data.price
    }
  } catch (e) {
    /* 保持空态 */
  }
  loading.value = false
}

// ===== 交易链路跳转（原站各入口 path） =====
function goCategory() {
  router.push('/pages/market/categoryManager')
}

function submitOrder(type) {
  if (!isLogin.value) {
    showSheet.value = true
    return
  }
  // 原站：写入 confirmOrder 后跳转确认订单页
  localStorage.setItem(
    'confirmOrder',
    JSON.stringify({
      product: info.value.product,
      income_type: info.value.income_type,
      market_goods_id: info.value.id,
      count: 1,
      order_type: 2,
      maxCount: 1,
      type,
    })
  )
  router.push({ path: '/pages/order/orderSubmit', query: { id: info.value.id, type } })
}

function minus() {
  if (orderBaseInfo.count <= 1) return
  orderBaseInfo.count -= 1
}
function add() {
  if (orderBaseInfo.count >= orderBaseInfo.maxCount) return
  orderBaseInfo.count += 1
}
function changeCount(e) {
  const v = parseInt(e.target.value, 10)
  orderBaseInfo.count = Number.isNaN(v) ? 1 : Math.min(Math.max(v, 1), orderBaseInfo.maxCount)
}
function toggleHuifu() {
  huifuSelected.value = !huifuSelected.value
}

function onSubmitTap() {
  if (submitDisabled.value) {
    uni.showToast({ title: '请先登录', icon: 'none' })
    return
  }
  showSheet.value = false
  submitOrder(1)
}

onMounted(getInfo)
</script>

<style scoped>
@import '@/styles/atomic.css';

.market-detail-page {
  min-height: 100vh;
  background: #eef4f1;
  overflow-y: auto;
  padding-bottom: 160rpx;
}

/* ===== 导航 ===== */
.u-navbar {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  z-index: 11;
}
.u-navbar__content {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  position: relative;
}
.u-navbar__left {
  padding: 0 26rpx;
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  display: flex;
  flex-direction: row;
  align-items: center;
}
.market-back {
  width: 56rpx;
  height: 56rpx;
  background: rgba(255, 255, 255, 0.55);
  border-radius: 50%;
}
.market-back img {
  width: 17rpx;
}

/* ===== 藏品主卡 ===== */
/* 源站量测：product-card 高 564px、背景 #e8f0eb */
.product-card {
  position: relative;
  width: 100%;
  height: 1085rpx;
  background-repeat: no-repeat;
  background-size: 100% 1085rpx;
  background-position: top;
  background-color: #e8f0eb;
  box-sizing: border-box;
}
/* 源站量测：img-wrap 208x208、距卡顶 148px */
.img-wrap {
  position: absolute;
  top: 285rpx;
  left: 0;
  right: 0;
  margin: 0 auto;
  width: 400rpx;
  height: 400rpx;
}
/* 源站量测：main-img 208x210、圆角 23px */
.main-img {
  width: 400rpx;
  height: 400rpx;
  border-radius: 45rpx;
  border: 1px solid rgba(0, 0, 0, 0.47);
}
/* 源站量测：info-wrap 位于 y=398、高 125px。
   注意：global.css:1149 的全局 .info-wrap 带 margin-top:82rpx，
   与绝对定位叠加会把整块推到 441px，此处需显式归零。 */
.info-wrap {
  position: absolute;
  top: 766rpx;
  left: 0;
  right: 0;
  margin-top: 0;
  padding: 0 40rpx;
  box-sizing: border-box;
}
/* 源站量测：预览按钮 36x36、圆角 18px */
.preview-btn {
  background: rgba(255, 255, 255, 0.61);
  width: 70rpx;
  height: 70rpx;
  border-radius: 35rpx;
}
/* 源站量测：预览图标 18x18 */
.preview-btn img {
  width: 35rpx;
  height: 35rpx;
}
/* 源站量测：name 20px、y=470（距 info-wrap 顶 72px） */
.name {
  margin-top: 72rpx;
  max-width: 600rpx;
  font-size: 40rpx;
  color: #1a2438;
  text-align: center;
  flex-shrink: 0;
}
.limit-row {
  margin-top: 15rpx;
}
/* 源站量测：限量标签 32x18、底色 rgb(113,136,120)、圆角 3px 0 0 3px */
.limit-tag {
  height: 35rpx;
  background: #718878;
  border-radius: 6rpx 0 0 6rpx;
  width: 62rpx;
  font-size: 22rpx;
  color: #fff;
}
.limit-num {
  height: 35rpx;
  background: #ffffff;
  border-radius: 0 6rpx 6rpx 0;
  font-size: 22rpx;
  color: #1a2438;
  padding: 0 26rpx;
}

/* ===== 信息卡 ===== */
/* 源站量测：detail-body 顶部圆角 20px、白底 */
.detail-body {
  position: relative;
  background-color: #fff;
  border-radius: 40rpx 40rpx 0 0;
  margin-top: -38rpx;
  padding-top: 14rpx;
  box-sizing: border-box;
}
/* 源站量测：detail-inner 圆角 18px、无边框 */
.detail-inner {
  background: #ffffff;
  border-radius: 35rpx;
  padding: 0 14rpx;
}
/* 源站量测：tech-row 高 52px、左右 padding 12px。
   detail-inner 顶部需上移 8px（本地 mt-8 叠加 plr-12 的 padding-top）。 */
.tech-row {
  height: 100rpx;
  padding: 0 24rpx;
  justify-content: space-between;
}
.detail-inner {
  margin-top: 0;
}
.tech-row:not(:last-child) {
  border-bottom: 1px solid #eaeaea;
}
/* 源站量测：tech-label 15px、#999 */
.tech-label {
  font-size: 29rpx;
  color: #999;
  flex-shrink: 0;
}
/* 源站量测：tech-value 15px、按内容宽度右对齐（不可 flex:1，否则会撑满整行） */
.tech-value {
  font-size: 29rpx;
  color: #1a2438;
  margin-left: 20rpx;
  text-align: right;
  flex-shrink: 1;
  max-width: 70%;
}

/* 源站量测：buy-need 距上 10px、圆角 18px、内边距 16px */
.buy-need {
  margin-top: 19rpx;
  background: #ffffff;
  border-radius: 35rpx;
  padding: 32rpx;
  display: block;
}
/* 源站量测：标题 15px */
.buy-need .MiSans-Demibold {
  font-size: 29rpx;
  color: #1a2438;
  display: block;
}
/* 源站量测：正文块 margin-top 约 11px */
.buy-need .body {
  margin-top: 21rpx;
  line-height: 1.7;
}
/* 源站量测：条款 13px、块间距 10px */
.buy-need .normal,
.buy-need .danger {
  display: block;
  font-size: 25rpx;
  color: #656b75;
  margin-bottom: 18rpx;
}
.buy-need .danger {
  color: #ec2121;
}
/* 源站：首段与条款 1 之间有一条分隔留白 */
.buy-need-line {
  height: 20rpx;
}

/* ===== 底部操作条 ===== */
/* 源站量测：market-action 高 78px、底色纯白。
   全局 .market-action 带 padding/gap/width:750rpx，需归零。 */
.market-action {
  width: 100%;
  position: fixed;
  left: 0;
  bottom: 0;
  z-index: 10;
  height: 150rpx;
  padding: 0;
  gap: 0;
  background: #fff;
  box-shadow: 0 -11rpx 13rpx 0 rgba(0, 0, 0, 0.04);
  box-sizing: border-box;
}
/* 源站量测：container 362x62（左右各 16px、上下各 8px） */
/* 源站量测：container 362x62（x=14、y=774）。
   注意不能用 width:100%（会撑到 390），源站是内容自适应 + 左右 16px 内边距。 */
.market-action-container {
  width: auto;
  max-width: 100%;
  height: 150rpx;
  box-sizing: border-box;
}
/* 源站量测：价格块 x=30、￥12px + 数字 22px */
.price-block {
  flex-shrink: 0;
}
.price-block .font-size-12 {
  font-size: 23rpx;
}
.price-block .font-size-22 {
  font-size: 42rpx;
}

/* 源站量测：立即购买 249x43、右边缘 x=360、圆角 6px、底色 #6aa27b。
   宽高由 .btn-size-l 提供，此处只负责底色与圆角。 */
.z-btn {
  flex-shrink: 0;
  margin-left: auto;
  text-align: center;
  background: #6aa27b;
  color: #fff;
  border-radius: 12rpx;
  box-sizing: border-box;
}
.z-btn-placeholder {
  flex-shrink: 0;
  width: 479rpx;
  height: 83rpx;
  line-height: 83rpx;
  text-align: center;
  background: #6aa27b;
  color: #fff;
  border-radius: 12rpx;
  font-size: 27rpx;
  box-sizing: border-box;
}



.act-btn {
  height: 88rpx;
  line-height: 88rpx;
  text-align: center;
  border-radius: 12rpx;
  font-size: 30rpx;
  color: #999;
}
.act-btn.gray {
  background: #f3f6f8;
}

/* ===== 确认购买弹层 ===== */
.sheet-mask {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.55);
  z-index: 20;
}
.buy-sheet {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 21;
  padding: 32rpx 28rpx 24rpx;
  background: #fff;
  border-radius: 24rpx 24rpx 0 0;
  box-sizing: border-box;
}
.sheet-title {
  font-size: 34rpx;
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
.sheet-sub {
  display: block;
  margin-top: 8rpx;
  font-size: 22rpx;
  color: #999;
}
.sheet-body {
  margin-top: 28rpx;
}
.goods-card {
  padding: 20rpx;
  background: #f3f6f8;
  border-radius: 16rpx;
}
.goods-thumb {
  width: 120rpx;
  height: 120rpx;
  border-radius: 12rpx;
  background: #333;
  flex-shrink: 0;
  border: 2rpx solid #fff;
  box-sizing: border-box;
}
.goods-meta {
  margin-left: 20rpx;
  min-width: 0;
}
.goods-name {
  font-size: 28rpx;
  color: #1a2438;
}
.goods-row {
  margin-top: 16rpx;
}
.unit-price {
  font-size: 28rpx;
  color: #e54d42;
}
.qty-box {
  height: 56rpx;
}
.qty-btn {
  width: 56rpx;
  height: 56rpx;
  background: #fff;
  border-radius: 10rpx;
  font-size: 32rpx;
  color: #1a2438;
}
.qty-input {
  width: 80rpx;
  height: 56rpx;
  margin: 0 8rpx;
  text-align: center;
  font-size: 26rpx;
  color: #1a2438;
  background: #fff;
  border-radius: 10rpx;
}
.fee-row {
  margin-top: 24rpx;
  padding: 0 8rpx;
}
.fee-label {
  font-size: 26rpx;
  color: #666;
}
.total-price {
  font-size: 30rpx;
  color: #e54d42;
}
.pay-section {
  margin-top: 32rpx;
}
.pay-title {
  font-size: 28rpx;
  color: #1a2438;
}
.account-row {
  margin-top: 20rpx;
  height: 96rpx;
  padding: 0 28rpx;
  background: #eff7f2;
  border-radius: 16rpx;
}
.account-icon {
  width: 48rpx;
  height: 48rpx;
  flex-shrink: 0;
  border-radius: 10rpx;
  background: #fff;
}
.account-name {
  margin-left: 16rpx;
  font-size: 28rpx;
  color: #1a2438;
}
.radio-icon {
  width: 36rpx;
  height: 36rpx;
  flex-shrink: 0;
  border-radius: 50%;
  border: 2rpx solid #6aa27b;
  background: #fff;
}
.radio-on {
  background: #6aa27b;
  box-shadow: inset 0 0 0 6rpx #eff7f2;
}
.open-btn {
  height: 48rpx;
  padding: 0 20rpx;
  background: #5a9a45;
  border-radius: 24rpx;
}
.open-btn-text {
  font-size: 22rpx;
  color: #fff;
}
.tip-box {
  margin-top: 24rpx;
  padding: 20rpx;
  background: #f7f8fa;
  border-radius: 12rpx;
}
.tip-text {
  font-size: 22rpx;
  color: #999;
  line-height: 1.6;
}
.submit-btn {
  margin-top: 32rpx;
  height: 88rpx;
  background: #6aa27b;
  border-radius: 16rpx;
}
.submit-btn.disabled {
  opacity: 0.45;
}
.submit-text {
  font-size: 30rpx;
  color: #fff;
}
</style>
