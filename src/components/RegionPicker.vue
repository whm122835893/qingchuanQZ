<template>
  <view class="picker-mask" @click.self="emit('close')">
    <view class="picker-panel">
      <view class="picker-bar flex flex-js-sb flex-ai-center">
        <text class="picker-cancel" @click="emit('close')">取消</text>
        <text class="MiSans-Medium picker-confirm" @click="onConfirm">确定</text>
      </view>
      <view class="picker-cols flex">
        <scroll-view v-for="(col, ci) in columns" :key="ci" class="picker-col" scroll-y>
          <view
            v-for="(row, ri) in col"
            :key="ri"
            class="picker-row"
            :class="{ on: ri === idx[ci] }"
            @click="selectIdx(ci, ri)"
          >
            <text class="picker-row-text">{{ row.label }}</text>
          </view>
        </scroll-view>
      </view>
    </view>
  </view>
</template>

<script setup>
/**
 * 省市区三级选择器（等价原站 u-picker，keyName: 'label'）。
 * 选中项变化后向上抛出 label 文本，由父组件写入表单。
 */
import { computed, ref, watch } from 'vue'
import { REGIONS } from '@/data/regions'

defineOptions({ name: 'RegionPicker' })

const props = defineProps({
  show: { type: Boolean, default: false },
  /** 初始值 [省index, 市index, 区index] */
  value: { type: Array, default: () => [0, 0, 0] },
})
const emit = defineEmits(['close', 'confirm'])

const idx = ref([...props.value])
watch(
  () => props.show,
  (v) => {
    if (v) idx.value = [...props.value]
  }
)

/** 三级联动：切换上级时重置下级 */
const columns = computed(() => {
  const [pi, ci, ai] = idx.value
  const p = REGIONS[pi] || { children: [] }
  const cities = p.children || []
  const c = cities[ci] || { children: [] }
  const areas = c.children || []
  return [
    REGIONS.map((x) => ({ label: x.label })),
    cities.map((x) => ({ label: x.label })),
    areas.map((x) => ({ label: x.label })),
  ]
})

const selectedLabels = computed(() => {
  const [pi, ci, ai] = idx.value
  const p = REGIONS[pi]
  const c = p && p.children ? p.children[ci] : null
  const a = c && c.children ? c.children[ai] : null
  return {
    province: p ? p.label : '',
    city: c ? c.label : '',
    area: a ? a.label : '',
  }
})

function selectIdx(ci, ri) {
  const next = [...idx.value]
  next[ci] = ri
  for (let k = ci + 1; k < 3; k += 1) next[k] = 0
  idx.value = next
}

function onConfirm() {
  emit('confirm', { ...selectedLabels.value, idx: [...idx.value] })
}
</script>

<style scoped>
.picker-mask {
  position: fixed;
  inset: 0;
  z-index: 200;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
}
.picker-panel {
  width: 100%;
  background: #fff;
  border-radius: 24rpx 24rpx 0 0;
  padding-bottom: 40rpx;
  box-sizing: border-box;
}
.picker-bar {
  height: 96rpx;
  padding: 0 32rpx;
  border-bottom: 2rpx solid #f2f2f2;
}
.picker-cancel {
  font-size: 28rpx;
  color: #999;
}
.picker-confirm {
  font-size: 28rpx;
  color: #333;
}
.picker-cols {
  height: 520rpx;
}
.picker-col {
  flex: 1;
  height: 100%;
}
.picker-row {
  height: 88rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
}
.picker-row.on .picker-row-text {
  color: #1d569e;
  font-weight: 600;
}
.picker-row-text {
  font-size: 26rpx;
  color: #666;
}
</style>
