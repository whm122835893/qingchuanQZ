<template>
  <!-- 持有详情弹窗（popDetails）：底部弹出，自取数（getDetails），源站 pages-my-my 模块 26f1/493a -->
  <view v-if="show" class="pop-mask" @click="closePop"></view>
  <view v-if="show" class="pop-con">
    <!-- 头部：持有详情 + 批量寄售/取消选择/一键下架 + 关闭 -->
    <view class="header flex flex-ai-center flex-js-sb">
      <text class="MiSans-Demibold header-title">持有详情</text>
      <view class="flex flex-ai-center">
        <view
          v-if="types == 2 && collection.batch_up && !showCheck"
          class="action-pill flex flex-ai-center flex-js-center"
          @click="enterBatch"
        >
          <text class="MiSans-Regular pill-text">批量寄售</text>
        </view>
        <view
          v-else-if="types == 2 && showCheck"
          class="action-pill flex flex-ai-center flex-js-center"
          @click="cleatBatch"
        >
          <text class="MiSans-Regular pill-text">取消选择</text>
        </view>
        <view
          v-if="types == 2"
          class="action-pill action-pill--off flex flex-ai-center flex-js-center"
          @click="confirmOff = true"
        >
          <text class="MiSans-Regular pill-text">一键下架</text>
        </view>
        <!-- 源站 u-icon close size 18 #333 -->
        <svg class="close-icon" viewBox="0 0 24 24" aria-hidden="true" @click="closePop">
          <path d="M5 5 L19 19 M19 5 L5 19" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" fill="none" />
        </svg>
      </view>
    </view>

    <!-- 藏品概览：thumb + 名称/持有数量 + 地板价 + 涨跌幅 -->
    <view class="summary flex flex-ai-center">
      <img class="thumb" :src="thumbSrc" mode="aspectFill" />
      <view class="flex flex-dir-col summary-main">
        <text class="MiSans-Medium text-overflow summary-name">{{ collection.name || '--' }}</text>
        <text class="MiSans-Regular summary-sub">持有数量：{{ totalNum }}</text>
      </view>
      <view class="flex flex-dir-col flex-ai-end summary-side">
        <text class="MiSans-Demibold floor-price">{{ floorPriceText }}</text>
        <text class="MiSans-Regular summary-sub">市场地板价</text>
      </view>
      <view class="flex flex-dir-col flex-ai-end change-col">
        <view class="flex flex-ai-center">
          <img
            class="trend-icon"
            :src="changeNum >= 0 ? asset('static/my/zhang.png') : asset('static/my/die.png')"
            mode="aspectFit"
          />
          <text class="MiSans-Semibold change-text" :class="changeNum >= 0 ? 'up' : 'down'">{{ changeText }}</text>
        </view>
        <text class="MiSans-Regular summary-sub">市场涨跌幅</text>
      </view>
    </view>

    <!-- 实例编号列表 -->
    <scroll-view scroll-y class="list-scroll">
      <view
        v-for="(item, i) in list"
        :key="item.id || i"
        class="item-row"
        @click="onItemClick(item)"
      >
        <view class="flex flex-ai-center flex-js-sb">
          <view class="flex flex-ai-center item-code-col">
            <img
              v-if="showCheck && types == 2"
              class="check-icon"
              :src="isSelected(item) ? asset('static/common/check_select.png') : asset('static/common/check_default.png')"
              mode="aspectFit"
              @click.stop="toggleCheck(item)"
            />
            <text class="MiSans-Medium item-code">#{{ item.collection_code || item.id }}</text>
          </view>
          <view class="status-tag flex flex-ai-center flex-js-center">
            <text class="MiSans-Regular status-text">{{ statusText(item) }}</text>
          </view>
        </view>
        <text class="MiSans-Regular meta-line">{{ metaLine(item) }}</text>
      </view>
      <!-- 源站：list.length → 「没有更多数据了」；否则 w-loading emptyType=search -->
      <view v-if="list.length" class="flex flex-js-center list-end">
        <text class="MiSans-Regular end-text">没有更多数据了</text>
      </view>
      <view v-else-if="loadingType === 'empty'" class="pop-empty flex flex-dir-col flex-ai-center">
        <img class="empty-img" :src="asset('static/empty/search-empty.png')" mode="widthFix" />
        <text class="MiSans-Regular empty-title">暂无内容</text>
      </view>
    </scroll-view>

    <!-- 批量操作条：取消寄售 + 立即寄售(N) -->
    <view v-if="showCheck" class="batch-bar flex flex-js-sb flex-ai-center">
      <view class="batch-btn cancel flex flex-ai-center flex-js-center" @click="cleatBatch">
        <text class="MiSans-Regular batch-text">取消寄售</text>
      </view>
      <view class="batch-btn confirm flex flex-ai-center flex-js-center" @click="toResale">
        <text class="MiSans-Demibold batch-text">立即寄售({{ selectedIds.length }})</text>
      </view>
    </view>

    <!-- 盲盒操作条（types!=1 且非批量模式）：一键开启 / 逐个拆开 -->
    <view v-if="types != 1 && !showCheck" class="box-bar">
      <text class="MiSans-Regular box-tip">一次最多打开10个盲盒</text>
      <view class="flex flex-js-sb flex-ai-center box-btn-row">
        <view class="box-btn outline flex flex-ai-center flex-js-center" @click="openAll">
          <text class="MiSans-Regular box-btn-text">一键开启</text>
        </view>
        <view class="box-btn solid flex flex-ai-center flex-js-center" @click="takeApart">
          <text class="MiSans-Demibold box-btn-text solid-text">逐个拆开</text>
        </view>
      </view>
    </view>
  </view>

  <!-- 一键下架确认（源站 w-toast） -->
  <ConfirmToast
    :show="confirmOff"
    content="确认一键下架该藏品全部寄售中的商品？"
    ok-text="确认下架"
    @update:show="confirmOff = $event"
    @ok="onBatchOff"
  />

  <!-- 单个开盒结果（takeApart → openBox 单对象） -->
  <view v-if="showResultSingle" class="result-mask" @click="closeResult"></view>
  <view v-if="showResultSingle" class="result-single flex flex-dir-col flex-ai-center">
    <img
      v-if="resultSingle.rarity_icon"
      class="result-rarity"
      :src="resultImg(resultSingle.rarity_icon)"
      mode="aspectFit"
    />
    <img class="result-main" :src="resultImg(resultSingle.main_image || resultSingle.listimg)" mode="aspectFit" />
    <text class="MiSans-Medium result-name">{{ resultSingle.name || '--' }}</text>
    <text class="MiSans-Regular result-code">藏品编号：#{{ resultSingle.collection_code || '--' }}</text>
    <view class="result-btns flex flex-js-sb">
      <view class="box-btn outline flex flex-ai-center flex-js-center result-btn" @click="closeResult">
        <text class="MiSans-Regular box-btn-text">知道了</text>
      </view>
      <view class="box-btn solid flex flex-ai-center flex-js-center result-btn" @click="goMyAfterResult">
        <text class="MiSans-Demibold box-btn-text solid-text">我的藏品</text>
      </view>
    </view>
  </view>

  <!-- 批量开盒结果（openAll → openBoxs 数组） -->
  <view v-if="showResultList" class="result-mask" @click="closeResult"></view>
  <view v-if="showResultList" class="result-list">
    <text class="MiSans-Demibold result-title">开盒结果</text>
    <scroll-view scroll-y class="result-scroll">
      <view v-for="(item, i) in resultList" :key="i" class="result-item flex flex-ai-center">
        <img class="result-thumb" :src="resultImg(item.listimg || item.main_image)" mode="aspectFill" />
        <view class="flex flex-dir-col flex-1 result-item-main">
          <text class="MiSans-Medium text-overflow result-item-name">{{ item.name || '--' }}</text>
          <text class="MiSans-Regular result-item-code">藏品编号：#{{ item.collection_code || '--' }}</text>
        </view>
        <img
          v-if="item.rarity_icon"
          class="result-item-rarity"
          :src="resultImg(item.rarity_icon)"
          mode="aspectFit"
        />
      </view>
    </scroll-view>
    <text class="MiSans-Regular result-hint">商品陆续从链上转入个人中心，如有延迟请耐心等待</text>
    <view class="result-btns flex flex-js-sb">
      <view class="box-btn outline flex flex-ai-center flex-js-center result-btn" @click="closeResult">
        <text class="MiSans-Regular box-btn-text">知道了</text>
      </view>
      <view class="box-btn solid flex flex-ai-center flex-js-center result-btn" @click="goMyAfterResult">
        <text class="MiSans-Demibold box-btn-text solid-text">我的藏品</text>
      </view>
    </view>
  </view>
</template>

<script setup>
/**
 * 持有详情弹窗 —— 源站 popDetails（pages-my-my.0e9b7c94.js 模块 26f1 script + 493a render + CSS scope 64882cc4）
 *
 * 契约要点（均照抄源站）：
 * - props {id, types, showPop, summary}；watch showPop → 全量 reset + getDetails()
 * - getDetails({collection_id: id, types, page}) → data.list{total,data} + data.collection
 * - statusText：types==1 盲盒口径 / 其余口径（is_link/is_lock/status/can_compose）
 * - metaLine：来源：sourceText | 持有天数：day 天 | 购入价：¥buy_price??price | 寄售价：¥from_price
 * - sourceText：{1:购买,2:二级市场,3:开盲盒,4:赠送,5:空投,6:抽奖,7:积分兑换,8:合成} ?? source_name
 * - toggleCheck 仅 item.checked 可点（上限 200）；未勾选 toast「该藏品暂不可寄售」
 * - openAll → openBoxs(blindOpenId) 数组；takeApart → openBox(blindOpenId) 单对象
 * - onBatchOff → batchchangeMarketGoods({collection_id}) → 下架成功 → 刷新
 * - toResale → /pages/consignments/consignments?pageType={types}&id={ids}
 * - onItemClick：showCheck ? toggle : (types!=1 ? goCP : goBlindBox)，均 closePop + 300ms
 */
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { asset } from '@/utils/api'
import { ossImg } from '@/api'
import { fetchCollectionDetail, fetchOpenBox, fetchOpenBoxs, fetchBatchOff } from '@/utils/api'
import ConfirmToast from '@/components/ConfirmToast.vue'

const props = defineProps({
  show: { type: Boolean, default: false },
  id: { type: [String, Number], default: '' },
  types: { type: [String, Number], default: '' },
  summary: { type: Object, default: () => ({}) },
})
const emit = defineEmits(['update:show', 'opened'])

const router = useRouter()

const showCheck = ref(false)
const selectedIds = ref([])
const page = ref(1)
const list = ref([])
const isNext = ref(true)
const totalNum = ref(0)
const collection = ref({ batch_up: 0 })
const loadingType = ref('none')
const confirmOff = ref(false)
const showResultSingle = ref(false)
const showResultList = ref(false)
const resultSingle = ref({})
const resultList = ref([])

/** 源站 thumbSrc：collection.listimg ?? main_image ?? list_image ?? summary.collection.listimg；空 → logo.png */
const thumbSrc = computed(() => {
  const a =
    (collection.value && (collection.value.listimg || collection.value.main_image || collection.value.list_image)) ||
    (props.summary.collection && props.summary.collection.listimg) ||
    ''
  return a ? ossImg(a) : asset('static/logo/logo.png')
})

/** 源站 floorPriceText（弹窗版）：summary.min_price ?? summary.floor_price ?? collection.min_price ?? collection.floor_price */
const floorPriceText = computed(() => {
  const s = props.summary
  const a =
    s.min_price != null
      ? s.min_price
      : s.floor_price != null
        ? s.floor_price
        : collection.value.min_price != null
          ? collection.value.min_price
          : collection.value.floor_price
  return a == null || a === '' || Number(a) === 0 ? '--' : '¥' + Number(a)
})

/** 源站 changeNum（弹窗版）：summary.change_rate ?? summary.rise_fall ?? collection.change_rate ?? 0 */
const changeNum = computed(() => {
  const s = props.summary
  const a =
    s.change_rate != null
      ? s.change_rate
      : s.rise_fall != null
        ? s.rise_fall
        : collection.value.change_rate != null
          ? collection.value.change_rate
          : 0
  return Number(a) || 0
})

const changeText = computed(() => {
  const a = changeNum.value
  const d = a > 0 ? '+' : ''
  return `${d}${a.toFixed(2)}%`
})

/** 源站 blindOpenId：list 中首个带 blind_box_id 的项 ?? collection.blind_box_id ?? collection.id */
const blindOpenId = computed(() => {
  const a = list.value.find((x) => x.blind_box_id) || list.value[0]
  return (a && a.blind_box_id) || collection.value.blind_box_id || collection.value.id || ''
})

const SOURCE_TEXT = { 1: '购买', 2: '二级市场', 3: '开盲盒', 4: '赠送', 5: '空投', 6: '抽奖', 7: '积分兑换', 8: '合成' }

function resultImg(a) {
  return a ? ossImg(a) : asset('static/logo/logo.png')
}

function closePop() {
  emit('update:show', false)
}

/** watch showPop：源站 Object.assign($data, $options.data()) 全量 reset + getDetails */
watch(
  () => props.show,
  (v) => {
    showCheck.value = false
    selectedIds.value = []
    page.value = 1
    list.value = []
    isNext.value = true
    totalNum.value = 0
    collection.value = { batch_up: 0 }
    loadingType.value = 'none'
    confirmOff.value = false
    showResultSingle.value = false
    showResultList.value = false
    resultSingle.value = {}
    resultList.value = []
    if (v) getDetails()
  }
)

async function getDetails() {
  if (!isNext.value) return
  loadingType.value = 'loading'
  try {
    const t = await fetchCollectionDetail({
      collection_id: props.id,
      types: props.types,
      page: page.value,
    })
    const d = t || {}
    totalNum.value = (d.list && d.list.total) || 0
    collection.value = d.collection || {}
    list.value = (d.list && d.list.data) || []
    isNext.value = false
    loadingType.value = list.value.length ? 'none' : 'empty'
  } catch (e) {
    loadingType.value = 'empty'
  }
}

function getDetailsRefresh() {
  page.value = 1
  isNext.value = true
  list.value = []
  getDetails()
}

/** 源站 statusText 逐分支 */
function statusText(a) {
  if (props.types == 1) {
    if (a.status == 2) return '寄售中'
    if (a.status == 10) return '赠送中'
    if (a.is_lock) return '锁定中'
    return '未开启'
  }
  if (a.is_link === 0 && props.types == 2) return '上链中'
  if (a.is_lock) return '锁定中'
  if (a.status == 2) return '寄售中'
  if (a.status == 10) return '赠送中'
  if (a.can_compose) return '可合成'
  return '未寄售'
}

function sourceText(a) {
  return SOURCE_TEXT[a.source_type] || a.source_name || '--'
}

/** 源站 metaLine：来源 | 持有天数 | 购入价 | 寄售价 */
function metaLine(a) {
  const t = a.buy_price != null && a.buy_price !== '' ? a.buy_price : a.price != null && a.price !== '' ? a.price : '--'
  const d = a.from_price != null && a.from_price !== '' ? a.from_price : '--'
  const r = a.day != null ? a.day : '--'
  return `来源：${sourceText(a)} | 持有天数：${r}天 | 购入价：¥${t} | 寄售价：¥${d}`
}

function isSelected(a) {
  return selectedIds.value.indexOf(a.id) > -1
}

function enterBatch() {
  showCheck.value = true
  selectedIds.value = []
}

function cleatBatch() {
  showCheck.value = false
  selectedIds.value = []
}

/** 源站 toggleCheck：item.checked 才可操作；上限 200 */
function toggleCheck(a) {
  if (!a.checked) {
    uni.showToast({ icon: 'none', title: '该藏品暂不可寄售' })
    return
  }
  const t = selectedIds.value.indexOf(a.id)
  if (t > -1) selectedIds.value.splice(t, 1)
  else {
    if (selectedIds.value.length >= 200) {
      uni.showToast({ icon: 'none', title: '最多选择200个' })
      return
    }
    selectedIds.value.push(a.id)
  }
}

/** 源站 onItemClick：showCheck ? toggle : (types!=1 ? goCP : goBlindBox) */
function onItemClick(a) {
  if (showCheck.value) toggleCheck(a)
  else if (props.types != 1) goCP(a)
  else goBlindBox(a)
}

function toResale() {
  if (!selectedIds.value.length) {
    uni.showToast({ icon: 'none', title: '请选择寄售藏品' })
    return
  }
  router.push(`/pages/consignments/consignments?pageType=${props.types}&id=${selectedIds.value.join(',')}`)
}

async function onBatchOff() {
  confirmOff.value = false
  uni.showLoading({ title: '处理中' })
  try {
    await fetchBatchOff({ collection_id: props.id })
    uni.showToast({ icon: 'success', title: '下架成功' })
    getDetailsRefresh()
  } catch (e) {
    /* 源站 catch 为空 */
  } finally {
    uni.hideLoading()
  }
}

let openAllTimer = 0
let takeApartTimer = 0

/** 源站 openAll：$u.throttle(openAll, 3000) → openBoxs(blindOpenId) → resultList */
async function openAll() {
  const now = Date.now()
  if (now - openAllTimer < 3000) return
  openAllTimer = now
  if (!blindOpenId.value) {
    uni.showToast({ icon: 'none', title: '暂无可开启盲盒' })
    return
  }
  if (!totalNum.value) {
    uni.showToast({ icon: 'none', title: '暂无盲盒' })
    return
  }
  uni.showLoading({ title: '开启中...' })
  try {
    const t = await fetchOpenBoxs({ openid: blindOpenId.value })
    const d = (t && t.data) || []
    resultList.value = Array.isArray(d) ? d : d.list || []
    showResultList.value = true
    getDetailsRefresh()
    emit('opened')
  } catch (e) {
    /* 源站 catch 为空 */
  } finally {
    uni.hideLoading()
  }
}

/** 源站 takeApart：$u.throttle(takeApart, 1000) → openBox(blindOpenId) → resultSingle */
async function takeApart() {
  const now = Date.now()
  if (now - takeApartTimer < 1000) return
  takeApartTimer = now
  if (!blindOpenId.value) {
    uni.showToast({ icon: 'none', title: '暂无可开启盲盒' })
    return
  }
  if (!totalNum.value) {
    uni.showToast({ icon: 'none', title: '暂无盲盒' })
    return
  }
  uni.showLoading({ title: '开启中...' })
  try {
    const t = await fetchOpenBox({ openid: blindOpenId.value })
    resultSingle.value = (t && t.data) || {}
    showResultSingle.value = true
    getDetailsRefresh()
    emit('opened')
  } catch (e) {
    /* 源站 catch 为空 */
  } finally {
    uni.hideLoading()
  }
}

function closeResult() {
  showResultSingle.value = false
  showResultList.value = false
  resultSingle.value = {}
  resultList.value = []
}

function goMyAfterResult() {
  closeResult()
  closePop()
}

function goBlindBox(a) {
  closePop()
  setTimeout(() => {
    router.push(`/pages/blindBox/blindBoxDetails?id=${a.id}`)
  }, 300)
}

function goCP(a) {
  closePop()
  setTimeout(() => {
    router.push(`/pages/myCollection/collectionDetails?id=${a.id}`)
  }, 300)
}
</script>

<style scoped>
@import '@/styles/atomic.css';

.pop-mask {
  position: fixed;
  inset: 0;
  z-index: 40;
  background: rgba(0, 0, 0, 0.5);
}
/* 源站 u-popup mode=bottom round=24rpx；pop-con radius 32rpx 32rpx 0 0 */
.pop-con {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 41;
  width: 100%;
  padding: 32rpx 28rpx calc(24rpx + env(safe-area-inset-bottom));
  background: #fff;
  border-radius: 32rpx 32rpx 0 0;
  box-sizing: border-box;
}

.header {
  padding-bottom: 24rpx;
  border-bottom: 1px solid #f0f0f0;
}
.header-title {
  font-size: 34rpx;
  color: #1a2438;
}
.action-pill {
  height: 52rpx;
  padding: 0 22rpx;
  margin-right: 16rpx;
  border: 1px solid #d8d8d8;
  border-radius: 26rpx;
  flex-shrink: 0;
}
.action-pill--off {
  margin-right: 20rpx;
}
.pill-text {
  font-size: 24rpx;
  color: #1a2438;
}
.close-icon {
  width: 18px;
  height: 18px;
  color: #333;
  flex-shrink: 0;
}

.summary {
  padding: 28rpx 0;
  border-bottom: 1px solid #f0f0f0;
}
.thumb {
  width: 96rpx;
  height: 96rpx;
  border-radius: 12rpx;
  background: #2f4f3a;
  flex-shrink: 0;
}
.summary-main {
  flex: 1.2;
  min-width: 0;
  margin-left: 16rpx;
}
.summary-side {
  flex: 0.8;
  margin-left: 8rpx;
}
.change-col {
  flex: 0.9;
  margin-left: 12rpx;
}
.summary-name {
  font-size: 28rpx;
  color: #1a2438;
}
.summary-sub {
  margin-top: 8rpx;
  font-size: 20rpx;
  color: #999;
}
.floor-price {
  font-size: 28rpx;
  color: #1a2438;
}
.trend-icon {
  width: 28rpx;
  height: 20rpx;
  flex-shrink: 0;
}
.change-text {
  margin-left: 4rpx;
  font-size: 24rpx;
}
.change-text.up {
  color: #e54d42;
}
.change-text.down {
  color: #22a06b;
}

.list-scroll {
  max-height: 520rpx;
  margin-top: 8rpx;
}
.item-row {
  padding: 28rpx 0;
  border-bottom: 1px solid #f5f5f5;
}
.item-code-col {
  min-width: 0;
  flex: 1;
}
.check-icon {
  width: 36rpx;
  height: 36rpx;
  margin-right: 16rpx;
  flex-shrink: 0;
}
.item-code {
  font-size: 30rpx;
  color: #1a2438;
}
.status-tag {
  height: 44rpx;
  padding: 0 16rpx;
  margin-left: 16rpx;
  border: 1px solid #ddd;
  border-radius: 6rpx;
  flex-shrink: 0;
}
.status-text {
  font-size: 22rpx;
  color: #666;
}
.meta-line {
  display: block;
  margin-top: 16rpx;
  font-size: 22rpx;
  color: #999;
  line-height: 1.5;
}
/* 源站列表底部：list.length → padding 28rpx 0 8rpx，24rpx #bbb */
.list-end {
  padding: 28rpx 0 8rpx;
}
.end-text {
  font-size: 24rpx;
  color: #bbb;
}
/* 源站 w-loading emptyType=search：330rpx 图 + title「暂无内容」26rpx #999，mt=2×40rpx */
.pop-empty {
  margin-top: 80rpx;
}
.empty-img {
  width: 330rpx;
  height: auto;
}
.empty-title {
  margin-top: 16rpx;
  font-size: 26rpx;
  color: #999;
}

.batch-bar {
  padding-top: 20rpx;
}
.batch-btn {
  height: 80rpx;
  border-radius: 40rpx;
}
.batch-btn.cancel {
  width: 240rpx;
  border: 1px solid #d8d8d8;
}
.batch-btn.confirm {
  width: 400rpx;
  background: #1a2438;
}
.batch-text {
  font-size: 28rpx;
  color: #1a2438;
}
.batch-btn.confirm .batch-text {
  color: #fff;
}

.box-bar {
  padding-top: 20rpx;
}
.box-tip {
  display: block;
  text-align: center;
  font-size: 22rpx;
  color: #999;
}
.box-btn-row {
  margin-top: 16rpx;
}
.box-btn {
  height: 80rpx;
  border-radius: 40rpx;
}
.box-btn.outline {
  width: 300rpx;
  border: 1px solid #d8d8d8;
}
.box-btn.solid {
  width: 300rpx;
  background: #1a2438;
}
.box-btn-text {
  font-size: 28rpx;
  color: #1a2438;
}
.box-btn-text.solid-text {
  color: #fff;
}

/* 开盒结果弹窗（u-popup center round 16rpx） */
.result-mask {
  position: fixed;
  inset: 0;
  z-index: 50;
  background: rgba(0, 0, 0, 0.5);
}
.result-single {
  position: fixed;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  z-index: 51;
  width: 620rpx;
  padding: 48rpx 32rpx 40rpx;
  box-sizing: border-box;
  background: #fff;
  border-radius: 16rpx;
}
.result-rarity {
  width: 160rpx;
  height: 118rpx;
}
.result-main {
  width: 360rpx;
  height: 360rpx;
  margin: 24rpx 0;
  border-radius: 16rpx;
  background: #f5f5f5;
}
.result-name {
  font-size: 32rpx;
  color: #1a2438;
}
.result-code {
  margin-top: 8rpx;
  font-size: 24rpx;
  color: #999;
}
.result-btns {
  width: 100%;
  margin-top: 28rpx;
}
.result-btn {
  width: 240rpx;
}
.result-btn .box-btn-text {
  font-size: 26rpx;
}

.result-list {
  position: fixed;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  z-index: 51;
  width: 640rpx;
  padding: 36rpx 28rpx 32rpx;
  box-sizing: border-box;
  background: #fff;
  border-radius: 16rpx;
}
.result-title {
  font-size: 32rpx;
  color: #1a2438;
}
.result-scroll {
  max-height: 560rpx;
  margin-top: 24rpx;
}
.result-item {
  padding: 16rpx;
  margin-bottom: 16rpx;
  background: #f7f7f7;
  border-radius: 16rpx;
}
.result-thumb {
  width: 100rpx;
  height: 100rpx;
  border-radius: 12rpx;
  background: #eee;
  flex-shrink: 0;
}
.result-item-main {
  margin: 0 16rpx;
  min-width: 0;
}
.result-item-name {
  font-size: 26rpx;
  color: #1a2438;
}
.result-item-code {
  margin-top: 8rpx;
  font-size: 22rpx;
  color: #999;
}
.result-item-rarity {
  width: 88rpx;
  height: 82rpx;
  flex-shrink: 0;
}
.result-hint {
  display: block;
  margin-top: 8rpx;
  text-align: center;
  font-size: 20rpx;
  color: #999;
}
</style>
