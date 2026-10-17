<template>
  <view class="address-list-page pa-16 page-bg">
    <PageNavbar :title="navbarTitle" />

    <!-- 空态 -->
    <view v-if="!list.length" class="empty-wrap">
      <img class="empty-img" :src="asset('static/empty/search-empty.png')" mode="widthFix" />
      <text class="MiSans-Regular empty-text">还没有收货地址，去添加一个吧</text>
    </view>

    <view
      v-for="item in list"
      :key="item.address_id"
      class="ad_item mb-16 pb-20" style="position: relative"
      @click="doAction(item)"
    >
      <view class="name font-w-bold">
        <text>{{ item.name }}</text>
        <text class="ml-8">{{ item.mobile }}</text>
        <view
          v-if="item.is_default"
          class="font-color-white font-size-10 flex flex-center ml-12 default-tag"
        >
          默认
        </view>
      </view>
      <view class="info">{{ item.province }}{{ item.city }}{{ item.area }}{{ item.address }}</view>
      <view class="btn flex flex-center">
        <view class="btnStyle flex flex-center mr-12" @click.stop="askDelete(item)">删除</view>
        <view class="btnStyle flex flex-center" @click.stop="toEdit(item)">修改</view>
      </view>
    </view>

    <view class="add-row flex flex-js-center">
      <view class="add-btn flex flex-ai-center flex-js-center" @click="toEdit(null)">
        <text class="MiSans-Medium add-btn-text">新增收货地址</text>
      </view>
    </view>

    <!-- 删除确认 -->
    <view v-if="delAd" class="modal-mask" @click.self="delAd = false">
      <view class="modal-box">
        <text class="modal-body">确认要删除吗？</text>
        <view class="modal-btns">
          <view class="modal-btn" @click="delAd = false">取消</view>
          <view class="modal-btn primary" @click="delAddFn">确认</view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
/**
 * 原站 my/address/list —— 收货地址
 * 原站无地址时展示 w-loading 空态（带「新增收货地址」按钮），
 * 有地址时展示卡片列表，卡片右下角为删除 / 修改。
 */
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import PageNavbar from '@/components/PageNavbar.vue'
import { asset, fetchAddressList } from '@/utils/api'

defineOptions({ name: 'AddressListPage' })

const router = useRouter()
const list = ref([])
const delAd = ref(false)
const delTarget = ref(null)

/** 原站 navType 依据是否有地址在 default / address 间切换 */
const navbarTitle = computed(() => (list.value.length ? '收货地址' : '收货地址'))

onMounted(async () => {
  const data = await fetchAddressList()
  list.value = Array.isArray(data) ? data : []
})

function doAction() {
  // 原站点击地址卡片进入编辑
  // 已在右下角提供删除/修改入口，卡片本体行为保持一致
}

function toEdit(item) {
  router.push({
    path: '/pages/my/address/edit',
    query: item ? { id: item.address_id } : {},
  })
}

function askDelete(item) {
  delTarget.value = item
  delAd.value = true
}

function delAddFn() {
  list.value = list.value.filter((x) => x.address_id !== delTarget.value?.address_id)
  delAd.value = false
  delTarget.value = null
  uni.showToast({ title: '地址已删除', icon: 'none' })
}
</script>

<style scoped>
@import '@/styles/atomic.css';

.address-list-page {
  min-height: 100vh;
  background: #f4f6fa;
  box-sizing: border-box;
}
.empty-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 240rpx;
}
.empty-img {
  width: 330rpx;
}
.empty-text {
  margin-top: 32rpx;
  font-size: 26rpx;
  color: #999;
}
/* 地址卡片：与原站 ad_item 一致 */
.ad_item {
  width: 100%;
  background: #f4f6fa;
  border-radius: 16rpx;
  padding-left: 24rpx;
  padding-right: 24rpx;
  box-sizing: border-box;
}
.ad_item > .name {
  display: flex;
  align-items: center;
  width: 100%;
  height: 100rpx;
}
.ad_item > .name > text {
  color: #555;
  font-size: 32rpx;
}
.default-tag {
  width: 74rpx;
  height: 32rpx;
  background: #16181f;
  border-radius: 16rpx;
}
.ad_item > .info {
  color: #666;
  font-size: 24rpx;
  padding-bottom: 24rpx;
  line-height: 1.6;
}
.ad_item > .btn {
  height: 40rpx;
  background: #e8e8e9;
  border-radius: 16rpx 0 16rpx 0;
  padding: 0 30rpx;
  justify-content: space-between;
}
.btnStyle {
  font-size: 22rpx;
  color: #666;
}
.add-row {
  padding: 20rpx 0 40rpx;
}
.add-btn {
  width: 100%;
  height: 88rpx;
  background: #fff;
  border-radius: 44rpx;
}
.add-btn-text {
  font-size: 30rpx;
  color: #1a2438;
}
.modal-mask {
  position: fixed;
  inset: 0;
  z-index: 200;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
}
.modal-box {
  width: 600rpx;
  background: #fff;
  border-radius: 24rpx;
  padding: 48rpx 40rpx 32rpx;
  box-sizing: border-box;
  text-align: center;
}
.modal-body {
  display: block;
  margin-bottom: 40rpx;
  font-size: 28rpx;
  color: #555;
}
.modal-btns {
  display: flex;
}
.modal-btn {
  flex: 1;
  height: 84rpx;
  line-height: 84rpx;
  font-size: 30rpx;
  color: #666;
  background: #f5f6fa;
  border-radius: 42rpx;
}
.modal-btn.primary {
  margin-left: 16rpx;
  color: #fff;
  background: #1a2438;
}
</style>
