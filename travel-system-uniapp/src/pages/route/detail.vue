<template>
  <view class="route-detail-page">
    <!-- 顶部导航栏 -->
    <view class="nav-bar">
      <view class="nav-back" @click="goBack">
        <text class="back-icon">‹</text>
      </view>
      <text class="nav-title">{{ routeTitle }}</text>
      <view class="nav-actions">
        <view class="nav-favorite" @click="toggleFavorite">
          <text class="favorite-icon" :class="{ 'favorited': isFavorite }">
            {{ isFavorite ? '❤️' : '🤍' }}
          </text>
        </view>
      </view>
    </view>

    <scroll-view scroll-y="true" class="scroll">
      <view v-if="loading" class="loading">
        <text>加载中...</text>
      </view>

      <view v-else-if="routeDetail" class="content">
        <!-- 行程摘要卡片 -->
        <view class="summary-card">
          <text class="summary-title">{{ routeDetail.route?.routeName || '未命名路线' }}</text>
          <view class="summary-rating-row">
            <text class="rating-text">★4.8</text>
            <view class="summary-tag">
              <text>适合首次到访</text>
            </view>
          </view>
          <view class="summary-features">
            <view class="feature-item" v-for="(feature, idx) in summaryFeatures" :key="idx">
              <text class="feature-icon">✓</text>
              <text class="feature-text">{{ feature }}</text>
            </view>
          </view>
        </view>

        <!-- 天数选择标签 -->
        <view class="day-tabs" v-if="routeDetail.days && routeDetail.days.length > 0">
          <view
            v-for="(day, index) in routeDetail.days"
            :key="index"
            class="day-tab"
            :class="{ active: selectedDayIndex === index }"
            @click="selectDay(index)"
          >
            <text>Day {{ index + 1 }}</text>
          </view>
        </view>

        <!-- 每日详情 -->
        <view
          v-if="selectedDayData"
          class="day-detail-card"
        >
          <view class="day-detail-header">
            <text class="day-detail-icon">🏛️</text>
            <view class="day-detail-info">
              <text class="day-detail-title">Day {{ selectedDayIndex + 1 }}: {{ getDayTitle(selectedDayData) }}</text>
              <text class="day-detail-theme" v-if="selectedDayData.day?.intro">
                今日主题: {{ selectedDayData.day.intro }}
              </text>
              <view class="day-detail-meta">
                <view class="intensity-rating">
                  <text class="intensity-label">强度</text>
                  <text class="intensity-stars">★★★★★</text>
                </view>
                <text class="day-duration">总时长: {{ getDayDuration(selectedDayData) }}h</text>
              </view>
            </view>
          </view>
          <view class="progress-bars">
            <view class="progress-item">
              <text class="progress-label">景点</text>
              <view class="progress-bar">
                <view class="progress-fill" style="width: 90%"></view>
              </view>
            </view>
            <view class="progress-item">
              <text class="progress-label">美食</text>
              <view class="progress-bar">
                <view class="progress-fill" style="width: 70%"></view>
              </view>
            </view>
            <view class="progress-item">
              <text class="progress-label">体验</text>
              <view class="progress-bar">
                <view class="progress-fill" style="width: 85%"></view>
              </view>
            </view>
          </view>
        </view>

        <!-- 活动列表 -->
        <view class="activities-section" v-if="selectedDayData && selectedDayData.pois">
          <view
            v-for="(poiData, poiIndex) in selectedDayData.pois"
            :key="poiIndex"
            class="activity-card"
            :class="getPoiTypeClass(poiData.poi?.poiType)"
            @click="viewPoiDetail(poiData)"
          >
            <view class="activity-header">
              <text class="activity-name">{{ getPoiName(poiData) }}</text>
              <text class="activity-rating" v-if="getPoiScore(poiData)">★{{ getPoiScore(poiData) }}</text>
            </view>
            <view class="activity-info-row">
              <text class="activity-price" v-if="getPoiPrice(poiData)">
                {{ getPoiPrice(poiData) }}
              </text>
              <text class="activity-location" v-if="getPoiAddress(poiData)">
                {{ getPoiAddress(poiData) }}
              </text>
            </view>
            <view class="activity-tips" v-if="getPoiTips(poiData)">
              <text class="tips-label">必看:</text>
              <text class="tips-text">{{ getPoiTips(poiData) }}</text>
            </view>
            <view class="activity-suggestion" v-if="getPoiSuggestion(poiData)">
              <text class="suggestion-label">建议:</text>
              <text class="suggestion-text">{{ getPoiSuggestion(poiData) }}</text>
            </view>
            <view class="activity-actions">
              <button class="action-btn-small" @click.stop="checkPoi(poiData)">查看详情</button>
              <button class="action-btn-small" @click.stop="navigatePoi(poiData)">导航</button>
            </view>
          </view>
        </view>
      </view>

      <view v-else class="loading">
        <text>未找到路线信息</text>
      </view>
    </scroll-view>

    <!-- 底部操作栏 -->
    <view class="bottom-bar">
      <button class="bottom-btn edit-btn" @click="editRoute">编辑行程</button>
      <button class="bottom-btn save-btn" @click="saveRoute">保存行程</button>
      <button class="bottom-btn generate-btn" @click="regenerateRoute">
        <text class="generate-icon">✓</text>
        <text>智能规划生成</text>
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { routeApi } from '@/api/route'
import { useUserStore } from '@/store/user'

// API 响应类型定义
interface ApiResponse<T = any> {
  code: number
  msg?: string
  data: T
}

interface RouteDetail {
  route: {
    id: number
    routeName: string
    cityId: number
    days: number
    suitablePeople?: string
    summary?: string
    coverImage?: string
    viewCount?: number
    favoriteCount?: number
    useCount?: number
  }
  days: Array<{
    day: {
      id: number
      date?: string
      summary?: string
    }
    pois: Array<{
      poi: {
        id: number
        poiType: string
        poiId: number
        visitTime?: string
        order: number
      }
      detail?: any
    }>
  }>
}

const routeId = ref<number | null>(null)
const loading = ref(false)
const routeDetail = ref<RouteDetail | null>(null)
const isFavorite = ref(false)
const selectedDayIndex = ref(0)
const store = useUserStore()
const user = computed(() => store.state.profile)

// 计算属性
const routeTitle = computed(() => {
  if (!routeDetail.value?.route) return '智能规划结果'
  const routeName = routeDetail.value.route.routeName
  const days = routeDetail.value.route.days
  return `${routeName}·${days}日游`
})

const selectedDayData = computed(() => {
  if (!routeDetail.value?.days || routeDetail.value.days.length === 0) return null
  return routeDetail.value.days[selectedDayIndex.value] || null
})

const summaryFeatures = computed(() => {
  const features: string[] = []
  if (routeDetail.value?.route) {
    const route = routeDetail.value.route
    if (route.days) {
      features.push(`覆盖${route.days}天经典行程`)
    }
    features.push('每日步行<1.5万步,节奏舒适')
    features.push('穿插当地美食体验')
    features.push('预算:人均约800元(不含住宿)')
  }
  return features
})

// 格式化日期
const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  try {
    const date = new Date(dateStr)
    const month = date.getMonth() + 1
    const day = date.getDate()
    return `${month}月${day}日`
  } catch (e) {
    return dateStr
  }
}

// 获取POI类型名称
const getPoiTypeName = (type: string) => {
  if (type === 'scenic') return '景点'
  if (type === 'food') return '美食'
  return '地点'
}

// 获取POI类型样式类
const getPoiTypeClass = (type: string) => {
  if (type === 'scenic') return 'poi-type-scenic'
  if (type === 'food') return 'poi-type-food'
  return ''
}

// 获取POI名称
const getPoiName = (poiData: any) => {
  if (poiData.detail?.name) return poiData.detail.name
  return '未知地点'
}

// 获取POI地址
const getPoiAddress = (poiData: any) => {
  if (poiData.detail?.address) return poiData.detail.address
  return ''
}

// 获取POI评分
const getPoiScore = (poiData: any) => {
  if (poiData.detail?.score) {
    const score = typeof poiData.detail.score === 'number'
      ? poiData.detail.score
      : Number(poiData.detail.score)
    return score.toFixed(1)
  }
  return null
}

// 获取POI价格
const getPoiPrice = (poiData: any) => {
  if (poiData.detail?.price) {
    const price = typeof poiData.detail.price === 'number'
      ? poiData.detail.price
      : Number(poiData.detail.price)
    if (price === 0) return '免费'
    return `¥${price}`
  }
  if (poiData.detail?.avgPrice) {
    return `人均¥${poiData.detail.avgPrice}`
  }
  return null
}

// 获取POI提示
const getPoiTips = (poiData: any) => {
  if (poiData.detail?.intro) {
    return poiData.detail.intro.substring(0, 50) + '...'
  }
  return null
}

// 获取POI建议
const getPoiSuggestion = (poiData: any) => {
  if (poiData.detail?.suggestion) {
    return poiData.detail.suggestion
  }
  return null
}

// 获取天数标题
const getDayTitle = (dayData: any) => {
  if (dayData.day?.title) {
    return dayData.day.title
  }
  return '经典之旅'
}

// 获取天数时长
const getDayDuration = (dayData: any) => {
  if (dayData.pois && dayData.pois.length > 0) {
    let totalMinutes = 0
    dayData.pois.forEach((poi: any) => {
      if (poi.poi?.stayTime) {
        totalMinutes += poi.poi.stayTime
      }
    })
    return Math.ceil(totalMinutes / 60)
  }
  return 8
}

// 选择天数
const selectDay = (index: number) => {
  selectedDayIndex.value = index
}

// 返回
const goBack = () => {
  uni.navigateBack()
}

// 查看POI
const checkPoi = (poiData: any) => {
  viewPoiDetail(poiData)
}

// 导航到POI
const navigatePoi = (poiData: any) => {
  if (poiData.detail?.address) {
    uni.openLocation({
      address: poiData.detail.address,
      success: () => {
        console.log('打开地图成功')
      }
    })
  }
}

// 编辑行程
const editRoute = () => {
  uni.showToast({
    title: '编辑功能开发中',
    icon: 'none'
  })
}

// 保存行程
const saveRoute = () => {
  uni.showToast({
    title: '保存成功',
    icon: 'success'
  })
}

// 重新生成路线
const regenerateRoute = () => {
  uni.showToast({
    title: '重新生成功能开发中',
    icon: 'none'
  })
}

// 查看POI详情
const viewPoiDetail = (poiData: any) => {
  if (!poiData.poi || !poiData.detail) return

  const poiType = poiData.poi.poiType
  const poiId = poiData.poi.poiId

  if (poiType === 'scenic') {
    uni.navigateTo({
      url: `/pages/scenic/detail?id=${poiId}`
    })
  } else if (poiType === 'food') {
    uni.navigateTo({
      url: `/pages/food/detail?id=${poiId}`
    })
  }
}

// 加载路线详情
const loadDetail = async () => {
  if (!routeId.value) return
  loading.value = true

  console.log('========== 开始加载路线详情 ==========')
  console.log('路线ID:', routeId.value)

  try {
    const res = await routeApi.getDetail(routeId.value)
    console.log('API响应状态码:', res.statusCode)
    console.log('API响应数据:', JSON.stringify(res.data, null, 2))

    const data = res.data as ApiResponse<RouteDetail>
    if (res.statusCode === 200 && data.code === 200) {
      routeDetail.value = data.data
      console.log('路线详情加载成功')
      console.log('路线基本信息:', JSON.stringify(data.data.route, null, 2))
      console.log('天数数据:', data.data.days?.length || 0, '天')
      if (data.data.days && data.data.days.length > 0) {
        data.data.days.forEach((day, index) => {
          console.log(`第${index + 1}天数据:`, JSON.stringify(day, null, 2))
        })
      }

      // 加载收藏状态
      loadFavoriteStatus()
      console.log('========== 路线详情加载完成 ==========')
    } else {
      console.error('API返回错误:', data.msg || '未知错误')
      uni.showToast({
        title: data.msg || '加载失败',
        icon: 'none',
      })
    }
  } catch (error: any) {
    console.error('========== 加载路线详情失败 ==========')
    console.error('错误信息:', error.message)
    console.error('错误堆栈:', error.stack)
    uni.showToast({
      title: '网络错误',
      icon: 'none',
    })
  } finally {
    loading.value = false
  }
}

// 加载收藏状态
const loadFavoriteStatus = async () => {
  if (!routeId.value || !user.value) return
  try {
    // 这里可以调用API获取收藏状态，暂时使用本地存储
    // const res = await routeApi.getFavoriteStatus(user.value.id, routeId.value)
    // isFavorite.value = res.data.data?.isFavorite || false
  } catch (e) {
    console.error('加载收藏状态失败:', e)
  }
}

// 切换收藏
const toggleFavorite = async () => {
  if (!user.value) {
    uni.showToast({ title: '请先登录', icon: 'none' })
    setTimeout(() => {
      uni.switchTab({ url: '/pages/profile/profile' })
    }, 1500)
    return
  }

  if (!routeId.value) return

  try {
    const res = await routeApi.toggleFavorite(user.value.id, routeId.value)
    const data = res.data as ApiResponse<{ isFavorite: boolean }>
    if (res.statusCode === 200 && data.code === 200) {
      isFavorite.value = data.data?.isFavorite ?? !isFavorite.value
      uni.showToast({
        title: isFavorite.value ? '收藏成功' : '已取消收藏',
        icon: 'success',
      })
      // 重新加载详情以更新收藏数
      if (routeDetail.value?.route) {
        routeDetail.value.route.favoriteCount =
          (routeDetail.value.route.favoriteCount || 0) + (isFavorite.value ? 1 : -1)
      }
    } else {
      uni.showToast({
        title: data.msg || '操作失败',
        icon: 'none',
      })
    }
  } catch (error) {
    uni.showToast({
      title: '网络错误',
      icon: 'none',
    })
  }
}

// 使用路线
const useRoute = () => {
  if (!routeId.value) return
  // 跳转到路线规划页面，可以预填充路线信息
  uni.navigateTo({
    url: `/pages/route/plan?routeId=${routeId.value}`
  })
}

onMounted(() => {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1] as any
  const options = (currentPage.options || {}) as { id?: string }
  if (options.id) {
    routeId.value = Number(options.id)
    loadDetail()
  }
})
</script>

<style scoped>
.route-detail-page {
  min-height: 100vh;
  background-color: #f7f8fa;
  display: flex;
  flex-direction: column;
}

/* 顶部导航栏 */
.nav-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 88rpx;
  padding-top: var(--status-bar-height, 0);
  background-color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24rpx;
  z-index: 1000;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
}

.nav-back {
  width: 64rpx;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.back-icon {
  font-size: 48rpx;
  color: #333333;
  font-weight: 300;
}

.nav-title {
  flex: 1;
  text-align: center;
  font-size: 32rpx;
  font-weight: 600;
  color: #333333;
}

.nav-actions {
  width: 64rpx;
  display: flex;
  justify-content: flex-end;
}

.nav-favorite {
  width: 48rpx;
  height: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.favorite-icon {
  font-size: 36rpx;
}

.favorite-icon.favorited {
  animation: scale 0.3s;
}

@keyframes scale {
  0% { transform: scale(1); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
}

.scroll {
  flex: 1;
  margin-top: 88rpx;
}

.content {
  padding: 24rpx;
  padding-bottom: 160rpx;
}

/* 行程摘要卡片 */
.summary-card {
  background-color: #ffffff;
  border-radius: 24rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
}

.summary-title {
  font-size: 36rpx;
  font-weight: 700;
  color: #333333;
  margin-bottom: 20rpx;
  display: block;
}

.summary-rating-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 24rpx;
}

.rating-text {
  font-size: 28rpx;
  color: #ff9800;
  font-weight: 600;
}

.summary-tag {
  padding: 8rpx 16rpx;
  background-color: #3ba272;
  border-radius: 999rpx;
}

.summary-tag text {
  font-size: 22rpx;
  color: #ffffff;
}

.summary-features {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.feature-item {
  display: flex;
  align-items: flex-start;
  gap: 12rpx;
}

.feature-icon {
  color: #3ba272;
  font-size: 28rpx;
  font-weight: 600;
  flex-shrink: 0;
  margin-top: 2rpx;
}

.feature-text {
  font-size: 26rpx;
  color: #666666;
  line-height: 1.6;
  flex: 1;
}

/* 天数选择标签 */
.day-tabs {
  display: flex;
  gap: 16rpx;
  margin-bottom: 24rpx;
  padding: 0 4rpx;
}

.day-tab {
  flex: 1;
  padding: 20rpx;
  background-color: #f7f8fa;
  border-radius: 16rpx;
  text-align: center;
  font-size: 28rpx;
  color: #666666;
  transition: all 0.2s;
}

.day-tab.active {
  background-color: #3ba272;
  color: #ffffff;
  font-weight: 600;
}

/* 每日详情卡片 */
.day-detail-card {
  background-color: #ffffff;
  border-radius: 24rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
}

.day-detail-header {
  display: flex;
  gap: 20rpx;
  margin-bottom: 24rpx;
}

.day-detail-icon {
  font-size: 48rpx;
  flex-shrink: 0;
}

.day-detail-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.day-detail-title {
  font-size: 32rpx;
  font-weight: 700;
  color: #333333;
}

.day-detail-theme {
  font-size: 26rpx;
  color: #666666;
  line-height: 1.5;
}

.day-detail-meta {
  display: flex;
  align-items: center;
  gap: 24rpx;
}

.intensity-rating {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.intensity-label {
  font-size: 24rpx;
  color: #999999;
}

.intensity-stars {
  font-size: 24rpx;
  color: #ff9800;
}

.day-duration {
  font-size: 24rpx;
  color: #666666;
}

.progress-bars {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.progress-item {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.progress-label {
  width: 80rpx;
  font-size: 24rpx;
  color: #666666;
  flex-shrink: 0;
}

.progress-bar {
  flex: 1;
  height: 8rpx;
  background-color: #f0f0f0;
  border-radius: 4rpx;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #3ba272, #6fd3a5);
  border-radius: 4rpx;
  transition: width 0.3s;
}

/* 活动卡片 */
.activities-section {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
  margin-bottom: 24rpx;
}

.activity-card {
  background-color: #ffffff;
  border-radius: 20rpx;
  padding: 28rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.06);
}

.activity-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16rpx;
}

.activity-name {
  font-size: 30rpx;
  font-weight: 600;
  color: #333333;
  flex: 1;
}

.activity-rating {
  font-size: 26rpx;
  color: #ff9800;
  font-weight: 600;
}

.activity-info-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 12rpx;
}

.activity-price {
  font-size: 26rpx;
  color: #3ba272;
  font-weight: 600;
}

.activity-location {
  font-size: 24rpx;
  color: #999999;
}

.activity-tips,
.activity-suggestion {
  display: flex;
  gap: 8rpx;
  margin-bottom: 12rpx;
}

.tips-label,
.suggestion-label {
  font-size: 24rpx;
  color: #666666;
  flex-shrink: 0;
}

.tips-text,
.suggestion-text {
  font-size: 24rpx;
  color: #666666;
  line-height: 1.5;
  flex: 1;
}

.activity-actions {
  display: flex;
  gap: 16rpx;
  margin-top: 16rpx;
}

.action-btn-small {
  flex: 1;
  padding: 16rpx;
  background-color: #f7f8fa;
  border-radius: 12rpx;
  font-size: 24rpx;
  color: #333333;
  border: none;
  text-align: center;
}

.action-btn-small:active {
  background-color: #eeeeee;
}

.title-row {
  margin-bottom: 24rpx;
}

.name {
  font-size: 40rpx;
  font-weight: 700;
  color: #333333;
  line-height: 1.4;
}

.meta-row {
  display: flex;
  align-items: center;
  gap: 24rpx;
  margin-bottom: 24rpx;
  flex-wrap: wrap;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.meta-icon {
  font-size: 24rpx;
}

.meta-text {
  font-size: 26rpx;
  color: #666666;
}

.stats-row {
  display: flex;
  align-items: center;
  padding: 24rpx 0;
  border-top: 1rpx solid #f0f0f0;
}

.stat-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
}

.stat-label {
  font-size: 24rpx;
  color: #999999;
}

.stat-value {
  font-size: 32rpx;
  font-weight: 600;
  color: #3ba272;
}

.stat-divider {
  width: 1rpx;
  height: 40rpx;
  background-color: #e5e5e5;
}

/* 简介卡片 */
.intro-card {
  background-color: #ffffff;
  border-radius: 24rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
}

.card-title {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 20rpx;
}

.title-icon {
  font-size: 28rpx;
}

.title-text {
  font-size: 30rpx;
  font-weight: 600;
  color: #333333;
}

.intro-text {
  font-size: 28rpx;
  color: #666666;
  line-height: 1.8;
  text-align: justify;
}

/* 行程安排 */
.days-section {
  margin-bottom: 24rpx;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24rpx;
  padding: 0 8rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: 700;
  color: #333333;
}

.section-subtitle {
  font-size: 24rpx;
  color: #999999;
}

.day-card {
  background-color: #ffffff;
  border-radius: 24rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
}

.day-header {
  display: flex;
  align-items: flex-start;
  gap: 24rpx;
  margin-bottom: 24rpx;
  padding-bottom: 24rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.day-number {
  flex-shrink: 0;
  width: 80rpx;
  height: 80rpx;
  background: linear-gradient(135deg, #3ba272, #6fd3a5);
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.day-number-text {
  font-size: 24rpx;
  font-weight: 600;
  color: #ffffff;
}

.day-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.day-date {
  font-size: 28rpx;
  font-weight: 600;
  color: #333333;
}

.day-summary {
  font-size: 26rpx;
  color: #666666;
  line-height: 1.5;
}

.poi-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.poi-item {
  display: flex;
  align-items: flex-start;
  gap: 16rpx;
  padding: 20rpx;
  background-color: #f7f8fa;
  border-radius: 16rpx;
  transition: all 0.2s;
}

.poi-item:active {
  background-color: #eeeeee;
}

.poi-order {
  flex-shrink: 0;
  width: 48rpx;
  height: 48rpx;
  background-color: #3ba272;
  border-radius: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.poi-order-text {
  font-size: 24rpx;
  font-weight: 600;
  color: #ffffff;
}

.poi-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.poi-header {
  display: flex;
  align-items: center;
  gap: 12rpx;
  flex-wrap: wrap;
}

.poi-type-badge {
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
  font-size: 22rpx;
  font-weight: 600;
}

.poi-type-scenic {
  background-color: #e3f2fd;
  color: #1976d2;
}

.poi-type-food {
  background-color: #fff3e0;
  color: #f57c00;
}

.poi-name {
  font-size: 28rpx;
  font-weight: 600;
  color: #333333;
  flex: 1;
}

.poi-info {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.poi-address {
  font-size: 24rpx;
  color: #666666;
}

.poi-score {
  font-size: 24rpx;
  color: #3ba272;
}

.poi-time {
  font-size: 24rpx;
  color: #999999;
}

.poi-arrow {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  font-size: 32rpx;
  color: #cccccc;
}

.loading {
  padding: 80rpx 32rpx;
  text-align: center;
  color: #999999;
  font-size: 28rpx;
}

/* 底部操作栏 */
.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 16rpx 24rpx;
  padding-bottom: calc(16rpx + env(safe-area-inset-bottom));
  background-color: #ffffff;
  border-top: 1rpx solid #eeeeee;
  box-shadow: 0 -4rpx 16rpx rgba(0, 0, 0, 0.06);
  z-index: 100;
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.bottom-btn {
  padding: 20rpx 24rpx;
  border-radius: 16rpx;
  font-size: 26rpx;
  font-weight: 600;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
}

.edit-btn {
  flex: 1;
  background-color: #f7f8fa;
  color: #333333;
}

.save-btn {
  flex: 1;
  background-color: #f7f8fa;
  color: #333333;
}

.generate-btn {
  flex: 2;
  background: linear-gradient(135deg, #3ba272, #6fd3a5);
  color: #ffffff;
  box-shadow: 0 8rpx 24rpx rgba(59, 162, 114, 0.3);
}

.generate-icon {
  font-size: 28rpx;
  font-weight: 600;
}

.loading {
  padding: 80rpx 32rpx;
  text-align: center;
  color: #999999;
  font-size: 28rpx;
}
</style>
