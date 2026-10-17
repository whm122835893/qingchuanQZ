<template>
  <view class="share-page">
    <PageNavbar title="分享社群" />

    <view class="pa-16">
      <!-- 助力次数 + 分享图片入口 -->
      <view class="top-box">
        <view class="top-left">
          <text class="MiSans-Regular top-label">您已成功获得助力 </text>
          <text class="MiSans-Demibold top-num">{{ assistNum }}</text>
          <text class="MiSans-Regular top-label"> 次 </text>
        </view>
        <view class="share-entry" @click="previewOpen = true">
          <text class="MiSans-Regular share-entry-text">分享图片</text>
        </view>
      </view>

      <!-- 上传图片 -->
      <text class="MiSans-Demibold upload-title">上传图片:</text>
      <view class="upload-row">
        <view v-for="(img, i) in shareImages" :key="i" class="upload-item">
          <img class="upload-img" :src="ossImg(img)" mode="aspectFill" />
        </view>
        <view v-if="shareImages.length < 3" class="upload-add" @click="pickImage">
          <text class="upload-add-text">+</text>
        </view>
      </view>
      <text class="MiSans-Regular upload-tip">上传截图，图片大小限制5M内，数量3张</text>

      <!-- 审核记录表 -->
      <view class="table-wrap">
        <view class="row head">
          <text class="MiSans-Regular head-cell col-date">日期</text>
          <text class="MiSans-Regular head-cell col-num">上传图片数量</text>
          <text class="MiSans-Regular head-cell col-status">审核结果</text>
        </view>
        <view v-for="(r, i) in shareRecords" :key="r.id || i" class="row" :class="{ stripe: i % 2 === 0 }">
          <text class="MiSans-Regular cell col-date">{{ r.create_time }}</text>
          <text class="MiSans-Regular cell col-num">{{ shareImages.length }}</text>
          <text class="MiSans-Regular cell col-status" :class="statusOf(r).cls">{{ statusOf(r).text }}</text>
        </view>

        <view v-if="!shareRecords.length" class="empty-box">
          <text class="MiSans-Regular empty-text">暂无分享记录</text>
        </view>
      </view>

      <!-- 分享记录 -->
      <view class="record-box">
        <text class="MiSans-Demibold record-title">分享记录</text>
        <view v-for="(r, i) in shareRecords" :key="'s' + (r.id || i)" class="record-item">
          <view class="record-meta">
            <text class="MiSans-Medium record-name text-overflow">{{ r.community }}</text>
            <text class="MiSans-Regular record-time">{{ r.create_time }}</text>
          </view>
          <text class="MiSans-Regular record-status" :class="statusOf(r).cls">{{ statusOf(r).text }}</text>
        </view>
        <view v-if="!shareRecords.length" class="record-empty">
          <text class="MiSans-Regular record-empty-text">暂无分享记录</text>
        </view>
      </view>
    </view>

    <!-- 图片预览弹层 -->
    <view v-if="previewOpen" class="mask" @click="previewOpen = false">
      <view class="preview-box" @click.stop>
        <img
          v-for="(img, i) in images"
          :key="i"
          class="preview-img"
          :src="ossImg(img)"
          mode="aspectFit"
          @click.stop="previewImage(img)"
        />
      </view>
    </view>
  </view>
</template>

<script setup>
/**
 * 原站 draw/communityShare/communityShare —— 分享社群
 * 结构：助力次数卡（右侧「分享图片」入口）+ 上传图片区（3 张）+ 审核记录表（日期 / 上传图片数量 / 审核结果，隔行渐变底）+ 分享记录列表。
 * 说明：原站 u-upload 组件在 Web 端替换为「+」添加位，点击直接调起本地图片选择。
 */
import { computed, onMounted, ref } from 'vue'
import PageNavbar from '@/components/PageNavbar.vue'
import { fetchCommunityShare } from '@/utils/api'
import { ossImg } from '@/api'

defineOptions({ name: 'CommunityShare' })

const info = ref({})
/** 已上传的图片列表（最多 3 张） */
const shareImages = ref([])
/** 图片预览弹层开关 */
const previewOpen = ref(false)

onMounted(async () => {
  const data = await fetchCommunityShare()
  info.value = data || {}
  shareImages.value = data.share_images || []
})

const images = computed(() => (Array.isArray(shareImages.value) ? shareImages.value : []))
const assistNum = computed(() => info.value.assist_num || 0)
const shareRecords = computed(() => info.value.share_records || [])

/** audit_status: 0 待审核 / 1 通过 / 2 无效 */
function statusOf(r) {
  if (r.audit_status === 1) return { text: '通过', cls: 'ok' }
  if (r.audit_status === 2) return { text: '无效', cls: 'bad' }
  return { text: '待审核', cls: '' }
}

function pickImage() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.onchange = () => {
    const file = input.files && input.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      shareImages.value = [...images.value, reader.result].slice(0, 3)
      window.uni && window.uni.showToast({ title: '图片已上传', icon: 'none' })
    }
    reader.readAsDataURL(file)
  }
  input.click()
}

function previewImage(img) {
  window.uni && window.uni.previewImage({ urls: [ossImg(img)] })
}
</script>

<style scoped src="./CommunityShare.css"></style>
