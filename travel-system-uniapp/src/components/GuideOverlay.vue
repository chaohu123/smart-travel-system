<template>
  <view v-if="visible" class="guide-mask" @click="close">
    <view class="guide-card" @click.stop>
      <text class="guide-title">功能快速引导</text>
      <view class="guide-step" v-for="step in steps" :key="step.title">
        <view class="dot" />
        <view class="step-body">
          <text class="step-title">{{ step.title }}</text>
          <text class="step-desc">{{ step.desc }}</text>
        </view>
      </view>
      <button class="guide-btn" @click="close">我知道了</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getCache, setCache } from '@/utils/storage'

const visible = ref(false)
const steps = [
  { title: '智能规划', desc: '在首页进入“智能规划”快速生成行程' },
  { title: '游记发布', desc: '在游记页发布图文，分享体验' },
  { title: '打卡', desc: '在景点/美食页上传照片完成打卡' },
]

const close = () => {
  visible.value = false
  setCache('guided', true, 60 * 24 * 365)
}

onMounted(() => {
  const guided = getCache<boolean>('guided')
  if (!guided) {
    visible.value = true
  }
})
</script>

<style scoped>
.guide-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}
.guide-card {
  width: 86%;
  background: #fff;
  border-radius: 20rpx;
  padding: 28rpx;
  box-shadow: 0 18rpx 36rpx rgba(0, 0, 0, 0.15);
}
.guide-title {
  font-size: 32rpx;
  font-weight: 700;
  color: #333;
}
.guide-step {
  display: flex;
  gap: 12rpx;
  margin-top: 18rpx;
}
.dot {
  margin-top: 8rpx;
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
  background: #3ba272;
  box-shadow: 0 0 0 4rpx rgba(59, 162, 114, 0.12);
}
.step-body {
  flex: 1;
}
.step-title {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: #333;
}
.step-desc {
  display: block;
  margin-top: 6rpx;
  font-size: 24rpx;
  color: #666;
}
.guide-btn {
  margin-top: 20rpx;
  background: linear-gradient(135deg, #3ba272, #57c18c);
  color: #fff;
  border-radius: 12rpx;
  padding: 18rpx;
  font-size: 28rpx;
  font-weight: 600;
}
</style>














