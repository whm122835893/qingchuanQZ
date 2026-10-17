<template>
  <view class="record-page">
    <PageNavbar title="活动记录" variant="dark" />

    <view class="panel">
      <!-- tab -->
      <scroll-view scroll-x  class="tabs-scroll" :show-scrollbar="false">
        <view class="tabs-inner">
          <view
            v-for="(t, i) in tabList"
            :key="t"
            class="tab-chip"
            :class="{ on: tabIndex === i }"
            @click="tabIndex = i"
          >
            <text class="MiSans-Medium chip-text">{{ t }}</text>
          </view>
        </view>
      </scroll-view>

      <!-- 记录列表 -->
      <view v-if="list.length" class="list-area">
        <view v-for="r in list" :key="r.id" class="record-item" @click="openDetails(r)">
          <view class="item-top">
            <text class="MiSans-Regular time-text">{{ fmt(r.create_time) }}</text>
            <view class="status-badge">
              <text class="MiSans-Regular status-text">合成成功</text>
            </view>
          </view>
          <view class="item-body">
            <img class="thumb" :src="ossImg(r.listimg)" mode="aspectFill" />
            <view class="meta">
              <text class="MiSans-Demibold title text-overflow-2">{{ r.title }}</text>
              <text class="MiSans-Regular sub">类型：合成</text>
              <text class="MiSans-Regular sub">材料：{{ r.materials }}</text>
            </view>
          </view>
        </view>
      </view>

      <view v-else class="list-area">
        <view class="empty-box">
          <img class="empty-img" :src="asset('static/empty/search1-empty.png')" mode="widthFix" />
          <text class="MiSans-Regular empty-text">暂无活动记录</text>
        </view>
      </view>
    </view>

    <!-- 材料详情 -->
    <view v-if="detailsPop" class="mask" @click="detailsPop = false">
      <view class="modal" @click.stop>
        <text class="MiSans-Medium modal-title">材料详情</text>
        <scroll-view scroll-x  class="detailscon">
          <view v-for="(c, i) in current.consume" :key="i" class="consume-item">
            <img class="consume-thumb" :src="ossImg(c.image)" mode="aspectFill" />
            <view class="consume-meta">
              <text class="MiSans-Medium consume-name text-overflow">{{ c.name }}</text>
              <text class="MiSans-Regular consume-code">#{{ c.collection_code }}</text>
            </view>
          </view>
        </scroll-view>
        <view class="modal-btn" @click="goMyCollection">
          <text class="MiSans-Medium modal-btn-text">去查看我的数字藏品</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
/**
 * 原站 compound/record —— 合成活动记录
 * 结构：透明导航（白字「活动记录」）+ 白色面板（tab + 记录列表：时间 / 合成成功角标 / 缩略图 / 标题 / 类型 / 材料）+ 材料详情弹窗。
 */
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import PageNavbar from '@/components/PageNavbar.vue'
import { asset, fetchCompoundRecord } from '@/utils/api'
import { ossImg } from '@/api'

defineOptions({ name: 'CompoundRecord' })

const router = useRouter()
const tabList = ['全部', '合成成功']
const tabIndex = ref(0)
const list = ref([])
const current = ref({})
const detailsPop = ref(false)

onMounted(async () => {
  list.value = await fetchCompoundRecord()
})

function openDetails(r) {
  current.value = r
  detailsPop.value = true
}
function goMyCollection() {
  detailsPop.value = false
  router.push('/pages/myCollection/myCollection')
}
function fmt(v) {
  if (!v) return ''
  const d = new Date(Number(v) * 1000)
  if (Number.isNaN(d.getTime())) return String(v)
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}
</script>

<style scoped src="./Record.css"></style>
