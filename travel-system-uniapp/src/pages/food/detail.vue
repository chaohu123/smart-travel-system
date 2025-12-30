<template>
  <view class="food-detail-page">
    <!-- 顶部图片 -->
    <view class="header-image" v-if="detail?.imageUrl">
      <image
        class="header-img"
        :src="detail.imageUrl"
        mode="aspectFill"
      />
      <view class="header-overlay"></view>
    </view>

    <scroll-view scroll-y class="scroll">
      <view v-if="loading" class="loading">
        <text>加载中...</text>
      </view>

      <view v-else-if="detail" class="content">
        <!-- 美食名称和基本信息 -->
        <view class="header-section">
          <view class="title-row">
            <text class="name">{{ detail.name }}</text>
            <view class="type-badge" v-if="detail.foodType">
              <text class="type-text">{{ detail.foodType }}</text>
            </view>
          </view>
          <view class="location-row">
            <text class="location-icon">📍</text>
            <text class="location-text">{{ detail.cityName || '未知城市' }}</text>
          </view>

          <!-- 评分、热度和人均 -->
          <view class="stats-row">
            <view class="stat-item">
              <text class="stat-label">评分</text>
              <text class="stat-value score-value">{{ detail.score ? (typeof detail.score === 'number' ? detail.score.toFixed(1) : Number(detail.score).toFixed(1)) : '--' }}</text>
            </view>
            <view class="stat-divider"></view>
            <view class="stat-item">
              <text class="stat-label">热度</text>
              <text class="stat-value hot-value">{{ detail.hotScore || 0 }}</text>
            </view>
            <view class="stat-divider"></view>
            <view class="stat-item">
              <text class="stat-label">人均</text>
              <text class="stat-value price-value">
                {{ detail.avgPrice ? `¥${detail.avgPrice}` : '--' }}
              </text>
            </view>
          </view>
        </view>

        <!-- 详细信息卡片 -->
        <view class="info-card">
          <view class="info-item" v-if="detail.address">
            <view class="info-label">
              <text class="info-icon">📍</text>
              <text class="info-title">地址</text>
            </view>
            <text class="info-content">{{ detail.address }}</text>
          </view>

          <view class="info-item" v-if="detail.foodType">
            <view class="info-label">
              <text class="info-icon">🍽️</text>
              <text class="info-title">美食类型</text>
            </view>
            <text class="info-content">{{ detail.foodType }}</text>
          </view>
        </view>

        <!-- 简介卡片 -->
        <view class="intro-card" v-if="detail.intro">
          <view class="card-title">
            <text class="title-icon">📖</text>
            <text class="title-text">美食简介</text>
          </view>
          <text class="intro-text">{{ detail.intro }}</text>
        </view>

        <!-- 附近景点 -->
        <view class="nearby-scenic-card" v-if="nearbyScenics.length > 0">
          <view class="card-title">
            <text class="title-icon">🏞️</text>
            <text class="title-text">附近景点</text>
          </view>
          <view class="scenic-list">
            <view
              v-for="scenic in nearbyScenics"
              :key="scenic.id"
              class="scenic-item"
              @click="onViewScenic(scenic.id)"
            >
              <image
                v-if="scenic.imageUrl"
                class="scenic-image"
                :src="scenic.imageUrl"
                mode="aspectFill"
              />
              <view v-else class="scenic-image-placeholder">
                <text class="scenic-icon">🏞️</text>
              </view>
              <text class="scenic-name">{{ scenic.name }}</text>
              <text class="scenic-score" v-if="scenic.score">评分 {{ scenic.score }}</text>
            </view>
          </view>
        </view>
      </view>

      <view v-else class="loading">
        <text>未找到美食信息</text>
      </view>
    </scroll-view>

    <!-- 底部操作栏 -->
    <view class="bottom-bar">
      <view class="favorite-btn" @click="toggleFavorite">
        <text
          class="iconfont icon-shoucang favorite-icon"
          :class="{ 'favorited': isFavorite }"
        ></text>
      </view>
      <view class="action-buttons">
        <button class="action-btn checkin-btn" @click="goCheckin">
          <text class="btn-icon">✓</text>
          <text class="btn-text">去打卡</text>
        </button>
        <button
          class="action-btn route-btn"
          :class="{ 'added': isInPendingList }"
          @click="addToRoute"
        >
          <text class="btn-icon">{{ isInPendingList ? '✓' : '+' }}</text>
          <text class="btn-text">{{ isInPendingList ? '已添加到路线' : '添加到路线' }}</text>
        </button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { foodApi, scenicSpotApi } from '@/api/content'
import { getCache, setCache, removeCache } from '@/utils/storage'
import { useUserStore } from '@/store/user'

const foodId = ref<number | null>(null)
const loading = ref(false)
const detail = ref<any>(null)
const nearbyScenics = ref<any[]>([])
const isFavorite = ref(false)
const isInPendingList = ref(false) // 是否在待选列表中
const store = useUserStore()
const user = computed(() => store.state.profile)

// 收藏功能（使用本地存储）
const FAVORITE_KEY = 'food_favorites'

const loadFavoriteStatus = () => {
  if (!foodId.value) return
  const favorites = getCache<number[]>(FAVORITE_KEY) || []
  isFavorite.value = favorites.includes(foodId.value)
}

// 检查是否在待选列表中
const checkPendingStatus = () => {
  if (!foodId.value) return
  const pendingAdditions = getCache<Array<{ type: 'scenic' | 'food', id: number, name: string }>>('route_pending_additions') || []
  isInPendingList.value = pendingAdditions.some(item => item.type === 'food' && item.id === foodId.value)
}

const loadDetail = async () => {
  if (!foodId.value) return
  loading.value = true
  try {
    const res = await foodApi.getDetail(foodId.value)
    if (res.statusCode === 200 && res.data.code === 200) {
      // 后端返回的数据结构是 { food: Food }，需要提取food对象
      const data = res.data.data
      if (data && data.food) {
        detail.value = data.food
      } else {
        // 兼容处理：如果直接返回food对象
        detail.value = data
      }
      console.log('美食详情数据:', detail.value)
      // 加载收藏状态
      loadFavoriteStatus()
      // 检查待选列表状态
      checkPendingStatus()
      // 加载附近景点
      loadNearbyScenics()
    } else {
      uni.showToast({ title: res.data.msg || '加载失败', icon: 'none' })
    }
  } catch (e) {
    console.error('加载美食详情失败:', e)
    uni.showToast({ title: '网络错误', icon: 'none' })
  } finally {
    loading.value = false
  }
}

const loadNearbyScenics = async () => {
  if (!detail.value) return
  try {
    // 根据美食的城市ID获取附近景点
    const cityId = detail.value.cityId
    if (!cityId) return

    const res = await scenicSpotApi.getHot(cityId, 3)
    if (res.statusCode === 200 && res.data.code === 200) {
      nearbyScenics.value = res.data.data || []
    }
  } catch (e) {
    console.error('加载附近景点失败:', e)
  }
}

const onViewScenic = (scenicId: number) => {
  uni.navigateTo({
    url: `/pages/scenic/detail?id=${scenicId}`
  })
}

const toggleFavorite = () => {
  // 检查用户是否登录
  if (!user.value) {
    uni.showToast({ title: '请先登录', icon: 'none' })
    setTimeout(() => {
      uni.switchTab({ url: '/pages/profile/profile' })
    }, 1500)
    return
  }

  if (!foodId.value) return

  const favorites = getCache<number[]>(FAVORITE_KEY) || []
  const index = favorites.indexOf(foodId.value)

  if (index > -1) {
    // 取消收藏
    favorites.splice(index, 1)
    isFavorite.value = false
    uni.showToast({ title: '已取消收藏', icon: 'success' })
  } else {
    // 收藏
    favorites.push(foodId.value)
    isFavorite.value = true
    uni.showToast({ title: '收藏成功', icon: 'success' })
  }

  setCache(FAVORITE_KEY, favorites, 365 * 24 * 60) // 保存1年
}

const goCheckin = () => {
  if (!foodId.value) return
  uni.switchTab({ url: '/pages/checkin/checkin' })
}

const addToRoute = () => {
  if (!foodId.value || !detail.value) return

  // 将美食添加到路线规划的待选列表中，用户可以在路线规划页面选择任意天数添加
  const pendingAdditions = getCache<Array<{ type: 'scenic' | 'food', id: number, name: string }>>('route_pending_additions') || []

  // 检查是否已存在
  const exists = pendingAdditions.some(item => item.type === 'food' && item.id === foodId.value)

  if (!exists) {
    // 添加到待选列表
    pendingAdditions.push({
      type: 'food',
      id: foodId.value,
      name: detail.value.name || '美食'
    })
    setCache('route_pending_additions', pendingAdditions, 60 * 24) // 保存24小时
    isInPendingList.value = true

    uni.showToast({
      title: '已添加到待选列表',
      icon: 'success',
      duration: 2000
    })
  } else {
    // 从待选列表中移除
    const filtered = pendingAdditions.filter(item => !(item.type === 'food' && item.id === foodId.value))
    if (filtered.length > 0) {
      setCache('route_pending_additions', filtered, 60 * 24)
    } else {
      removeCache('route_pending_additions')
    }
    isInPendingList.value = false

    uni.showToast({
      title: '已从待选列表移除',
      icon: 'success',
      duration: 2000
    })
  }
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

// 页面显示时检查待选列表状态（处理从路线规划页返回的情况）
onShow(() => {
  checkPendingStatus()
})
</script>

<style scoped>
.food-detail-page {
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
  padding: 0 24rpx 200rpx;
}

/* 头部信息区域 */
.header-section {
  background-color: #ffffff;
  border-radius: 24rpx;
  padding: 32rpx;
  margin-top: 24rpx;
  position: relative;
  z-index: 10;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.08);
  margin-bottom: 24rpx;
}

.title-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 16rpx;
}

.name {
  font-size: 40rpx;
  font-weight: 700;
  color: #333333;
  flex: 1;
  line-height: 1.4;
}

.type-badge {
  padding: 8rpx 16rpx;
  background: linear-gradient(135deg, #ff9800, #ffb74d);
  border-radius: 20rpx;
  flex-shrink: 0;
}

.type-text {
  font-size: 22rpx;
  color: #ffffff;
  font-weight: 600;
}

.location-row {
  display: flex;
  align-items: center;
  gap: 8rpx;
  margin-bottom: 24rpx;
}

.location-icon {
  font-size: 24rpx;
}

.location-text {
  font-size: 26rpx;
  color: #666666;
}

.stats-row {
  display: flex;
  align-items: center;
  padding: 24rpx 0;
  border-top: 1rpx solid #f0f0f0;
  border-bottom: 1rpx solid #f0f0f0;
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
}

.score-value {
  color: #3ba272;
}

.hot-value {
  color: #ff6b6b;
}

.price-value {
  color: #ff9800;
}

.stat-divider {
  width: 1rpx;
  height: 40rpx;
  background-color: #e5e5e5;
}

/* 信息卡片 */
.info-card {
  background-color: #ffffff;
  border-radius: 24rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
}

.info-item {
  margin-bottom: 32rpx;
}

.info-item:last-child {
  margin-bottom: 0;
}

.info-label {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 12rpx;
}

.info-icon {
  font-size: 28rpx;
}

.info-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #333333;
}

.info-content {
  font-size: 26rpx;
  color: #666666;
  line-height: 1.6;
  display: block;
  padding-left: 40rpx;
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

.loading {
  padding: 80rpx 32rpx;
  text-align: center;
  color: #999999;
  font-size: 28rpx;
}

/* 附近景点卡片 */
.nearby-scenic-card {
  background-color: #ffffff;
  border-radius: 24rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
  overflow: visible;
}

.scenic-list {
  display: flex;
  gap: 10rpx;
  width: 100%;
  padding-bottom: 8rpx;
  box-sizing: border-box;
  overflow-x: auto;
  overflow-y: visible;
  -webkit-overflow-scrolling: touch;
}

.scenic-item {
  flex: 1;
  min-width: 200rpx;
  max-width: 240rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  transition: transform 0.2s;
  box-sizing: border-box;
  flex-shrink: 0;
}

.scenic-item:active {
  transform: scale(0.95);
}

.scenic-image {
  width: 100%;
  height: 150rpx;
  border-radius: 16rpx;
  background-color: #f5f5f5;
  margin-bottom: 12rpx;
}

.scenic-image-placeholder {
  width: 100%;
  height: 150rpx;
  border-radius: 16rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12rpx;
}

.scenic-icon {
  font-size: 60rpx;
}

.scenic-name {
  font-size: 26rpx;
  font-weight: 600;
  color: #333333;
  text-align: center;
  margin-bottom: 8rpx;
  width: 100%;
  word-break: break-all;
  word-wrap: break-word;
  line-height: 1.5;
  display: block;
  overflow: visible;
}

.scenic-score {
  font-size: 22rpx;
  color: #999999;
  text-align: center;
  width: 100%;
  word-break: break-all;
  word-wrap: break-word;
  line-height: 1.4;
  margin-top: 4rpx;
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
  color: #999999;
  transition: color 0.3s;
}

.favorite-icon.favorited {
  color: #ffd700;
}

.action-buttons {
  flex: 1;
  display: flex;
  gap: 16rpx;
}

.action-btn {
  flex: 1;
  padding: 28rpx;
  border-radius: 24rpx;
  font-size: 28rpx;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  border: none;
}

.checkin-btn {
  background: linear-gradient(135deg, #3ba272, #6fd3a5);
  color: #ffffff;
  box-shadow: 0 8rpx 24rpx rgba(59, 162, 114, 0.3);
}

.route-btn {
  background: linear-gradient(135deg, #409eff, #66b1ff);
  color: #ffffff;
  box-shadow: 0 8rpx 24rpx rgba(64, 158, 255, 0.3);
}

.route-btn.added {
  background: linear-gradient(135deg, #3ba272, #6fd3a5);
  box-shadow: 0 8rpx 24rpx rgba(59, 162, 114, 0.3);
}

.btn-icon {
  font-size: 32rpx;
  font-weight: 700;
}

.btn-text {
  font-size: 28rpx;
}
</style>

