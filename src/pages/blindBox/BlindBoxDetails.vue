<template>
  <view class="bb-detail-page" id="colection">
    <!-- ═══════════════════════════════════════════════════════════
      顶部导航（原站 w-navbar navType="market" placeholder=false）
      与 collectionDetails 同组件；右侧插槽 home-btn（xuanyao.png）
      点击进 /pages/invitation/invitation。
      ═══════════════════════════════════════════════════════════ -->
    <view class="u-navbar">
      <view class="u-navbar__content" :style="{ height: navHeight + 'px' }">
        <view class="u-navbar__left" @click="goBack">
          <view class="cd-back flex flex-js-center flex-ai-center">
            <img :src="asset('static/common/back_default.png')" mode="widthFix" />
          </view>
        </view>
        <view class="u-navbar__right" @click="goInvitation">
          <img class="xuanyao-img" :src="asset('static/common/xuanyao.png')" mode="heightFix" />
        </view>
      </view>
    </view>

    <!-- ═══════════════════════════════════════════════════════════
      藏品主卡（原站 w-product-details-card，与 market/Detail、
      collectionDetails 同组件；isShengou 未传默认 false → 限量分支）
      源站运行 DOM 实测：卡片 390x564、底色 #e8f0eb、背景图 top_bg.png；
      img-wrap 208x208 距卡顶 148px；main-img 208x210 圆角 23px、1px 描边；
      preview 圆钮 36x36 半透明白；name 20px #1a2438；
      限量标签 32x18 底色 #718878 圆角 3px 0 0 3px + 白底右段 26x18。
      ═══════════════════════════════════════════════════════════ -->
    <view
      class="product-card"
      :style="{ backgroundImage: `url(${asset('static/collection/top_bg.png')})` }"
    >
      <view class="img-wrap flex flex-js-center flex-ai-center">
        <img class="main-img" :src="mainImg" mode="aspectFill" @click="preview" />
      </view>
      <view class="info-wrap flex flex-dir-col flex-ai-center">
        <view class="preview-btn flex flex-ai-center flex-js-center" @click="preview">
          <img :src="asset('static/collection/preview.png')" mode="aspectFit" />
        </view>
        <text class="MiSans-Demibold name text-overflow">{{ product.name || '藏品名称' }}</text>
        <view class="flex flex-ai-center limit-row">
          <view class="limit-tag flex flex-ai-center flex-js-center MiSans-Regular">限量</view>
          <view class="limit-num flex flex-ai-center flex-js-center MiSans-Regular">
            {{ product.total_num || 0 }}
          </view>
        </view>
      </view>
    </view>

    <!-- ═══════════════════════════════════════════════════════════
      白色信息卡（源站 plr-16 ptb-12 + 内联白底/上圆角 40rpx/上移 40rpx）
      盒间关系（live DOM 实测）：w-product-info-list 因 prop 错配恒渲染为空
      （页面传 product、组件声明 info），其 mt-12 与后盒 margin 合并后
      视觉间距 12px；复刻时不实现该死组件，直接由介绍盒 mt-24rpx 承担。
      ═══════════════════════════════════════════════════════════ -->
    <view class="plr-16 ptb-12 detail-body">
      <!-- 概率池盒（原站 w-product-box，v-show collectionlist.length）
          标题带 title 类 → 32rpx #1a2438（与介绍/须知盒的默认 30rpx 不同，
          bundle scoped CSS + live DOM 双轨实证） -->
      <view v-show="pool.length" class="pool-box">
        <text class="MiSans-Demibold pool-title">购买须知</text>
        <view v-for="c in pool" :key="c.id" class="pool-item">
          <img class="pool-thumb" :src="ossImg(c.listimg)" mode="aspectFill" />
          <view class="pool-meta">
            <text class="pool-name text-overflow">{{ c.name }}</text>
            <view class="pool-stats">
              <view>
                <text class="stat-minor">概率：</text>
                <text class="stat-primary">{{ c.probability }}%</text>
              </view>
              <view class="ml-20">
                <text class="stat-minor">总量：</text>
                <text class="stat-primary">{{ c.show_total_num }}份</text>
              </view>
            </view>
          </view>
          <img class="rarity-icon" :src="ossImg(c.rarity_icon)" mode="aspectFit" />
        </view>
      </view>

      <!-- 藏品介绍盒（原站 w-product-introduce）：标题无 title 类 → 默认 30rpx #4a4a4a；
          正文 u-parse 内联 color #686868 / font-size 28rpx（v-html 承接，
          p 标签按源站 UA 默认 1em 间距——本地全局 reset 已清零，此处恢复） -->
      <view class="introduce-box">
        <text class="MiSans-Demibold">藏品介绍</text>
        <view class="mt-12 MiSans-Regular introduce-body" v-html="product.introduce_image || ''"></view>
      </view>

      <!-- 购买须知盒（原站 w-product-buy-need，文案逐字取自 bundle render） -->
      <view class="buyneed-box">
        <text class="MiSans-Demibold">购买须知</text>
        <view class="MiSans-Regular buy-body">
          <text class="buy-normal">
            {{ BUY_TIP_1 }}
          </text>
          <text class="buy-normal">
            {{ BUY_TIP_2 }}
          </text>
          <text class="buy-danger">
            {{ BUY_TIP_3 }}
          </text>
          <text class="buy-normal">
            {{ BUY_TIP_4 }}
          </text>
          <text class="buy-normal">
            {{ BUY_TIP_5 }}
          </text>
        </view>
      </view>

      <!-- 版权位（原站 w-copyright：isshow=false 时仅保留 ptb-16 空容器占位） -->
      <view class="copyright-slot flex flex-dir-col flex-ai-center ptb-16"></view>
    </view>

    <!-- ═══════════════════════════════════════════════════════════
      底部操作（原站 blindBox-detail-button）
      源站 render 直接访问 info.product.weither_resale 等字段：
      details.product 缺失（接口报错/空数据）时整个组件渲染抛异常、
      底部白条与 w-toast 一律不出现——live 空态 DOM dump 实证
      （无 product-action 节点），故以 v-if="details.product" 复刻。
      按钮矩阵四分支为独立 v-if（非 else-if），顺序即源站顺序：
      立即寄售 → 立即转赠 → 锁定中(disabled) → 取消寄售。
      每个按钮 = w-button(flex-1 act-btn shape=circle)：
      内联 #718878/46rpx/#fff/83rpx/27rpx，.act-btn 12rpx !important 覆盖圆角；
      容器 product-action flex：padding 30rpx、gap 20rpx、白底、
      上投影 0 -11rpx 13rpx rgba(0,0,0,.04)（scoped CSS 原值）。
      ═══════════════════════════════════════════════════════════ -->
    <view v-if="details.product">
      <view class="product-action flex">
        <view
          v-if="product.weither_resale === 0 && details.status === 1"
          class="act-btn"
          @click="goConsignment"
        >
          立即寄售
        </view>
        <view
          v-if="product.weither_regift === 0 && details.status === 1"
          class="act-btn"
          @click="goRegift"
        >
          立即转赠
        </view>
        <view v-if="details.status === 2 && product.is_lock === 1" class="act-btn disabled">
          锁定中
        </view>
        <view v-if="details.status === 2 && product.is_lock !== 1" class="act-btn" @click="cancelPop = true">
          取消寄售
        </view>
      </view>

      <!-- 取消寄售确认（原站 w-toast contentAlign=center「确认取消此寄售？」） -->
      <ConfirmToast
        v-model:show="cancelPop"
        content="确认取消此寄售？"
        content-align="center"
        @ok="doCancel"
      />
    </view>
  </view>
</template>

<script setup>
/**
 * 原站 pages/blindBox/blindBoxDetails —— 盲盒详情。
 *
 * 结构（源站 bundle render + 运行 DOM dump 双轨取证）：
 *   w-navbar(market) → w-product-details-card → 白卡[w-product-box 概率池 /
 *   w-product-introduce 藏品介绍 / w-product-buy-need 购买须知 /
 *   w-copyright 空占位] → blindBox-detail-button。
 *
 * 数据契约（源站模块 2158）：onLoad(id) → getUserCollectionDetails(id)，
 * 响应 data 即 details，data.product 即 product；本地同构端点为
 * fetchCollectionInfo（/market/trade/collectionInfo）。
 * 按钮判据全部走 details.product.* + details.status；
 * 取消寄售入参 details.market_goods.id（changeMarketGoods）。
 *
 * 已知源站死代码（刻意不实现）：w-product-info-list —— 页面传 product 而
 * 组件声明 info prop，info 恒为 {}，链上信息三行永不渲染（dump 无 tech-row）。
 */
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { asset, fetchCollectionInfo } from '@/utils/api'
import { api, ossImg } from '@/api'
import ConfirmToast from '@/components/ConfirmToast.vue'

defineOptions({ name: 'BlindBoxDetails' })

/* 购买须知文案：逐字取自源站 bundle w-product-buy-need render */
const BUY_TIP_1 =
  ' 为更好服务青川平台的各位用户，青川特此公告数字藏品的二次交易细则。鉴于不同属性的数字艺术的二次交易细则各有不同，请各位用户务必审慎阅读并同意相关规则后进行相应操作，以免造成不必要损失。 '
const BUY_TIP_2 = '\n'
const BUY_TIP_3 = '1、本商品为在线数字化商品，一经出售，不支持七天无理由退换货。'
const BUY_TIP_4 =
  '\n2、数字藏品为虚拟数字商品，购买前请完成实名认证未满18周岁人群禁止购买。'
const BUY_TIP_5 =
  ' \n3、依据我国法律要求，特定条件下的数字藏品的二次交易不支持任何形式的变相炒作，我们坚决反对数字藏品炒作、场外交易、欺诈，或以任何其他非法、侵权方式使用的违法违规行为，请大家注意甄别上述涉嫌网络欺诈的行为及其相关风险。 \n4、如您为参与任何活动或获得任何赋能而转让(出售赠与等)、受让、合成、兑换、使用、处置、销毁相关数字藏品，您授权同意青川平台向活动举办方、赋能提供方、数字藏品发售方等提供您的联系方式、藏品信息、藏品数量、收货地址(如需)等必要信息。 '

const route = useRoute()
const router = useRouter()
const navHeight = 44

const details = ref({})
const cancelPop = ref(false)

const product = computed(() => (details.value && details.value.product) || {})
/** 概率池：源站 render v-show product.collectionlist.length */
const pool = computed(() => (product.value && product.value.collectionlist) || [])

const mainImg = computed(() => {
  const p = product.value
  const src = p.main_image || p.listimg || ''
  if (!src) return ''
  return src.startsWith('http') ? src : ossImg(src)
})

function goBack() {
  if (window.history.length > 1) router.back()
  else router.push('/pages/my/my')
}

function goInvitation() {
  router.push('/pages/invitation/invitation')
}

function preview() {
  if (mainImg.value) uni.previewImage({ urls: [mainImg.value], current: mainImg.value })
}

/* ── 按钮行为（源站 blindBox-detail-button methods 逐一对应） ── */

function goRegift() {
  router.push({ path: '/pages/regift/regift', query: { id: details.value.id } })
}

function goConsignment() {
  // 源站 consignment：$u.route("/pages/consignments/consignments", {id, pageType:2})
  router.push({
    path: '/pages/consignments/consignments',
    query: { id: details.value.id, pageType: 2 },
  })
}

async function doCancel() {
  cancelPop.value = false
  const mg = details.value.market_goods
  if (!mg || !mg.id) {
    uni.showToast({ title: '寄售单不存在', icon: 'none' })
    return
  }
  uni.showLoading({ title: '取消中' })
  try {
    await api.changeMarketGoods({ id: mg.id })
    uni.showToast({ title: '已取消寄售', icon: 'none' })
    await getDetails() // 源站 $emit('refresh') → getDetails 重拉
  } catch (e) {
    uni.showToast({ title: (e && e.message) || '取消失败', icon: 'none' })
  } finally {
    uni.hideLoading()
  }
}

/* ── 数据 ── */

async function getDetails() {
  const data = await fetchCollectionInfo({ id: route.query.id || 226 })
  if (data) details.value = data
}

onMounted(() => {
  getDetails()
})
</script>

<style scoped>
@import '@/styles/atomic.css';

.bb-detail-page {
  min-height: 100vh;
  background: #f4f6fa; /* 源站 w-container bg-color-pageBg */
}

/* ===== 导航（源站量测：透明浮层，返回圆钮 29x29 半透明白） ===== */
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
  /* 源站 w-navbar scoped CSS 将 uView 全局默认蓝 #9acafc 覆盖为透明
     （live DOM 实测 u-navbar__content bg rgba(0,0,0,0)），此处同步覆盖 */
  background-color: transparent;
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
.cd-back {
  width: 56rpx;
  height: 56rpx;
  background: rgba(255, 255, 255, 0.55);
  border-radius: 50%;
}
.cd-back img {
  width: 17rpx;
}
.u-navbar__right {
  position: absolute;
  top: 0;
  bottom: 0;
  right: 23rpx;
  display: flex;
  flex-direction: row;
  align-items: center;
}
.xuanyao-img {
  height: 44rpx;
}

/* ===== 藏品主卡（与 collectionDetails 同组件，逐值一致） ===== */
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
/* 源站量测：main-img 208x210、圆角 23px、1px 描边 rgba(0,0,0,.47) */
.main-img {
  width: 400rpx;
  height: 400rpx;
  border-radius: 45rpx;
  border: 1px solid rgba(0, 0, 0, 0.47);
}
/* 源站量测：info-wrap 位于 y=398、高 125px */
.info-wrap {
  position: absolute;
  top: 766rpx;
  left: 0;
  right: 0;
  margin-top: 0;
  padding: 0 40rpx;
  box-sizing: border-box;
}
/* 源站量测：预览按钮 36x36、圆角 18px、半透明白 */
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
/* 源站量测：name 20px、距预览钮 70rpx（bundle 原值） */
.name {
  margin-top: 70rpx;
  max-width: 600rpx;
  font-size: 40rpx;
  color: #1a2438;
  text-align: center;
  flex-shrink: 0;
}
.limit-row {
  margin-top: 16rpx;
}
/* 源站量测：限量标签 32x18、底色 #718878、圆角 3px 0 0 3px、白字 */
.limit-tag {
  height: 35rpx;
  background: #718878;
  border-radius: 6rpx 0 0 6rpx;
  width: 62rpx;
  font-size: 22rpx;
  color: #fff;
}
/* 源站量测：右段白底 26x18、圆角 0 3px 3px 0、字色 #4a4a4a */
.limit-num {
  height: 35rpx;
  background: #ffffff;
  border-radius: 0 6rpx 6rpx 0;
  font-size: 22rpx;
  color: #4a4a4a;
  padding: 0 26rpx;
}

/* ===== 白色信息卡（源站：上圆角 20px、上移 40rpx） ===== */
.detail-body {
  position: relative;
  background-color: #fff;
  border-radius: 40rpx 40rpx 0 0;
  margin-top: -40rpx;
  box-sizing: border-box;
}

/* ===== 概率池盒（源站 w-product-box：内联白底/35rpx 圆角/1px #bfccc8/padding 30rpx） ===== */
.pool-box {
  background: #ffffff;
  border-radius: 35rpx;
  border: 1px solid #bfccc8;
  padding: 30rpx;
}
/* 源站 scoped CSS .title：32rpx #1a2438（仅概率池盒标题带 title 类） */
.pool-title {
  font-size: 32rpx;
  color: #1a2438;
}
/* 源站量测：条目 #f7fbfa、圆角 25rpx、1px #bfccc8、pa-6/mt-12、高 118rpx */
.pool-item {
  padding: 12rpx;
  display: flex;
  align-items: center;
  margin-top: 24rpx;
  background: #f7fbfa;
  border-radius: 25rpx;
  border: 1px solid #bfccc8;
}
/* 源站 w-image radius=4：59x59 / 55x55 */
.pool-thumb {
  width: 59rpx;
  height: 59rpx;
  border-radius: 8rpx;
  flex-shrink: 0;
}
/* 源站量测：中栏 flex-1 纵排 space-between、pl-8/ptb-6、高 118rpx */
.pool-meta {
  flex: 1;
  min-width: 0;
  height: 118rpx;
  padding: 12rpx 0 12rpx 16rpx;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
/* 源站量测：名称 font-size-13(26rpx) textPrimary(#555) w500 */
.pool-name {
  font-size: 26rpx;
  color: #555;
  font-weight: 500;
}
/* 源站量测：统计行 flex font-size-12(24rpx) */
.pool-stats {
  display: flex;
  font-size: 24rpx;
}
.stat-minor {
  color: #7a7a7a;
}
.stat-primary {
  color: #555;
}
.rarity-icon {
  width: 55rpx;
  height: 55rpx;
  border-radius: 8rpx;
  flex-shrink: 0;
}

/* ===== 藏品介绍盒（源站 w-product-introduce，盒规格同概率池盒） ===== */
.introduce-box {
  background: #ffffff;
  border-radius: 35rpx;
  border: 1px solid #bfccc8;
  padding: 30rpx;
  margin-top: 24rpx;
}
/* 源站量测：正文 u-parse 内联 color #686868 / font-size 28rpx；
   标题无 title 类，按页面默认 30rpx #4a4a4a 继承（不设显式值）。
   p 间距：源站未 reset，按 UA 默认 1em（继承 28rpx 字号）复现 */
.introduce-body {
  color: #686868;
  font-size: 28rpx;
  word-break: break-all;
}
.introduce-body :deep(p) {
  margin: 1em 0;
}

/* ===== 购买须知盒（源站 w-product-buy-need：mt-10 自带上 + mt-12 页面传入，
      后者定义序在后生效 → 间距 24rpx；盒规格同概率池盒） ===== */
.buyneed-box {
  background: #ffffff;
  border-radius: 35rpx;
  border: 1px solid #bfccc8;
  padding: 30rpx;
  margin-top: 24rpx;
}
/* 源站 scoped CSS：body line-height 1.7 + 内联 margin-top 20rpx */
.buy-body {
  margin-top: 20rpx;
  line-height: 1.7;
}
/* 源站 scoped CSS：normal 26rpx #656b75 / danger 26rpx #ec2121 */
.buy-normal {
  font-size: 26rpx;
  color: #656b75;
}
.buy-danger {
  font-size: 26rpx;
  color: #ec2121;
}

/* ===== 底部操作栏（源站 blindBox-detail-button scoped CSS 原值） ===== */
.product-action {
  width: 750rpx;
  position: fixed;
  left: 0;
  bottom: 0;
  z-index: 10;
  background: #fff;
  box-shadow: 0 -11rpx 13rpx 0 rgba(0, 0, 0, 0.04);
  padding: 30rpx;
  display: flex;
  gap: 20rpx;
}
/* 源站 w-button 契约：根节点 plr-10 MiSans-Demibold + z-btn(flex 居中/nowrap)；
   内联 #718878/46rpx/#fff/83rpx/27rpx，.act-btn 12rpx !important 覆盖圆角。
   disabled 态不改色（类选择器胜不过内联样式），仅禁点击——collectionDetails
   live dump 中 disabled 按钮实测仍为 #718878。 */
.act-btn {
  flex: 1;
  height: 83rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 10rpx;
  background: #718878;
  border-radius: 12rpx;
  font-size: 27rpx;
  font-family: MiSans-Demibold;
  color: #fff;
  white-space: nowrap;
  box-sizing: border-box;
}
</style>
