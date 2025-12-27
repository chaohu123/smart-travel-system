<template>
  <view class="plan-page">
    <scroll-view scroll-y class="plan-scroll">
      <!-- 条件选择区（卡片） -->
      <view class="plan-form">
        <!-- 城市选择 -->
        <view class="form-item">
          <text class="form-label">城市选择</text>
          <picker
            mode="selector"
            :range="cityList"
            range-key="name"
            @change="onCityChange"
          >
            <view class="picker-view">
              <text :class="{ placeholder: !selectedCity }">
                {{ selectedCity?.name || '请选择城市' }}
              </text>
              <text class="picker-arrow">›</text>
            </view>
          </picker>
        </view>

        <!-- 出行天数 -->
        <view class="form-item">
          <text class="form-label">天数选择</text>
          <view class="stepper-wrapper">
            <view
              class="stepper-btn"
              :class="{ disabled: selectedDays <= 1 }"
              @click="decreaseDays"
            >
              <text>−</text>
            </view>
            <text class="stepper-value">{{ selectedDays }}天</text>
            <view
              class="stepper-btn"
              :class="{ disabled: selectedDays >= 7 }"
              @click="increaseDays"
            >
              <text>+</text>
            </view>
          </view>
        </view>

        <!-- 兴趣标签（多选 Tag） -->
        <view class="form-item">
          <text class="form-label">兴趣标签</text>
          <view class="tag-list">
            <view
              v-for="tag in tagList"
              :key="tag.id"
              class="tag-item"
              :class="{ active: selectedTags.includes(tag.id) }"
              @click="toggleTag(tag.id)"
            >
              <text>{{ tag.name }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- "生成线路"按钮（核心按钮） -->
      <view class="submit-section">
        <button
          class="submit-btn"
          :class="{ disabled: !canSubmit }"
          @click="generateRoute"
        >
          为我生成智能线路
        </button>
      </view>

      <!-- 线路结果展示（如果有历史记录） -->
      <view v-if="recentRoutes.length > 0" class="recent-routes">
        <view class="section-title">最近生成的线路</view>
        <view
          v-for="route in recentRoutes"
          :key="route.id"
          class="route-item"
          @click="viewRoute(route.id)"
        >
          <text class="route-item-title">{{ route.title }}</text>
          <text class="route-item-arrow">›</text>
        </view>
      </view>
    </scroll-view>

    <!-- 加载中 -->
    <view v-if="loading" class="loading-overlay">
      <view class="loading-content">
        <text class="loading-text">正在为您规划行程...</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { routeApi } from '@/api/route'
import { cityApi } from '@/api/content'

// API 响应类型定义
interface ApiResponse<T = any> {
  code: number
  msg?: string
  data: T
}

const cityList = ref<{ id: number; name: string }[]>([])

const selectedCity = ref<{ id: number; name: string } | null>(null)
const selectedDays = ref<number>(3)
const selectedTags = ref<number[]>([])
const loading = ref(false)
const recentRoutes = ref<any[]>([])

const canSubmit = computed(() => {
  return selectedCity.value !== null && selectedTags.value.length > 0
})

const decreaseDays = () => {
  if (selectedDays.value > 1) {
    selectedDays.value--
  }
}

const increaseDays = () => {
  if (selectedDays.value < 7) {
    selectedDays.value++
  }
}

const tagList = ref([
  { id: 1, name: '美食' },
  { id: 2, name: '历史' },
  { id: 3, name: '自然' },
  { id: 4, name: '亲子' },
  { id: 5, name: '购物' },
])

const onCityChange = (e: any) => {
  selectedCity.value = cityList.value[e.detail.value]
}

const viewRoute = (routeId: number) => {
  uni.navigateTo({
    url: `/pages/route/detail?id=${routeId}`,
  })
}

const toggleTag = (tagId: number) => {
  const index = selectedTags.value.indexOf(tagId)
  if (index > -1) {
    selectedTags.value.splice(index, 1)
  } else {
    selectedTags.value.push(tagId)
  }
}

const generateRoute = async () => {
  if (!canSubmit.value) {
    uni.showToast({
      title: '请完成必填项',
      icon: 'none',
    })
    return
  }

  loading.value = true

  try {
    const res = await routeApi.generate({
      cityId: selectedCity.value!.id,
      days: selectedDays.value,
      tagIds: selectedTags.value,
      useAi: true,
    })

    if (res.statusCode === 200 && res.data.code === 200) {
      const routeId = res.data.data.routeId
      uni.navigateTo({
        url: `/pages/route/detail?id=${routeId}`,
      })
    } else {
      uni.showToast({
        title: res.data.msg || '生成失败',
        icon: 'none',
      })
    }
  } catch (error) {
    uni.showToast({
      title: '网络错误',
      icon: 'none',
    })
  } finally {
    loading.value = false
  }
}

const loadCities = async () => {
  try {
    const res = await cityApi.list()
    const response = res.data as ApiResponse<any[]>
    if (res.statusCode === 200 && response.code === 200) {
      const cities = response.data || []
      cityList.value = cities.map((city: any) => ({
        id: city.id,
        name: city.cityName || city.name,
      }))
    }
  } catch (error) {
    console.error('加载城市列表失败', error)
  }
}

onMounted(() => {
  loadCities()
})
</script>

<style scoped>
.plan-page {
  min-height: 100vh;
  background-color: #f7f8fa;
  display: flex;
  flex-direction: column;
}

.plan-scroll {
  flex: 1;
}

.plan-form {
  background-color: #ffffff;
  border-radius: 24rpx;
  padding: 32rpx;
  margin: 24rpx;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.06);
}

.form-item {
  margin-bottom: 40rpx;
}

.form-item:last-child {
  margin-bottom: 0;
}

.form-label {
  display: block;
  font-size: 28rpx;
  color: #333333;
  font-weight: 600;
  margin-bottom: 20rpx;
}

.picker-view {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx;
  background-color: #f7f8fa;
  border-radius: 16rpx;
  color: #333333;
}

.picker-view .placeholder {
  color: #999999;
}

.picker-arrow {
  font-size: 32rpx;
  color: #cccccc;
}

.stepper-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 32rpx;
}

.stepper-btn {
  width: 64rpx;
  height: 64rpx;
  border-radius: 999rpx;
  background-color: #3ba272;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36rpx;
  font-weight: 600;
}

.stepper-btn.disabled {
  background-color: #e0e0e0;
  color: #999999;
}

.stepper-value {
  font-size: 32rpx;
  color: #333333;
  font-weight: 600;
  min-width: 80rpx;
  text-align: center;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.tag-item {
  padding: 16rpx 32rpx;
  background-color: #f7f8fa;
  border-radius: 999rpx;
  font-size: 26rpx;
  color: #666666;
  border: 2rpx solid transparent;
  transition: all 0.2s;
}

.tag-item.active {
  background-color: #3ba272;
  color: #ffffff;
  border-color: #3ba272;
}

.submit-section {
  padding: 0 24rpx 24rpx;
}

.submit-btn {
  width: 100%;
  padding: 28rpx;
  background-color: #3ba272;
  color: #ffffff;
  border-radius: 16rpx;
  font-size: 32rpx;
  font-weight: 600;
  box-shadow: 0 8rpx 24rpx rgba(59, 162, 114, 0.3);
}

.submit-btn.disabled {
  background-color: #cccccc;
  box-shadow: none;
}

.recent-routes {
  padding: 24rpx;
}

.section-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #333333;
  margin-bottom: 16rpx;
}

.route-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx;
  background-color: #ffffff;
  border-radius: 16rpx;
  margin-bottom: 16rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
}

.route-item-title {
  font-size: 28rpx;
  color: #333333;
}

.route-item-arrow {
  font-size: 32rpx;
  color: #cccccc;
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.loading-content {
  background-color: #ffffff;
  border-radius: 24rpx;
  padding: 60rpx 80rpx;
}

.loading-text {
  font-size: 28rpx;
  color: #333333;
}
</style>


