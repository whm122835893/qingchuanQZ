<template>
  <view class="container container notice-page">
    <view class="flex flex-dir-col plr-16 notice-inner">
      <view class="notice-list">
        <!-- 分类 tabs -->
        <view class="u-tabs">
          <scroll-view scroll-x  class="tabs-scroll" :show-scrollbar="false">
            <view class="tabs-nav">
              <view
                v-for="(t, i) in tabs"
                :key="i"
                class="tab-item"
                :class="{ active: currentTab === i }"
                @click="selectTab(i)"
              >
                <text class="tab-text">{{ t }}</text>
              </view>
            </view>
          </scroll-view>
          <view v-if="currentTab >= 0" class="tab-line" :style="{ left: lineLeft }"></view>
        </view>

        <!-- 搜索 + 筛选 -->
        <view class="flex flex-ai-center search-row">
          <view class="flex flex-ai-center flex-1 search-box" @click="goSearch">
            <img class="search-icon" :src="asset('static/find/search.png')" mode="widthFix" />
            <text class="MiSans-Regular search-ph">搜索公告..</text>
          </view>
          <view class="flex flex-ai-center filter-btn" @click="openFilter">
            <text class="MiSans-Regular filter-text">筛选</text>
            <img class="filter-icon" :src="asset('static/find/more.png')" mode="widthFix" />
          </view>
        </view>

        <!-- 公告列表 -->
        <view class="mt-16 notice-body">
          <view
            v-for="item in list"
            :key="item.id"
            class="flex flex-dir-col notice-item"
            @click="goDetail(item)"
          >
            <view class="flex flex-ai-center">
              <img class="avatar" :src="asset('static/tabBar/index.png')" mode="widthFix" />
              <view class="flex flex-dir-col author-col">
                <view class="flex flex-ai-center">
                  <text class="MiSans-Medium text-overflow author-name">QingChuan发布官</text>
                </view>
                <text class="MiSans-Regular author-time">{{ formatTime(item.createtime) }}</text>
              </view>
            </view>

            <view class="flex flex-ai-start title-row">
              <view
                class="flex flex-ai-center flex-js-center type-tag"
                :class="'type-' + typeIndex(item.affiche_type)"
              >
                <text class="MiSans-Regular type-text">{{ item.affiche_type }}</text>
              </view>
              <text class="MiSans-Medium item-title">{{ item.title }}</text>
            </view>

            <view class="flex flex-ai-center flex-js-sb action-row">
              <text class="MiSans-Regular read-text">阅读{{ item.view_count }}</text>
              <view class="flex flex-ai-center">
                <view class="flex flex-ai-center act" @click.stop="doReport">
                  <img class="act-icon" :src="asset('static/find/report.png')" mode="widthFix" />
                  <text class="MiSans-Regular act-text">举报</text>
                </view>
                <view class="flex flex-ai-center act" @click.stop="doShare">
                  <img class="act-icon" :src="asset('static/find/share.png')" mode="widthFix" />
                  <text class="MiSans-Regular act-text">转发</text>
                  <text class="MiSans-Regular act-count">{{ item.view_count }}</text>
                </view>
              </view>
            </view>
          </view>

          <view v-if="!list.length" class="flex flex-dir-col flex-ai-center empty-box">
            <img class="empty-img" :src="asset('static/empty/search-empty.png')" mode="widthFix" />
            <text class="MiSans-Regular empty-text">暂无公告</text>
          </view>

          <view v-else class="upwarp">
            <text class="MiSans-Regular upwarp-text">{{ loading ? '加载中 ...' : '我已经到底了' }}</text>
          </view>
        </view>
      </view>
    </view>

    <AppTabBar :value="1" />
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AppTabBar from '@/components/AppTabBar.vue'
import { fetchAfficheList, fetchAfficheTypeList } from '@/utils/api'

defineOptions({ name: 'NoticePage' })

const router = useRouter()
const asset = (p) => import.meta.env.BASE_URL + p.replace(/^\//, '')

const tabs = ref(['全部'])
const currentTab = ref(0)
const list = ref([])
const loading = ref(false)

// 分类 tab 下划线位置（选中项居中）
const lineLeft = computed(() => {
  const i = currentTab.value
  if (i === 0) return '16px'
  return `${12 + i * 80 + 24}px`
})

function typeIndex(type) {
  const map = { 官方公告: 0, 运营公告: 1, 寄售公告: 2, 限价公告: 0, 求购公告: 3, 活动公告: 0, 空投公告: 4 }
  return map[type] !== undefined ? map[type] : 0
}

function formatTime(ts) {
  const d = new Date(ts * 1000)
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}

async function loadList() {
  loading.value = true
  const typeName = tabs.value[currentTab.value]
  const params = { page: 1, list_rows: 15 }
  if (typeName && typeName !== '全部') {
    const types = await fetchAfficheTypeList()
    const hit = types.find((t) => t.name === typeName)
    if (hit) params.affiche_type = hit.id
  }
  list.value = await fetchAfficheList(params)
  loading.value = false
}

function selectTab(i) {
  currentTab.value = i
  loadList()
}

function goSearch() { router.push('/pages/notice/search') }
function goDetail(item) { router.push({ path: '/pages/notice/noticeDetails', query: { id: item.id } }) }
function openFilter() { /* 原站筛选弹窗在交易链路阶段实现 */ }
function doReport() { /* 原站举报弹窗 */ }
function doShare() { /* 原站转发弹窗 */ }

onMounted(async () => {
  const types = await fetchAfficheTypeList()
  tabs.value = ['全部', ...types.map((t) => t.name)]
  await loadList()
})
</script>

<style scoped>

.notice-page {
  display: block;
  width: 100%;
  box-sizing: border-box;
  padding-left: 0;
  padding-right: 0;
}

.notice-page {
  min-height: 100vh;
  padding-bottom: 160rpx;
  background: #fff url('/static/find/notice_bg.png') no-repeat 0 0 / 100% 100%;
}
.notice-inner {
  min-height: 100vh;
  padding: 62px 16px 0;
  box-sizing: border-box;
  width: 100%;
  max-width: 100%;
  overflow-x: hidden;
}
.notice-list {
  width: 100%;
  max-width: 100%;
  overflow-x: hidden;
}
/* 分类 tabs：h37 */
.u-tabs {
  position: relative;
  height: 37px;
  width: 100%;
  max-width: 100%;
  overflow: hidden;
}
.tabs-scroll {
  width: 100%;
  max-width: 100%;
  height: 37px;
}
.tabs-nav {
  display: inline-flex;
  flex-direction: row;
  height: 37px;
  /* tab 项按内容宽度排布，禁止被 flex 压缩（否则首项「全部」被挤成竖排单字） */
  flex-shrink: 0;
}
.tab-item {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 37px;
  padding: 0 10px;
  margin-right: 4px;
  /* flex 项无固有宽度，需显式 max-content，否则按内容协商失败被压成竖排单字 */
  flex: 0 0 auto;
  width: max-content;
}
.tab-text {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  white-space: nowrap;
}
.tab-item.active .tab-text {
  color: #1a2438;
}
.tab-line {
  position: absolute;
  top: 35px;
  width: 24px;
  height: 2px;
  background: #1a2438;
  border-radius: 1px;
}
/* 搜索筛选行：h33 mt12 mb4 */
.search-row {
  height: 33px;
  margin: 12px 0 4px;
}
.search-box {
  height: 33px;
  padding: 0 12px;
  background: #fff;
  border-radius: 17px;
  border: 1px solid #f0f0f0;
}
.search-icon {
  width: 16px;
  height: 16px;
}
.search-ph {
  margin-left: 6px;
  font-size: 13px;
  line-height: 18px;
  color: #999;
}
.filter-btn {
  margin-left: 12px;
  padding-right: 2px;
}
.filter-text {
  font-size: 13px;
  line-height: 18px;
  color: #333;
}
.filter-icon {
  width: 14px;
  height: 14px;
  margin-left: 4px;
}
/* 公告列表 */
.notice-body {
  margin-top: 16px;
}
.notice-item {
  padding: 16px 0;
  border-bottom: 1px solid #f5f5f5;
}
.avatar {
  width: 37px;
  height: 37px;
  border-radius: 50%;
  flex-shrink: 0;
}
.author-col {
  margin-left: 8px;
  flex: 1;
}
.author-name {
  font-size: 14px;
  line-height: 19px;
  color: #333;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.author-time {
  font-size: 12px;
  line-height: 14px;
  color: #999;
}
/* 标题行：mt10 */
.title-row {
  margin-top: 10px;
}
.type-tag {
  height: 20px;
  margin-top: 2px;
  padding: 0 6px;
  border-radius: 4px;
  flex-shrink: 0;
}
.type-text {
  font-size: 12px;
  line-height: 14px;
  color: #fff;
}
.type-0 { background: #e85a71; }
.type-1 { background: #ff8f1f; }
.type-2 { background: #7b6cf0; }
.type-3 { background: #00b578; }
.type-4 { background: #333; }
.item-title {
  margin-left: 6px;
  font-size: 15px;
  line-height: 22px;
  color: #333;
  flex: 1;
}
/* 操作行：mt12 */
.action-row {
  margin-top: 12px;
}
.read-text {
  font-size: 12px;
  line-height: 16px;
  color: #999;
}
.act {
  margin-left: 16px;
}
.act:first-child {
  margin-left: 0;
}
.act-icon {
  width: 14px;
  height: 14px;
}
.act-text {
  margin-left: 4px;
  font-size: 12px;
  line-height: 16px;
  color: #999;
}
.act-count {
  margin-left: 2px;
  font-size: 12px;
  line-height: 16px;
  color: #999;
}
/* 空状态 */
.empty-box {
  padding: 80px 0;
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
/* 加载完成提示 */
.upwarp {
  padding: 15px 0;
  text-align: center;
}
.upwarp-text {
  font-size: 12px;
  color: #bbb;
}
</style>