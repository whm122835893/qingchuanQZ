<template>
  <view class="rules-page">
    <PageNavbar :title="navTitle" />

    <!-- 原站该页为富文本正文容器（u-parse渲染 config 规则文案） -->
    <view class="conent bg-color-item pa-24">
      <text class="MiSans-Regular rule-body">{{ activityRule }}</text>
    </view>
  </view>
</template>

<script setup>
/**
 * 原站 rules/rules —— 规则中心
 * 原站通过路由 query 传入规则 key（type/activity），正文取config 中的富文本。
 * 本项目按 query.type 映射到内置规则正文，取不到时展示默认的「交易规则」。
 */
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import PageNavbar from '@/components/PageNavbar.vue'

defineOptions({ name: 'RulesPage' })

const route = useRoute()

const RULES = {
  trade:
    '一、藏品购买\n1. 平台所售数字藏品均为区块链链上凭证，一经售出不支持退换。\n2. 购买前请仔细阅读藏品详情、发售规则与风险提示，确认无误后再下单。\n\n二、委托与求购\n1. 委托卖家需支付对应保证金，委托成交后按规则结算。\n2. 求购方需按约定时间完成付款，逾期未付款将扣除保证金。\n\n三、寄售\n1. 寄售价格不得低于平台规定的最低价。\n2. 寄售成交后资金进入钱包余额，可随时提现。\n\n四、转赠\n1. 转赠成功后不可撤销，受赠满2年后方可再次转赠。\n2. 平台不支持任何形式的有偿转赠。',
  consign:
    '寄售规则\n\n1. 寄售门槛：持有平台数字藏品且未处于锁定状态的用户均可发起寄售。\n2. 价格限制：寄售价不得低于平台同期地板价，也不得高于上一次成交价的 200%。\n3. 有效期：寄售自上架起 30 天内有效，超期未成交自动下架。\n4. 结算方式：成交后扣除平台服务费，剩余款项实时到账钱包余额。',
  withdraw:
    '提现规则\n\n1. 钱包余额可提现至本人同名银行卡。\n2. 单笔提现金额不低于 100 元，单日累计提现不超过 5 万元。\n3. 提现申请提交后，平台将在 1-3 个工作日内完成审核与打款。\n4. 提现手续费按银行实际收取，由用户自行承担。',
  privacy:
    '隐私政策\n\n我们仅收集为完成服务所必需的信息，包括手机号、钱包地址与实名信息。\n我们不会将你的个人信息出售给第三方。在法律法规要求或获得你明确授权的情况下，我们才会披露相关信息。\n你可以随时在「设置 - 隐私设置」中关闭藏品对外展示。',
  activity:
    '活动规则\n\n1. 活动时间以平台公告为准，开始与结束时间以服务器时间为准。\n2. 同一账号、同一证件视为同一用户，不可重复参与。\n3. 活动中奖名单将在活动结束后 3 个工作日内公示。\n4. 如发现作弊等违规行为，平台有权取消该账号的活动资格并收回奖励。',
}
const RULE_TITLES = {
  trade: '交易规则',
  consign: '寄售规则',
  withdraw: '提现规则',
  privacy: '隐私政策',
  activity: '活动规则',
}
const DEFAULT_TYPE = 'trade'

const type = computed(() => String(route.query.type || DEFAULT_TYPE))
const navTitle = computed(() => route.query.title || RULE_TITLES[type.value] || '规则中心')
const activityRule = computed(() => RULES[type.value] || RULES[DEFAULT_TYPE])
</script>

<style scoped>
@import '@/styles/atomic.css';

.rules-page {
  min-height: 100vh;
  background: #f4f6fa;
  padding-bottom: 60rpx;
  box-sizing: border-box;
}
.conent {
  margin: 24rpx 28rpx;
  border-radius: 12rpx;
}
.rule-body {
  font-size: 26rpx;
  line-height: 48rpx;
  color: #666;
  white-space: pre-wrap;
}
</style>