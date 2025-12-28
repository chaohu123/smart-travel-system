<template>
  <view class="plan-page">
    <view class="page-bg"></view>
    <scroll-view scroll-y class="plan-scroll">
      <!-- 条件选择区（卡片） -->
      <view class="plan-form">
        <!-- 标题 -->
        <view class="form-header">
          <text class="header-title">智能生成你的完美行程</text>
        </view>

        <!-- 目的地 -->
        <view class="form-item">
          <text class="form-label">目的地</text>
          <input
            class="destination-input"
            v-model="destination"
            placeholder="北京"
            placeholder-style="color: #999999; font-weight: normal;"
            @input="onDestinationInput"
            type="text"
            maxlength="50"
          />
          <text class="form-hint">支持自然输入，如"北京3日游"</text>
        </view>

        <!-- 出行天数 -->
        <view class="form-item">
          <text class="form-label">出行天数</text>
          <picker
            mode="selector"
            :range="dayOptions"
            range-key="label"
            :value="selectedDayIndex"
            @change="onDayChange"
          >
            <view class="picker-view">
              <text>{{ dayOptions[selectedDayIndex]?.label || '3天' }}</text>
              <text class="picker-arrow">›</text>
            </view>
          </picker>
          <text class="form-hint">快捷选项：2天1晚、3天2晚、5天4晚</text>
        </view>

        <!-- 旅行偏好（多选 Tag） -->
        <view class="form-item">
          <text class="form-label">旅行偏好 <text class="label-optional">(可多选)</text></text>
          <view class="tag-list">
            <view
              v-for="tag in tagList"
              :key="tag.id"
              class="tag-item"
              :class="{ active: selectedTags.includes(tag.id) }"
              :style="selectedTags.includes(tag.id) ? { backgroundColor: tag.color, borderColor: tag.color } : {}"
              @click="toggleTag(tag.id)"
            >
              <text>{{ tag.name }}</text>
            </view>
          </view>
        </view>

        <!-- 同行人 -->
        <view class="form-item">
          <text class="form-label">同行人</text>
          <view class="companion-list">
            <view
              v-for="companion in companionList"
              :key="companion.id"
              class="companion-item"
              :class="{ active: selectedCompanion === companion.id }"
              @click="selectCompanion(companion.id)"
            >
              <text>{{ companion.name }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- "开始智能规划"按钮（核心按钮） -->
      <view class="submit-section">
        <button
          class="submit-btn"
          :class="{ disabled: !canSubmit }"
          @click="generateRoute"
        >
          <text>开始智能规划</text>
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
import { cityApi, tagApi } from '@/api/content'

// API 响应类型定义
interface ApiResponse<T = any> {
  code: number
  msg?: string
  data: T
}

const cityList = ref<{ id: number; name: string }[]>([])
const destination = ref('北京')
const selectedDayIndex = ref(1) // 默认选择"3天"
const selectedTags = ref<number[]>([])
const selectedCompanion = ref<number>(1) // 默认选择"独行"
const loading = ref(false)
const recentRoutes = ref<any[]>([])

// 天数选项
const dayOptions = ref([
  { label: '2天', value: 2 },
  { label: '3天', value: 3 },
  { label: '4天', value: 4 },
  { label: '5天', value: 5 },
  { label: '6天', value: 6 },
  { label: '7天', value: 7 },
  { label: '2天1晚', value: 2 },
  { label: '3天2晚', value: 3 },
  { label: '5天4晚', value: 5 },
])

// 旅行偏好标签（从API获取）
const tagList = ref<Array<{ id: number; name: string; color: string }>>([])

// 标签颜色预设（循环使用）
const tagColors = [
  '#3ba272', // 绿色
  '#ff6b9d', // 粉色
  '#ff9800', // 橙色
  '#9c27b0', // 紫色
  '#2196f3', // 蓝色
  '#f44336', // 红色
  '#00bcd4', // 青色
  '#ffc107', // 黄色
]

// 同行人选项
const companionList = ref([
  { id: 1, name: '独行' },
  { id: 2, name: '情侣' },
  { id: 3, name: '家庭' },
  { id: 4, name: '朋友' },
  { id: 5, name: '亲子' },
])

const canSubmit = computed(() => {
  return destination.value.trim() !== '' && selectedTags.value.length > 0
})

// 目的地输入处理（支持自然语言解析，如"北京3日游"）
const onDestinationInput = (e: any) => {
  const input = e.detail.value
  destination.value = input

  // 尝试从输入中解析天数，如"北京3日游" -> 提取"3"
  const dayMatch = input.match(/(\d+)[日天]/)
  if (dayMatch) {
    const days = parseInt(dayMatch[1])
    const dayOption = dayOptions.value.find(opt => opt.value === days)
    if (dayOption) {
      selectedDayIndex.value = dayOptions.value.indexOf(dayOption)
    }
  }
}

// 天数选择变化
const onDayChange = (e: any) => {
  selectedDayIndex.value = e.detail.value
}

// 选择同行人
const selectCompanion = (companionId: number) => {
  selectedCompanion.value = companionId
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

// 从目的地文本中提取城市名称
const extractCityFromDestination = (dest: string): string => {
  // 移除天数相关文字，如"3日游"、"3天"等
  const cleaned = dest.replace(/\d+[日天]游?/g, '').trim()
  return cleaned || dest
}

// 根据城市名称查找城市ID
const findCityId = (cityName: string): number | null => {
  const city = cityList.value.find(c =>
    c.name.includes(cityName) || cityName.includes(c.name)
  )
  return city ? city.id : null
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
    // 从目的地中提取城市名称
    const cityName = extractCityFromDestination(destination.value)
    let cityId = findCityId(cityName)

    // 如果找不到城市，尝试使用第一个城市或提示用户
    if (!cityId && cityList.value.length > 0) {
      // 可以尝试模糊匹配或使用默认城市
      cityId = cityList.value[0].id
    }

    if (!cityId) {
      uni.showToast({
        title: '未找到对应城市，请检查目的地输入',
        icon: 'none',
        duration: 2000,
      })
      loading.value = false
      return
    }

    const selectedDays = dayOptions.value[selectedDayIndex.value]?.value || 3

    // 获取同行人名称
    const companion = companionList.value.find(c => c.id === selectedCompanion.value)
    const suitablePeople = companion ? companion.name : '独行'

    const res = await routeApi.generate({
      cityId: cityId,
      days: selectedDays,
      tagIds: selectedTags.value,
      suitablePeople: suitablePeople,
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

// 加载标签列表
const loadTags = async () => {
  try {
    const res = await tagApi.list()
    const response = res.data as ApiResponse<any[]>
    if (res.statusCode === 200 && response.code === 200) {
      const tags = response.data || []
      // 将标签数据转换为前端需要的格式，并分配颜色
      tagList.value = tags.map((tag: any, index: number) => ({
        id: tag.id,
        name: tag.tagName || tag.name,
        color: tagColors[index % tagColors.length], // 循环使用颜色
      }))
      console.log('标签列表加载成功:', tagList.value)
    }
  } catch (error) {
    console.error('加载标签列表失败', error)
    // 如果加载失败，使用空数组
    tagList.value = []
  }
}

onMounted(() => {
  loadCities()
  loadTags()
})
</script>

<style scoped>
.plan-page {
  min-height: 100vh;
  background-color: #f7f8fa;
  display: flex;
  flex-direction: column;
  position: relative;
}

.page-bg {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(180deg, #f0f8f5 0%, #f7f8fa 100%);
  z-index: 0;
}

.plan-scroll {
  flex: 1;
  position: relative;
  z-index: 1;
}

.plan-form {
  background-color: #ffffff;
  border-radius: 32rpx;
  padding: 48rpx 32rpx;
  margin: 32rpx 24rpx;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.06);
}

.form-header {
  margin-bottom: 48rpx;
  padding-bottom: 32rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.header-title {
  font-size: 38rpx;
  font-weight: 700;
  color: #333333;
  line-height: 1.4;
}

.form-item {
  margin-bottom: 48rpx;
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

.label-optional {
  font-weight: 400;
  color: #999999;
  font-size: 24rpx;
}

.form-hint {
  display: block;
  font-size: 22rpx;
  color: #999999;
  margin-top: 12rpx;
  line-height: 1.5;
  word-wrap: break-word;
  white-space: normal;
}

.destination-input {
  width: 100%;
  padding: 28rpx 24rpx;
  background-color: #f7f8fa;
  border-radius: 16rpx;
  font-size: 32rpx;
  font-weight: 600;
  color: #333333;
  border: 2rpx solid transparent;
  transition: all 0.2s;
  box-sizing: border-box;
  line-height: 1.5;
  min-height: 88rpx;
  display: block;
}

.destination-input:focus {
  background-color: #ffffff;
  border-color: #3ba272;
}

.picker-view {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 28rpx 24rpx;
  background-color: #f7f8fa;
  border-radius: 16rpx;
  color: #333333;
  font-size: 28rpx;
  border: 2rpx solid transparent;
  transition: all 0.2s;
}

.picker-view:active {
  background-color: #ffffff;
  border-color: #3ba272;
}

.picker-arrow {
  font-size: 32rpx;
  color: #cccccc;
  margin-left: 12rpx;
  font-weight: 300;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
  margin-top: 8rpx;
}

.tag-item {
  padding: 18rpx 32rpx;
  background-color: #f7f8fa;
  border-radius: 999rpx;
  font-size: 26rpx;
  color: #666666;
  border: 2rpx solid #e5e5e5;
  transition: all 0.2s;
  line-height: 1;
}

.tag-item.active {
  color: #ffffff;
  border-color: transparent;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.15);
  transform: translateY(-2rpx);
}

.companion-list {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
  margin-top: 8rpx;
}

.companion-item {
  padding: 18rpx 32rpx;
  background-color: #f7f8fa;
  border-radius: 999rpx;
  font-size: 26rpx;
  color: #666666;
  border: 2rpx solid #e5e5e5;
  transition: all 0.2s;
  line-height: 1;
}

.companion-item.active {
  background-color: #3ba272;
  color: #ffffff;
  border-color: #3ba272;
  box-shadow: 0 4rpx 12rpx rgba(59, 162, 114, 0.3);
  transform: translateY(-2rpx);
}

.submit-section {
  padding: 0 24rpx 32rpx;
}

.submit-btn {
  width: 100%;
  padding: 32rpx;
  background: linear-gradient(135deg, #3ba272 0%, #6fd3a5 100%);
  color: #ffffff;
  border-radius: 24rpx;
  font-size: 32rpx;
  font-weight: 600;
  box-shadow: 0 12rpx 32rpx rgba(59, 162, 114, 0.4);
  border: none;
  transition: all 0.3s;
}

.submit-btn:active:not(.disabled) {
  transform: translateY(2rpx);
  box-shadow: 0 8rpx 24rpx rgba(59, 162, 114, 0.3);
}

.submit-btn.disabled {
  background: #cccccc;
  box-shadow: none;
  opacity: 0.6;
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


