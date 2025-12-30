<template>
  <view class="interest-page">
    <!-- 顶部标题栏 -->
    <view class="page-header">
      <view class="header-bg">
        <view class="header-gradient"></view>
      </view>
      <view class="header-content">
        <view class="header-title-row">
          <text class="page-title">兴趣推荐</text>
          <text class="page-subtitle">根据你的兴趣智能推荐</text>
        </view>
      </view>
    </view>

    <!-- 标签选择区 -->
    <view class="tags-section">
      <view class="section-title">
        <text class="title-text">选择你的兴趣</text>
        <text class="title-desc">多选标签，精准推荐</text>
      </view>
      <scroll-view scroll-x class="tags-scroll" show-scrollbar="false">
        <view class="tags-list">
          <view
            v-for="tag in tagList"
            :key="tag.id"
            class="tag-item"
            :class="{ 'tag-item--active': selectedTags.includes(tag.id) }"
            @click="toggleTag(tag.id)"
          >
            <text class="tag-icon">{{ getTagIcon(tag.name) }}</text>
            <text class="tag-name">{{ tag.name }}</text>
          </view>
        </view>
      </scroll-view>
    </view>

    <!-- 推荐内容区 -->
    <scroll-view
      scroll-y
      class="content-scroll"
      @scrolltolower="loadMore"
      refresher-enabled
      :refresher-triggered="refreshing"
      @refresherrefresh="onRefresh"
    >
      <!-- 内容类型切换 -->
      <view class="content-tabs">
        <view
          v-for="tab in contentTabs"
          :key="tab.type"
          class="tab-item"
          :class="{ 'tab-item--active': activeTab === tab.type }"
          @click="switchTab(tab.type)"
        >
          <text class="tab-icon">{{ tab.icon }}</text>
          <text class="tab-text">{{ tab.label }}</text>
        </view>
      </view>

      <!-- 加载骨架屏 -->
      <view v-if="loading && contentList.length === 0" class="skeleton-container">
        <view v-for="i in 4" :key="i" class="content-card-skeleton">
          <view class="skeleton-cover"></view>
          <view class="skeleton-content">
            <view class="skeleton-title"></view>
            <view class="skeleton-desc"></view>
          </view>
        </view>
      </view>

      <!-- 内容列表 -->
      <view v-else class="content-list">
        <!-- 路线卡片 -->
        <template v-if="activeTab === 'route'">
          <view
            v-for="item in contentList"
            :key="item.id"
            class="content-card route-card"
            @click="onViewRoute(item)"
          >
            <view class="card-cover-wrapper">
              <image
                class="card-cover"
                :src="item.coverImage || '/static/default-route.jpg'"
                mode="aspectFill"
              />
              <view class="card-badge">{{ item.days }}天</view>
            </view>
            <view class="card-info">
              <text class="card-title">{{ item.routeName }}</text>
              <text class="card-desc" v-if="item.summary">{{ item.summary }}</text>
              <view class="card-stats">
                <text class="stat-text">👁️ {{ formatCount(item.viewCount) }}</text>
                <text class="stat-text">❤️ {{ formatCount(item.favoriteCount) }}</text>
              </view>
            </view>
          </view>
        </template>

        <!-- 景点卡片 -->
        <template v-if="activeTab === 'scenic'">
          <view
            v-for="item in contentList"
            :key="item.id"
            class="content-card scenic-card"
            @click="onViewScenic(item)"
          >
            <view class="card-cover-wrapper">
              <image
                class="card-cover"
                :src="item.imageUrl || '/static/default-scenic.jpg'"
                mode="aspectFill"
              />
              <view class="card-score" v-if="item.score">
                ⭐ {{ item.score }}
              </view>
            </view>
            <view class="card-info">
              <text class="card-title">{{ item.name }}</text>
              <text class="card-address" v-if="item.address">{{ item.address }}</text>
              <view class="card-tags" v-if="item.tags && item.tags.length > 0">
                <text
                  v-for="tag in item.tags.slice(0, 3)"
                  :key="tag"
                  class="card-tag"
                >{{ tag }}</text>
              </view>
            </view>
          </view>
        </template>

        <!-- 美食卡片 -->
        <template v-if="activeTab === 'food'">
          <view
            v-for="item in contentList"
            :key="item.id"
            class="content-card food-card"
            @click="onViewFood(item)"
          >
            <view class="card-cover-wrapper">
              <image
                class="card-cover"
                :src="item.imageUrl || '/static/default-food.jpg'"
                mode="aspectFill"
              />
              <view class="card-price" v-if="item.avgPrice">
                ¥{{ item.avgPrice }}/人
              </view>
            </view>
            <view class="card-info">
              <text class="card-title">{{ item.name }}</text>
              <text class="card-address" v-if="item.address">{{ item.address }}</text>
              <view class="card-meta">
                <text class="card-score" v-if="item.score">⭐ {{ item.score }}</text>
                <text class="card-type" v-if="item.foodType">{{ item.foodType }}</text>
              </view>
            </view>
          </view>
        </template>

        <!-- 游记卡片 -->
        <template v-if="activeTab === 'note'">
          <view
            v-for="item in contentList"
            :key="item.id"
            class="content-card note-card"
            @click="onViewNote(item)"
          >
            <view class="card-cover-wrapper">
              <image
                class="card-cover"
                :src="item.coverImage || '/static/default-note.jpg'"
                mode="aspectFill"
              />
            </view>
            <view class="card-info">
              <text class="card-title">{{ item.title }}</text>
              <view class="card-author" v-if="item.authorName">
                <image
                  class="author-avatar"
                  :src="item.authorAvatar || '/static/default-avatar.png'"
                  mode="aspectFill"
                />
                <text class="author-name">{{ item.authorName }}</text>
              </view>
              <view class="card-stats">
                <text class="stat-text">👁️ {{ formatCount(item.viewCount) }}</text>
                <text class="stat-text">❤️ {{ formatCount(item.likeCount) }}</text>
                <text class="stat-text">💬 {{ formatCount(item.commentCount) }}</text>
              </view>
            </view>
          </view>
        </template>

        <!-- 空状态 -->
        <view v-if="!loading && contentList.length === 0" class="empty-state">
          <text class="empty-icon">🔍</text>
          <text class="empty-text">
            {{ selectedTags.length === 0 ? '请选择兴趣标签' : '暂无推荐内容' }}
          </text>
          <text class="empty-desc">
            {{ selectedTags.length === 0 ? '选择标签后为你推荐相关内容' : '换个标签试试吧' }}
          </text>
        </view>

        <!-- 加载更多 -->
        <view v-if="loading && contentList.length > 0" class="loading-more">
          <text class="loading-text">加载中...</text>
        </view>

        <!-- 没有更多 -->
        <view v-if="!hasMore && contentList.length > 0" class="no-more">
          <text class="no-more-text">没有更多了</text>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { onLoad, onPullDownRefresh } from '@dcloudio/uni-app'
import { recommendApi, tagApi, scenicSpotApi, foodApi, travelNoteApi, type ApiResponse } from '@/api/content'
import { request } from '@/utils/http'
import { useUserStore } from '@/store/user'

const store = useUserStore()
const user = computed(() => store.state.profile)

// 标签类型
interface Tag {
  id: number
  name: string
}

// 内容类型
type ContentType = 'route' | 'scenic' | 'food' | 'note'

// 内容项类型
interface ContentItem {
  id: number
  [key: string]: any
}

const tagList = ref<Tag[]>([])
const selectedTags = ref<number[]>([])
const activeTab = ref<ContentType>('route')
const contentList = ref<ContentItem[]>([])
const loading = ref(false)
const refreshing = ref(false)
const pageNum = ref(1)
const pageSize = ref(10)
const hasMore = ref(true)

// 内容类型标签
const contentTabs = [
  { type: 'route' as ContentType, label: '路线', icon: '🗺️' },
  { type: 'scenic' as ContentType, label: '景点', icon: '🏞️' },
  { type: 'food' as ContentType, label: '美食', icon: '🍜' },
  { type: 'note' as ContentType, label: '游记', icon: '📝' },
]

// 获取标签图标
const getTagIcon = (tagName: string) => {
  const iconMap: Record<string, string> = {
    '美食': '🍜',
    '历史': '🏛️',
    '亲子': '👨‍👩‍👧',
    '自然': '🌲',
    '文化': '📚',
    '休闲': '☕',
    '探险': '⛰️',
    '摄影': '📷',
    '购物': '🛍️',
    '夜生活': '🌃',
    '宗教': '🕌',
    '建筑': '🏗️',
    '艺术': '🎨',
    '运动': '⚽',
    '温泉': '♨️',
  }
  return iconMap[tagName] || '🏷️'
}

// 切换标签
const toggleTag = (tagId: number) => {
  const index = selectedTags.value.indexOf(tagId)
  if (index > -1) {
    selectedTags.value.splice(index, 1)
  } else {
    selectedTags.value.push(tagId)
  }
  // 标签变化时重新加载内容
  loadContent(true)
}

// 切换内容类型
const switchTab = (type: ContentType) => {
  if (activeTab.value === type) return
  activeTab.value = type
  loadContent(true)
}

// 格式化数字
const formatCount = (count?: number) => {
  if (!count) return '0'
  if (count >= 10000) {
    return (count / 10000).toFixed(1) + 'w'
  }
  return count.toString()
}

// 加载标签列表
const loadTags = async () => {
  try {
    const res = await tagApi.list() as any
    const data = res.data as ApiResponse<Tag[]>
    if (res.statusCode === 200 && data.code === 200) {
      tagList.value = data.data || []
    }
  } catch (error) {
    console.error('加载标签失败:', error)
  }
}

// 加载推荐内容
const loadContent = async (reset = false) => {
  if (loading.value || (!hasMore.value && !reset)) return

  // 如果没有选择标签，不加载内容
  if (selectedTags.value.length === 0) {
    if (reset) {
      contentList.value = []
    }
    return
  }

  loading.value = true
  if (reset) {
    pageNum.value = 1
    hasMore.value = true
    contentList.value = []
  }

  try {
    const userId = user.value?.id
    const tagNames = tagList.value
      .filter(tag => selectedTags.value.includes(tag.id))
      .map(tag => tag.name)
      .join(',')

    let res: any
    const limit = pageSize.value * pageNum.value

    switch (activeTab.value) {
      case 'route':
        // 路线推荐（暂时使用通用推荐，后续可以支持标签筛选）
        res = await recommendApi.routes(userId, limit)
        break
      case 'scenic':
        // 景点推荐（支持标签筛选）
        res = await request({
          url: '/scenic/list',
          method: 'GET',
          data: {
            pageNum: pageNum.value,
            pageSize: pageSize.value,
            tagName: tagNames || undefined,
          },
          showLoading: false,
        })
        break
      case 'food':
        // 美食推荐（支持标签筛选）
        res = await request({
          url: '/food/list',
          method: 'GET',
          data: {
            pageNum: pageNum.value,
            pageSize: pageSize.value,
            tagName: tagNames || undefined,
          },
          showLoading: false,
        })
        break
      case 'note':
        // 游记推荐（支持标签筛选）
        res = await travelNoteApi.list({
          pageNum: pageNum.value,
          pageSize: pageSize.value,
          tagName: tagNames || undefined,
        })
        break
    }

    const data = res.data as ApiResponse<any>
    if (res.statusCode === 200 && data.code === 200) {
      let newItems: ContentItem[] = []

      if (activeTab.value === 'route') {
        newItems = data.data || []
      } else {
        // 列表接口返回的是分页数据
        const listData = data.data
        if (listData?.rows) {
          newItems = listData.rows
        } else if (listData?.list) {
          newItems = listData.list
        } else if (Array.isArray(listData)) {
          newItems = listData
        }
      }

      if (reset) {
        contentList.value = newItems
      } else {
        const existingIds = new Set(contentList.value.map(item => item.id))
        const uniqueNewItems = newItems.filter(item => !existingIds.has(item.id))
        contentList.value = [...contentList.value, ...uniqueNewItems]
      }

      // 判断是否还有更多
      if (activeTab.value === 'route') {
        hasMore.value = newItems.length >= limit
      } else {
        const listData = data.data
        const total = listData?.total || 0
        hasMore.value = contentList.value.length < total
      }

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
    console.error('加载内容失败:', error)
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
  loadContent(true)
}

// 加载更多
const loadMore = () => {
  if (!loading.value && hasMore.value) {
    loadContent()
  }
}

// 查看详情
const onViewRoute = (item: ContentItem) => {
  uni.navigateTo({ url: `/pages/itinerary/itinerary-detail?id=${item.id}` })
}

const onViewScenic = (item: ContentItem) => {
  uni.navigateTo({ url: `/pages/scenic/detail?id=${item.id}` })
}

const onViewFood = (item: ContentItem) => {
  uni.navigateTo({ url: `/pages/food/detail?id=${item.id}` })
}

const onViewNote = (item: ContentItem) => {
  uni.navigateTo({ url: `/pages/travel-note/detail?id=${item.id}` })
}

// 监听标签变化
watch(selectedTags, () => {
  loadContent(true)
}, { deep: true })

onMounted(() => {
  loadTags()
  // 默认加载第一个标签的内容（如果有标签）
  // loadContent(true)
})
</script>

<style scoped>
.interest-page {
  min-height: 100vh;
  background-color: #f7f8fa;
  display: flex;
  flex-direction: column;
}

/* 顶部标题栏 */
.page-header {
  position: relative;
  padding-top: var(--status-bar-height, 0);
  padding-bottom: 24rpx;
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

/* 标签选择区 */
.tags-section {
  background-color: #ffffff;
  padding: 24rpx 0;
  margin-bottom: 16rpx;
}

.section-title {
  padding: 0 32rpx 16rpx;
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.title-text {
  font-size: 32rpx;
  font-weight: 600;
  color: #333333;
}

.title-desc {
  font-size: 24rpx;
  color: #999999;
}

.tags-scroll {
  white-space: nowrap;
  width: 100%;
}

.tags-list {
  display: flex;
  flex-direction: row;
  gap: 16rpx;
  padding: 0 32rpx;
}

.tag-item {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
  padding: 20rpx 24rpx;
  background-color: #f7f8fa;
  border-radius: 20rpx;
  border: 2rpx solid transparent;
  transition: all 0.3s ease;
  min-width: 120rpx;
}

.tag-item--active {
  background: linear-gradient(135deg, #e8f6f0, #d4f0e4);
  border-color: #3ba272;
  box-shadow: 0 4rpx 12rpx rgba(59, 162, 114, 0.2);
}

.tag-icon {
  font-size: 48rpx;
  line-height: 1;
}

.tag-name {
  font-size: 24rpx;
  color: #333333;
  font-weight: 500;
}

.tag-item--active .tag-name {
  color: #3ba272;
  font-weight: 600;
}

/* 内容区域 */
.content-scroll {
  flex: 1;
  padding: 0 24rpx 24rpx;
}

/* 内容类型切换 */
.content-tabs {
  display: flex;
  gap: 16rpx;
  margin-bottom: 24rpx;
  background-color: #ffffff;
  padding: 16rpx;
  border-radius: 20rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.04);
}

.tab-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
  padding: 16rpx;
  border-radius: 16rpx;
  background-color: #f7f8fa;
  transition: all 0.3s ease;
}

.tab-item--active {
  background: linear-gradient(135deg, #3ba272, #6fd3a5);
  box-shadow: 0 4rpx 12rpx rgba(59, 162, 114, 0.3);
}

.tab-icon {
  font-size: 36rpx;
  line-height: 1;
}

.tab-text {
  font-size: 24rpx;
  color: #666666;
  font-weight: 500;
}

.tab-item--active .tab-text {
  color: #ffffff;
  font-weight: 600;
}

/* 骨架屏 */
.skeleton-container {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.content-card-skeleton {
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

@keyframes skeleton-loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

/* 内容列表 */
.content-list {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
  padding-bottom: 32rpx;
}

.content-card {
  background-color: #ffffff;
  border-radius: 24rpx;
  overflow: hidden;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

.content-card:active {
  transform: scale(0.98);
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.12);
}

.card-cover-wrapper {
  position: relative;
  width: 100%;
  height: 0;
  padding-bottom: 56.25%;
  overflow: hidden;
  background-color: #e5e5e5;
}

.card-cover {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.card-badge {
  position: absolute;
  top: 16rpx;
  right: 16rpx;
  padding: 8rpx 16rpx;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 999rpx;
  backdrop-filter: blur(10rpx);
  font-size: 22rpx;
  font-weight: 600;
  color: #ffffff;
}

.card-score {
  position: absolute;
  bottom: 16rpx;
  right: 16rpx;
  padding: 8rpx 16rpx;
  background: rgba(255, 152, 0, 0.9);
  border-radius: 999rpx;
  backdrop-filter: blur(10rpx);
  font-size: 22rpx;
  font-weight: 600;
  color: #ffffff;
}

.card-price {
  position: absolute;
  bottom: 16rpx;
  right: 16rpx;
  padding: 8rpx 16rpx;
  background: rgba(59, 162, 114, 0.9);
  border-radius: 999rpx;
  backdrop-filter: blur(10rpx);
  font-size: 22rpx;
  font-weight: 600;
  color: #ffffff;
}

.card-info {
  padding: 24rpx;
}

.card-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333333;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin-bottom: 12rpx;
}

.card-desc {
  font-size: 26rpx;
  color: #666666;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin-bottom: 16rpx;
}

.card-address {
  font-size: 24rpx;
  color: #999999;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin-bottom: 12rpx;
}

.card-stats {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding-top: 16rpx;
  border-top: 1rpx solid #f0f0f0;
}

.stat-text {
  font-size: 24rpx;
  color: #666666;
}

.card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8rpx;
  margin-top: 12rpx;
}

.card-tag {
  padding: 6rpx 12rpx;
  background-color: #f0f0f0;
  border-radius: 12rpx;
  font-size: 22rpx;
  color: #666666;
}

.card-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 12rpx;
}

.card-type {
  font-size: 24rpx;
  color: #3ba272;
  font-weight: 500;
}

.card-author {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 12rpx;
}

.author-avatar {
  width: 48rpx;
  height: 48rpx;
  border-radius: 999rpx;
  background-color: #e5e5e5;
}

.author-name {
  font-size: 24rpx;
  color: #666666;
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

