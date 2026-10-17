<template>
  <view class="send-rumor-page">
    <!-- 自定义导航：左「取消」 / 右「发表」 -->
    <view class="diy-nav flex flex-js-sb flex-ai-center flex-1 plr-16">
      <text class="MiSans-Regular cancel-text" @click="goBack">取消</text>
      <view
        class="submit-pill flex flex-ai-center flex-js-center"
        :class="{ disbaled: !canSubmit }"
        @click="onSubmit"
      >
        <text class="MiSans-Medium submit-text">发表</text>
      </view>
    </view>

    <view class="plr-16">
      <!-- 正文输入 -->
      <view class="bg-color-item content-box">
        <textarea
          class="MiSans-Regular content-area"
          :value="form.content"
          placeholder="请输入内容"
          placeholder-class="content-ph" confirm-type="done"
          :maxlength="-1"
          auto-height
          @input="onInput"
        />
      </view>

      <!-- 图片上传（最多 3 张） -->
      <view class="upload-row">
        <view
          v-for="(img, i) in form.images"
          :key="i"
          class="upload-preview"
        >
          <img class="preview-img" :src="img" mode="aspectFill" @click="preview(i)" />
          <view class="preview-del" @click="deleteImage(i)"></view>
        </view>
        <view
          v-if="form.images.length < 3"
          class="flex flex-center flex-dir-col upload-add mt-16"
          @click="addImage"
        >
          <view class="add-plus"></view>
          <text class="MiSans-Regular add-text">照片</text>
        </view>
      </view>

      <!-- 匿名发表 -->
      <view class="flex flex-ai-center pt-32">
        <text class="font-color-minor font-size-14 mr-12">匿名发表</text>
        <view
          class="switch"
          :class="{ on: form.is_anonymous }"
          @click="form.is_anonymous = form.is_anonymous ? 0 : 1"
        >
          <view class="switch-node" :class="{ on: form.is_anonymous }"></view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ossImg } from '@/api'

const router = useRouter()

const form = reactive({ content: '', images: [], is_anonymous: 0 })

/** 占位图用已本地化的藏品图，绝不引用外链 */
const PLACEHOLDER_IMG = '/uploads/20261014/ea65d8aff9b71747498819acc2c28e74.jpg'

const canSubmit = computed(() => !!(form.content.trim() || form.images.length))

function onInput(e) {
  form.content = e.target.value
}

function addImage() {
  if (form.images.length >= 3) return
  // 原站为真实相册选择，此处用本地已下载藏品图占位，保持图片链路一致
  form.images.push(ossImg(PLACEHOLDER_IMG))
}

function deleteImage(i) {
  form.images.splice(i, 1)
}

function preview(i) {
  uni.previewImage({ urls: form.images, current: i })
}

function onSubmit() {
  if (!canSubmit.value) {
    uni.showToast({ title: '请输入内容或上传图片', icon: 'none' })
    return
  }
  uni.showToast({ title: '发表成功', icon: 'none' })
  setTimeout(() => {
    if (window.history.length > 1) router.back()
    else router.push('/pages/community/community')
  }, 600)
}

function goBack() {
  if (window.history.length > 1) router.back()
  else router.push('/pages/community/community')
}

</script>

<style scoped>
@import '@/styles/atomic.css';

.send-rumor-page {
  min-height: 100vh;
  background: #fff;
  padding-bottom: 60rpx;
}

.diy-nav {
  height: 88rpx;
}
.cancel-text {
  font-size: 28rpx;
  color: #555;
}
.submit-pill {
  min-width: 104rpx;
  height: 56rpx;
  padding: 0 20rpx;
  background: #1a2438;
  border-radius: 28rpx;
}
.submit-pill.disbaled {
  opacity: 0.4;
}
.submit-text {
  font-size: 26rpx;
  color: #fff;
}

.content-box {
  background-color: #f4f6fa;
  border-radius: 16rpx;
  padding: 24rpx;
  min-height: 320rpx;
}
.content-area {
  width: 100%;
  min-height: 280rpx;
  font-size: 28rpx;
  color: #1a2438;
  line-height: 1.7;
}
.content-ph {
  color: #bababa;
  font-size: 28rpx;
}

.upload-row {
  display: flex;
  flex-wrap: wrap;
  margin-top: 24rpx;
}
.upload-preview {
  position: relative;
  width: 200rpx;
  height: 200rpx;
  margin-right: 16rpx;
  margin-top: 16rpx;
  border-radius: 12rpx;
  overflow: hidden;
  background: #f4f6fa;
}
.preview-img {
  width: 100%;
  height: 100%;
}
.preview-del {
  position: absolute;
  right: 8rpx;
  top: 8rpx;
  width: 36rpx;
  height: 36rpx;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.55);
  position: relative;
}
.preview-del::before,
.preview-del::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 50%;
  width: 18rpx;
  height: 2rpx;
  background: #fff;
  transform: translate(-50%, -50%) rotate(45deg);
}
.preview-del::after {
  transform: translate(-50%, -50%) rotate(-45deg);
}
.upload-add {
  width: 200rpx;
  height: 200rpx;
  background-color: #f4f6fa;
  border-radius: 12rpx;
}
.add-plus {
  position: relative;
  width: 40rpx;
  height: 40rpx;
}
.add-plus::before,
.add-plus::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 50%;
  background: #8b8b8b;
  transform: translate(-50%, -50%);
}
.add-plus::before {
  width: 40rpx;
  height: 3rpx;
}
.add-plus::after {
  width: 3rpx;
  height: 40rpx;
}
.add-text {
  margin-top: 12rpx;
  font-size: 20rpx;
  color: #bababa;
}

.switch {
  width: 52rpx;
  height: 32rpx;
  border-radius: 16rpx;
  background: rgb(230, 230, 230);
  padding: 3rpx;
  box-sizing: border-box;
  transition: background-color 0.15s ease;
}
.switch.on {
  background: #333;
}
.switch-node {
  width: 26rpx;
  height: 26rpx;
  border-radius: 50%;
  background: #fff;
  transition: transform 0.15s ease;
}
.switch-node.on {
  transform: translateX(20rpx);
}
</style>