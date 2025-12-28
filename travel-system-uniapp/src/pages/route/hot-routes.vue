<template>
  <view class="hot-routes-page">
    <!-- 顶部标题栏 -->
    <view class="page-header">
      <view class="header-bg">
        <view class="header-gradient"></view>
      </view>
      <view class="header-content">
        <view class="header-title-row">
          <text class="page-title">热门路线</text>
          <text class="page-subtitle">大家都在走的爆款路线</text>
        </view>
      </view>
    </view>

    <!-- 路线列表 -->
    <scroll-view
      scroll-y
      class="routes-scroll"
      @scrolltolower="loadMore"
      refresher-enabled
      :refresher-triggered="refreshing"
      @refresherrefresh="onRefresh"
    >
      <!-- 加载骨架屏 -->
      <view v-if="loading && routeList.length === 0" class="skeleton-container">
        <view v-for="i in 6" :key="i" class="route-card-skeleton">
          <view class="skeleton-cover"></view>
          <view class="skeleton-content">
            <view class="skeleton-title"></view>
            <view class="skeleton-desc"></view>
            <view class="skeleton-meta"></view>
          </view>
        </view>
      </view>

      <!-- 路线列表 -->
      <view v-else class="routes-list">
        <view
          v-for="route in routeList"
          :key="route.id"
          class="route-card"
          @click="onViewRoute(route)"
        >
          <!-- 封面图片 -->
          <view class="route-cover-wrapper">
            <image
              class="route-cover"
              :src="route.coverImage || '/static/default-route.jpg'"
              mode="aspectFill"
            />
            <view class="route-overlay"></view>
            <!-- 热度标签 -->
            <view class="route-hot-badge" v-if="getHotIndex(route) <= 3">
              <text class="hot-icon">🔥</text>
              <text class="hot-text">TOP{{ getHotIndex(route) }}</text>
            </view>
            <!-- 天数标签 -->
            <view class="route-days-badge">
              <text class="days-text">{{ route.days }}天</text>
            </view>
          </view>

          <!-- 路线信息 -->
          <view class="route-info">
            <view class="route-header">
              <text class="route-name">{{ route.routeName }}</text>
            </view>
            <text class="route-summary" v-if="route.summary">
              {{ route.summary }}
            </text>
            <!-- 统计信息 -->
            <view class="route-stats">
              <view class="stat-item">
                <text class="stat-icon">👁️</text>
                <text class="stat-value">{{ formatCount(route.viewCount) }}</text>
              </view>
              <view class="stat-divider"></view>
              <view class="stat-item">
                <text class="stat-icon">❤️</text>
                <text class="stat-value">{{ formatCount(route.favoriteCount) }}</text>
              </view>
              <view class="stat-divider"></view>
              <view class="stat-item">
                <text class="stat-icon">📍</text>
                <text class="stat-value">{{ formatCount(route.useCount) }}</text>
              </view>
            </view>
          </view>
        </view>

        <!-- 空状态 -->
        <view v-if="!loading && routeList.length === 0" class="empty-state">
          <text class="empty-icon">🗺️</text>
          <text class="empty-text">暂无热门路线</text>
          <text class="empty-desc">稍后再来看看吧</text>
        </view>

        <!-- 加载更多 -->
        <view v-if="loading && routeList.length > 0" class="loading-more">
          <text class="loading-text">加载中...</text>
        </view>

        <!-- 没有更多 -->
        <view v-if="!hasMore && routeList.length > 0" class="no-more">
          <text class="no-more-text">没有更多了</text>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { onLoad, onPullDownRefresh } from '@dcloudio/uni-app'
import { recommendApi, type ApiResponse } from '@/api/content'
import { useUserStore } from '@/store/user'

const store = useUserStore()
const user = computed(() => store.state.profile)

// 路线数据类型
interface RouteItem {
  id: number
  routeName: string
  days: number
  coverImage?: string
  summary?: string
  viewCount?: number
  favoriteCount?: number
  useCount?: number
}

const routeList = ref<RouteItem[]>([])
const loading = ref(false)
const refreshing = ref(false)
const pageNum = ref(1)
const pageSize = ref(10)
const hasMore = ref(true)

// 格式化数字
const formatCount = (count?: number) => {
  if (!count) return '0'
  if (count >= 10000) {
    return (count / 10000).toFixed(1) + 'w'
  }
  return count.toString()
}

// 获取热度排名
const getHotIndex = (route: RouteItem) => {
  return routeList.value.findIndex(r => r.id === route.id) + 1
}

// 查看路线详情
const onViewRoute = (route: RouteItem) => {
  uni.navigateTo({ url: `/pages/route/detail?id=${route.id}` })
}

// 加载路线列表
const loadRoutes = async (reset = false) => {
  if (loading.value || (!hasMore.value && !reset)) return

  loading.value = true
  if (reset) {
    pageNum.value = 1
    hasMore.value = true
    routeList.value = []
  }

  try {
    const userId = user.value?.id
    const limit = pageSize.value * pageNum.value
    const res = await recommendApi.routes(userId, limit) as any
    const data = res.data as ApiResponse<RouteItem[]>

    if (res.statusCode === 200 && data.code === 200) {
      const newRoutes = data.data || []
      if (reset) {
        routeList.value = newRoutes
      } else {
        // 去重并追加
        const existingIds = new Set(routeList.value.map(r => r.id))
        const uniqueNewRoutes = newRoutes.filter(r => !existingIds.has(r.id))
        routeList.value = [...routeList.value, ...uniqueNewRoutes]
      }

      // 判断是否还有更多
      hasMore.value = newRoutes.length >= limit
      if (hasMore.value) {
        pageNum.value += 1
      }
    } else {
      uni.showToast({
        title: data.msg || '加载失败',
        icon: 'none',
      })
    }
  } catch (error: any) {
    console.error('加载路线失败:', error)
    uni.showToast({
      title: error?.message || '网络错误',
      icon: 'none',
    })
  } finally {
    loading.value = false
    refreshing.value = false
  }
}

// 下拉刷新
const onRefresh = () => {
  refreshing.value = true
  loadRoutes(true)
}

// 加载更多
const loadMore = () => {
  if (!loading.value && hasMore.value) {
    loadRoutes()
  }
}

onMounted(() => {
  loadRoutes(true)
})

onPullDownRefresh(async () => {
  await loadRoutes(true)
  uni.stopPullDownRefresh()
})
</script>

<style scoped>
.hot-routes-page {
  min-height: 100vh;
  background-color: #f7f8fa;
  display: flex;
  flex-direction: column;
}

/* 顶部标题栏 */
.page-header {
  position: relative;
  padding-top: var(--status-bar-height, 0);
  padding-bottom: 32rpx;
}

.header-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.header-gradient {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #3ba272 0%, #6fd3a5 100%);
}

.header-content {
  position: relative;
  padding: 24rpx 32rpx 0;
}

.header-title-row {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.page-title {
  font-size: 44rpx;
  font-weight: 700;
  color: #ffffff;
  line-height: 1.2;
}

.page-subtitle {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.4;
}

/* 滚动区域 */
.routes-scroll {
  flex: 1;
  padding: 24rpx 24rpx 0;
}

/* 骨架屏 */
.skeleton-container {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.route-card-skeleton {
  background-color: #ffffff;
  border-radius: 24rpx;
  overflow: hidden;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.06);
}

.skeleton-cover {
  width: 100%;
  height: 0;
  padding-bottom: 56.25%;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s ease-in-out infinite;
}

.skeleton-content {
  padding: 24rpx;
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.skeleton-title {
  height: 32rpx;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s ease-in-out infinite;
  border-radius: 8rpx;
}

.skeleton-desc {
  height: 24rpx;
  width: 80%;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s ease-in-out infinite;
  border-radius: 8rpx;
}

.skeleton-meta {
  height: 24rpx;
  width: 60%;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s ease-in-out infinite;
  border-radius: 8rpx;
}

@keyframes skeleton-loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

/* 路线列表 */
.routes-list {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
  padding-bottom: 32rpx;
}

.route-card {
  background-color: #ffffff;
  border-radius: 24rpx;
  overflow: hidden;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

.route-card:active {
  transform: scale(0.98);
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.12);
}

/* 封面区域 */
.route-cover-wrapper {
  position: relative;
  width: 100%;
  height: 0;
  padding-bottom: 56.25%; /* 16:9 */
  overflow: hidden;
  background-color: #e5e5e5;
}

.route-cover {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.route-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.3) 100%);
}

.route-hot-badge {
  position: absolute;
  top: 16rpx;
  left: 16rpx;
  display: flex;
  align-items: center;
  gap: 6rpx;
  padding: 8rpx 16rpx;
  background: linear-gradient(135deg, #ff6b6b, #ff8787);
  border-radius: 999rpx;
  box-shadow: 0 4rpx 12rpx rgba(255, 107, 107, 0.4);
}

.hot-icon {
  font-size: 24rpx;
  line-height: 1;
}

.hot-text {
  font-size: 22rpx;
  font-weight: 600;
  color: #ffffff;
  line-height: 1;
}

.route-days-badge {
  position: absolute;
  top: 16rpx;
  right: 16rpx;
  padding: 8rpx 16rpx;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 999rpx;
  backdrop-filter: blur(10rpx);
}

.days-text {
  font-size: 22rpx;
  font-weight: 600;
  color: #ffffff;
  line-height: 1;
}

/* 路线信息 */
.route-info {
  padding: 24rpx;
}

.route-header {
  margin-bottom: 12rpx;
}

.route-name {
  font-size: 32rpx;
  font-weight: 600;
  color: #333333;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.route-summary {
  font-size: 26rpx;
  color: #666666;
  line-height: 1.6;
  margin-bottom: 16rpx;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 统计信息 */
.route-stats {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding-top: 16rpx;
  border-top: 1rpx solid #f0f0f0;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 6rpx;
}

.stat-icon {
  font-size: 24rpx;
  line-height: 1;
}

.stat-value {
  font-size: 24rpx;
  color: #666666;
  line-height: 1;
}

.stat-divider {
  width: 1rpx;
  height: 24rpx;
  background-color: #e5e5e5;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx 32rpx;
  gap: 16rpx;
}

.empty-icon {
  font-size: 120rpx;
  line-height: 1;
  opacity: 0.5;
}

.empty-text {
  font-size: 32rpx;
  font-weight: 600;
  color: #999999;
}

.empty-desc {
  font-size: 26rpx;
  color: #cccccc;
}

/* 加载更多 */
.loading-more {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 32rpx;
}

.loading-text {
  font-size: 26rpx;
  color: #999999;
}

.no-more {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 32rpx;
}

.no-more-text {
  font-size: 24rpx;
  color: #cccccc;
}
</style>

