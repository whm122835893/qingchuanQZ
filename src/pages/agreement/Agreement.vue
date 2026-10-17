<template>
  <view class="agreement-page">
    <view class="tnav">
      <view class="tnav-left" @click="goBack">
        <img :src="asset('static/common/back_default.png')" mode="widthFix" />
      </view>
      <text class="tnav-title">{{ title }}</text>
    </view>

    <view class="body">
      <text class="MiSans-Demibold doc-title">{{ title }}</text>
      <text class="MiSans-Regular update">更新日期：2026-10-16</text>

      <view v-for="(sec, i) in sections" :key="i" class="sec">
        <text class="MiSans-Demibold sec-title">{{ sec.head }}</text>
        <text v-for="(p, j) in sec.paras" :key="j" class="MiSans-Regular para">{{ p }}</text>
      </view>

      <view class="safe-bottom"></view>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { asset } from '@/utils/api'

const route = useRoute()
const router = useRouter()

const title = computed(() => route.query.title || '协议')

/**
 * 各协议正文。与原站 agreement 页面展示的条款结构一致，
 * 内容为平台通用交易条款（数字藏品交易须知 / 各类协议）。
 */
const DOCS = {
  购买协议: [
    {
      head: '一、协议适用范围',
      paras: [
        '本协议是您与青川数字艺术平台（以下简称"本平台"）之间就数字藏品购买事项达成的协议。',
        '您点击"立即购买"即视为您已阅读、理解并接受本协议全部条款。',
      ],
    },
    {
      head: '二、数字藏品说明',
      paras: [
        '数字藏品为在线数字化商品，一经出售，不支持七天无理由退换货。',
        '数字藏品为虚拟数字商品，购买前请完成实名认证，未满18周岁人群禁止购买。',
        '依据我国法律要求，特定条件下的数字藏品的二次交易不支持任何形式的变相炒作。',
      ],
    },
    {
      head: '三、交易与结算',
      paras: [
        '付款后将按平台到款顺序排队发放，未成交将原路退回付款账户。',
        '超时未支付，系统会自动取消订单。',
        '同一账号一段时间内累计取消3次订单，将会被限购一段时间。',
      ],
    },
    {
      head: '四、风险提示',
      paras: [
        '数字藏品价格受市场波动影响，请您理性投资，谨慎决策。',
        '您授权同意本平台向活动举办方、赋能提供方、数字藏品发售方等提供您的必要信息。',
      ],
    },
  ],
  购买须知: [
    {
      head: '一、商品性质',
      paras: [
        '本商品为在线数字化商品，一经出售，不支持七天无理由退换货。',
        '数字藏品为虚拟数字商品，购买前请完成实名认证。',
      ],
    },
    {
      head: '二、购买限制',
      paras: [
        '未满18周岁人群禁止购买。',
        '同一账号累计取消3次订单将被限购一段时间。',
        '超时未支付，系统将自动取消订单。',
      ],
    },
    {
      head: '三、发放规则',
      paras: [
        '付款后将按平台到款顺序排队发放。',
        '未成交订单将原路退回付款账户。',
      ],
    },
  ],
  寄售协议: [
    {
      head: '一、寄售规则',
      paras: [
        '您作为卖方在平台出售数字藏品应按照国家税收法律法规依法纳税，平台将根据相关法律代扣代缴相关税款。',
        '您出售数字藏品将按成交金额收取2%的服务费，服务费将从您的交易金额中直接扣除。',
        '请确保您的数字藏品符合平台规则及法律法规，如有违规行为平台有权下架并追究责任。',
        '您同意授权平台使用您的交易数据用于风控、统计分析等合法用途。',
      ],
    },
    {
      head: '二、价格保护',
      paras: [
        '您的寄售价格低于目前市场最低价20%时，平台将给予二次确认提示。',
        '市场价格实时变动中，最低价格仅供参考。',
      ],
    },
  ],
  出售协议: [
    {
      head: '一、成交顺序',
      paras: [
        '成交顺序是以买方发起求购订单的金额由高至低的顺序成交。',
        '买方求购订单的付款钱包和卖方收款账户钱包需要一致才可成交，如果不一致会导致无法成交。',
        '订单一旦成交，不可撤销。',
      ],
    },
    {
      head: '二、结算方式',
      paras: [
        '成交后按平台规则扣除综合服务费，剩余款项原路退回收款账户。',
      ],
    },
  ],
  委托协议: [
    {
      head: '一、委托规则',
      paras: [
        '委托下单后将按您设置的价格与数量预付冻结相应资金。',
        '当市场出现符合条件的寄售商品时，系统将按规则自动撮合成交。',
        '未成交部分可取消委托，已冻结资金将原路退回。',
      ],
    },
    {
      head: '二、费用说明',
      paras: [
        '委托成交将收取综合服务费2%。',
        '如藏品方设置了服务比例，还将额外收取藏品服务费。',
      ],
    },
  ],
  求购协议: [
    {
      head: '一、求购规则',
      paras: [
        '自发求购订单您可选择求购信息的有效时长，当前默认选择为7天。',
        '在有效期限内，您的求购信息会展示给持有该藏品且有意出售的卖家。',
        '若在期限内有卖家接受您的求购条件，系统将自动匹配并推进交易结算。',
        '若期限结束仍未成功匹配，已冻结的相应资金会解冻并退回您的账户。',
      ],
    },
    {
      head: '二、注意事项',
      paras: [
        '求购单价不得高于市场地板价，否则建议您直接购买该藏品。',
      ],
    },
  ],
}

const sections = computed(() => DOCS[title.value] || DOCS['购买协议'])

function goBack() {
  if (window.history.length > 1) router.back()
  else router.push('/pages/index/index')
}
</script>

<style scoped>
@import '@/styles/atomic.css';

.agreement-page {
  min-height: 100vh;
  background: #f7f7f7;
}
.body {
  padding: 24rpx 32rpx 60rpx;
  background: #fff;
}
.doc-title {
  display: block;
  font-size: 40rpx;
  color: #1a2438;
}
.update {
  display: block;
  margin-top: 12rpx;
  margin-bottom: 32rpx;
  font-size: 24rpx;
  color: #999;
}
.sec {
  margin-bottom: 36rpx;
}
.sec-title {
  display: block;
  margin-bottom: 16rpx;
  font-size: 30rpx;
  color: #1a2438;
}
.para {
  display: block;
  margin-bottom: 12rpx;
  font-size: 26rpx;
  color: #666;
  line-height: 1.8;
}
.safe-bottom {
  height: calc(60rpx + env(safe-area-inset-bottom));
}
</style>
