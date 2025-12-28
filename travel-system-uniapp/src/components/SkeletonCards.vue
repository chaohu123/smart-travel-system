<template>
  <view class="skeleton-list">
    <view v-for="n in count" :key="n" class="skeleton-card">
      <view class="skeleton-cover shimmer" />
      <view class="skeleton-line shimmer" />
      <view class="skeleton-line short shimmer" />
    </view>
  </view>
</template>

<script setup lang="ts">
defineProps<{
  count?: number
}>()
</script>

<style scoped>
.skeleton-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16rpx;
  padding: 8rpx 0;
}
.skeleton-card {
  background: #ffffff;
  border-radius: 20rpx;
  padding: 12rpx;
  box-shadow: 0 10rpx 24rpx rgba(0, 0, 0, 0.05);
}
.skeleton-cover {
  width: 100%;
  padding-bottom: 70%;
  border-radius: 14rpx;
  background: #eef0f3;
  margin-bottom: 12rpx;
}
.skeleton-line {
  height: 22rpx;
  background: #eef0f3;
  border-radius: 999rpx;
  margin-bottom: 8rpx;
}
.skeleton-line.short {
  width: 60%;
}
.shimmer {
  position: relative;
  overflow: hidden;
}
.shimmer::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.6) 50%, rgba(255,255,255,0) 100%);
  animation: shimmer 1.2s infinite;
}
@keyframes shimmer {
  100% {
    transform: translateX(100%);
  }
}
</style>





















