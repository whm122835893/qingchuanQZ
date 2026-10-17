<template>
  <view class="container market-page">
    <!-- 搜索栏 + 榜单入口 -->
    <view class="search-bar flex flex-ai-center">
      <view class="search-input flex flex-ai-center flex-1" @click="goSearch">
        <img class="search-icon" :src="asset('static/market/search.png')" mode="widthFix" />
        <text class="MiSans-Regular search-placeholder">搜索关键词...</text>
      </view>
      <text class="MiSans-Medium rank-btn" @click="goRank">榜单</text>
    </view>

    <!-- 板块横滑。源站此处是普通横向 flex 容器（非 scroll-view，padding 12px 12px 0），
         board-card 直接作为 flex 子项，故不套 board-list 中间层 -->
    <view class="board-scroll flex flex-ai-end">
        <view
          v-for="(b, i) in boards"
          :key="i"
          class="board-card"
          :class="{ active: currentBoard === i }"
          @click="selectBoard(i)"
        >
          <template v-if="currentBoard === i">
            <view class="flex flex-ai-center">
              <view class="flex flex-ai-center flex-js-center board-tag">
                <text class="MiSans-Regular board-tag-text">板块</text>
              </view>
              <text class="MiSans-Bold board-name">{{ b.name }}</text>
            </view>
            <text class="MiSans-Demibold board-value">{{ b.value }}</text>
            <view class="flex flex-ai-center">
              <!-- 源站板块卡用 market_zhang.png（涨）/ die.png（跌），尺寸 14x10 -->
              <img
                class="board-arrow"
                :src="String(b.rate).startsWith('-') || b.rawRate < 0 ? asset('static/market/die.png') : asset('static/market/market_zhang.png')"
                mode="aspectFit"
              />
              <text class="MiSans-Regular board-rate">{{ b.rate }}</text>
            </view>
          </template>
          <template v-else>
            <text class="MiSans-Medium board-name-sm">{{ b.name }}</text>
            <text class="MiSans-Medium board-value-sm">{{ b.value }}</text>
          </template>
        </view>
    </view>

    <!-- 列表面板 -->
    <view class="panel">
      <!-- 筛选行 -->
      <view class="flex flex-ai-center flex-js-sb filter-row">
        <view class="flex flex-ai-center">
          <view class="flex flex-ai-center" @click="openFilter">
            <text class="MiSans-Regular filter-text">筛选</text>
            <img class="filter-icon" :src="asset('static/market/market_filter.png')" mode="widthFix" />
          </view>
          <view class="flex flex-ai-center" @click="toggleSort">
            <text class="MiSans-Regular filter-text">藏品</text>
            <!-- 源站：arrow_up.png 旋转 180° 作下三角，尺寸 9x6 -->
            <img
              class="sort-icon"
              :src="sortAsc ? asset('static/market/sort_down.png') : asset('static/market/arrow_up.png')"
              mode="widthFix"
              :style="{ transform: sortAsc ? 'none' : 'rotate(180deg)' }"
            />
          </view>
        </view>
        <view class="flex flex-ai-center" @click="toggleOut">
          <img
            class="out-icon"
            :src="onlyNotOut ? asset('static/market/radio_sel.png') : asset('static/market/radio_default.png')"
            mode="widthFix"
          />
          <text class="MiSans-Regular out-text">未退市</text>
        </view>
      </view>

      <!-- 系列分类 -->
      <scroll-view scroll-x  class="cate-scroll" :show-scrollbar="false">
        <view class="cate-list flex">
          <view
            v-for="(c, i) in cates"
            :key="i"
            class="cate-item"
            :class="{ active: currentCate === i }"
            @click="selectCate(i)"
          >
            <text class="MiSans-Regular cate-text">{{ c }}</text>
          </view>
        </view>
      </scroll-view>

      <!-- 表头 -->
      <view class="flex flex-ai-center table-head">
        <text class="MiSans-Regular th-text">藏品</text>
        <view class="flex flex-ai-center flex-js-center th-col">
          <text class="MiSans-Regular th-text">成交量</text>
          <img class="th-sort" :src="asset('static/market/sort_default.png')" mode="widthFix" />
        </view>
        <view class="flex flex-ai-center flex-js-center th-col">
          <text class="MiSans-Regular th-text">地板价</text>
          <img class="th-sort" :src="asset('static/market/sort_default.png')" mode="widthFix" />
        </view>
        <text class="MiSans-Regular th-text th-last">涨跌幅</text>
      </view>

      <!-- 藏品列表 -->
      <view class="goods-list">
        <view
          v-for="g in displayList"
          :key="g.id"
          class="market-row flex flex-ai-center"
          @click="goDetail(g)"
        >
          <view class="flex flex-ai-center goods-left">
            <img class="goods-img" :src="ossImg(g.listimg)" mode="aspectFill" />
            <view class="flex flex-dir-col goods-info">
              <view class="flex flex-ai-center">
                <text class="MiSans-Medium text-overflow goods-name">{{ g.name }}</text>
                <img class="like-icon" :src="asset('static/market/like_default.png')" mode="widthFix" />
              </view>
              <view v-if="g.is_out" class="out-tag flex flex-ai-center flex-js-center">
                <text class="MiSans-Regular out-tag-text">已退市</text>
              </view>
            </view>
          </view>

          <view class="flex flex-dir-col ml-8 goods-nums">
            <text class="MiSans-Regular num-line">发行 <text class="font-color-343434 MiSans-Demibold">{{ g.total_num }}</text></text>
            <text class="MiSans-Regular num-line">流通 <text class="font-color-343434 MiSans-Demibold">{{ g.flux }}</text></text>
            <text class="MiSans-Regular num-line">成交 <text class="font-color-343434 MiSans-Demibold">{{ g.deal_num }}</text></text>
          </view>

          <view class="flex flex-js-center goods-price">
            <text class="MiSans-Demibold price-text">{{ g.min_price && g.min_price !== '0.00' ? g.min_price : '--' }}</text>
          </view>

          <view class="flex flex-ai-center flex-js-end goods-rate">
            <!-- 源站：涨用 market_zhang.png（红），跌用 die.png（绿），
                 尺寸固定 12x9，不是 arrow_up + rotate -->
            <img
              class="rate-arrow"
              :src="Number(g.market_fluctuate) >= 0 ? asset('static/market/market_zhang.png') : asset('static/market/die.png')"
              mode="aspectFit"
            />
            <text
              class="MiSans-Semibold rate-text"
              :class="Number(g.market_fluctuate) >= 0 ? 'rate-up' : 'rate-down'"
            >{{ rateText(g) }}</text>
          </view>
        </view>

        <view v-if="!displayList.length" class="empty-box flex flex-dir-col flex-ai-center">
          <img class="empty-img" :src="asset('static/empty/market-empty.png')" mode="widthFix" />
          <text class="MiSans-Regular empty-text">我已经到底了</text>
        </view>
      </view>
    </view>

    <AppTabBar :value="2" />
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AppTabBar from '@/components/AppTabBar.vue'
import { ossImg } from '@/api'
import { fetchMarketList, fetchSeries, fetchSeriesPid } from '@/utils/api'

defineOptions({ name: 'MarketPage' })

const router = useRouter()
const asset = (p) => import.meta.env.BASE_URL + p.replace(/^\//, '')

const goodsList = ref([])
const boards = ref([])
const cates = ref([])
const currentBoard = ref(1)
const currentCate = ref(0)
const boardSeriesIds = ref([])
const cateSeriesIds = ref([])
/** 选中 chip（子系列）优先，否则用选中板块的 series_id —— 对齐源站请求参数 */
const activeSeriesId = computed(
  () => cateSeriesIds.value[currentCate.value] ?? boardSeriesIds.value[currentBoard.value]
)
const sortAsc = ref(false)
const onlyNotOut = ref(false)

/** 默认展示全部（含已退市），与原站一致；点击右上角切为仅看未退市 */
const displayList = computed(() => {
  if (!onlyNotOut.value) return goodsList.value
  return goodsList.value.filter((g) => !g.is_out)
})

// 涨跌箭头由原站图片 icon/market/arrow_up.png 承担（见模板 img.rate-arrow），此处只出数值
const rateText = (g) => Math.abs(Number(g.market_fluctuate || 0)).toFixed(2) + '%'

function selectBoard(i) {
  currentBoard.value = i
  loadGoods()
}

/** 选中系列分类 chip：源站按该 chip 的 series_id 重新拉列表 */
function selectCate(i) {
  currentCate.value = i
  loadGoods()
}

function toggleSort() {
  sortAsc.value = !sortAsc.value
}

function toggleOut() {
  onlyNotOut.value = !onlyNotOut.value
}

function openFilter() { /* 原站筛选弹窗在交易链路阶段实现 */ }
function goSearch() { router.push('/pages/market/search') }
function goRank() { router.push('/pages/market/marketCapRanking') }
function goDetail(g) {
  // 源站实测：点击市场列表行跳「专辑列表」页，而非藏品详情页
  // 实测 URL：#/pages/market/marketGoodsList?id=236&goodsType=2&minPrice=15
  // goodsType=2 为藏品（1 为盲盒），minPrice 传该藏品的最低价（无则 0）
  const minPrice = Number(g.min_price || 0)
  router.push({
    path: '/pages/market/marketGoodsList',
    query: {
      id: g.id,
      goodsType: g.goods_type ?? 2,
      minPrice: Number.isFinite(minPrice) ? minPrice : 0,
    },
  })
}

async function loadGoods() {
  // 源站按选中板块的 series_id 拉取列表（实测请求 {goods_type:2,page:1,list_rows:9999,series_id:15}）
  const list = await fetchMarketList({ page: 1, list_rows: 20, series_id: activeSeriesId.value })
  goodsList.value = list.map((g) => ({
    ...g,
    // 原站图片走CDN，本地资源已按原路径下载到 public/uploads
    listimg: asset(g.listimg.split('?')[0]),
  }))
  // 板块卡市值/涨跌幅：源站由当前系列的藏品聚合而来
  // （实测点击板块卡后数值随之变化，如「2026」518.40 → 「光」43.75）。
  // 市值合计向下取两位小数，涨跌幅取各藏品 market_fluctuate 均值，无藏品时显示 --。
  const cur = boards.value[currentBoard.value]
  if (cur && goodsList.value.length) {
    const mv = goodsList.value.reduce((s, g) => s + Number(g.market_value || 0), 0)
    const rf = goodsList.value.reduce((s, g) => s + Number(g.market_fluctuate || 0), 0) / goodsList.value.length
    cur.value = mv.toFixed(2)
    cur.rawRate = rf
    cur.rate = Math.abs(rf).toFixed(2) + '%'
  } else if (cur) {
    cur.value = '--'
    cur.rawRate = 0
    cur.rate = '--'
  }
}

onMounted(async () => {
  const [s1, s2] = await Promise.all([
    fetchSeries({ type: 10 }),
    fetchSeriesPid({ type: 10, pid: 10 })
  ])
  // 系列分类 chip：源站只渲染 getSeries?type=10&pid=10 的子系列（实测仅「赛博」一项），
  // 不含顶层系列，故取 s2 而非 s1+s2。
  cates.value = s2.map((x) => x.series_name)
  cateSeriesIds.value = s2.map((x) => x.series_id)
  // 源站板块区只渲染 getSeries?type=10 返回的系列（实测源站仅「2026」「光」两张卡，
  // 并不包含 pid 子系列「赛博」——赛博只出现在下方系列分类 chip 中）。
  // 首项为 is_def=1 的默认系列并默认选中。
  const defIdx = s1.findIndex((x) => x.is_def === 1)
  boards.value = s1.map((x) => ({ name: x.series_name, value: '--', rate: '--', rawRate: 0 }))
  boardSeriesIds.value = s1.map((x) => x.series_id)
  currentBoard.value = defIdx >= 0 ? defIdx : 0
  // 源站默认选中分类 chip 的第一项（实测默认 series_id=15 即「赛博」子系列）
  currentCate.value = 0
  await loadGoods()
})
</script>

<style scoped>

.market-page {
  display: block;
  width: 100%;
  box-sizing: border-box;
  padding-left: 0;
  padding-right: 0;
}

.market-page {
  min-height: 100vh;
  /* 底部固定 tabbar 高 160rpx */
  padding-bottom: 160rpx;
  background: #fff url('/static/market/market_bg.png') no-repeat 50% 0 / 100% 100%;
}
/* 搜索栏：y54 h35 */
.search-bar {
  margin-top: 54px;
  height: 35px;
  padding: 0 12px;
}
.search-input {
  height: 35px;
  padding: 0 12px;
  background: #fff;
  border-radius: 18px;
  border: 1px solid #e8f0eb;
}
.search-icon {
  width: 16px;
  height: 16px;
}
.search-placeholder {
  margin-left: 6px;
  font-size: 13px;
  color: #999;
}
.rank-btn {
  margin-left: 12px;
  font-size: 14px;
  color: #5f7a68;
}
/* 板块横滑：源站为普通横向 flex 容器（非 scroll-view），padding 12px 12px 0 */
.board-scroll {
  margin-top: 0;
  height: 99px;
  padding: 12px 12px 0;
}
.board-list {
  align-items: flex-end;
  height: 99px;
}
.board-card {
  flex-shrink: 0;
  width: 79px;
  height: 76px;
  margin-right: 0;
  padding: 10px 12px;
  background: #fff;
  border-radius: 10px;
}
.board-card.active {
  width: 162px;
  height: 87px;
  margin-right: 8px;
  background: #fff url('/static/market/market_tab_sel.png') no-repeat 50% 50% / 100% 100%;
}
.board-tag {
  height: 15px;
  padding: 1px 7px;
  background: #58c092;
  border-radius: 10px;
}
.board-tag-text {
  font-size: 10px;
  color: #fff;
}
.board-name {
  margin-left: 0;
  font-size: 16px;
  color: #1a2438;
}
.board-value {
  margin-top: 4px;
  font-size: 17px;
  line-height: 23px;
  color: #1a2438;
}
.board-arrow {
  width: 14px;
  height: 10px;
  margin-right: 3px;
}
.board-rate {
  margin-left: 3px;
  font-size: 11px;
  color: #e54d42;
}
/* 非激活板块卡：源站文字为蓝灰色 #98A6BF */
.board-name-sm {
  font-size: 12px;
  color: #98a6bf;
}
.board-value-sm {
  margin-top: 8px;
  font-size: 13px;
  color: #98a6bf;
  white-space: nowrap;
}
/* 面板：y200 mt12 padding 12 12 0 */
.panel {
  margin-top: 12px;
  padding: 12px 12px 0;
}
.filter-row {
  padding: 4px 0 10px;
}
.filter-text {
  font-size: 13px;
  /* 源站 rgb(51,51,51) */
  color: #333;
}
.filter-icon {
  width: 12px;
  height: 12px;
  margin-left: 4px;
}
.sort-icon {
  width: 9px;
  height: 6px;
  margin-left: 4px;
}
.out-text {
  margin-left: 5px;
  font-size: 13px;
  color: #333;
}
.out-icon {
  width: 14px;
  height: 14px;
}
/* 系列分类：y244 h26 */
.cate-scroll {
  width: 100%;
  height: 26px;
}
.cate-list {
  flex-direction: row;
}
/* 分类 chip。
   源站计算样式：inline-flex / width:48.0156px / height:26px / padding:5px 12px / box-sizing:border-box。
   注意 width 是源站显式给定的；本地若只写 padding，在 border-box 下会被压成 24px
   （flex 项按内容协商 + padding 占满），故这里显式声明宽度。 */
.cate-item {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 26px;
  padding: 5px 12px;
  margin-right: 8px;
  border-radius: 6px;
  flex-shrink: 0;
  /* 源站 .cate-item 为 white-space: nowrap（继承自横向 scroll-view），
     若沿用 uni-text 的 pre-line，中文会被压成两行。 */
  white-space: nowrap;
}
.cate-item.active {
  background: #e8f0eb;
}
.cate-text {
  /* 源站 style="font-size: 12px" */
  font-size: 12px;
  color: #4a4a4a;
  /* uni-text 作为 .cate-item(inline-flex) 的 flex item，默认 flex-shrink:1
     会被压到内容宽度并逐字换行（实测 span 被拆成 2 个 client rect、宽 12px）。
     源站靠 nowrap 规避，这里同时锁死不压缩。 */
  flex-shrink: 0;
  white-space: nowrap;
}
.cate-item.active .cate-text {
  color: #5f7a68;
}
/* 表头：y278 h28 */
.table-head {
  height: 28px;
  margin-top: 8px;
}
.th-text {
  font-size: 12px;
  color: #999;
}
.th-col {
  flex: 1;
}
.th-sort {
  width: 8px;
  height: 11px;
  margin-left: 3px;
}
.th-last {
  width: 72px;
  text-align: right;
}
/* 藏品行：h66 padding 10 0 */
.market-row {
  height: 66px;
  padding: 10px 0;
  border-bottom: 1px solid #f5f5f5;
}
.goods-left {
  flex: 0 0 auto;
  width: 127px;
}
.goods-img {
  width: 45px;
  height: 45px;
  border-radius: 4px;
  flex-shrink: 0;
}
.goods-info {
  margin-left: 6px;
  flex: 1 1 0%;
  min-width: 0;
}
.goods-name {
  font-size: 13px;
  color: #1a2438;
  max-width: 52px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.like-icon {
  width: 14px;
  height: 13px;
  margin-left: 4px;
  flex-shrink: 0;
}
.out-tag {
  margin-top: 4px;
  padding: 1px 5px;
  background: #e54d42;
  border-radius: 3px;
}
.out-tag-text {
  font-size: 12px;
  color: #fff;
}
.goods-nums {
  flex: 0 0 auto;
  width: 79px;
  margin-left: 8px;
  min-width: 0;
}
.num-line {
  font-size: 12px;
  line-height: 15px;
  color: #999;
  white-space: nowrap;
}
.goods-price {
  flex: 1 1 0%;
}
.price-text {
  font-size: 14px;
  color: #1a2438;
}
.goods-rate {
  flex: 1 1 0%;
  justify-content: flex-end;
}
.rate-arrow {
  width: 12px;
  height: 9px;
}
.rate-text {
  margin-left: 2px;
  font-size: 12px;
}
/* 源站涨 rgb(229,77,66) / 跌为绿色系 */
.rate-up {
  color: #e54d42;
}
.rate-down {
  color: #22a06b;
}
/* 空状态 */
.empty-box {
  padding: 60px 0;
}
.empty-img {
  width: 120px;
  height: 120px;
}
.empty-text {
  margin-top: 12px;
  font-size: 13px;
  color: #bbb;
}
</style>