<template>
  <view class="empty">
    <image v-if="icon" class="empty-icon" :src="icon" mode="aspectFit" />
    <text class="empty-text">{{ text }}</text>
    <button v-if="btnText" class="empty-btn" size="mini" @click="$emit('retry')">
      {{ btnText }}
    </button>
  </view>
</template>

<script setup lang="ts">
defineProps<{
  text?: string
  icon?: string
  btnText?: string
}>()
</script>

<style scoped>
.empty {
  padding: 60rpx 24rpx;
  text-align: center;
  color: #8a94a3;
}
.empty-icon {
  width: 140rpx;
  height: 140rpx;
  margin-bottom: 16rpx;
}
.empty-text {
  display: block;
  font-size: 26rpx;
  margin-bottom: 12rpx;
}
.empty-btn {
  background: linear-gradient(135deg, #3ba272, #57c18c);
  color: #fff;
  border-radius: 999rpx;
  padding: 12rpx 32rpx;
}
</style>














