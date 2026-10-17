<template>
  <view class="regift-form-page">
    <!-- 赠送价格 -->
    <view class="section">
      <text class="MiSans-Demibold section-title">赠送价格</text>
      <view class="price-input flex flex-ai-center">
        <text class="MiSans-Demibold price-symbol">¥</text>
        <input
          :value="price"
          class="MiSans-Regular price-field flex-1"
          type="digit"
          placeholder="请输入赠送价格"
          placeholder-class="ph"
          @input="$emit('update:price', $event.detail.value)"
        />
      </view>
    </view>

    <!-- 选择用户 -->
    <view class="section">
      <text class="MiSans-Demibold section-title">选择用户</text>
      <view class="search-box flex flex-ai-center">
        <img class="search-icon" :src="asset('static/icon/search.png')" mode="aspectFit" />
        <input
          :value="phone"
          class="MiSans-Regular search-input flex-1"
          placeholder="输入用户手机号或钱包地址"
          placeholder-class="ph"
          @input="$emit('update:phone', $event.detail.value)"
          @confirm="$emit('search')"
        />
      </view>

      <view v-if="user && user.id" class="user-card flex flex-ai-center">
        <img class="user-avatar" :src="ossImg(user.avatar)" mode="aspectFill" />
        <view class="flex flex-dir-col flex-1 user-meta">
          <text class="MiSans-Medium user-name text-overflow">{{ user.nickname || '--' }}</text>
          <text class="MiSans-Regular user-url text-overflow">{{ user.ntf_url || '' }}</text>
        </view>
      </view>
      <view v-else class="MiSans-Regular search-tip">输入完整手机号或钱包地址后点击回车查询</view>
    </view>

    <!-- 转赠说明 -->
    <view class="section">
      <text class="MiSans-Demibold section-title">转赠说明</text>
      <view class="notice-list">
        <text class="MiSans-Regular notice-item">1.转赠成功后不可撤销，在使用场景（如付款码皮肤页面）将不再限时本数字藏品。</text>
        <text class="MiSans-Regular notice-item">2.该数字藏品在受赠满2年后，可再次发起转赠。</text>
        <text class="MiSans-Regular notice-item">3.我们不支持任何形式的有偿转赠，请警惕欺诈风险。一旦发现异常行为，我们会对相关账户采取限制措施。</text>
      </view>
    </view>
  </view>
</template>

<script setup>
/**
 * 转赠表单区（regift/regift 内嵌）：赠送价格 / 选择用户 / 转赠说明。
 */
import { asset } from '@/utils/api'
import { ossImg } from '@/api'

defineOptions({ name: 'RegiftFormSection' })

defineProps({
  price: { type: String, default: '' },
  phone: { type: String, default: '' },
  user: { type: Object, default: () => ({}) },
})
defineEmits(['update:price', 'update:phone', 'search'])
</script>

<style scoped>
@import '@/styles/atomic.css';

.section {
  margin-top: 20rpx;
  padding: 24rpx;
  background: #fff;
  border-radius: 20rpx;
}
.section-title {
  display: block;
  font-size: 30rpx;
  color: #1a2438;
  margin-bottom: 20rpx;
}
.price-input {
  height: 88rpx;
  padding: 0 24rpx;
  background: #f5f6fa;
  border-radius: 12rpx;
}
.price-symbol {
  font-size: 32rpx;
  color: #1a2438;
  margin-right: 12rpx;
}
.price-field {
  font-size: 28rpx;
  color: #1a2438;
}
.ph {
  color: #bbb;
  font-size: 28rpx;
}
.search-box {
  height: 88rpx;
  padding: 0 24rpx;
  background: #f5f6fa;
  border-radius: 12rpx;
}
.search-icon {
  width: 32rpx;
  height: 32rpx;
  flex-shrink: 0;
}
.search-input {
  margin-left: 12rpx;
  font-size: 28rpx;
  color: #1a2438;
}
.search-tip {
  margin-top: 16rpx;
  font-size: 22rpx;
  color: #999;
}
.user-card {
  margin-top: 20rpx;
  padding: 20rpx;
  background: #f5f6fa;
  border-radius: 12rpx;
}
.user-avatar {
  width: 104rpx;
  height: 104rpx;
  border-radius: 50%;
  background: #ddd;
  flex-shrink: 0;
}
.user-meta {
  margin-left: 20rpx;
  min-width: 0;
}
.user-name {
  font-size: 28rpx;
  color: #1a2438;
}
.user-url {
  margin-top: 8rpx;
  font-size: 22rpx;
  color: #999;
}
.notice-item {
  display: block;
  font-size: 24rpx;
  line-height: 40rpx;
  color: #999;
}
.notice-item + .notice-item {
  margin-top: 8rpx;
}
</style>