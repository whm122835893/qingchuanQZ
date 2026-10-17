<template>
  <view class="modal-mask" @click.self="emit('close')">
    <view class="modal-box">
      <view class="modal-head"></view>
      <text class="MiSans-Demibold modal-title">青川注销注意事项</text>
      <view class="plr-24">
        <text class="font-color-999 modal-para">
          在您开始注销流程时，请确保您已知下列注意事项：账号注销是不可逆的操作，一日注销成功，则个人资料、头像、购买记录等数据都会清空且不可重新获取，您将无法再以该账号登录和使用本App的服务。即使您使用相同的手机号再次注册，您也无法继续通过本软件访问您的数宇藏品。所以在注销之前，请确认您账户中已没有数字藏品、余额等。
        </text>
        <text class="font-w-600 modal-para">
          为了保障您的合法权益，我们设置了365天的冷静期。如果您在成功申请注销账号后的365天内再次登录的。即视为您撤回注销申请；若365天内未登录，则该账号将完成注销。
        </text>
        <text class="font-color-999 modal-para">具体内容请见</text>
        <text class="modal-link">《青川软件注销协议》</text>
      </view>

      <view class="flex flex-dir-col flex-ai-center">
        <view class="flex flex-ai-center mt-16 agree-row" @click="emit('toggle')">
          <view class="checkbox" :class="{ on: checked }"></view>
          <text class="font-color-999 agree-text">我已阅读并同意</text>
          <text class="modal-link">《青川注销协议》</text>
        </view>
        <view class="flex flex-js-sb plr-24 mt-16" style="width: 100%">
          <view class="cancel-btn flex flex-ai-center flex-js-center" @click="emit('close')">
            <text class="MiSans-Medium cancel-text">取消</text>
          </view>
          <view class="submit-btn flex flex-ai-center flex-js-center" @click="emit('confirm')">
            <text class="MiSans-Medium submit-text">注销账号</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
/** 原站注销注意事项弹层（u-popup mode=center round=12） */
defineOptions({ name: 'CancellationNoticeModal' })

defineProps({ checked: { type: Boolean, default: false } })
const emit = defineEmits(['close', 'toggle', 'confirm'])
</script>

<style scoped>
.modal-mask {
  position: fixed;
  inset: 0;
  z-index: 200;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
}
.modal-box {
  position: relative;
  width: 654rpx;
  border-radius: 12rpx;
  padding-bottom: 48rpx;
  background: #fff;
  box-sizing: border-box;
}
.modal-head {
  background-color: #fff5e0;
  height: 80rpx;
  border-top-right-radius: 32rpx;
  border-top-left-radius: 32rpx;
}
.modal-title {
  display: block;
  text-align: center;
  font-size: 34rpx;
  color: #000;
  padding: 40rpx 0 26rpx;
}
.modal-para {
  display: block;
  font-size: 26rpx;
  line-height: 1.8;
  color: #999;
  margin-bottom: 20rpx;
}
.modal-link {
  font-size: 26rpx;
  color: #b27700;
}
.agree-row {
  padding: 0 8rpx;
}
.checkbox {
  width: 32rpx;
  height: 32rpx;
  border-radius: 50%;
  border: 2rpx solid #1d569e;
  margin-right: 12rpx;
  flex-shrink: 0;
  box-sizing: border-box;
}
.checkbox.on {
  background: #1d569e;
}
.agree-text {
  font-size: 26rpx;
  color: #999;
}
.cancel-btn,
.submit-btn {
  width: 236rpx;
  height: 84rpx;
  border-radius: 42rpx;
}
.cancel-btn {
  background: #f5f6fa;
}
.cancel-text {
  font-size: 30rpx;
  color: #8d90aa;
}
.submit-btn {
  background: linear-gradient(90deg, #183c6a 0%, #1d569e 100%);
}
.submit-text {
  font-size: 30rpx;
  color: #fff;
}
</style>
