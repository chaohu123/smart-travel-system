<template>
  <view class="error">
    <text class="error-text">{{ text }}</text>
    <button class="error-btn" size="mini" @click="$emit('retry')">重试</button>
  </view>
</template>

<script setup lang="ts">
defineProps<{
  text?: string
}>()
</script>

<style scoped>
.error {
  padding: 60rpx 24rpx;
  text-align: center;
  color: #d14343;
}
.error-text {
  display: block;
  font-size: 26rpx;
  margin-bottom: 12rpx;
}
.error-btn {
  background: #d14343;
  color: #fff;
  border-radius: 999rpx;
  padding: 12rpx 32rpx;
}
</style>























<<<<<<< HEAD

=======
>>>>>>> 299642f29c0d19bfedecf29490a18cfe2ad7de4f
