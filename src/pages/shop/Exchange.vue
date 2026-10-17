<template>
  <view class="exchange-page">
    <PageNavbar title="确认订单" />

    <!-- 商品卡 -->
    <view class="goods-card">
      <img class="goods-thumb" :src="ossImg(product.listimg)" mode="aspectFill" />
      <view class="goods-meta">
        <text class="MiSans-Medium goods-name text-overflow-2">{{ product.name }}</text>
        <view class="stepper">
          <view class="step-btn" @click="minus">
            <text class="step-text">-</text>
          </view>
          <text class="MiSans-Medium step-num">{{ count }}</text>
          <view class="step-btn" @click="add">
            <text class="step-text">+</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 收货地址（type=30 时显示） -->
    <view v-if="info.type === 30" class="pa-16 bg-card br-12 mb-16">
      <view v-if="!address" class="addr-empty">
        <text class="MiSans-Medium addr-empty-text">您还未添加收货地址</text>
        <view class="addr-add" @click="go('/pages/my/address/list')">
          <text class="MiSans-Medium addr-add-text">立即添加</text>
        </view>
      </view>
      <view v-else class="addr-row" @click="go('/pages/my/address/list')">
        <view class="addr-meta">
          <text class="MiSans-Demibold addr-name">{{ addressText }}</text>
          <view class="addr-line">
            <text class="MiSans-Regular addr-user">{{ address.name }}</text>
            <text class="MiSans-Regular addr-mobile">{{ address.mobile }}</text>
          </view>
        </view>
        <img class="addr-arrow" :src="asset('static/icon/arrow-right.png')" mode="widthFix" />
      </view>
    </view>

    <!-- 订单信息 -->
    <view class="br-8 bg-card pa-8 mtb-16">
      <view v-if="publisher" class="kv">
        <text class="MiSans-Regular kv-k">创作者:</text>
        <text class="MiSans-Regular kv-v">{{ publisher }}</text>
      </view>
      <view v-if="product.goods_type === 2" class="kv">
        <text class="MiSans-Regular kv-k">藏品编号:</text>
        <text class="MiSans-Regular kv-v">随机编号</text>
      </view>
      <view class="kv">
        <text class="MiSans-Regular kv-k">区块链地址:</text>
        <text class="MiSans-Regular kv-v addr-ellipsis">{{ ntfUrl }}</text>
      </view>
      <view class="kv">
        <text class="MiSans-Regular kv-k">订单金额:</text>
        <view class="kv-amount">
          <text v-if="count > 1" class="MiSans-Regular amount-sub">{{ info.crystal_number }}x{{ count }}=</text>
          <view class="amount-main">
            <text class="MiSans-Demibold amount-num">{{ totalPrice }}</text>
            <text class="MiSans-Regular amount-label"> 龙晶</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 余额 -->
    <view class="ptb-28 plr-16 bg-card br-12">
      <view class="balance-row">
        <view class="balance-left">
          <text class="MiSans-Medium balance-label">我的龙晶</text>
          <text class="MiSans-Regular balance-sub">(剩余{{ balance }})</text>
        </view>
        <text class="MiSans-Medium balance-check">已实名</text>
      </view>
    </view>

    <!-- 底部固定 -->
    <view class="action">
      <view class="btns">
        <view class="price">
          <text class="MiSans-Demibold price-num">{{ totalPrice }}</text>
          <text class="MiSans-Regular price-label"> 龙晶</text>
        </view>
        <view class="submit-btn" :class="{ off: disabled }" @click="pwdPop = true">
          <text class="MiSans-Medium submit-text">立即兑换</text>
        </view>
      </view>
    </view>

    <!-- 操作密码弹层 -->
    <view v-if="pwdPop" class="mask" @click="pwdPop = false">
      <view class="pwd-sheet" @click.stop>
        <text class="MiSans-Medium pwd-title">请输入操作密码</text>
        <input
          v-model="pwd"
          class="pwd-input" type="password"
          placeholder="请输入操作密码"
          placeholder-class="pwd-ph"
        />
        <view class="pwd-btn" @click="submit">
          <text class="MiSans-Medium pwd-btn-text">确认兑换</text>
        </view>
        <text class="pwd-cancel" @click="pwdPop = false">取消</text>
      </view>
    </view>
  </view>
</template>

<script setup>
/**
 * 原站 shop/exchange —— 确认订单
 * 结构：商品卡（含数量步进器）+ 收货地址 + 订单信息（创作者/编号/区块链地址/金额）+ 余额行 + 底部固定「立即兑换」+ 操作密码弹层。
 */
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import PageNavbar from '@/components/PageNavbar.vue'
import { asset, fetchShopGoodsDetail } from '@/utils/api'
import { ossImg } from '@/api'

defineOptions({ name: 'ShopExchange' })

const router = useRouter()
const info = ref({})
const product = ref({})
const count = ref(1)
const pwd = ref('')
const pwdPop = ref(false)

onMounted(async () => {
  const data = await fetchShopGoodsDetail()
  info.value = data.info || {}
  product.value = data.product || {}
})

const publisher = computed(() => {
  const p = product.value.publisher
  if (!p) return ''
  return (p.user && p.user.nickname) || p.name || ''
})
const totalPrice = computed(() => (info.value.crystal_number || 0) * count.value)
const balance = computed(() => info.value.crystal_number || 0)
const disabled = computed(() => balance.value < totalPrice.value)
const ntfUrl = computed(() => {
  const u = product.value.ntf_url || ''
  if (!u) return '0x8f2a...41c9'
  return u.length > 24 ? `${u.slice(0, 12)}...${u.slice(-6)}` : u
})
const addressText = computed(() => (product.value.address_text || '请选择收货地址').trim())

function minus() {
  if (count.value > 1) count.value -= 1
}
function add() {
  const max = info.value.max_count || 1
  if (count.value < max) count.value += 1
}
function go(path) {
  router.push(path)
}
function submit() {
  if (pwd.value.length < 6) {
    window.uni && window.uni.showToast({ title: '请输入6位操作密码', icon: 'none' })
    return
  }
  pwdPop.value = false
  window.uni && window.uni.showToast({ title: '兑换成功', icon: 'none' })
  router.replace('/pages/shop/record')
}
</script>

<style scoped src="./Exchange.css"></style>
