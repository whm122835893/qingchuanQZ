<template>
  <scroll-view class="list-scroll" scroll-y>
    <view
      v-for="item in list"
      :key="item.id || item.collection_code"
      class="item-row"
      @click="$emit('item-click', item)"
    >
      <view class="flex flex-ai-center flex-js-sb">
        <view class="flex flex-ai-center item-code-col">
          <img
            v-if="showCheck"
            class="check-icon"
            :src="
              isSelected(item)
                ? asset('static/common/check_select.png')
                : asset('static/common/check_default.png')
            "
            mode="aspectFit"
            @click.stop="$emit('toggle-check', item)"
          />
          <text class="MiSans-Medium code-text">#{{ item.collection_code || item.id }}</text>
        </view>
        <view class="status-tag flex flex-ai-center flex-js-center">
          <text class="MiSans-Regular status-text">{{ statusText(item) }}</text>
        </view>
      </view>
      <text class="MiSans-Regular meta-line">{{ metaLine(item) }}</text>
    </view>

    <view v-if="list.length" class="no-more">
      <text class="MiSans-Regular no-more-text">没有更多数据了</text>
    </view>
    <view v-else class="list-empty">
      <text class="MiSans-Regular empty-text">暂无藏品编号</text>
    </view>
  </scroll-view>
</template>

<script setup>
import { asset } from '@/utils/api'

const props = defineProps({
  list: { type: Array, default: () => [] },
  selectedIds: { type: Array, default: () => [] },
  showCheck: { type: Boolean, default: false },
})
defineEmits(['toggle-check', 'item-click'])

function isSelected(item) {
  return props.selectedIds.includes(item.id)
}
function statusText(item) {
  if (item.status === 2) return '寄售中'
  if (item.status === 3) return '已售出'
  return '持有中'
}
function metaLine(item) {
  const parts = []
  if (item.price) parts.push(`当前售价 ¥${item.price}`)
  if (item.createtime) {
    const d = new Date(Number(item.createtime) * 1000)
    const p = (n) => String(n).padStart(2, '0')
    parts.push(
      `获得时间 ${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
    )
  }
  return parts.join(' · ') || '--'
}
</script>

<style scoped>
@import '@/styles/atomic.css';
.list-scroll {
  max-height: 640rpx;
  margin-top: 20rpx;
}
.item-row {
  padding: 21rpx 0;
  border-bottom: 1rpx solid #f5f5f5;
}
.item-code-col {
  min-width: 0;
}
.check-icon {
  width: 34rpx;
  height: 34rpx;
  margin-right: 12rpx;
}
.code-text {
  font-size: 27rpx;
  color: #000;
}
.status-tag {
  height: 36rpx;
  padding: 0 12rpx;
  border-radius: 6rpx;
  background: #f4f6fa;
}
.status-text {
  font-size: 20rpx;
  color: #666;
}
.meta-line {
  display: block;
  margin-top: 10rpx;
  font-size: 21rpx;
  color: #999;
}
.no-more {
  padding: 24rpx 0;
  text-align: center;
}
.no-more-text {
  font-size: 21rpx;
  color: #bbb;
}
.list-empty {
  height: 200rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.empty-text {
  font-size: 24rpx;
  color: #999;
}
</style>