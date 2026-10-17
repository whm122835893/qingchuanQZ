<template>
  <view class="flex flex-dir-col flex-ai-center font-w-500 trade-union">
    <view class="tnav" style="background: transparent; width: 100%">
      <view class="tnav-left" @click="goBack">
        <img :src="asset('static/common/back_default.png')" mode="widthFix" />
      </view>
      <text class="tnav-title" style="color: #e3a86a">GM工会</text>
    </view>

    <img class="union-logo" :src="asset('static/wallet/huifu.png')" mode="aspectFit" />

    <text class="unlock-title"> 您的公会未解锁 </text>
    <text class="unlock-desc"> 赶快购买公会藏品解锁您的公会吧~ </text>

    <view class="tabbar mt-40" style="width: 100%">
      <view class="tabs flex">
        <view
          v-for="t in pageList"
          :key="t.name"
          class="tabs-item"
          :class="{ active: current === t.index }"
          @click="onTab(t.index)"
        >
          <text class="MiSans-Demibold tabs-text" :class="{ active: current === t.index }">{{
            t.name
          }}</text>
        </view>
      </view>

      <!-- current == 0 -->
      <view v-if="current === 0" class="card-view mt-24">
        <view class="flex flex-center">
          <img class="card-icon" :src="asset('static/wallet/huifu.png')" mode="aspectFit" />
          <view>
            <text class="card-title"> 手续费减免 </text>
            <text class="card-desc"
              > 持有人可以享受消费返利{{ rebateHolder }}%，被邀请人 可以享受消费返利{{ rebateInvited
              }}%手续费;持有人还可以 额外享受所有被邀请人消费返利的{{ rebateExtra }}%。 </text
            >
          </view>
        </view>
        <view class="card-divider"></view>
        <view class="flex flex-center" style="width: 100%">
          <img class="card-icon" :src="asset('static/wallet/arrow_right.png')" mode="aspectFit" />
          <view class="flex-1">
            <text class="card-title"> 公会成员人数 </text>
            <text class="card-desc"> 每位公会会长最多可绑定邀请{{ maxBind }}人。 </text>
          </view>
        </view>
      </view>

      <!-- current != 0 -->
      <view
        v-else
        class="pt-10 flex flex-center flex-w pl-10 flex-1" style="height: 100%; min-height: 300rpx"
      >
        <text class="empty-text">暂无公会成员</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { fetchTradeUnion, asset } from '@/utils/api'

const router = useRouter()

const union = ref({})
const current = ref(0)

const pageList = [
  { name: '手续费减免', index: 0 },
  { name: '成员列表', index: 1 },
]
const rebateHolder = computed(() => union.value.rebate_holder || '1.88')
const rebateInvited = computed(() => union.value.rebate_invited || '1')
const rebateExtra = computed(() => union.value.rebate_extra || '0.88')
const maxBind = computed(() => union.value.max_bind || 30)

function goBack() {
  if (window.history.length > 1) router.back()
  else router.push('/pages/my/my')
}
function onTab(i) {
  current.value = i
}

onMounted(async () => {
  union.value = await fetchTradeUnion()
})
</script>

<style scoped>
@import '@/styles/atomic.css';

.trade-union {
  min-height: 100vh;
  padding-top: 100rpx;
  box-sizing: border-box;
  background: #2a2418;
  color: #e3a86a;
}
.union-logo {
  width: 110rpx;
  height: 110rpx;
  border-radius: 20rpx;
}
.unlock-title {
  margin-top: 48rpx;
  margin-bottom: 32rpx;
  font-size: 32rpx;
  font-weight: 700;
  color: #fcd8b1;
}
.unlock-desc {
  font-size: 24rpx;
  color: #fcd8b1;
}
.tabs {
  gap: 24rpx;
  justify-content: center;
}
.tabs-item {
  padding: 0 40rpx;
  height: 120rpx;
  line-height: 120rpx;
}
.tabs-text {
  font-size: 32rpx;
  color: #cab6a1;
  border-bottom: 3rpx solid transparent;
}
.tabs-text.active {
  color: #e3a86a;
  border-bottom-color: #e3a86a;
}
.card-view {
  padding: 0 40rpx;
}
.card-icon {
  width: 58rpx;
  height: 52rpx;
  margin-right: 58rpx;
}
.card-title {
  display: block;
  margin-bottom: 28rpx;
  font-size: 32rpx;
  font-weight: 700;
  color: #e3a86a;
}
.card-desc {
  display: block;
  font-size: 24rpx;
  color: #cab6a1;
  line-height: 36rpx;
}
.card-divider {
  width: 100%;
  height: 1rpx;
  background: rgba(227, 168, 106, 0.25);
  margin: 40rpx 0;
}
.empty-text {
  font-size: 26rpx;
  color: #cab6a1;
}
</style>
