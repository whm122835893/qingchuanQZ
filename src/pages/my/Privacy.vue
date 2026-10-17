<template>
  <view class="privacy-page page-bg-colorfull plr-13">
    <PageNavbar title="隐私设置" />

    <view class="bg-color-item ptb-12 br-12">
      <view class="flex flex-js-sb flex-ai-center pa-16">
        <text class="MiSans-Regular font-color-black">对外隐藏所有数字藏品</text>
        <switch
          class="hide-switch"
          :checked="hideAll"
          color="#333"
          @change="onChange"
        />
      </view>
    </view>
  </view>
</template>

<script setup>
/**
 * 原站 my/privacy —— 隐私设置
 * 仅一项：对外隐藏所有数字藏品（对应原站 info.out 字段）。
 */
import { ref } from 'vue'
import PageNavbar from '@/components/PageNavbar.vue'

defineOptions({ name: 'MyPrivacyPage' })

const hideAll = ref(false)

function onChange(e) {
  hideAll.value = e.detail.value
  uni.showToast({ title: hideAll.value ? '已对外隐藏藏品' : '已取消隐藏', icon: 'none' })
}
</script>

<style scoped>
@import '@/styles/atomic.css';

.privacy-page {
  min-height: 100vh;
  background: #f4f6fa;
  padding-bottom: 26rpx;
  box-sizing: border-box;
}
.hide-switch {
  transform: scale(0.7);
  transform-origin: right center;
}
</style>
