<template>
  <view class="likes-content">
    <scroll-view
      scroll-y
      class="scroll-view"
      @scrolltolower="loadMore"
      :refresher-enabled="true"
      :refresher-triggered="refreshing"
      @refresherrefresh="onRefresh"
    >
      <!-- 骨架屏 -->
      <view v-if="loading && likeList.length === 0" class="note-list">
        <view v-for="i in 6" :key="i" class="skeleton-card">
          <view class="skeleton-cover"></view>
          <view class="skeleton-content">
            <view class="skeleton-line"></view>
            <view class="skeleton-line short"></view>
          </view>
        </view>
      </view>

      <!-- 空状态 -->
      <view v-else-if="!loading && likeList.length === 0" class="empty-state">
        <text class="empty-icon iconfont icon-icon"></text>
        <text class="empty-text">还没有点赞过任何内容</text>
        <text class="empty-tip">去发现精彩内容吧~</text>
      </view>

      <!-- 点赞列表 -->
      <view v-if="!loading && likeList.length > 0" class="note-list">
        <view
          v-for="note in likeList"
          :key="note.id"
          class="note-card"
          @click="viewDetail(note.id)"
        >
          <view class="note-cover-wrapper">
            <image
              v-if="note.coverImage"
              class="note-cover"
              :src="getImageUrl(note.coverImage)"
              mode="aspectFill"
              :lazy-load="true"
            />
            <view v-if="getNoteTag(note)" class="note-tag">
              {{ getNoteTag(note) }}
            </view>
          </view>

          <view class="note-info">
            <view class="note-meta-row">
              <image
                class="note-author-avatar"
                :src="getImageUrl(note.authorAvatar) || defaultAvatar"
                mode="aspectFill"
              />
              <text class="note-author-name">{{ note.authorName || '匿名用户' }}</text>
              <text class="note-publish-time">{{ formatTime(note.createTime) }}</text>
            </view>

            <view class="note-title-row">
              <text class="note-title">{{ note.title }}</text>
            </view>

            <view class="note-location-row">
              <text class="note-location">{{ note.cityName || '未知地点' }}</text>
            </view>

            <view class="note-actions-row">
              <view class="note-action-item">
                <text class="iconfont icon-icon note-action-icon icon-liked"></text>
                <text class="note-action-count text-active">{{ note.likeCount || 0 }}</text>
              </view>
              <view class="note-action-item">
                <text class="iconfont icon-pinglun note-action-icon"></text>
                <text class="note-action-count">{{ note.commentCount || 0 }}</text>
              </view>
              <view class="note-action-item">
                <text class="iconfont note-action-icon" :class="['icon-shoucang', { 'icon-favorited': note.isFavorite }]"></text>
                <text class="note-action-count" :class="{ 'text-active': note.isFavorite }">
                  {{ note.favoriteCount || 0 }}
                </text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 加载更多提示 -->
      <view v-if="hasMore && !loading" class="load-more">
        <text class="load-more-text">上拉加载更多</text>
      </view>
      <view v-if="!hasMore && likeList.length > 0" class="load-more">
        <text class="load-more-text">没有更多了</text>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { travelNoteInteractionApi } from '@/api/content'
import { useUserStore } from '@/store/user'
import { safeNavigateTo } from '@/utils/router'
import { getImageUrl } from '@/utils/image'

const store = useUserStore()
const user = computed(() => store.state.profile)
const defaultAvatar = 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=200'

const likeList = ref<any[]>([])
const loading = ref(false)
const refreshing = ref(false)
const pageNum = ref(1)
const pageSize = ref(10)
const hasMore = ref(true)

// 加载点赞列表
const loadLikes = async (reset = false) => {
  if (!user.value?.id) {
    uni.showToast({ title: '请先登录', icon: 'none' })
    return
  }

  if (reset) {
    pageNum.value = 1
    hasMore.value = true
    likeList.value = [] // 重置时清空列表
  }

  if (loading.value || (!reset && !hasMore.value)) {
    return
  }

  loading.value = true

  try {
    const res = await travelNoteInteractionApi.listMyLikes(user.value.id, pageNum.value, pageSize.value)

    if (res.statusCode === 200 && res.data.code === 200) {
      const data = res.data.data || {}
      const dataList = data.list || []
      
      if (reset) {
        likeList.value = dataList
      } else {
        // 使用循环替代扩展运算符，避免 Babel runtime 错误
        for (let i = 0; i < dataList.length; i++) {
          likeList.value.push(dataList[i])
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
      uni.showToast({ title: res.data.msg || '加载失败', icon: 'none' })
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
  loadLikes(true)
}

// 加载更多
const loadMore = () => {
  if (!loading.value && hasMore.value) {
    loadLikes(false)
  }
}

// 点击防抖
let lastClickTime = 0
const CLICK_DEBOUNCE_TIME = 300

// 查看详情
const viewDetail = (noteId: number) => {
  const now = Date.now()
  if (now - lastClickTime < CLICK_DEBOUNCE_TIME) return
  lastClickTime = now
  
  safeNavigateTo(`/pages/travel-note/detail?id=${noteId}`).catch(() => {
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

// 获取标签
const getNoteTag = (note: any) => {
  if (note.isFeatured) return '精选'
  if (note.isHot) return '热门'
  return ''
}

onMounted(() => {
  if (user.value) {
    loadLikes(true)
  }
})
</script>

<style scoped>
.likes-content {
  height: 100%;
  background-color: #f8fafb;
  display: flex;
  flex-direction: column;
}

.scroll-view {
  flex: 1;
  min-height: 0;
  width: 100%;
  box-sizing: border-box;
}

.note-list {
  padding: 20rpx;
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

