<template>
  <view class="favorites-content">
    <!-- 分类选择 -->
    <view class="category-tabs">
      <view
        v-for="category in categories"
        :key="category.key"
        class="category-tab"
        :class="{ active: currentCategory === category.key }"
        @click="switchCategory(category.key)"
      >
        <text class="category-text">{{ category.label }}</text>
      </view>
    </view>

    <!-- 内容列表 -->
    <scroll-view
      scroll-y
      class="scroll-view"
      @scrolltolower="loadMore"
      :refresher-enabled="true"
      :refresher-triggered="refreshing"
      @refresherrefresh="onRefresh"
    >
      <!-- 骨架屏 -->
      <view v-if="loading && list.length === 0" class="content-list">
        <view v-for="i in 6" :key="i" class="skeleton-card">
          <view class="skeleton-cover"></view>
          <view class="skeleton-content">
            <view class="skeleton-line"></view>
            <view class="skeleton-line short"></view>
          </view>
        </view>
      </view>

      <!-- 空状态 -->
      <view v-else-if="!loading && list.length === 0" class="empty-state">
        <text class="empty-icon">⭐</text>
        <text class="empty-text">还没有收藏任何{{ getCategoryLabel() }}</text>
        <text class="empty-tip">去发现精彩内容吧~</text>
      </view>

      <!-- 游记列表 -->
      <view v-if="!loading && currentCategory === 'note' && list.length > 0" class="content-list note-list">
        <view
          v-for="item in list"
          :key="item.id"
          class="note-card"
          @click="viewNoteDetail(item.id)"
        >
          <view class="note-cover-wrapper">
            <image
              v-if="item.coverImage"
              class="note-cover"
              :src="getImageUrl(item.coverImage)"
              mode="aspectFill"
              :lazy-load="true"
            />
            <view v-if="getNoteTag(item)" class="note-tag">
              {{ getNoteTag(item) }}
            </view>
          </view>

          <view class="note-info">
            <view class="note-meta-row">
              <image
                class="note-author-avatar"
                :src="item.authorAvatar || defaultAvatar"
                mode="aspectFill"
              />
              <text class="note-author-name">{{ item.authorName || '匿名用户' }}</text>
              <text class="note-publish-time">{{ formatTime(item.createTime) }}</text>
            </view>

            <view class="note-title-row">
              <text class="note-title">{{ item.title }}</text>
            </view>

            <view class="note-location-row">
              <text class="note-location">{{ item.cityName || '未知地点' }}</text>
            </view>

            <view class="note-actions-row">
              <view class="note-action-item">
                <text class="iconfont note-action-icon" :class="['icon-icon', { 'icon-liked': item.isLiked }]"></text>
                <text class="note-action-count" :class="{ 'text-active': item.isLiked }">
                  {{ item.likeCount || 0 }}
                </text>
              </view>
              <view class="note-action-item">
                <text class="iconfont icon-pinglun note-action-icon"></text>
                <text class="note-action-count">{{ item.commentCount || 0 }}</text>
              </view>
              <view class="note-action-item">
                <text class="iconfont note-action-icon icon-shoucang icon-favorited"></text>
                <text class="note-action-count text-active">{{ item.favoriteCount || 0 }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 景点列表 -->
      <view v-if="!loading && currentCategory === 'scenic' && list.length > 0" class="content-list scenic-list">
        <view
          v-for="item in list"
          :key="item.id"
          class="scenic-card"
          @click="viewScenicDetail(item.id)"
        >
          <image
            v-if="item.imageUrl"
            class="scenic-image"
            :src="getImageUrl(item.imageUrl)"
            mode="aspectFill"
          />
          <view class="scenic-info">
            <text class="scenic-name">{{ item.name }}</text>
            <text class="scenic-address">{{ item.address || '未知地址' }}</text>
            <view v-if="item.intro" class="scenic-intro">
              <text class="scenic-intro-text">{{ item.intro }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 美食列表 -->
      <view v-if="!loading && currentCategory === 'food' && list.length > 0" class="content-list food-list">
        <view
          v-for="item in list"
          :key="item.id"
          class="food-card"
          @click="viewFoodDetail(item.id)"
        >
          <image
            v-if="item.imageUrl"
            class="food-image"
            :src="getImageUrl(item.imageUrl)"
            mode="aspectFill"
          />
          <view class="food-info">
            <text class="food-name">{{ item.name }}</text>
            <text class="food-address">{{ item.address || '未知地址' }}</text>
            <view v-if="item.foodType" class="food-type">
              <text class="food-type-text">{{ item.foodType }}</text>
            </view>
            <view v-if="item.intro" class="food-intro">
              <text class="food-intro-text">{{ item.intro }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 加载更多提示 -->
      <view v-if="hasMore && !loading" class="load-more">
        <text class="load-more-text">上拉加载更多</text>
      </view>
      <view v-if="!hasMore && list.length > 0" class="load-more">
        <text class="load-more-text">没有更多了</text>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { travelNoteApi, scenicSpotApi, foodApi } from '@/api/content'
import { useUserStore } from '@/store/user'
import { safeNavigateTo } from '@/utils/router'

const store = useUserStore()
const user = computed(() => store.state.profile)
const defaultAvatar = 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=200'

const categories = [
  { key: 'note', label: '游记' },
  { key: 'scenic', label: '景点' },
  { key: 'food', label: '美食' },
  // 注意：打卡路线可能需要单独的接口，暂时先保留游记、景点、美食
]

const currentCategory = ref('note')
const list = ref<any[]>([])
const loading = ref(false)
const refreshing = ref(false)
const pageNum = ref(1)
const pageSize = ref(10)
const hasMore = ref(true)

// 切换分类
const switchCategory = (key: string) => {
  currentCategory.value = key
  pageNum.value = 1
  hasMore.value = true
  list.value = []
  loadData(true)
}

// 获取分类标签
const getCategoryLabel = () => {
  const category = categories.find(c => c.key === currentCategory.value)
  return category?.label || '内容'
}

// 加载数据
const loadData = async (reset = false) => {
  if (!user.value?.id) {
    uni.showToast({ title: '请先登录', icon: 'none' })
    return
  }

  if (reset) {
    pageNum.value = 1
    hasMore.value = true
  }

  if (loading.value || !hasMore.value) {
    return
  }

  loading.value = true

  try {
    let res: any

    if (currentCategory.value === 'note') {
      res = await travelNoteApi.listMyFavorites(user.value.id, pageNum.value, pageSize.value)
    } else if (currentCategory.value === 'scenic') {
      res = await scenicSpotApi.getMyFavorites(user.value.id, pageNum.value, pageSize.value)
    } else if (currentCategory.value === 'food') {
      res = await foodApi.getMyFavorites(user.value.id, pageNum.value, pageSize.value)
    }

    if (res && res.statusCode === 200 && res.data.code === 200) {
      const data = res.data.data || {}
      const dataList = data.list || []
      
      if (reset) {
        list.value = dataList
      } else {
        // 使用循环替代扩展运算符，避免 Babel runtime 错误
        for (let i = 0; i < dataList.length; i++) {
          list.value.push(dataList[i])
        }
      }

      hasMore.value = dataList.length >= pageSize.value
      if (hasMore.value) {
        pageNum.value++
      }

      // 立即重置 loading 状态，确保数据能显示
      loading.value = false
      refreshing.value = false
      
      // 等待 DOM 更新
      await nextTick()
    } else {
      uni.showToast({ title: res?.data?.msg || '加载失败', icon: 'none' })
      loading.value = false
      refreshing.value = false
    }
  } catch (e: any) {
    uni.showToast({ title: '加载失败: ' + (e?.message || '未知错误'), icon: 'none', duration: 3000 })
    loading.value = false
    refreshing.value = false
  }
}

// 下拉刷新
const onRefresh = () => {
  refreshing.value = true
  loadData(true)
}

// 加载更多
const loadMore = () => {
  if (!loading.value && hasMore.value) {
    loadData(false)
  }
}

// 点击防抖
let lastClickTime = 0
const CLICK_DEBOUNCE_TIME = 300

// 查看详情
const viewNoteDetail = (id: number) => {
  const now = Date.now()
  if (now - lastClickTime < CLICK_DEBOUNCE_TIME) return
  lastClickTime = now
  safeNavigateTo(`/pages/travel-note/detail?id=${id}`).catch(() => {
    // 静默处理错误
  })
}

const viewScenicDetail = (id: number) => {
  const now = Date.now()
  if (now - lastClickTime < CLICK_DEBOUNCE_TIME) return
  lastClickTime = now
  safeNavigateTo(`/pages/scenic/detail?id=${id}`).catch(() => {
    // 静默处理错误
  })
}

const viewFoodDetail = (id: number) => {
  const now = Date.now()
  if (now - lastClickTime < CLICK_DEBOUNCE_TIME) return
  lastClickTime = now
  safeNavigateTo(`/pages/food/detail?id=${id}`).catch(() => {
    // 静默处理错误
  })
}

// 格式化时间
const formatTime = (time: string) => {
  if (!time) return ''
  const date = new Date(time)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (days === 0) {
    const hours = Math.floor(diff / (1000 * 60 * 60))
    if (hours === 0) {
      const minutes = Math.floor(diff / (1000 * 60))
      return minutes <= 0 ? '刚刚' : `${minutes}分钟前`
    }
    return `${hours}小时前`
  } else if (days < 7) {
    return `${days}天前`
  } else {
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
  }
}

// 获取图片URL
const getImageUrl = (url: string) => {
  if (!url) return ''
  if (url.startsWith('http')) return url
  return `https://your-api-domain.com${url}`
}

// 获取标签
const getNoteTag = (note: any) => {
  if (note.isFeatured) return '精选'
  if (note.isHot) return '热门'
  return ''
}

onMounted(() => {
  if (user.value) {
    loadData(true)
  }
})
</script>

<style scoped>
.favorites-content {
  height: 100%;
  background-color: #f8fafb;
  display: flex;
  flex-direction: column;
}

.category-tabs {
  display: flex;
  background: #fff;
  border-bottom: 1rpx solid #eee;
  position: sticky;
  top: 0;
  z-index: 9;
  flex-shrink: 0;
}

.category-tab {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 24rpx 0;
  position: relative;
}

.category-tab.active {
  color: #3ba272;
}

.category-tab.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 50rpx;
  height: 4rpx;
  background: #3ba272;
  border-radius: 2rpx;
}

.category-text {
  font-size: 26rpx;
  color: #666;
}

.category-tab.active .category-text {
  color: #3ba272;
  font-weight: 600;
}

.scroll-view {
  flex: 1;
  min-height: 0;
  width: 100%;
  box-sizing: border-box;
}

.content-list {
  padding: 20rpx;
}

.note-list {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
  box-sizing: border-box;
}

.note-card {
  width: calc((100% - 20rpx) / 2);
  flex: 0 0 calc((100% - 20rpx) / 2);
  background: #fff;
  border-radius: 20rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
  box-sizing: border-box;
}

.note-cover-wrapper {
  position: relative;
  width: 100%;
  padding-top: 56.25%;
  overflow: hidden;
}

.note-cover {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.note-tag {
  position: absolute;
  top: 12rpx;
  left: 12rpx;
  background: rgba(59, 162, 114, 0.9);
  color: #fff;
  font-size: 20rpx;
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
}

.note-info {
  padding: 20rpx;
}

.note-meta-row {
  display: flex;
  align-items: center;
  margin-bottom: 12rpx;
}

.note-author-avatar {
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  margin-right: 12rpx;
}

.note-author-name {
  font-size: 24rpx;
  color: #666;
  margin-right: 12rpx;
}

.note-publish-time {
  font-size: 22rpx;
  color: #999;
  margin-left: auto;
}

.note-title-row {
  margin-bottom: 8rpx;
}

.note-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #333;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

.note-location-row {
  margin-bottom: 12rpx;
}

.note-location {
  font-size: 24rpx;
  color: #999;
}

.note-actions-row {
  display: flex;
  justify-content: space-around;
  padding-top: 12rpx;
  border-top: 1rpx solid #f5f5f5;
}

.note-action-item {
  display: flex;
  align-items: center;
  gap: 6rpx;
}

.note-action-icon {
  font-size: 32rpx;
  color: #999;
}

.note-action-icon.icon-liked {
  color: #ff6b6b;
}

.note-action-icon.icon-favorited {
  color: #ff6b6b;
}

.note-action-count {
  font-size: 24rpx;
  color: #999;
}

.note-action-count.text-active {
  color: #ff6b6b;
}

.scenic-list,
.food-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.scenic-card,
.food-card {
  background: #fff;
  border-radius: 20rpx;
  overflow: hidden;
  display: flex;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
}

.scenic-image,
.food-image {
  width: 200rpx;
  height: 200rpx;
  flex-shrink: 0;
}

.scenic-info,
.food-info {
  flex: 1;
  padding: 24rpx;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.scenic-name,
.food-name {
  font-size: 30rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 12rpx;
}

.scenic-address,
.food-address {
  font-size: 24rpx;
  color: #999;
  margin-bottom: 12rpx;
}

.scenic-intro,
.food-intro {
  margin-top: 8rpx;
}

.scenic-intro-text,
.food-intro-text {
  font-size: 24rpx;
  color: #999;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

.food-type {
  margin-top: 8rpx;
}

.food-type-text {
  font-size: 24rpx;
  color: #3ba272;
  background: #e4f7ef;
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
  display: inline-block;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 200rpx 40rpx;
}

.empty-icon {
  font-size: 120rpx;
  margin-bottom: 40rpx;
}

.empty-text {
  font-size: 32rpx;
  color: #666;
  margin-bottom: 16rpx;
}

.empty-tip {
  font-size: 26rpx;
  color: #999;
}

.load-more {
  text-align: center;
  padding: 40rpx;
}

.load-more-text {
  font-size: 24rpx;
  color: #999;
}

.skeleton-card {
  background: #fff;
  border-radius: 20rpx;
  overflow: hidden;
}

.skeleton-cover {
  width: 100%;
  padding-top: 56.25%;
  background: #f0f0f0;
}

.skeleton-content {
  padding: 20rpx;
}

.skeleton-line {
  height: 24rpx;
  background: #f0f0f0;
  border-radius: 4rpx;
  margin-bottom: 12rpx;
}

.skeleton-line.short {
  width: 60%;
}
</style>

