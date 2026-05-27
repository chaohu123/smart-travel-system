<template>
    <view class="my-article-page">
    <!-- 内容区域 -->
    <view class="content-wrapper">
      <view class="article-content">
      <!-- 搜索框和状态筛选容器 -->
      <view class="search-filter-container">
        <!-- 搜索框 -->
        <view class="search-bar-wrapper">
          <view class="search-bar">
            <text class="iconfont icon-sousuo search-icon"></text>
            <input
              class="search-input"
              v-model="searchKeyword"
              type="text"
              confirm-type="search"
              placeholder="搜索游记标题或内容"
              @confirm="handleSearch"
              @input="onSearchInput"
            />
            <text
              v-if="searchKeyword"
              class="iconfont icon-guanbi clear-icon"
              @click="clearSearch"
            ></text>
          </view>
        </view>
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
      </view>
  
      <!-- 卡片列表 -->
      <scroll-view
        scroll-y
        class="scroll-view"
        :scroll-top="scrollTop"
        @scrolltolower="loadMore"
        :enable-back-to-top="true"
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
          <text class="empty-icon iconfont icon-youji"></text>
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
import { safeNavigateTo, safeNavigateBack } from '@/utils/router'
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
const scrollTop = ref(0)
const searchKeyword = ref('')
  
  // 占位图和默认头像
  const placeholderImage = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIyNSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIyNSIgZmlsbD0iI0U1RTVFNSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5RUE3QjAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5Mb2FkaW5nLi4uPC90ZXh0Pjwvc3ZnPg=='
  const defaultAvatar = 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=200'
  
// 加载游记列表（仿照 my-interaction.vue 的 loadFavoritesData 逻辑）
const loadNotes = async (reset: boolean = false) => {
    if (!user.value?.id) {
      uni.showToast({ title: '请先登录', icon: 'none' })
      return
    }

  // 如果是重置（切换状态时），先重置分页和清空列表
  if (reset) {
    pageNum.value = 1
    noMore.value = false
    noteList.value = []
    networkError.value = false
    // 重置时，如果正在加载，先停止之前的加载
    // 这样可以确保新的加载能正常进行
    if (loading.value) {
      loading.value = false
    }
  }

  // 如果正在加载（且不是重置），或者不是重置且没有更多数据，则返回
  // 注意：reset 为 true 时，即使 loading 为 true，也应该继续加载
  if ((!reset && loading.value) || (!reset && noMore.value)) {
      return
    }
  
    loading.value = true
    networkError.value = false
  
    try {
    // 处理状态值：'all' 不传，其他状态直接传递
    let status: string | undefined = undefined
    if (selectedStatus.value === 'all') {
      status = undefined
    } else {
      // 'pass', 'pending', 'reject', 'private' 都直接传递
      status = selectedStatus.value
    }
    
      const res = await travelNoteApi.listMyNotes(user.value.id, pageNum.value, pageSize.value, status)
      const response = res.data as ApiResponse<{ list: any[] }>
      
      if (res.statusCode === 200 && response.code === 200) {
        const data = response.data
        if (data.list && data.list.length > 0) {
          // 先映射数据，然后根据搜索关键词过滤
          let newNotes = data.list.map((item: any) => ({
            ...item,
            isLiked: item.isLiked || false,
            isFavorite: item.isFavorite || false,
            commentCount: item.commentCount !== undefined ? item.commentCount : (item.comment_count || 0),
            favoriteCount: item.favoriteCount !== undefined ? item.favoriteCount : (item.favorite_count || 0),
          }))
          
          // 如果有搜索关键词，进行过滤
          if (searchKeyword.value && searchKeyword.value.trim()) {
            const keyword = searchKeyword.value.trim().toLowerCase()
            newNotes = newNotes.filter((note: any) => {
              const title = (note.title || '').toLowerCase()
              const content = (note.content || '').toLowerCase()
              const cityName = (note.cityName || '').toLowerCase()
              return title.includes(keyword) || content.includes(keyword) || cityName.includes(keyword)
            })
          }
        // 如果是重置（切换状态时），直接赋值；否则追加（加载更多时）
        if (reset) {
          noteList.value = newNotes
        } else {
          noteList.value.push(...newNotes)
        }
          
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
        // 如果是重置且数据为空，确保列表为空数组
        if (reset) {
          noteList.value = []
        }
      }
    } else {
      networkError.value = true
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
  
  // 搜索处理
  const handleSearch = () => {
    // 重置分页和列表
    pageNum.value = 1
    noteList.value = []
    noMore.value = false
    networkError.value = false
    // 重新加载数据
    loadNotes(true)
  }
  
  // 搜索输入处理（实时搜索，可以添加防抖）
  const onSearchInput = () => {
    // 可以在这里添加防抖逻辑，或者直接触发搜索
    // 为了更好的用户体验，这里使用防抖
    clearTimeout(searchTimer.value)
    searchTimer.value = setTimeout(() => {
      handleSearch()
    }, 500)
  }
  
  // 清除搜索
  const clearSearch = () => {
    searchKeyword.value = ''
    if (searchTimer.value) {
      clearTimeout(searchTimer.value)
    }
    // 重新加载数据
    handleSearch()
  }
  
  // 搜索防抖定时器
  const searchTimer = ref<ReturnType<typeof setTimeout> | undefined>(undefined)
  
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

// 切换状态筛选（仿照 my-interaction.vue 的逻辑）
  const switchStatus = (status: string) => {
  // 如果点击的是当前状态，且已有数据，不重复加载
  if (selectedStatus.value === status && noteList.value.length > 0) {
    return
  }
  
  // 立即更新状态，避免UI闪烁
    selectedStatus.value = status
    pageNum.value = 1
  noMore.value = false
  networkError.value = false
  
  // 重置滚动位置到顶部
  scrollTop.value = 0
  // 使用 nextTick 确保 DOM 更新后再重置滚动位置
  nextTick(() => {
    scrollTop.value = 0
  })
  
  // 清理旧的定时器和图片状态
  clearImageLoadTimers()
  
  // 清空列表，只显示当前状态的数据
    noteList.value = []
  
  // 清理不再需要的图片加载状态
  cleanupImageLoadedMap()
  
  // 不在这里设置 loading，让 loadNotes 自己管理
  // 这样可以避免 loadNotes 中的检查逻辑出现问题
  loadNotes(true) // Force reload with reset
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

let skipNextShowRefresh = true
let lastMyArticleRefreshTime = 0
const MY_ARTICLE_REFRESH_INTERVAL = 3000

// 页面显示时刷新数据（审核状态变更后返回需看到最新状态）
onShow(() => {
  if (!user.value) return
  if (skipNextShowRefresh) {
    skipNextShowRefresh = false
    return
  }
  const now = Date.now()
  if (now - lastMyArticleRefreshTime < MY_ARTICLE_REFRESH_INTERVAL) return
  lastMyArticleRefreshTime = now
  loadNotes(true)
})

onMounted(() => {
  if (user.value) {
    loadNotes()
  } else {
    uni.showToast({ title: '请先登录', icon: 'none' })
    setTimeout(() => {
      safeNavigateBack({ fallbackUrl: '/pages/profile/profile' })
    }, 1500)
  }
})

onUnmounted(() => {
  // 清理所有定时器，防止内存泄漏
  clearImageLoadTimers()
  // 清理搜索定时器
  if (searchTimer.value) {
    clearTimeout(searchTimer.value)
  }
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
  /* 消除子元素之间的空白字符间隙 */
  font-size: 0;
}

/* 搜索框和状态筛选的公共容器 */
.search-filter-container {
  background-color: #FFFFFF;
  flex-shrink: 0;
  /* 恢复字体大小 */
  font-size: 28rpx;
}

/* 搜索框容器 */
.search-bar-wrapper {
  padding: 20rpx 24rpx 0 24rpx;
  margin: 0;
  background-color: transparent;
  flex-shrink: 0;
  /* 确保紧贴导航栏，无间隙 */
  position: relative;
  /* 恢复字体大小 */
  font-size: 28rpx;
}

/* 搜索框 */
.search-bar {
  display: flex;
  align-items: center;
  background-color: #F6F7F8;
  border-radius: 48rpx;
  padding: 16rpx 24rpx;
  gap: 16rpx;
  margin: 0;
  margin-bottom: 0;
}

.search-icon {
  font-size: 32rpx;
  color: #9EA7B0;
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  font-size: 28rpx;
  color: #333333;
  background-color: transparent;
  border: none;
  outline: none;
}

.search-input::placeholder {
  color: #9EA7B0;
}

.clear-icon {
  font-size: 28rpx;
  color: #9EA7B0;
  flex-shrink: 0;
  padding: 4rpx;
  cursor: pointer;
}

/* 状态筛选行 */
.status-filter-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 12rpx 24rpx 20rpx 24rpx;
  margin: 0;
  background-color: transparent;
  border-bottom: 1rpx solid #F0F0F0;
  border-top: none;
  overflow-x: auto;
  white-space: nowrap;
  position: sticky;
  /* 导航栏高度通常是 88rpx（44px * 2），加上搜索框高度约 80rpx */
  top: calc(88rpx + 80rpx);
  z-index: 100;
  flex-shrink: 0;
  /* 确保状态筛选行有足够的高度和可见性 */
  min-height: 80rpx;
  width: 100%;
  box-sizing: border-box;
  /* 确保状态筛选行始终在最上层，不被其他元素遮挡 */
  will-change: transform;
  /* 恢复字体大小 */
  font-size: 24rpx;
}

.status-filter-item {
  padding: 12rpx 24rpx;
  background-color: #F6F7F8;
  border-radius: 48rpx;
  font-size: 24rpx;
  color: #666666;
  transition: all 120ms ease;
  flex-shrink: 0;
  /* 确保文字可见 */
  min-width: fit-content;
  white-space: nowrap;
  line-height: 1.5;
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
  background-color: #F6F7F8;
  /* 使用 flex: 1 和 min-height: 0 确保 scroll-view 始终占据可用空间 */
  /* 避免切换状态时高度变为 0 导致白色背景闪烁 */
  /* 设置背景色与页面一致，避免白色闪烁 */
}

/* 卡片列表 */
.note-list {
  display: flex;
  flex-wrap: wrap;
  padding: 24rpx;
  gap: 24rpx;
  box-sizing: border-box;
  background-color: #F6F7F8;
  /* 确保背景色与页面一致，避免切换状态时出现白色背景 */
  min-height: 100%;
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
