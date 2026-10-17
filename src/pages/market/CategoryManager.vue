<template>
  <view class="category-page page-bg-colorfull">
    <view class="tnav" style="background: transparent">
      <view class="tnav-left" @click="goBack">
        <img :src="asset('static/common/back_default.png')" mode="widthFix" />
      </view>
      <text class="tnav-title">分类</text>
      <view class="tnav-right" @click="goBack">
        <text class="MiSans-Regular confirm-text">确认</text>
      </view>
    </view>

    <!-- 我的分类 -->
    <view class="pa-16">
      <text class="MiSans-Regular block-title">我的分类</text>
      <view class="flex flex-w gap-12">
        <view
          v-for="s in tabList"
          :key="s.series_id"
          class="tab-item flex flex-ai-center"
          @click="removeSelfSeries(s)"
        >
          <text class="MiSans-Regular tab-text text-center flex-1 text-overflow">{{ s.series_name }}</text>
          <view v-if="s.series_id > 0" class="tab-close"></view>
        </view>
      </view>
    </view>

    <!-- 其他分类 -->
    <view class="pa-16">
      <text class="MiSans-Regular block-title">其他分类</text>
      <view class="flex flex-w gap-12">
        <view
          v-for="s in setting.platform_series"
          :key="s.series_id"
          class="tab-item flex flex-ai-center"
          @click="addSelfSeries(s)"
        >
          <text class="MiSans-Regular tab-text text-center flex-1 text-overflow">{{ s.series_name }}</text>
          <img class="tab-add" :src="asset('static/icon/arrow-right.png')" mode="aspectFit" />
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { fetchCategoryManager, asset } from '@/utils/api'

const router = useRouter()

const tabList = ref([])
const setting = reactive({ platform_series: [] })

function goBack() {
  if (window.history.length > 1) router.back()
  else router.push('/pages/market/market')
}
function removeSelfSeries(s) {
  if (s.series_id <= 0) return
  tabList.value = tabList.value.filter((x) => x.series_id !== s.series_id)
  uni.showToast({ title: `已移除「${s.series_name}」`, icon: 'none' })
}
function addSelfSeries(s) {
  if (tabList.value.some((x) => x.series_id === s.series_id)) {
    uni.showToast({ title: '该分类已添加', icon: 'none' })
    return
  }
  tabList.value = [...tabList.value, s]
}

onMounted(async () => {
  const data = await fetchCategoryManager()
  if (data) {
    tabList.value = data.self_series || []
    setting.platform_series = data.platform_series || []
  }
})
</script>

<style scoped>
@import '@/styles/atomic.css';

.category-page {
  min-height: 100vh;
  background: #eef4f0;
}
.confirm-text {
  font-size: 24rpx;
  color: #1a2438;
}
.block-title {
  display: block;
  font-size: 28rpx;
  color: #1a2438;
}
.tab-item {
  width: 212rpx;
  height: 68rpx;
  margin-top: 24rpx;
  padding: 0 24rpx;
  background: #fff;
  border-radius: 86rpx;
  box-sizing: border-box;
}
.tab-text {
  font-size: 28rpx;
  color: #1a2438;
}
.tab-close {
  width: 24rpx;
  height: 24rpx;
  margin-left: 16rpx;
  position: relative;
  flex-shrink: 0;
}
.tab-close::before,
.tab-close::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 50%;
  width: 20rpx;
  height: 2rpx;
  background: #333;
  transform: translate(-50%, -50%) rotate(45deg);
}
.tab-close::after {
  transform: translate(-50%, -50%) rotate(-45deg);
}
.tab-add {
  width: 24rpx;
  height: 24rpx;
  margin-left: 16rpx;
  flex-shrink: 0;
  transform: rotate(180deg);
}
</style>
