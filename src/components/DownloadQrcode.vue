<template>
  <!-- 下载二维码：25×25 固定矩阵用 CSS 网格绘制，不请求任何外部图片/二维码服务 -->
  <view class="qr-wrap flex flex-dir-col flex-ai-center">
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
    <text class="MiSans-Regular qr-tip">扫码下载青川 APP</text>
  </view>
</template>

<script setup>
/**
 * 下载页二维码（index/downloadApp 内嵌块）。
 * 定位角 + 定位点 + 固定数据区，视觉占位，非真实可扫码内容。
 */
defineOptions({ name: 'DownloadQrcode' })

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
</script>

<style scoped>
@import '@/styles/atomic.css';

.qr-wrap {
  margin-top: 60rpx;
}
.qr {
  width: 320rpx;
  height: 320rpx;
  padding: 16rpx;
  background: #fff;
  border-radius: 16rpx;
  box-shadow: 0 4rpx 24rpx rgba(11, 42, 113, 0.08);
}
.qr-row {
  display: flex;
  height: 11.5rpx;
}
.qr-cell {
  flex: 1;
}
.qr-cell.on {
  background: #1a2438;
}
.qr-tip {
  margin-top: 20rpx;
  font-size: 22rpx;
  color: #999;
}
</style>