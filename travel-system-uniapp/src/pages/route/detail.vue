<template>
  <view class="route-detail-page">
    <!-- 顶部封面图 -->
    <view class="header-image" v-if="routeDetail?.route?.coverImage">
      <image
        class="header-img"
        :src="routeDetail.route.coverImage"
        mode="aspectFill"
      />
      <view class="header-overlay"></view>
    </view>

    <scroll-view scroll-y class="scroll">
      <view v-if="loading" class="loading">
        <text>加载中...</text>
      </view>

      <view v-else-if="routeDetail" class="content">
        <!-- 路线基本信息 -->
        <view class="header-section">
          <view class="title-row">
            <text class="name">{{ routeDetail.route?.routeName || '未命名路线' }}</text>
          </view>

          <view class="meta-row">
            <view class="meta-item">
              <text class="meta-icon">📅</text>
              <text class="meta-text">{{ routeDetail.route?.days || 0 }}天</text>
            </view>
            <view class="meta-item" v-if="routeDetail.route?.suitablePeople">
              <text class="meta-icon">👥</text>
              <text class="meta-text">{{ routeDetail.route.suitablePeople }}</text>
            </view>
            <view class="meta-item">
              <text class="meta-icon">👁️</text>
              <text class="meta-text">{{ routeDetail.route?.viewCount || 0 }}次浏览</text>
            </view>
          </view>

          <!-- 统计信息 -->
          <view class="stats-row">
            <view class="stat-item">
              <text class="stat-label">收藏</text>
              <text class="stat-value">{{ routeDetail.route?.favoriteCount || 0 }}</text>
            </view>
            <view class="stat-divider"></view>
            <view class="stat-item">
              <text class="stat-label">使用</text>
              <text class="stat-value">{{ routeDetail.route?.useCount || 0 }}</text>
            </view>
          </view>
        </view>

        <!-- 路线简介 -->
        <view class="intro-card" v-if="routeDetail.route?.summary">
          <view class="card-title">
            <text class="title-icon">📖</text>
            <text class="title-text">路线简介</text>
          </view>
          <text class="intro-text">{{ routeDetail.route.summary }}</text>
        </view>

        <!-- 行程安排 -->
        <view class="days-section" v-if="routeDetail.days && routeDetail.days.length > 0">
          <view class="section-header">
            <text class="section-title">行程安排</text>
            <text class="section-subtitle">{{ routeDetail.days.length }}天行程</text>
          </view>

          <view
            v-for="(dayData, dayIndex) in routeDetail.days"
            :key="dayIndex"
            class="day-card"
          >
            <view class="day-header">
              <view class="day-number">
                <text class="day-number-text">第{{ dayIndex + 1 }}天</text>
              </view>
              <view class="day-info" v-if="dayData.day">
                <text class="day-date" v-if="dayData.day.date">{{ formatDate(dayData.day.date) }}</text>
                <text class="day-summary" v-if="dayData.day.summary">{{ dayData.day.summary }}</text>
              </view>
            </view>

            <!-- 当天的POI列表 -->
            <view class="poi-list" v-if="dayData.pois && dayData.pois.length > 0">
              <view
                v-for="(poiData, poiIndex) in dayData.pois"
                :key="poiIndex"
                class="poi-item"
                @click="viewPoiDetail(poiData)"
              >
                <view class="poi-order">
                  <text class="poi-order-text">{{ poiIndex + 1 }}</text>
                </view>
                <view class="poi-content">
                  <view class="poi-header">
                    <text class="poi-type-badge" :class="getPoiTypeClass(poiData.poi?.poiType)">
                      {{ getPoiTypeName(poiData.poi?.poiType) }}
                    </text>
                    <text class="poi-name">{{ getPoiName(poiData) }}</text>
                  </view>
                  <view class="poi-info" v-if="poiData.detail">
                    <text class="poi-address" v-if="getPoiAddress(poiData)">
                      📍 {{ getPoiAddress(poiData) }}
                    </text>
                    <text class="poi-score" v-if="getPoiScore(poiData)">
                      评分：{{ getPoiScore(poiData) }}
                    </text>
                  </view>
                  <text class="poi-time" v-if="poiData.poi?.visitTime">
                    ⏱️ 建议游览：{{ poiData.poi.visitTime }}
                  </text>
                </view>
                <view class="poi-arrow">
                  <text>›</text>
                </view>
              </view>
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
      <view class="favorite-btn" @click="toggleFavorite">
        <text
          class="favorite-icon"
          :class="{ 'favorited': isFavorite }"
        >{{ isFavorite ? '❤️' : '🤍' }}</text>
      </view>
      <button class="action-btn use-btn" @click="useRoute">
        <text class="btn-text">使用此路线</text>
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
const store = useUserStore()
const user = computed(() => store.state.profile)

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
  try {
    const res = await routeApi.getDetail(routeId.value)
    const data = res.data as ApiResponse<RouteDetail>
    if (res.statusCode === 200 && data.code === 200) {
      routeDetail.value = data.data
      // 加载收藏状态
      loadFavoriteStatus()
    } else {
      uni.showToast({
        title: data.msg || '加载失败',
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

/* 顶部图片 */
.header-image {
  width: 100%;
  height: 400rpx;
  position: relative;
  overflow: hidden;
}

.header-img {
  width: 100%;
  height: 100%;
}

.header-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 80rpx;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.2), transparent);
}

.scroll {
  flex: 1;
}

.content {
  padding: 0 24rpx 160rpx;
}

/* 头部信息区域 */
.header-section {
  background-color: #ffffff;
  border-radius: 24rpx;
  padding: 32rpx;
  margin-top: 24rpx;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.08);
  margin-bottom: 24rpx;
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

.favorite-btn {
  width: 88rpx;
  height: 88rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f5f5;
  border-radius: 44rpx;
  flex-shrink: 0;
  transition: all 0.3s;
}

.favorite-btn:active {
  transform: scale(0.95);
  background-color: #eeeeee;
}

.favorite-icon {
  font-size: 44rpx;
  transition: transform 0.3s;
}

.favorite-icon.favorited {
  transform: scale(1.1);
}

.action-btn {
  flex: 1;
  padding: 28rpx;
  border-radius: 24rpx;
  font-size: 28rpx;
  font-weight: 600;
  border: none;
}

.use-btn {
  background: linear-gradient(135deg, #3ba272, #6fd3a5);
  color: #ffffff;
  box-shadow: 0 8rpx 24rpx rgba(59, 162, 114, 0.3);
}

.btn-text {
  font-size: 28rpx;
}
</style>
