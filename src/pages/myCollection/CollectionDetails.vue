<template>
  <view class="collection-details-page" id="colection">
    <!-- ═══════════════════════════════════════════════════════════
      顶部导航（原站 w-navbar navType="market" placeholder=false）
      源站运行 DOM 实测：fixed 透明浮层，content 高 44px；
      左侧返回圆钮 29x29（56rpx）半透明白、内箭头 8x14；
      右侧「炫耀」图 xuanyao.png 50x22（高 44rpx mode=heightFix），
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
      藏品主卡（原站 w-product-details-card，与 market/Detail 同组件）
      源站运行 DOM 实测：卡片 390x564、底色 #e8f0eb、背景图 top_bg.png；
      img-wrap 208x208 距卡顶 148px；main-img 208x210 圆角 23px、1px 描边；
      preview 圆钮 36x36 半透明白；name 20px #1a2438；
      限量标签 32x18 底色 #718878 圆角 3px 0 0 3px + 白底右段。
      注：isShengou 为组件 prop 且本页未传（默认 false），
      故走「限量」分支而非申购规则分支（bundle 实证）。
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
      白色信息卡（源站 ptb-12 plr-16 内联样式原样）
      源站实测：白底、上圆角 20px、整体上移 40rpx 盖住主卡底部。
    ═══════════════════════════════════════════════════════════ -->
    <view class="ptb-12 plr-16 detail-body">
      <!-- 链上信息三行（源站内联：白卡 + 35rpx 圆角 + 1px #bfccc8 描边） -->
      <view class="tech-card flex flex-dir-col mt-8">
        <view v-for="row in techRows" :key="row.label" class="tech-row flex flex-ai-center flex-js-sb">
          <text class="MiSans-Regular tech-label">{{ row.label }}</text>
          <text class="MiSans-Regular tech-value text-overflow">{{ row.value }}</text>
        </view>
      </view>

      <!-- 购买须知（原站 w-product-buy-need，文案逐字取自 bundle）
           注：源站该组件 render 的标题无 title class，按页面默认 30rpx/#4a4a4a 继承渲染
           （live DOM 实测 fs 15px=floor(15.6)、color rgb(74,74,74)），不设显式字号 -->
      <view class="buy-need mt-20">
        <text class="MiSans-Demibold">购买须知</text>
        <view class="buy-body MiSans-Regular">
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
      底部操作栏（原站 collection-detail-button）
      源站实测：fixed 底部白底、上投影 0 -11rpx 13rpx rgba(0,0,0,.04)；
      按钮 362x43、底色 #718878、圆角 6px、白字 14px；
      多按钮时间距 20rpx。按钮显隐与 info(user_hash/status) +
      product(is_lock/weither_regift/weither_resale/can_compose) 严格对应
      bundle render，不增不减。
    ═══════════════════════════════════════════════════════════ -->
    <view class="product-action">
      <view class="action-btns flex-center-sb">
        <template v-if="info.user_hash">
          <view v-if="info.status === 10" class="act-btn disabled">赠送中</view>
          <view v-else-if="info.status === 2 && product.is_lock === 1" class="act-btn disabled">
            锁定中
          </view>
          <view
            v-else-if="product.weither_regift === 0 && info.status === 1"
            class="act-btn"
            @click="goRegift"
          >
            转赠
          </view>
          <view
            v-else-if="product.can_compose === 1 && !product.is_lock && info.status === 1"
            class="act-btn"
            @click="goCompound"
          >
            合成
          </view>
          <view
            v-else-if="product.weither_resale === 0 && info.status === 1"
            class="act-btn"
            @click="goConsignment"
          >
            立即寄售
          </view>
          <view v-else-if="info.status === 2 && product.is_lock !== 1" class="act-btn" @click="cancelPop = true">
            取消寄售
          </view>
          <view
            v-else-if="
              info.status === 1 &&
              product.is_lock !== 1 &&
              product.weither_regift === 1 &&
              product.weither_resale === 1 &&
              product.can_compose === 0
            "
            class="act-btn disabled"
          >
            尚未开启寄售
          </view>
        </template>
        <view v-else class="act-btn disabled">上链中</view>
      </view>
    </view>

    <!-- 取消寄售确认（原站 w-toast「确认取消此寄售？」） -->
    <ConfirmToast v-model:show="cancelPop" content="确认取消此寄售？" @ok="doCancel" />
  </view>
</template>

<script setup>
/**
 * 原站 pages/myCollection/collectionDetails —— 我的藏品详情。
 *
 * 结构（源站 bundle render + 运行 DOM dump 双轨取证）：
 *   w-navbar(market) → w-product-details-card → 白卡(tech 三行 + 购买须知 +
 *   w-copyright 空占位) → collection-detail-button。
 *
 * 关键字段路径（与原站 render 逐字对齐）：
 *   tech 第一行 藏品持有者 = userInfo.nickname（当前登录用户昵称）
 *   tech 第二行 创作者     = "青川"（源站硬编码）
 *   tech 第三行 认证时间   = $u.timeFormat(product.createtime, "yyyy.mm.dd")
 *   按钮组判据 = info(user_hash/status) + product(is_lock/weither_regift/
 *   weither_resale/can_compose)，取消寄售入参 info.market_goods.id。
 *
 * 取消寄售为源站**无滑块**的写操作（changeMarketGoods 直调），
 * 故本地真实调用后端接口并在成功后 refresh（与源站 $emit('refresh') 一致）。
 */
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { asset, fetchCollectionInfo, fetchUserInfo } from '@/utils/api'
import { api, ossImg } from '@/api'
import ConfirmToast from '@/components/ConfirmToast.vue'

defineOptions({ name: 'CollectionDetailsPage' })

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

const details = ref({ product: {} })
const userInfo = ref({})
const cancelPop = ref(false)

const info = computed(() => details.value || {})
const product = computed(() => (details.value && details.value.product) || {})

const mainImg = computed(() => {
  const p = product.value
  const src = p.main_image || p.listimg || ''
  if (!src) return ''
  return src.startsWith('http') ? src : ossImg(src)
})

/** 源站 $u.timeFormat(createtime, "yyyy.mm.dd")：unix 秒 → yyyy.mm.dd */
function timeFormat(ts, fmt) {
  if (!ts) return ''
  const d = new Date(Number(ts) * 1000)
  const p = (v) => String(v).padStart(2, '0')
  return fmt
    .replace('yyyy', d.getFullYear())
    .replace('mm', p(d.getMonth() + 1))
    .replace('dd', p(d.getDate()))
}

const techRows = computed(() => [
  { label: '藏品持有者', value: userInfo.value.nickname || '' },
  { label: '创作者', value: '青川' },
  { label: '认证时间', value: timeFormat(product.value.createtime, 'yyyy.mm.dd') },
])

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

/* ── 按钮行为（源站 collection-detail-button methods 逐一对应） ── */

function goRegift() {
  router.push({ path: '/pages/regift/regift', query: { id: info.value.id } })
}

function goConsignment() {
  router.push({
    path: '/pages/consignments/consignments',
    query: { id: info.value.id, pageType: 1 },
  })
}

function goCompound() {
  // 源站 goCompound：查 pageConfig「合成通道」菜单 path，未配置时 toast「合成未开启」。
  // 本地无动态菜单体系，合成通道路由即 /pages/compound/compound。
  router.push('/pages/compound/compound')
}

async function doCancel() {
  cancelPop.value = false
  const mg = info.value.market_goods
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

onMounted(async () => {
  await getDetails()
  const u = await fetchUserInfo()
  if (u) userInfo.value = u
})
</script>

<style scoped>
@import '@/styles/atomic.css';

.collection-details-page {
  min-height: 100vh;
  background: #f4f6fa;
  padding-bottom: 160rpx;
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
/* 源站量测：右侧炫耀图 50x22（高 44rpx heightFix），右边距 12px */
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

/* ===== 藏品主卡（源站量测与 market/Detail 同组件，逐值一致） ===== */
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
/* 源站量测：tech 卡圆角 18px、1px #bfccc8 描边、左右 padding 12rpx */
.tech-card {
  background: #ffffff;
  border-radius: 35rpx;
  border: 1px solid #bfccc8;
  padding: 0 12rpx;
}
/* 源站量测：tech-row 高 52px、左右 padding 12px、行间隔线 #eaeaea */
.tech-row {
  height: 100rpx;
  padding: 0 24rpx;
  justify-content: space-between;
}
.tech-row:not(:last-child) {
  border-bottom: 1px solid #eaeaea;
}
/* 源站量测：label/value 无显式字号/颜色类，按页面默认 30rpx/#4a4a4a 继承
   （live DOM 实测 fs 15px=floor(15.6)、color rgb(74,74,74)） */

/* ===== 购买须知（源站 CSS 原值：padding 32/32/24rpx） ===== */
.buy-need {
  background: #ffffff;
  border-radius: 35rpx;
  border: 1px solid #bfccc8;
  padding: 32rpx 32rpx 24rpx;
}
/* 源站量测：正文距标题 20rpx、行高 1.7、13px */
.buy-body {
  margin-top: 20rpx;
  line-height: 1.7;
}
.buy-normal {
  font-size: 26rpx;
  color: #656b75;
}
/* 源站量测：首条警示 13px #ec2121 */
.buy-danger {
  font-size: 26rpx;
  color: #ec2121;
}

/* ===== 底部操作栏（源站 CSS 原值） ===== */
.product-action {
  width: 750rpx;
  position: fixed;
  left: 0;
  bottom: 0;
  z-index: 10;
  background: #fff;
  box-shadow: 0 -11rpx 13rpx 0 rgba(0, 0, 0, 0.04);
  padding: 16rpx 28rpx calc(16rpx + env(safe-area-inset-bottom));
}
.action-btns {
  gap: 20rpx;
}
/* 源站量测：act-btn 362x43、底色 #718878、圆角 6px、白字 14px
   （w-button 内联高 83rpx/字 27rpx，.act-btn 12rpx !important 覆盖 46rpx 圆角） */
.act-btn {
  flex: 1;
  height: 83rpx;
  line-height: 83rpx;
  text-align: center;
  border-radius: 12rpx;
  font-size: 27rpx;
  color: #fff;
  background: #718878;
}
.act-btn.disabled {
  opacity: 1;
}
</style>
