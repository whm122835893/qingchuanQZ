<template>
  <view class="lottery-page">
    <PageNavbar title="幸运抽奖" variant="dark">
      <template #right>
        <view class="record-entry" @click="goRecord">
          <text class="MiSans-Regular record-text">中奖记录</text>
        </view>
      </template>
    </PageNavbar>

    <!-- 转盘区（原站素材已下线，用 CSS conic-gradient 绘制 8 扇格） -->
    <view class="wheel-area">
      <view class="wheel-pointer"></view>
      <view class="wheel" :style="{ transform: `rotate(${rotateDeg}deg)` }">
        <view
          v-for="(p, i) in wheelSlices"
          :key="i"
          class="slice"
          :style="{ transform: `rotate(${i * 45}deg)` }"
        >
          <view class="slice-inner" :class="{ dark: i % 2 === 0 }">
            <text class="slice-text">{{ p.name }}</text>
          </view>
        </view>
      </view>
      <view class="wheel-center" @click="start">
        <text class="MiSans-Demibold center-text">{{ spinning ? '转动中' : '开始' }}</text>
      </view>
    </view>

    <!-- 消耗提示 -->
    <view class="consume-bar">
      <text class="MiSans-Regular consume-text">每次抽奖消耗 1 件藏品，剩余 {{ remainNum }} 次</text>
    </view>

    <!-- 奖品列表 -->
    <view class="box-info">
      <text class="MiSans-Demibold box-title">奖品设置</text>
      <view class="prize-grid">
        <view v-for="p in prizes" :key="p.id" class="prize-item">
          <img class="prize-img" :src="ossImg(p.lottery_image)" mode="aspectFill" />
          <text class="MiSans-Regular prize-name text-overflow-2">{{ p.name }}</text>
        </view>
      </view>
    </view>

    <!-- 中奖结果弹层 -->
    <view v-if="tipsFlag" class="mask" @click="closeTips">
      <view class="model" @click.stop>
        <view class="model-content">
          <text class="MiSans-Demibold model-title">{{ tipContent ? '恭喜中奖' : '感谢参与' }}</text>
          <view class="tips-box">
            <text class="MiSans-Demibold tips-title">{{ tipContent ? '恭喜您已中奖' : '很遗憾您未中奖' }}</text>
            <text class="MiSans-Regular tips-text">{{ tipContent || '感谢您的参与，请继续加油' }}</text>
          </view>
          <view class="surebtn-view">
            <view class="cancel-btn" @click="closeTips">
              <text class="MiSans-Regular cancel-text">休息一会</text>
            </view>
            <view class="sure-btn" @click="restart">
              <text class="MiSans-Regular sure-text">再来一次</text>
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
/**
 * 原站 lottery/lottery —— 抽奖转盘
 * 结构：深色导航（右侧「中奖记录」）+ 转盘（8 扇格 CSS transform rotate 实现 + 中间按钮）+ 消耗提示 + 奖品网格 + 中奖结果弹层。
 * 说明：原站转盘为 canvas 绘制且依赖 /static/good/choujiang_*.png（已404），
 *      本页按用户要求改用 CSS conic-gradient 扇格 + rotate 动画实现。
 */
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import PageNavbar from '@/components/PageNavbar.vue'
import { fetchLotteryInfo } from '@/utils/api'
import { ossImg } from '@/api'

defineOptions({ name: 'LotteryPage' })

const router = useRouter()
const info = ref({})
const rotateDeg = ref(0)
const spinning = ref(false)
const tipsFlag = ref(false)
const tipContent = ref('')

onMounted(async () => {
  info.value = await fetchLotteryInfo()
})

const prizes = computed(() => info.value.prizeList || [])
/** 8 扇格：奖品不足 8 个时循环补足，多余的忽略 */
const wheelSlices = computed(() => {
  const src = prizes.value
  const out = []
  for (let i = 0; i < 8; i++) out.push(src[i % Math.max(src.length, 1)] || { name: '谢谢参与' })
  return out
})
const remainNum = computed(() => Math.max(0, 1000 - (info.value.used || 0)))

function start() {
  if (spinning.value) return
  spinning.value = true
  tipsFlag.value = false
  // 至少转 5 圈，落在随机扇格
  const target = 360 * 5 + Math.floor(Math.random() * 360)
  rotateDeg.value += target
  setTimeout(() => {
    spinning.value = false
    const hit = wheelSlices.value[Math.floor(Math.random() * 8)]
    tipContent.value = hit && hit.id ? hit.name : ''
    tipsFlag.value = true
  }, 3200)
}
function closeTips() {
  tipsFlag.value = false
}
function restart() {
  tipsFlag.value = false
  start()
}
function goRecord() {
  router.push('/pages/lottery/record')
}
</script>

<style scoped src="./Lottery.css"></style>
