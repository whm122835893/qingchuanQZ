<template>
  <view class="scheme-page">
    <PageNavbar title="合成兑换">
      <template #right>
        <text class="MiSans-Demibold nav-right" @click="go('/pages/compound/record')">合成记录</text>
      </template>
    </PageNavbar>

    <view class="page-body">
      <view class="target-wrap">
        <img class="target-img" :src="ossImg(scheme.target_img)" mode="aspectFill" />
      </view>

      <view class="main-card">
        <view class="target">
          <text class="MiSans-Demibold target-name">{{ scheme.title || '--' }}</text>
          <text class="MiSans-Regular target-tip">·寄售中的藏品无法参与合成</text>
        </view>

        <view class="section">
          <text class="MiSans-Demibold section-title">请选择藏品：</text>

          <view v-for="(cond, ci) in conditions" :key="ci" class="condition-block">
            <view class="cond-head">
              <text class="MiSans-Regular cond-name">{{ cond.name }}</text>
              <text class="MiSans-Regular cond-progress">放置 {{ pickedOf(ci).length }}/{{ cond.number }}</text>
            </view>
            <view
              v-for="(c, i) in cond.collectionList"
              :key="c.id || i"
              class="mat-row"
              @click="toggle(ci, c)"
            >
              <img class="mat-thumb" :src="ossImg(c.image)" mode="aspectFill" />
              <view class="mat-meta">
                <text class="MiSans-Medium mat-name text-overflow">{{ c.name }}</text>
                <text class="MiSans-Regular mat-stat">#{{ c.collection_code }}</text>
              </view>
              <view class="check" :class="{ on: isPicked(ci, c) }">
                <view v-if="isPicked(ci, c)" class="check-mark"></view>
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 底部 -->
    <view class="footer">
      <view v-if="isDisabled" class="tip-bar">
        <text class="MiSans-Regular tip-text">当前拥有藏品不满足合成条件</text>
      </view>
      <view class="submit-btn" :class="{ disabled: isDisabled }" @click="submit">
        <text class="MiSans-Demibold submit-text">立即合成/兑换</text>
      </view>
    </view>

    <!-- 合成成功弹层 -->
    <view v-if="showSuccess" class="success-mask">
      <view class="success-pop">
        <img class="success-title" :src="asset('static/compound/success_title.png')" mode="widthFix" />
        <view class="success-stage">
          <img class="pop-bg" :src="asset('static/compound/pop_bg.png')" mode="aspectFill" />
          <view class="result-box">
            <img class="result-img" :src="ossImg(resultImage)" mode="aspectFill" />
          </view>
          <img class="pop-bottom-bg" :src="asset('static/compound/pop_bottom_bg.png')" mode="widthFix" />
          <view class="pop-btns">
            <view class="pop-btn view" @click="goMyCollection">
              <img class="btn-label" :src="asset('static/compound/view_btn.png')" mode="heightFix" />
            </view>
            <view class="pop-btn again" @click="again">
              <img class="btn-label" :src="asset('static/compound/again_btn.png')" mode="heightFix" />
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
/**
 * 原站 compound/schemeDetails —— 合成兑换（材料选择）
 * 结构：导航（右侧「合成记录」）+ 目标图 + 主卡（目标名 + 请选择藏品：按条件分组多选）+ 底部提示条与「立即合成/兑换」+ 合成成功弹层。
 */
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import PageNavbar from '@/components/PageNavbar.vue'
import { asset, fetchCompoundResult, fetchCompoundScheme } from '@/utils/api'
import { ossImg } from '@/api'

defineOptions({ name: 'CompoundSchemeDetails' })

const router = useRouter()
const scheme = ref({})
const picked = ref([])
const showSuccess = ref(false)
const resultImage = ref('')

onMounted(async () => {
  scheme.value = await fetchCompoundScheme()
})

const conditions = computed(() => scheme.value.rule_text || [])

function pickedOf(ci) {
  return picked.value[ci] || []
}
function isPicked(ci, c) {
  return pickedOf(ci).some((x) => x.id === c.id)
}
function toggle(ci, c) {
  const arr = pickedOf(ci).slice()
  const idx = arr.findIndex((x) => x.id === c.id)
  if (idx > -1) arr.splice(idx, 1)
  else if (arr.length < (conditions.value[ci] || {}).number) arr.push(c)
  const next = picked.value.slice()
  next[ci] = arr
  picked.value = next
}

const isDisabled = computed(() =>
  conditions.value.some((c, i) => pickedOf(i).length < c.number)
)

async function submit() {
  if (isDisabled.value) return
  const data = await fetchCompoundResult()
  const first = (data && data.result && data.result[0]) || {}
  resultImage.value = scheme.value.target_img
  showSuccess.value = true
  window.uni && window.uni.showToast({ title: first.name || '合成成功', icon: 'none' })
}
function again() {
  showSuccess.value = false
  picked.value = []
}
function goMyCollection() {
  showSuccess.value = false
  router.push('/pages/myCollection/myCollection')
}
function go(path) {
  router.push(path)
}
</script>

<style scoped src="./SchemeDetails.css"></style>
