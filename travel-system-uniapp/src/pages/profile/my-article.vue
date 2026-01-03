<template>
  <view class="my-article-page">
    <!-- 内容区域 -->
    <view class="content-wrapper">
      <view class="article-content">
        <!-- 状态筛选 -->
        <view class="status-filter-row">
          <view
            v-for="status in statusFilters"
            :key="status.key"
            class="status-filter-item"
            :class="{ active: selectedStatus === status.key }"
            @click="switchStatus(status.key)"
          >
            {{ status.label }}
          </view>
        </view>

        <!-- 卡片列表 -->
        <scroll-view
          scroll-y
          class="scroll-view"
          @scrolltolower="loadMore"
        >
      <!-- 骨架屏 -->
      <view v-if="loading && noteList.length === 0" class="note-list">
        <SkeletonCards :count="6" />
      </view>

      <!-- 游记卡片列表 -->
      <view v-else class="note-list">
        <view
          v-for="note in noteList"
          :key="note.id"
          class="note-card"
          @click="handleNoteClick(note)"
        >
          <!-- 图片区域 -->
          <view class="note-cover-wrapper">
            <image
              v-if="note.coverImage"
              class="note-cover"
              :class="{ 'loaded': imageLoadedMap[note.id] }"
              :src="getImageUrl(note.coverImage)"
              mode="aspectFill"
              :lazy-load="true"
              @load="onImageLoad(note.id)"
              @error="onImageError(note.id)"
            />
            <image
              v-if="!imageLoadedMap[note.id]"
              class="note-cover placeholder"
              :src="placeholderImage"
              mode="aspectFill"
            />
            <!-- 状态标签 -->
            <view v-if="getStatusTag(note)" class="note-status-tag" :class="getStatusTagClass(note)">
              {{ getStatusTag(note) }}
            </view>
          </view>

          <!-- 信息区 -->
          <view class="note-info">
            <!-- 第一行：作者头像 + 昵称 + 发布时间 -->
            <view class="note-meta-row">
              <image
                class="note-author-avatar"
                :src="note.authorAvatar || defaultAvatar"
                mode="aspectFill"
              />
              <text class="note-author-name">{{ note.authorName || '匿名用户' }}</text>
              <text class="note-publish-time">{{ formatTime(note.createTime) }}</text>
            </view>

            <!-- 第二行：文章标题 -->
            <view class="note-title-row">
              <text class="note-title">{{ note.title }}</text>
            </view>

            <!-- 第三行：地点 -->
            <view class="note-location-row">
              <text class="note-location">{{ note.cityName || '未知地点' }}</text>
            </view>

            <!-- 审核不通过原因 -->
            <view v-if="note.status === 'reject' && note.auditRemark" class="audit-remark-row">
              <text class="audit-remark-label">审核不通过：</text>
              <text class="audit-remark-text">{{ note.auditRemark }}</text>
            </view>

            <!-- 底部：三个小图标与数据 -->
            <view class="note-actions-row">
              <view class="note-action-item" @tap.stop="toggleLike(note)">
                <text
                  class="iconfont note-action-icon"
                  :class="['icon-icon', { 'icon-liked': note.isLiked }]"
                ></text>
                <text class="note-action-count" :class="{ 'text-active': note.isLiked }">
                  {{ note.likeCount || 0 }}
                </text>
              </view>
              <view class="note-action-item" @tap.stop="handleComment(note)">
                <text class="iconfont icon-pinglun note-action-icon"></text>
                <text class="note-action-count">{{ note.commentCount || 0 }}</text>
              </view>
              <view class="note-action-item" @tap.stop="toggleFavorite(note)">
                <text
                  class="iconfont note-action-icon"
                  :class="['icon-shoucang', { 'icon-favorited': note.isFavorite }]"
                ></text>
                <text class="note-action-count" :class="{ 'text-active': note.isFavorite }">
                  {{ note.favoriteCount || 0 }}
                </text>
              </view>
            </view>

            <!-- 操作按钮 -->
            <view class="my-note-actions">
              <view class="action-btn edit-btn" @tap.stop="editNote(note)">
                <text class="iconfont icon-bianji"></text>
                <text>编辑</text>
              </view>
              <view class="action-btn private-btn" @tap.stop="togglePrivate(note)">
                <text class="iconfont" :class="note.isPrivate ? 'icon-gongkai' : 'icon-siyou'"></text>
                <text>{{ note.isPrivate ? '设为公开' : '设为私人' }}</text>
              </view>
              <view class="action-btn delete-btn" @tap.stop="deleteNote(note)">
                <text class="iconfont icon-shanchu"></text>
                <text>删除</text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 底部加载/空态提示 -->
      <view v-if="loading && noteList.length > 0" class="loading-more">
        <text>加载中...</text>
      </view>
      <view v-else-if="noMore && noteList.length > 0" class="no-more">
        <text>没有更多了</text>
      </view>
      <view v-else-if="!loading && noteList.length === 0 && !networkError" class="empty-state">
        <text class="empty-icon">📝</text>
        <text class="empty-text">还没有发布过游记</text>
        <view class="empty-action" @click="publishNote">
          <text>立即发布</text>
        </view>
      </view>
      <view v-else-if="networkError" class="error-state">
        <text class="error-text">网络错误，请重试</text>
        <view class="error-action" @click="retryLoad">
          <text>重试</text>
        </view>
      </view>
        </scroll-view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { useUserStore } from '@/store/user'
import { travelNoteApi, travelNoteInteractionApi } from '@/api/content'
import { getImageUrl } from '@/utils/image'
import { safeNavigateTo } from '@/utils/router'
import SkeletonCards from '@/components/SkeletonCards.vue'

const store = useUserStore()
const user = computed(() => store.state.profile)

// API 响应类型定义
interface ApiResponse<T = any> {
  code: number
  msg?: string
  data: T
}

// 数据状态
const noteList = ref<any[]>([])
const pageNum = ref(1)
const pageSize = ref(10)
const loading = ref(false)
const noMore = ref(false)
const networkError = ref(false)
const imageLoadedMap = ref<Record<number, boolean>>({})
// 存储定时器ID，用于清理
const imageLoadTimers = ref<Map<number, ReturnType<typeof setTimeout>>>(new Map())

// 状态筛选
const statusFilters = [
  { key: 'all', label: '全部' },
  { key: 'pass', label: '已发表' },
  { key: 'pending', label: '待审核' },
  { key: 'reject', label: '被驳回' },
  { key: 'private', label: '私人' },
]
const selectedStatus = ref('all')

// 占位图和默认头像
const placeholderImage = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIyNSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIyNSIgZmlsbD0iI0U1RTVFNSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5RUE3QjAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5Mb2FkaW5nLi4uPC90ZXh0Pjwvc3ZnPg=='
const defaultAvatar = 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=200'

// 加载游记列表
const loadNotes = async () => {
  if (loading.value || noMore.value) return

  if (!user.value?.id) {
    uni.showToast({ title: '请先登录', icon: 'none' })
    return
  }

  loading.value = true
  networkError.value = false

  try {
    const status = selectedStatus.value === 'all' ? undefined : selectedStatus.value
    const res = await travelNoteApi.listMyNotes(user.value.id, pageNum.value, pageSize.value, status)
    const response = res.data as ApiResponse<{ list: any[] }>
    
    if (res.statusCode === 200 && response.code === 200) {
      const data = response.data
      if (data.list && data.list.length > 0) {
        const newNotes = data.list.map((item: any) => ({
          ...item,
          isLiked: item.isLiked || false,
          isFavorite: item.isFavorite || false,
          commentCount: item.commentCount !== undefined ? item.commentCount : (item.comment_count || 0),
          favoriteCount: item.favoriteCount !== undefined ? item.favoriteCount : (item.favorite_count || 0),
        }))
        noteList.value.push(...newNotes)
        
        // 初始化图片加载状态（移除不必要的延迟加载逻辑，直接设置为true）
        newNotes.forEach((note: any) => {
          if (note.coverImage && !imageLoadedMap.value[note.id]) {
            imageLoadedMap.value[note.id] = false
          }
        })
        
        if (data.list.length < pageSize.value) {
          noMore.value = true
        } else {
          pageNum.value++
        }
      } else {
        noMore.value = true
      }
    }
  } catch (error) {
    networkError.value = true
    uni.showToast({
      title: '加载失败',
      icon: 'none',
    })
  } finally {
    loading.value = false
  }
}

// 加载更多
const loadMore = () => {
  if (!loading.value && !noMore.value) {
    loadNotes()
  }
}

// 图片加载完成
const onImageLoad = (noteId: number) => {
  imageLoadedMap.value[noteId] = true
}

// 图片加载错误
const onImageError = (noteId: number) => {
  imageLoadedMap.value[noteId] = false
}

// 获取状态标签
const getStatusTag = (note: any) => {
  if (note.isPrivate) return '私人'
  if (note.status === 'pass') return '已发表'
  if (note.status === 'pending') return '待审核'
  if (note.status === 'reject') return '已驳回'
  return null
}

// 获取状态标签样式类
const getStatusTagClass = (note: any) => {
  if (note.isPrivate) return 'status-private'
  if (note.status === 'pass') return 'status-pass'
  if (note.status === 'pending') return 'status-pending'
  if (note.status === 'reject') return 'status-reject'
  return ''
}

// 清理图片加载定时器
const clearImageLoadTimers = () => {
  imageLoadTimers.value.forEach((timer) => {
    clearTimeout(timer)
  })
  imageLoadTimers.value.clear()
}

// 清理不再需要的图片加载状态（只保留当前列表中的）
const cleanupImageLoadedMap = () => {
  const currentNoteIds = new Set(noteList.value.map((note: any) => note.id))
  const keysToDelete: number[] = []
  Object.keys(imageLoadedMap.value).forEach((key) => {
    const noteId = Number(key)
    if (!currentNoteIds.has(noteId)) {
      keysToDelete.push(noteId)
    }
  })
  keysToDelete.forEach((noteId) => {
    delete imageLoadedMap.value[noteId]
  })
}

// 切换状态筛选
const switchStatus = (status: string) => {
  if (selectedStatus.value === status) return
  selectedStatus.value = status
  pageNum.value = 1
  // 清理旧的定时器和图片状态
  clearImageLoadTimers()
  noteList.value = []
  noMore.value = false
  // 清理不再需要的图片加载状态
  cleanupImageLoadedMap()
  // 使用 nextTick 确保 DOM 更新后再加载数据，避免布局问题
  nextTick(() => {
    loadNotes()
  })
}

// 点击卡片
const handleNoteClick = (note: any) => {
  // 如果是被驳回的，优先提示编辑
  if (note.status === 'reject') {
    uni.showModal({
      title: '游记被驳回',
      content: note.auditRemark || '审核不通过，请编辑后重新提交',
      confirmText: '去编辑',
      cancelText: '查看详情',
      success: (res) => {
        if (res.confirm) {
          editNote(note)
        } else {
          viewDetail(note.id)
        }
      },
    })
  } else {
    viewDetail(note.id)
  }
}

// 查看详情
const viewDetail = (id: number) => {
  safeNavigateTo(`/pages/travel-note/detail?id=${id}`)
}

// 编辑游记
const editNote = (note: any) => {
  if (!user.value) {
    uni.showToast({ title: '请先登录', icon: 'none' })
    return
  }
  safeNavigateTo(`/pages/travel-note/publish?id=${note.id}`)
}

// 删除游记
const deleteNote = (note: any) => {
  if (!user.value) {
    uni.showToast({ title: '请先登录', icon: 'none' })
    return
  }
  uni.showModal({
    title: '确认删除',
    content: '删除后无法恢复，确定要删除这篇游记吗？',
    confirmText: '删除',
    cancelText: '取消',
    confirmColor: '#ff3b30',
    success: async (res) => {
      if (res.confirm) {
        try {
          const deleteRes = await travelNoteApi.delete(note.id, user.value!.id)
          const data = deleteRes.data as ApiResponse
          if (deleteRes.statusCode === 200 && data.code === 200) {
            uni.showToast({ title: '删除成功', icon: 'success' })
            // 从列表中移除
            const index = noteList.value.findIndex((n) => n.id === note.id)
            if (index > -1) {
              noteList.value.splice(index, 1)
            }
          } else {
            uni.showToast({ title: data.msg || '删除失败', icon: 'none' })
          }
        } catch (error: any) {
          uni.showToast({ title: error?.message || '删除失败', icon: 'none' })
        }
      }
    },
  })
}

// 设为私人/公开
const togglePrivate = async (note: any) => {
  if (!user.value) {
    uni.showToast({ title: '请先登录', icon: 'none' })
    return
  }
  const isPrivate = !note.isPrivate
  try {
    const res = await travelNoteApi.setPrivate(note.id, user.value.id, isPrivate)
    const data = res.data as ApiResponse
    if (res.statusCode === 200 && data.code === 200) {
      note.isPrivate = isPrivate
      // 如果设为私人，状态改为private；如果设为公开，状态改为pending等待审核
      if (isPrivate) {
        note.status = 'private'
      } else {
        note.status = 'pending'
      }
      uni.showToast({ title: isPrivate ? '已设为私人' : '已设为公开，等待审核', icon: 'success' })
    } else {
      uni.showToast({ title: data.msg || '操作失败', icon: 'none' })
    }
  } catch (error: any) {
    uni.showToast({ title: error?.message || '操作失败', icon: 'none' })
  }
}

// 点赞切换
const toggleLike = async (note: any) => {
  if (!user.value) {
    uni.showModal({
      title: '需要登录',
      content: '请先登录',
      confirmText: '去登录',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          safeNavigateTo('/pages/profile/profile')
        }
      }
    })
    return
  }

  try {
    const wasLiked = note.isLiked
    note.isLiked = !wasLiked

    const res = await travelNoteInteractionApi.toggleLike(user.value.id, note.id)
    const data = res.data as ApiResponse<{ isLiked: boolean; likeCount?: number }>
    
    if (res.statusCode === 200 && data.code === 200) {
      note.isLiked = data.data.isLiked
      if (data.data.likeCount !== undefined) {
        note.likeCount = data.data.likeCount
      } else {
        note.likeCount = note.isLiked
          ? (note.likeCount || 0) + 1
          : Math.max(0, (note.likeCount || 0) - 1)
      }
    } else {
      note.isLiked = wasLiked
      note.likeCount = wasLiked ? (note.likeCount || 0) + 1 : Math.max(0, (note.likeCount || 0) - 1)
      uni.showToast({
        title: data.msg || '操作失败',
        icon: 'none',
      })
    }
  } catch (error: any) {
    note.isLiked = !note.isLiked
    note.likeCount = note.isLiked ? (note.likeCount || 0) + 1 : Math.max(0, (note.likeCount || 0) - 1)
    uni.showToast({
      title: error?.message || '操作失败，请检查网络',
      icon: 'none',
    })
  }
}

// 收藏切换
const toggleFavorite = async (note: any) => {
  if (!user.value) {
    uni.showModal({
      title: '需要登录',
      content: '请先登录',
      confirmText: '去登录',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          safeNavigateTo('/pages/profile/profile')
        }
      }
    })
    return
  }

  try {
    const wasFavorite = note.isFavorite
    note.isFavorite = !wasFavorite

    const res = await travelNoteInteractionApi.toggleFavorite(user.value.id, note.id)
    const data = res.data as ApiResponse<{ isFavorite: boolean; favoriteCount?: number }>
    
    if (res.statusCode === 200 && data.code === 200) {
      note.isFavorite = data.data.isFavorite
      if (data.data.favoriteCount !== undefined) {
        note.favoriteCount = data.data.favoriteCount
      } else {
        note.favoriteCount = note.isFavorite
          ? (note.favoriteCount || 0) + 1
          : Math.max(0, (note.favoriteCount || 0) - 1)
      }
    } else {
      note.isFavorite = wasFavorite
      note.favoriteCount = wasFavorite ? (note.favoriteCount || 0) + 1 : Math.max(0, (note.favoriteCount || 0) - 1)
      uni.showToast({
        title: data.msg || '操作失败',
        icon: 'none',
      })
    }
  } catch (error: any) {
    note.isFavorite = !note.isFavorite
    note.favoriteCount = note.isFavorite ? (note.favoriteCount || 0) + 1 : Math.max(0, (note.favoriteCount || 0) - 1)
    uni.showToast({
      title: error?.message || '操作失败，请检查网络',
      icon: 'none',
    })
  }
}

// 评论处理
const handleComment = (note: any) => {
  safeNavigateTo(`/pages/travel-note/detail?id=${note.id}&tab=comment`)
}

// 格式化时间
const formatTime = (time: string) => {
  if (!time) return ''
  const date = new Date(time)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) return '今天'
  if (days === 1) return '昨天'
  if (days < 7) return `${days}天前`
  return `${date.getMonth() + 1}-${date.getDate()}`
}

// 发布游记
const publishNote = () => {
  safeNavigateTo('/pages/travel-note/publish')
}

// 重试加载
const retryLoad = () => {
  networkError.value = false
  pageNum.value = 1
  noteList.value = []
  noMore.value = false
  loadNotes()
}

// 页面加载时读取 URL 参数
onLoad((options: any) => {
  if (options.status) {
    // 如果 URL 中有 status 参数，设置初始状态
    const validStatus = ['all', 'pass', 'pending', 'reject', 'private']
    if (validStatus.includes(options.status)) {
      selectedStatus.value = options.status
    }
  }
})

// 页面显示时刷新数据
onShow(() => {
  if (user.value && noteList.value.length === 0 && !loading.value) {
    pageNum.value = 1
    noteList.value = []
    noMore.value = false
    loadNotes()
  }
})

onMounted(() => {
  if (user.value) {
    loadNotes()
  } else {
    uni.showToast({ title: '请先登录', icon: 'none' })
    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
  }
})

onUnmounted(() => {
  // 清理所有定时器，防止内存泄漏
  clearImageLoadTimers()
  // 清理图片加载状态
  imageLoadedMap.value = {}
})
</script>

<style scoped>
.my-article-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: #F6F7F8;
}

/* 内容区域 */
.content-wrapper {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background-color: #F6F7F8;
}

/* 文章内容容器（类似 favorites-content） */
.article-content {
  width: 100%;
  height: 100%;
  background-color: #F6F7F8;
  display: flex;
  flex-direction: column;
}

/* 状态筛选行 */
.status-filter-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 20rpx 24rpx;
  background-color: #FFFFFF;
  border-bottom: 1rpx solid #F0F0F0;
  overflow-x: auto;
  white-space: nowrap;
  position: sticky;
  top: 0;
  z-index: 9;
  flex-shrink: 0;
}

.status-filter-item {
  padding: 12rpx 24rpx;
  background-color: #F6F7F8;
  border-radius: 48rpx;
  font-size: 24rpx;
  color: #666666;
  transition: all 120ms ease;
  flex-shrink: 0;
}

.status-filter-item.active {
  background-color: #3BA272;
  color: #FFFFFF;
  font-weight: 600;
}

/* 滚动区域 */
.scroll-view {
  flex: 1;
  min-height: 0;
  width: 100%;
  box-sizing: border-box;
  /* 确保 scroll-view 始终有高度，避免切换状态时高度变为 0 */
  height: 0;
}

/* 卡片列表 */
.note-list {
  display: flex;
  flex-wrap: wrap;
  padding: 24rpx;
  gap: 24rpx;
  box-sizing: border-box;
}

.note-card {
  width: calc((100% - 24rpx) / 2);
  flex: 0 0 calc((100% - 24rpx) / 2);
  background-color: #FFFFFF;
  border-radius: 24rpx;
  overflow: hidden;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.06);
  transition: all 120ms ease;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

.note-card:active {
  transform: scale(0.98);
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.1);
}

/* 图片区域 */
.note-cover-wrapper {
  width: 100%;
  height: 0;
  padding-bottom: 56.25%; /* 16:9 */
  position: relative;
  overflow: hidden;
  background-color: #E5E5E5;
  border-radius: 16rpx 16rpx 0 0;
}

.note-cover {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  transition: opacity 240ms ease;
}

.note-cover.loaded {
  opacity: 1;
}

.note-cover.placeholder {
  opacity: 0.5;
  z-index: 1;
}

/* 状态标签 */
.note-status-tag {
  position: absolute;
  top: 12rpx;
  right: 12rpx;
  padding: 4rpx 12rpx;
  color: #FFFFFF;
  font-size: 20rpx;
  border-radius: 20rpx;
  font-weight: 600;
}

.note-status-tag.status-private {
  background-color: rgba(153, 153, 153, 0.9);
}

.note-status-tag.status-pass {
  background-color: rgba(47, 166, 106, 0.9);
}

.note-status-tag.status-pending {
  background-color: rgba(255, 193, 7, 0.9);
}

.note-status-tag.status-reject {
  background-color: rgba(244, 67, 54, 0.9);
}

/* 信息区 */
.note-info {
  padding: 20rpx;
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  background-color: #FFFFFF;
  box-shadow: inset 0 1rpx 0 0 #F0F0F0;
}

/* 第一行：作者头像 + 昵称 + 发布时间 */
.note-meta-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.note-author-avatar {
  width: 48rpx;
  height: 48rpx;
  border-radius: 50%;
  background-color: #E5E5E5;
  flex-shrink: 0;
}

.note-author-name {
  flex: 1;
  font-size: 24rpx;
  color: #333333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.note-publish-time {
  font-size: 20rpx;
  color: #9EA7B0;
  flex-shrink: 0;
}

/* 第二行：文章标题 */
.note-title-row {
  margin-top: 4rpx;
}

.note-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333333;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 第三行：地点/类别 */
.note-location-row {
  margin-top: 4rpx;
}

.note-location {
  font-size: 24rpx;
  color: #9EA7B0;
}

/* 审核不通过原因 */
.audit-remark-row {
  margin-top: 12rpx;
  padding: 12rpx;
  background-color: #FFF3F0;
  border-left: 4rpx solid #FF6B6B;
  border-radius: 8rpx;
}

.audit-remark-label {
  font-size: 24rpx;
  color: #FF6B6B;
  font-weight: 600;
}

.audit-remark-text {
  font-size: 24rpx;
  color: #666666;
  line-height: 1.5;
}

/* 底部：互动数据 - 平均分布 */
.note-actions-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 8rpx;
  padding-top: 12rpx;
  border-top: 1rpx solid #F0F0F0;
}

.note-action-item {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  transition: all 120ms ease;
}

.note-action-item:active {
  transform: scale(0.95);
}

.note-action-icon {
  font-size: 32rpx;
  color: #666666;
  transition: color 120ms ease;
}

.note-action-icon.icon-liked {
  color: rgb(162, 59, 81);
}

.note-action-icon.icon-shoucang.icon-favorited {
  color: #FF6B6B;
}

.note-action-count {
  font-size: 24rpx;
  color: #666666;
  transition: color 120ms ease;
}

.note-action-count.text-active {
  color: #2FA66A;
  font-weight: 600;
}

/* 操作按钮 */
.my-note-actions {
  display: flex;
  gap: 12rpx;
  margin-top: 16rpx;
  padding-top: 16rpx;
  border-top: 1rpx solid #F0F0F0;
}

.action-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6rpx;
  padding: 12rpx;
  border-radius: 8rpx;
  font-size: 24rpx;
  transition: all 120ms ease;
}

.action-btn:active {
  transform: scale(0.95);
  opacity: 0.8;
}

.edit-btn {
  background-color: #E6F5ED;
  color: #3BA272;
}

.private-btn {
  background-color: #F0F0F0;
  color: #666666;
}

.delete-btn {
  background-color: #FFF3F0;
  color: #FF6B6B;
}

.action-btn .iconfont {
  font-size: 28rpx;
}

/* 底部加载/空态提示 */
.loading-more {
  text-align: center;
  padding: 40rpx;
  color: #9EA7B0;
  font-size: 24rpx;
}

.no-more {
  text-align: center;
  padding: 40rpx;
  color: #9EA7B0;
  font-size: 24rpx;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx 40rpx;
  gap: 24rpx;
}

.empty-icon {
  font-size: 120rpx;
  opacity: 0.3;
}

.empty-text {
  font-size: 28rpx;
  color: #9EA7B0;
}

.empty-action {
  margin-top: 16rpx;
  padding: 16rpx 32rpx;
  background-color: #2FA66A;
  color: #FFFFFF;
  border-radius: 48rpx;
  font-size: 24rpx;
  transition: all 120ms ease;
}

.empty-action:active {
  transform: scale(0.95);
  opacity: 0.8;
}

.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx 40rpx;
  gap: 24rpx;
}

.error-text {
  font-size: 28rpx;
  color: #9EA7B0;
}

.error-action {
  margin-top: 16rpx;
  padding: 16rpx 32rpx;
  background-color: #2FA66A;
  color: #FFFFFF;
  border-radius: 48rpx;
  font-size: 24rpx;
  transition: all 120ms ease;
}

.error-action:active {
  transform: scale(0.95);
  opacity: 0.8;
}
</style>
