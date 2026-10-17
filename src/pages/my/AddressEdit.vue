<template>
  <view class="address-edit-page page-bg plr-16 pt-16 flex flex-dir-col">
    <PageNavbar :title="navbarText" />

    <view class="flex-1">
      <view class="form bg-color-item">
        <view class="ipt">
          <text>收货人</text>
          <input v-model="form.s_name" class="ipt-input" placeholder="请输入姓名" placeholder-class="ph" />
        </view>
        <view class="line"></view>

        <view class="ipt">
          <text>手机号码</text>
          <input
            v-model="form.s_phone"
            class="ipt-input" type="number"
            maxlength="11"
            placeholder="请输入手机号"
            placeholder-class="ph"
          />
        </view>
        <view class="line"></view>

        <view class="ipt" @click="showPicker = true">
          <text>所在地区</text>
          <text class="ipt-value" :class="{ ph: !areaText }">{{ areaText || '请选择市区' }}</text>
        </view>
        <view class="line"></view>

        <view class="ipt">
          <text>详细地址</text>
          <input v-model="form.address" class="ipt-input" placeholder="街道 小区 门牌号等" placeholder-class="ph" />
        </view>
        <view class="line"></view>

        <view class="isdef flex flex-ai-center flex-js-sb">
          <text>设置默认收货地址</text>
          <switch :checked="!!form.isdef" color="#333" @change="onToggleDefault" />
        </view>
      </view>

      <view class="pb-24">
        <view class="save-btn flex flex-ai-center flex-js-center" :class="{ disabled: !able }" @click="saveAdd">
          <text class="MiSans-Medium save-text">保存</text>
        </view>
      </view>
    </view>

    <RegionPicker
      :show="showPicker"
      :value="regionIdx"
      @close="showPicker = false"
      @confirm="onRegionConfirm"
    />
  </view>
</template>

<script setup>
/**
 * 原站 my/address/edit —— 新增 / 修改收货地址
 * 表单：收货人 / 手机号码 / 所在地区（省市区三级选择）/ 详细地址 / 设置默认收货地址。
 * 无 id 为新增（导航「新增收货地址」），带 id 为修改（「修改收货地址」）。
 */
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PageNavbar from '@/components/PageNavbar.vue'
import RegionPicker from '@/components/RegionPicker.vue'

defineOptions({ name: 'AddressEditPage' })

const route = useRoute()
const router = useRouter()

const form = reactive({
  address_id: route.query.id ? Number(route.query.id) : 0,
  s_name: '',
  s_phone: '',
  address: '',
  isdef: 0,
  province: '',
  city: '',
  area: '',
})
const showPicker = ref(false)
const regionIdx = ref([0, 0, 0])

const navbarText = computed(() => (form.address_id ? '修改收货地址' : '新增收货地址'))
const able = computed(() => !!(form.s_name && form.s_phone && form.province && form.address))
const areaText = computed(() =>
  form.province && form.city && form.area ? `${form.province}${form.city}${form.area}` : ''
)

function onRegionConfirm({ province, city, area, idx }) {
  form.province = province
  form.city = city
  form.area = area
  regionIdx.value = idx
  showPicker.value = false
}

function onToggleDefault(e) {
  form.isdef = e.detail.value ? 1 : 0
}

function saveAdd() {
  if (!able.value) {
    uni.showToast({ title: '请填写完整收货信息', icon: 'none' })
    return
  }
  uni.showToast({ title: '原站保存地址需人机验证', icon: 'none' })
  setTimeout(() => router.back(), 800)
}
</script>

<style scoped>
@import '@/styles/atomic.css';

.address-edit-page {
  min-height: 100vh;
  background: #f4f6fa;
  box-sizing: border-box;
}
.form {
  width: 100%;
  border-radius: 24rpx;
  padding-top: 16rpx;
  padding-bottom: 16rpx;
  padding-left: 32rpx;
  padding-right: 32rpx;
  box-sizing: border-box;
}
.form > .ipt {
  width: 100%;
  height: 96rpx;
  display: flex;
  align-items: center;
}
.form > .ipt > text:first-child {
  width: 180rpx;
  flex-shrink: 0;
  font-size: 28rpx;
  color: #000;
  font-weight: 700;
}
.ipt-input {
  flex: 1;
  height: 100%;
  font-size: 28rpx;
  color: #000;
}
.ipt-value {
  flex: 1;
  font-size: 28rpx;
  color: #000;
}
.line {
  width: 100%;
  height: 2rpx;
  background: #e6e6e6;
}
.isdef {
  width: 100%;
  height: 100rpx;
  margin-top: 16rpx;
}
.isdef > text {
  font-size: 28rpx;
  color: #000;
  font-weight: 700;
}
.ph {
  color: #bbb;
}
.save-btn {
  margin-top: 40rpx;
  height: 92rpx;
  background: #7ac386;
  border-radius: 46rpx;
}
.save-btn.disabled {
  opacity: 0.45;
}
.save-text {
  font-size: 30rpx;
  color: #fff;
}
</style>
