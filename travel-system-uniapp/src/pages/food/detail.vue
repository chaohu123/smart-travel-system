<template>
  <view class="food-detail-page">
    <scroll-view scroll-y class="scroll">
      <view v-if="loading" class="loading">
        <text>加载中...</text>
      </view>

      <view v-else-if="detail" class="content">
        <view class="header">
          <text class="name">{{ detail.name }}</text>
          <text class="city">{{ detail.cityName || '' }}</text>
        </view>

        <view class="meta-row">
          <text class="score">评分：{{ detail.score || '--' }}</text>
          <text class="hot">热度：{{ detail.hotScore || 0 }}</text>
          <text v-if="detail.avgPrice" class="price">
            人均：¥{{ detail.avgPrice }}
          </text>
        </view>

        <view class="section">
          <text class="section-title">地址</text>
          <text class="section-text">
            {{ detail.address || '暂无地址信息' }}
          </text>
        </view>

        <view class="section" v-if="detail.foodType">
          <text class="section-title">类型</text>
          <text class="section-text">
            {{ detail.foodType }}
          </text>
        </view>

        <view class="section">
          <text class="section-title">简介</text>
          <text class="section-text">
            {{ detail.intro || '暂无简介' }}
          </text>
        </view>
      </view>

      <view v-else class="loading">
        <text>未找到美食信息</text>
      </view>
    </scroll-view>

    <view class="bottom-bar">
      <button class="checkin-btn" @click="goCheckin">去打卡</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { foodApi } from '@/api/content'

const foodId = ref<number | null>(null)
const loading = ref(false)
const detail = ref<any>(null)

const loadDetail = async () => {
  if (!foodId.value) return
  loading.value = true
  try {
    const res = await foodApi.getDetail(foodId.value)
    if (res.statusCode === 200 && res.data.code === 200) {
      detail.value = res.data.data
    } else {
      uni.showToast({ title: res.data.msg || '加载失败', icon: 'none' })
    }
  } catch (e) {
    uni.showToast({ title: '网络错误', icon: 'none' })
  } finally {
    loading.value = false
  }
}

const goCheckin = () => {
  if (!foodId.value) return
  uni.switchTab({ url: '/pages/checkin/checkin' })
}

onMounted(() => {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1] as any
  const options = (currentPage.options || {}) as { id?: string }
  if (options.id) {
    foodId.value = Number(options.id)
    loadDetail()
  }
})
</script>

<style scoped>
.food-detail-page {
  min-height: 100vh;
  background-color: #f7f8fa;
  display: flex;
  flex-direction: column;
}

.scroll {
  flex: 1;
}

.content {
  padding: 24rpx;
}

.header {
  margin-bottom: 12rpx;
}

.name {
  font-size: 36rpx;
  font-weight: 600;
  color: #333333;
}

.city {
  margin-top: 8rpx;
  font-size: 24rpx;
  color: #999999;
}

.meta-row {
  margin-top: 12rpx;
  display: flex;
  flex-wrap: wrap;
  gap: 24rpx;
  font-size: 24rpx;
  color: #666666;
}

.score {
  color: #3ba272;
  font-weight: 600;
}

.price {
  color: #ff7d00;
}

.section {
  margin-top: 24rpx;
}

.section-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #333333;
  display: block;
  margin-bottom: 8rpx;
}

.section-text {
  font-size: 26rpx;
  color: #666666;
  line-height: 1.6;
}

.loading {
  padding: 80rpx 32rpx;
  text-align: center;
  color: #999999;
  font-size: 28rpx;
}

.bottom-bar {
  padding: 16rpx 24rpx;
  background-color: #ffffff;
  border-top: 1rpx solid #eeeeee;
}

.checkin-btn {
  width: 100%;
  padding: 24rpx;
  background-color: #3ba272;
  color: #ffffff;
  border-radius: 20rpx;
  font-size: 30rpx;
  font-weight: 600;
}
</style>


























