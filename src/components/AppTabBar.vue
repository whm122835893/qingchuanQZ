<template>
  <view class="app-tabbar-wrap">
    <view class="u-tabbar" :class="{ 'u-tabbar--fixed': true }">
      <view class="u-tabbar__content">
        <view
          v-for="(item, index) in tabs"
          :key="index"
          class="u-tabbar-item"
          :class="{ 'u-tabbar-item--active': value === index }"
          @click="tabbarClick(index)"
        >
          <img
            class="u-page__item__slot-icon"
            :class="{ 'home-active': index === 0 && value === 0 }"
            :src="value === index ? item.activeIcon : item.icon"
            mode="widthFix"
          />
          <text v-if="!(index === 0 && value === 0)" class="u-tabbar-item__text" :style="{ color: value === index ? '#495F50' : '#1a2438' }">{{ item.text }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()
const props = defineProps({
  value: { type: [String, Number], default: 0 }
})

const asset = (p) => (import.meta.env.BASE_URL + p.replace(/^\//, ''))

const tabs = [
  { text: '首页', icon: asset('static/tabBar/home-inactive.png'), activeIcon: asset('static/tabBar/home-active.png'), path: '/pages/index/index' },
  { text: '活动', icon: asset('static/tabBar/activity-inactive.png'), activeIcon: asset('static/tabBar/activity-active.png'), path: '/pages/notice/notice' },
  { text: '市场', icon: asset('static/tabBar/market-inactive.png'), activeIcon: asset('static/tabBar/market-active.png'), path: '/pages/market/market' },
  { text: '社区', icon: asset('static/tabBar/community-inactive.png'), activeIcon: asset('static/tabBar/community-active.png'), path: '/pages/community/community' },
  { text: '我的', icon: asset('static/tabBar/my-inactive.png'), activeIcon: asset('static/tabBar/my-active.png'), path: '/pages/my/my' }
]

const tabbarClick = (index) => {
  if (Number(props.value) === index) return
  router.push(tabs[index].path)
}
</script>

<style scoped>
.u-tabbar {
  display: flex;
  flex-direction: column;
  flex: 1;
  justify-content: center;
}
.u-tabbar--fixed {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1000;
}
.u-tabbar__content {
  height: 160rpx;
  background: #fff;
  display: flex;
  flex-direction: row;
}
.u-tabbar-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  height: 160rpx;
}
.u-page__item__slot-icon {
  width: 42rpx;
  height: 42rpx;
  display: block;
}
.u-page__item__slot-icon.home-active {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
}
.u-tabbar-item__text {
  color: #1a2438;
  font-size: 20rpx !important;
  margin-top: 16rpx;
  font-family: MiSans-Demibold;
}
</style>
