<template>
  <view class="bb-detail-page">
    <!-- 顶部藏品卡 -->
    <view class="product-card" :style="{ backgroundImage: `url(${asset('static/collection/top_bg.png')})` }">
      <view class="img-wrap">
        <img class="main-img" :src="ossImg(product.main_image || product.listimg)" mode="aspectFill" />
      </view>
      <view class="info-wrap">
        <view class="preview-btn" @click="preview">
          <img class="preview-icon" :src="asset('static/collection/preview.png')" mode="aspectFit" />
        </view>
        <text class="MiSans-Demibold name text-overflow">{{ product.name || '藏品名称' }}</text>
        <view class="limit-row">
          <view class="limit-k">
            <text class="MiSans-Regular limit-k-text"> 限量 </text>
          </view>
          <view class="limit-v">
            <text class="MiSans-Regular limit-v-text"> {{ product.total_num || 0 }} </text>
          </view>
        </view>
      </view>
    </view>

    <!-- 藏池概率 -->
    <view class="plr-16 ptb-12">
      <view class="white-card">
        <text class="MiSans-Medium card-title">藏品介绍</text>
        <view v-for="c in pool" :key="c.id" class="pool-item">
          <img class="pool-thumb" :src="ossImg(c.listimg)" mode="aspectFill" />
          <view class="pool-meta">
            <text class="MiSans-Medium pool-name text-overflow-2">{{ c.name }}</text>
            <view class="pool-tags">
              <text class="MiSans-Regular pool-tag">概率：{{ c.probability }}%</text>
              <text class="MiSans-Regular pool-tag">总量：{{ c.show_total_num }}</text>
            </view>
          </view>
          <img class="rarity-icon" :src="ossImg(c.rarity_icon)" mode="aspectFit" />
        </view>
      </view>

      <view class="white-card mtb-12">
        <text class="MiSans-Medium card-title">藏品信息</text>
        <view class="kv">
          <text class="MiSans-Regular kv-k">藏品名称</text>
          <text class="MiSans-Regular kv-v">{{ product.name }}</text>
        </view>
        <view class="kv">
          <text class="MiSans-Regular kv-k">申购规则</text>
          <text class="MiSans-Regular kv-v" @click="go('/pages/product/ruleDetail')">限量发行，售完即止</text>
        </view>
      </view>

      <view class="white-card mtb-12">
        <text class="MiSans-Medium card-title">购买须知</text>
        <view class="rich mt-12" v-html="info.details || product.details || ''"></view>
      </view>
    </view>

    <view class="copyright">
      <img class="copyright-img" :src="asset('static/icon/copyright.png')" mode="widthFix" />
    </view>

    <!-- 底部操作 -->
    <view class="bb-buttons">
      <view class="bb-btn plain" @click="go('/pages/order/orderSubmit')">
        <text class="MiSans-Medium bb-btn-text">立即转赠</text>
      </view>
      <view class="bb-btn" @click="toggleShengou">
        <text class="MiSans-Medium bb-btn-text">{{ isShengou ? '取消寄售' : '立即寄售' }}</text>
      </view>
    </view>

    <!-- 取消寄售确认 -->
    <view v-if="confirmPop" class="mask" @click="confirmPop = false">
      <view class="confirm-box" @click.stop>
        <text class="MiSans-Medium confirm-title">确认取消此寄售？</text>
        <view class="confirm-btns">
          <view class="confirm-btn" @click="confirmPop = false">
            <text class="MiSans-Regular confirm-btn-text">再想想</text>
          </view>
          <view class="confirm-btn primary" @click="doCancel">
            <text class="MiSans-Medium confirm-btn-text">确认取消</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
/**
 * 原站 blindBox/blindBoxDetails —— 盲盒详情
 * 结构：顶部藏品卡（主图 + 名称 + 限量）+ 藏池概率卡 + 藏品信息卡 + 购买须知卡 + 底部「立即转赠 / 立即寄售」。
 */
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { asset, fetchShopBoxDetail } from '@/utils/api'
import { ossImg } from '@/api'

defineOptions({ name: 'BlindBoxDetails' })

const router = useRouter()
const info = ref({})
const product = ref({})
const isShengou = ref(false)
const confirmPop = ref(false)

onMounted(async () => {
  const data = await fetchShopBoxDetail()
  info.value = data.info || {}
  product.value = data.product || {}
  isShengou.value = !!product.value.is_shengou
})

function preview() {
  window.uni && window.uni.previewImage({ urls: [ossImg(product.value.main_image)] })
}
function go(path) {
  router.push(path)
}
function toggleShengou() {
  if (isShengou.value) confirmPop.value = true
  else {
    isShengou.value = true
    window.uni && window.uni.showToast({ title: '已提交寄售', icon: 'none' })
  }
}
function doCancel() {
  confirmPop.value = false
  isShengou.value = false
}
</script>

<style scoped src="./BlindBoxDetails.css"></style>
