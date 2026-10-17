<template>
  <view class="shop-page">
    <PageNavbar title="百宝箱" />

    <!-- 用户卡片：龙晶余额 + 头像昵称 -->
    <view class="user-card">
      <img class="user-avatar" :src="ossImg(info.user_info && info.user_info.avatar)" mode="aspectFill" />
      <view class="user-meta">
        <text class="MiSans-Medium user-name">{{ (info.user_info && info.user_info.nickname) || '未登录' }}</text>
        <text class="MiSans-Regular user-sub">用龙晶兑换心仪好物</text>
      </view>
      <view class="crystal-box">
        <view class="crystal-num">
          <text class="MiSans-Demibold crystal-value">{{ info.crystal_number || 0 }}</text>
          <text class="MiSans-Regular crystal-label">龙晶余额</text>
        </view>
      </view>
    </view>

    <!-- 商品网格：两列 -->
    <view class="goods-grid">
      <view v-for="g in list" :key="g.goods_id" class="item-con" @click="toDetail(g)">
        <view class="img-con">
          <img class="goods-img" :src="ossImg(g.list_image)" mode="aspectFill" />
          <view v-if="statusOf(g).badge" class="img-badge">
            <text class="MiSans-Regular badge-text">{{ statusOf(g).badge }}</text>
          </view>
        </view>
        <view class="info">
          <text class="MiSans-Medium t1 text-overflow-2">{{ g.goods_name }}</text>
          <view class="price-row">
            <view class="price">
              <text class="MiSans-Demibold price-num">{{ g.crystal_price }}</text>
              <text class="MiSans-Regular price-unit">龙晶</text>
            </view>
            <text class="MiSans-Regular status-text" :style="{ color: statusOf(g).color }">{{ statusOf(g).text }}</text>
          </view>
        </view>
      </view>
    </view>

    <view v-if="!list.length" class="empty-box">
      <img class="empty-img" :src="asset('static/empty/search1-empty.png')" mode="widthFix" />
      <text class="MiSans-Regular empty-text">暂无兑换商品</text>
    </view>

    <!-- 底部固定：兑换记录 -->
    <view class="footer">
      <view class="footer-btn" @click="go('/pages/shop/record')">
        <text class="MiSans-Medium footer-text">兑换记录</text>
      </view>
    </view>
  </view>
</template>

<script setup>
/**
 * 原站 shop/shop —— 百宝箱（积分商城首页）
 * 结构：导航 + 用户卡片（龙晶余额）+ 两列商品网格 + 底部兑换记录入口。
 * 商品卡：156x156 缩略图 + 名称 + 龙晶价 + 兑换状态文案。
 */
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import PageNavbar from '@/components/PageNavbar.vue'
import { asset, fetchShopList } from '@/utils/api'
import { ossImg } from '@/api'

defineOptions({ name: 'ShopPage' })

const router = useRouter()
const info = ref({})
const list = ref([])

onMounted(async () => {
  const data = await fetchShopList()
  info.value = data || {}
  list.value = (data && data.list) || []
})

/**
 * 兑换状态（与原站 getStatus 对齐）：
 * 1 未开售 2 可兑换 4 已兑完 5 龙晶不足
 */
function statusOf(g) {
  if (g.exchange_status === 1) return { text: '未开售', badge: '', color: '#999' }
  if (g.exchange_status === 2) return { text: '立即兑换', badge: '', color: '#e26f1b' }
  if (g.exchange_status === 4) return { text: '已兑完', badge: '已兑完', color: '#999' }
  if (g.exchange_status === 5) return { text: '龙晶不足', badge: '', color: '#999' }
  return { text: '立即兑换', badge: '', color: '#e26f1b' }
}

function toDetail(g) {
  const path =
    g.goods_type === 2
      ? '/pages/shop/detail/box'
      : g.goods_type === 3
        ? '/pages/shop/detail/collection'
        : '/pages/shop/detail/goods'
  router.push({ path, query: { id: g.goods_id } })
}

function go(path) {
  router.push(path)
}
</script>

<style scoped>
@import '@/styles/atomic.css';

.shop-page {
  min-height: 100vh;
  background: #f4f5f8;
  padding-bottom: 140rpx;
  box-sizing: border-box;
}

/* 用户卡片 */
.user-card {
  display: flex;
  align-items: center;
  margin: 24rpx;
  padding: 24rpx;
  background: #fff;
  border-radius: 16rpx;
}
.user-avatar {
  width: 96rpx;
  height: 96rpx;
  border-radius: 50%;
  flex-shrink: 0;
  background: #eee;
}
.user-meta {
  flex: 1;
  min-width: 0;
  margin-left: 20rpx;
  display: flex;
  flex-direction: column;
}
.user-name {
  font-size: 30rpx;
  color: #1a2438;
}
.user-sub {
  margin-top: 8rpx;
  font-size: 22rpx;
  color: #999;
}
.crystal-box {
  display: flex;
  align-items: center;
  padding: 10rpx 20rpx;
  background: #fdf3ea;
  border-radius: 12rpx;
}
.crystal-num {
  display: flex;
  align-items: baseline;
}
.crystal-value {
  font-size: 34rpx;
  color: #e26f1b;
}
.crystal-label {
  margin-left: 6rpx;
  font-size: 20rpx;
  color: #e26f1b;
}

/* 商品网格 */
.goods-grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  padding: 0 24rpx;
}
.item-con {
  width: 342rpx;
  margin-bottom: 24rpx;
  background: #fff;
  border-radius: 16rpx;
  overflow: hidden;
}
.img-con {
  position: relative;
  width: 342rpx;
  height: 342rpx;
  background: #f0f1f4;
}
.goods-img {
  width: 100%;
  height: 100%;
}
.img-badge {
  position: absolute;
  left: 0;
  bottom: 0;
  padding: 0 16rpx;
  height: 44rpx;
  line-height: 44rpx;
  background: rgba(0, 0, 0, 0.45);
  border-top-right-radius: 12rpx;
}
.badge-text {
  font-size: 22rpx;
  color: #fff;
}
.info {
  padding: 20rpx 24rpx 24rpx;
}
.t1 {
  font-size: 28rpx;
  line-height: 38rpx;
  color: #1a2438;
  min-height: 76rpx;
}
.price-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 16rpx;
}
.price {
  display: flex;
  align-items: baseline;
}
.price-num {
  font-size: 32rpx;
  color: #e26f1b;
}
.price-unit {
  margin-left: 6rpx;
  font-size: 20rpx;
  color: #e26f1b;
}
.status-text {
  font-size: 24rpx;
}

/* 空态 */
.empty-box {
  padding: 140rpx 0 60rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.empty-img {
  width: 300rpx;
}
.empty-text {
  margin-top: 24rpx;
  font-size: 26rpx;
  color: #999;
}

/* 底部固定 */
.footer {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 16rpx 48rpx calc(24rpx + env(safe-area-inset-bottom));
  background: #fff;
  box-shadow: 0 -4rpx 16rpx rgba(0, 0, 0, 0.04);
}
.footer-btn {
  height: 88rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #e26f1b;
  border-radius: 44rpx;
}
.footer-text {
  font-size: 30rpx;
  color: #fff;
}
</style>