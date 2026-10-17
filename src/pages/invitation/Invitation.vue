<template>
  <view class="invite-page">
    <PageNavbar title="邀请好友" />

    <!-- 邀请信息块 -->
    <view class="info-block">
      <view class="info-row">
        <view class="info-left">
          <text class="MiSans-Demibold count">{{ inviteNum }}</text>
          <text class="MiSans-Regular count-label">已邀请好友</text>
          <view class="code-row" @click="copy(inviteCode)">
            <text class="MiSans-Regular code-text">我的邀请码：{{ inviteCode }}</text>
            <img class="code-copy" :src="asset('static/icon/copy-white.png')" mode="aspectFit" />
          </view>
        </view>
        <view class="info-right">
          <view class="invite-now" @click="posterPop = true">
            <text class="MiSans-Demibold invite-now-text">立即邀请 &gt;</text>
          </view>
          <text class="MiSans-Regular copy-link" @click="copy(h5Link)">复制邀请码链接</text>
        </view>
      </view>
    </view>

    <!-- 下方：链接按钮 + 邀请记录 -->
    <view class="below">
      <view class="link-row">
        <view class="link-btn" @click="copy(h5Link)">
          <text class="MiSans-Regular link-btn-text">复制H5链接</text>
        </view>
        <view class="link-btn" @click="copy(appLink)">
          <text class="MiSans-Regular link-btn-text">复制APP下载链接</text>
        </view>
      </view>

      <view class="record-box">
        <text class="MiSans-Demibold record-title">邀请记录</text>
        <view v-for="(r, i) in list" :key="r.id || i" class="record-item">
          <img class="avatar" :src="ossImg(r.avatar)" mode="aspectFill" />
          <view class="record-meta">
            <text class="MiSans-Medium record-name text-overflow">{{ r.nickname || '用户' }}</text>
            <text class="MiSans-Regular record-time">{{ fmt(r.create_time) }}</text>
          </view>
          <text class="MiSans-Regular record-status">{{ r.status === 1 ? '已实名' : '未实名' }}</text>
        </view>
        <view v-if="list.length" class="no-more">
          <text class="MiSans-Regular no-more-text">—— 没有更多数据了 ——</text>
        </view>
        <view v-else class="no-more">
          <text class="MiSans-Regular no-more-text">暂无邀请记录</text>
        </view>
      </view>
    </view>

    <!-- 邀请海报 -->
    <view v-if="posterPop" class="mask" @click="posterPop = false">
      <view class="poster-wrap" @click.stop>
        <view class="poster">
          <img class="poster-bg" :src="asset('static/invite/poster_bg.png')" mode="aspectFill" />
          <view class="poster-qr">
            <view class="qr">
              <view v-for="(row, i) in QR_BASE" :key="i" class="qr-row">
                <view
                  v-for="(on, j) in row.split('')"
                  :key="j"
                  class="qr-cell"
                  :class="{ on: on === '1' }"
                ></view>
              </view>
            </view>
          </view>
        </view>
        <view class="save-btn" @click="savePoster">
          <text class="MiSans-Medium save-btn-text">保存海报</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
/**
 * 原站 invitation/invitation —— 邀请好友
 * 结构：绿底 banner（已邀请人数 + 我的邀请码 + 立即邀请 + 复制邀请码链接）+ 下方（复制H5链接 / 复制APP下载链接 + 邀请记录列表）+ 邀请海报弹层。
 * 说明：邀请链接使用当前站点域名（window.location.origin），不含任何源站域名。
 *      二维码沿用项目已有的 CSS 网格矩阵方案绘制（25×25），不请求外部二维码服务。
 */
import { computed, onMounted, ref } from 'vue'
import PageNavbar from '@/components/PageNavbar.vue'
import { asset, fetchInvitationInfo, fetchInvitationRecord } from '@/utils/api'
import { ossImg } from '@/api'

defineOptions({ name: 'InvitationPage' })

const info = ref({})
const list = ref([])
const posterPop = ref(false)

const QR_BASE = [
  '111111100101101111111',
  '100000101110101000001',
  '101110100011101011101',
  '101110101101101011101',
  '101110100110101011101',
  '100000101011101000001',
  '111111101010101111111',
  '000000001101100000000',
  '110101111001011010110',
  '001011001111100101001',
  '111100110101011110110',
  '010011011011110001011',
  '101101110110101101101',
  '000000001011011001100',
  '111111101101101010111',
  '100000101011001111000',
  '101110101110111001101',
  '101110100001101110010',
  '101110101111101011111',
  '100000100110001100100',
  '111111101011101010111',
  '000000001101110001010',
  '101011111001011110101',
  '010100001111001011010',
  '111011110110111100111',
]

onMounted(async () => {
  const [i, r] = await Promise.all([fetchInvitationInfo(), fetchInvitationRecord()])
  info.value = i || {}
  list.value = (r && r.list) || []
})

const inviteNum = computed(() => info.value.invite_num || 0)
const inviteCode = computed(() => info.value.invite_code || '--')
/** H5 邀请链接：当前域名 + 邀请路径 */
const h5Link = computed(
  () => `${window.location.origin}${info.value.invite_path || '/pages/index/index'}`
)
/** APP 下载链接：当前域名 + 下载页路径 */
const appLink = computed(
  () => `${window.location.origin}${info.value.app_download_path || '/pages/index/downloadApp'}`
)

function copy(text) {
  if (navigator.clipboard) navigator.clipboard.writeText(text)
  window.uni && window.uni.showToast({ title: '已复制', icon: 'none' })
}
function savePoster() {
  posterPop.value = false
  window.uni && window.uni.showToast({ title: '海报已保存', icon: 'none' })
}
function fmt(v) {
  if (!v) return ''
  const d = new Date(Number(v) * 1000)
  if (Number.isNaN(d.getTime())) return String(v)
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())}`
}
</script>

<style scoped src="./Invitation.css"></style>
