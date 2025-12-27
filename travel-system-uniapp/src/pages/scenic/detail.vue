<template>
  <view class="scenic-detail-page">
    <!-- 顶部图片轮播 -->
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
        <!-- 景点名称和基本信息 -->
        <view class="header-section">
          <view class="title-row">
            <text class="name">{{ detail.name }}</text>
            <view class="heritage-badge" v-if="detail.isWorldHeritage">
              <text class="heritage-text">世界文化遗产</text>
            </view>
          </view>
          <view class="location-row">
            <text class="location-icon">📍</text>
            <text class="location-text">{{ detail.province || '' }}{{ detail.province && detail.city ? '/' : '' }}{{ detail.city || '' }}</text>
          </view>

          <!-- 评分和热度 -->
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
              <text class="stat-label">价格</text>
              <text class="stat-value price-value" :class="{ 'price-free': !detail.price || Number(detail.price) === 0 }">
                {{ detail.price && Number(detail.price) > 0 ? `¥${Number(detail.price)}` : '免费' }}
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

          <view class="info-item" v-if="detail.openTime">
            <view class="info-label">
              <text class="info-icon">🕐</text>
              <text class="info-title">开放时间</text>
            </view>
            <text class="info-content">{{ detail.openTime }}</text>
          </view>

          <view class="info-item" v-if="detail.suggestedVisitTime">
            <view class="info-label">
              <text class="info-icon">⏱️</text>
              <text class="info-title">建议游览时长</text>
            </view>
            <text class="info-content">{{ detail.suggestedVisitTime }}</text>
          </view>

          <view class="info-item" v-if="detail.ticketInfo">
            <view class="info-label">
              <text class="info-icon">🎫</text>
              <text class="info-title">门票信息</text>
            </view>
            <text class="info-content">{{ detail.ticketInfo }}</text>
          </view>
        </view>

        <!-- 简介卡片 -->
        <view class="intro-card" v-if="detail.intro">
          <view class="card-title">
            <text class="title-icon">📖</text>
            <text class="title-text">景点简介</text>
          </view>
          <text class="intro-text">{{ detail.intro }}</text>
        </view>

        <!-- 标签 -->
        <view class="tags-card" v-if="detail.tags && detail.tags.length > 0">
          <view class="card-title">
            <text class="title-icon">🏷️</text>
            <text class="title-text">标签</text>
          </view>
          <view class="tags-list">
            <text
              v-for="tag in detail.tags"
              :key="tag"
              class="tag-item"
            >{{ tag }}</text>
          </view>
        </view>

        <!-- 附近美食 -->
        <view class="nearby-food-card" v-if="nearbyFoods.length > 0">
          <view class="card-title">
            <text class="title-icon">🍜</text>
            <text class="title-text">附近美食</text>
          </view>
          <view class="food-list">
            <view
              v-for="food in nearbyFoods"
              :key="food.id"
              class="food-item"
              @click="onViewFood(food.id)"
            >
              <image
                v-if="food.imageUrl"
                class="food-image"
                :src="food.imageUrl"
                mode="aspectFill"
              />
              <view v-else class="food-image-placeholder">
                <text class="food-icon">🍜</text>
              </view>
              <text class="food-name">{{ food.name }}</text>
              <text class="food-score" v-if="food.score">评分 {{ food.score }}</text>
            </view>
          </view>
        </view>
      </view>

      <view v-else class="loading">
        <text>未找到景点信息</text>
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
        <button class="action-btn route-btn" @click="addToRoute">
          <text class="btn-icon">+</text>
          <text class="btn-text">添加到路线</text>
        </button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { scenicSpotApi, foodApi } from '@/api/content'
import { getCache, setCache } from '@/utils/storage'
import { useUserStore } from '@/store/user'

const scenicId = ref<number | null>(null)
const loading = ref(false)
const detail = ref<any>(null)
const isFavorite = ref(false)
const nearbyFoods = ref<any[]>([])
const store = useUserStore()
const user = computed(() => store.state.profile)

// 收藏功能（使用本地存储）
const FAVORITE_KEY = 'scenic_favorites'

const loadFavoriteStatus = () => {
  if (!scenicId.value) return
  const favorites = getCache<number[]>(FAVORITE_KEY) || []
  isFavorite.value = favorites.includes(scenicId.value)
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

  if (!scenicId.value) return

  const favorites = getCache<number[]>(FAVORITE_KEY) || []
  const index = favorites.indexOf(scenicId.value)

  if (index > -1) {
    // 取消收藏
    favorites.splice(index, 1)
    isFavorite.value = false
    uni.showToast({ title: '已取消收藏', icon: 'success' })
  } else {
    // 收藏
    favorites.push(scenicId.value)
    isFavorite.value = true
    uni.showToast({ title: '收藏成功', icon: 'success' })
  }

  setCache(FAVORITE_KEY, favorites, 365 * 24 * 60) // 保存1年
}

const loadDetail = async () => {
  if (!scenicId.value) return
  loading.value = true
  try {
    const res = await scenicSpotApi.getDetail(scenicId.value)
    if (res.statusCode === 200 && res.data.code === 200) {
      // 后端返回的数据结构是 { spot: ScenicSpot, tags: List<String> }，需要合并
      const data = res.data.data
      if (data && data.spot) {
        detail.value = {
          ...data.spot,
          tags: data.tags || []
        }
      } else {
        detail.value = data
      }
      // 加载收藏状态
      loadFavoriteStatus()
      // 加载附近美食
      loadNearbyFoods()
    } else {
      uni.showToast({ title: res.data.msg || '加载失败', icon: 'none' })
    }
  } catch (e) {
    uni.showToast({ title: '网络错误', icon: 'none' })
  } finally {
    loading.value = false
  }
}

const loadNearbyFoods = async () => {
  if (!detail.value) return
  try {
    // 根据景点的城市ID获取附近美食
    const cityId = detail.value.cityId
    if (!cityId) return

    const res = await foodApi.getHot(cityId, 3)
    if (res.statusCode === 200 && res.data.code === 200) {
      nearbyFoods.value = res.data.data || []
    }
  } catch (e) {
    console.error('加载附近美食失败:', e)
  }
}

const onViewFood = (foodId: number) => {
  uni.navigateTo({
    url: `/pages/food/detail?id=${foodId}`
  })
}

const goCheckin = () => {
  if (!scenicId.value) return
  uni.switchTab({ url: '/pages/checkin/checkin' })
}

const addToRoute = () => {
  if (!scenicId.value || !detail.value) return

  // 跳转到路线规划页面，并传递景点信息
  uni.navigateTo({
    url: `/pages/route/plan?scenicId=${scenicId.value}&scenicName=${encodeURIComponent(detail.value.name || '')}`
  })
}

onMounted(() => {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1] as any
  const options = (currentPage.options || {}) as { id?: string }
  if (options.id) {
    scenicId.value = Number(options.id)
    loadDetail()
  }
})
</script>

<style scoped>
.scenic-detail-page {
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

.heritage-badge {
  padding: 8rpx 16rpx;
  background: linear-gradient(135deg, #ff9800, #ffb74d);
  border-radius: 20rpx;
}

.heritage-text {
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
  color: #3ba272;
}

.price-value.price-free {
  color: #ff6b6b;
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

/* 标签卡片 */
.tags-card {
  background-color: #ffffff;
  border-radius: 24rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.tag-item {
  padding: 12rpx 24rpx;
  background-color: #f0f7f4;
  color: #3ba272;
  border-radius: 20rpx;
  font-size: 24rpx;
  border: 1rpx solid #e8f6f0;
}

/* 附近美食卡片 */
.nearby-food-card {
  background-color: #ffffff;
  border-radius: 24rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
  overflow: visible;
}

.food-list {
  display: flex;
  gap: 10rpx;
  width: 100%;
  padding-bottom: 8rpx;
  box-sizing: border-box;
  overflow-x: auto;
  overflow-y: visible;
  -webkit-overflow-scrolling: touch;
}

.food-item {
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

.food-item:active {
  transform: scale(0.95);
}

.food-image {
  width: 100%;
  height: 150rpx;
  border-radius: 16rpx;
  background-color: #f5f5f5;
  margin-bottom: 12rpx;
}

.food-image-placeholder {
  width: 100%;
  height: 150rpx;
  border-radius: 16rpx;
  background: linear-gradient(135deg, #ffd89b 0%, #19547b 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12rpx;
}

.food-icon {
  font-size: 60rpx;
}

.food-name {
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

.food-score {
  font-size: 22rpx;
  color: #999999;
  text-align: center;
  width: 100%;
  word-break: break-all;
  word-wrap: break-word;
  line-height: 1.4;
  margin-top: 4rpx;
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

.btn-icon {
  font-size: 32rpx;
  font-weight: 700;
}

.btn-text {
  font-size: 28rpx;
}
</style>
