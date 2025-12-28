<template>
  <view v-if="visible" class="login-prompt-mask" @click="handleCancel">
    <view class="login-prompt" @click.stop>
      <view class="prompt-header">
        <text class="prompt-title">需要登录</text>
        <text class="prompt-close" @click="handleCancel">×</text>
      </view>
      <view class="prompt-content">
        <text class="prompt-message">{{ message }}</text>
      </view>
      <view class="prompt-footer">
        <button class="prompt-btn prompt-btn-cancel" @click="handleCancel">取消</button>
        <button class="prompt-btn prompt-btn-confirm" @click="handleConfirm">去登录</button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { watch } from 'vue'

interface Props {
  visible: boolean
  message?: string
}

const props = withDefaults(defineProps<Props>(), {
  message: '请先登录',
})

// 监听 visible 变化，用于调试
watch(() => props.visible, (newVal) => {
  console.log('LoginPrompt visible changed:', newVal)
}, { immediate: true })

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

const handleConfirm = () => {
  emit('confirm')
  uni.switchTab({ url: '/pages/profile/profile' })
}

const handleCancel = () => {
  emit('cancel')
}
</script>

<style scoped>
.login-prompt-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 99999;
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.login-prompt {
  width: 560rpx;
  background-color: #ffffff;
  border-radius: 24rpx;
  overflow: hidden;
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    transform: translateY(100rpx);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.prompt-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 32rpx 32rpx 24rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.prompt-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333333;
}

.prompt-close {
  font-size: 48rpx;
  color: #999999;
  line-height: 1;
  width: 48rpx;
  height: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.prompt-content {
  padding: 32rpx;
}

.prompt-message {
  font-size: 28rpx;
  color: #666666;
  line-height: 1.6;
  text-align: center;
}

.prompt-footer {
  display: flex;
  border-top: 1rpx solid #f0f0f0;
}

.prompt-btn {
  flex: 1;
  height: 88rpx;
  line-height: 88rpx;
  text-align: center;
  font-size: 30rpx;
  border: none;
  border-radius: 0;
  background-color: transparent;
  padding: 0;
  margin: 0;
}

.prompt-btn::after {
  border: none;
}

.prompt-btn-cancel {
  color: #666666;
  border-right: 1rpx solid #f0f0f0;
}

.prompt-btn-confirm {
  color: #3ba272;
  font-weight: 600;
}

.prompt-btn-cancel:active {
  background-color: #f7f8fa;
}

.prompt-btn-confirm:active {
  background-color: #f0f9f5;
}
</style>

