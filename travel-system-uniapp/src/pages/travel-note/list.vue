<template>
  <view class="note-list-page">
    <!-- 顶部搜索框 -->
    <view class="search-header">
      <view class="search-wrapper">
        <Search class="search-icon" theme="outline" size="24" fill="#9EA7B0" />
        <input
          class="search-input"
          v-model="searchKeyword"
          type="text"
          confirm-type="search"
          placeholder="搜索游记内容或作者昵称..."
          @confirm="handleSearch"
          @input="onSearchInput"
        />
        <CloseSmall
          v-if="searchKeyword"
          class="clear-icon"
          @click="clearSearch"
          theme="outline"
          size="20"
          fill="#9EA7B0"
        />
      </view>
      <view class="search-icon-btn" @click="handleSearch">
        <Search class="search-icon-right" theme="outline" size="28" fill="#2FA66A" />
      </view>
    </view>

    <!-- 筛选栏 -->
    <view class="filter-bar">
      <picker
        mode="selector"
        :range="cityList"
        range-key="name"
        @change="onCityChange"
      >
        <view class="filter-item">
          {{ selectedCity?.name || '全部城市' }}
        </view>
      </picker>
      <view class="sort-tabs">
        <text
          class="sort-tab"
          :class="{ active: sortBy === 'hot' }"
          @click="changeSort('hot')"
        >
          最热
        </text>
        <text
          class="sort-tab"
          :class="{ active: sortBy === 'time' }"
          @click="changeSort('time')"
        >
          最新
        </text>
      </view>
    </view>

    <scroll-view
      scroll-y
      class="scroll-view"
      @scrolltolower="loadMore"
    >
      <view class="note-list">
        <view
          v-for="note in noteList"
          :key="note.id"
          class="note-card"
          @click="viewDetail(note.id)"
        >
          <view class="note-cover-wrapper">
            <image
              v-if="note.coverImage"
              class="note-cover"
              :src="note.coverImage"
              mode="aspectFill"
            />
          </view>
          <view class="note-content-wrapper">
            <!-- 第一行：头像 + 标题 -->
            <view class="note-header-row">
              <image
                class="note-author-avatar"
                :src="note.authorAvatar || 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=200'"
                mode="aspectFill"
              />
              <text class="note-title">{{ note.title }}</text>
            </view>

            <!-- 第二行：发布者昵称 + 点赞 + 评论 -->
            <view class="note-footer-row">
              <text class="note-author-name">{{ note.authorName || '匿名用户' }}</text>
              <view class="note-stats">
                <view class="note-stat-item" @tap.stop="toggleLike(note)">
                  <view class="note-icon-box" :class="{ 'is-active': note.isLiked && shouldAnimateMap[note.id] }">
                    <text
                      class="iconfont note-stat-icon"
                      :class="['icon-icon', { 'icon-liked': note.isLiked }]"
                    ></text>
                  </view>
                  <text class="note-stat-text" :class="{ 'text-active': note.isLiked }">{{ note.likeCount || 0 }}</text>
                </view>
                <view class="note-stat-item" @tap.stop="handleComment(note)">
                  <view class="note-icon-box">
                    <text class="iconfont icon-pinglun note-stat-icon"></text>
                  </view>
                  <text class="note-stat-text">{{ note.commentCount || 0 }}</text>
                </view>
              </view>
            </view>
          </view>
        </view>
      </view>

      <view v-if="loading" class="loading">
        <text>加载中...</text>
      </view>
      <view v-if="noMore && noteList.length > 0" class="no-more">
        <text>没有更多了</text>
      </view>
      <view v-if="!loading && noteList.length === 0" class="empty-state">
        <text class="empty-text">{{ searchKeyword ? '未找到相关游记' : '暂无游记' }}</text>
      </view>
    </scroll-view>

    <!-- 右下角发布按钮 -->
    <view class="fab-button" @click="publishNote">
      <text class="iconfont icon-tianjia fab-icon"></text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { travelNoteApi, cityApi, travelNoteInteractionApi } from '@/api/content'
import { Search, CloseSmall } from '@icon-park/vue-next'
import { safeNavigateTo } from '@/utils/router'
import { useUserStore } from '@/store/user'

const store = useUserStore()
const user = computed(() => store.state.profile)

// API 响应类型定义
interface ApiResponse<T = any> {
  code: number
  msg?: string
  data: T
}

const cityList = ref<{ id: number | null; name: string }[]>([
  { id: null, name: '全部城市' },
])

const selectedCity = ref<{ id: number | null; name: string } | null>(null)
const sortBy = ref('hot')
const noteList = ref<any[]>([])
const allNoteList = ref<any[]>([]) // 存储所有数据用于搜索
const pageNum = ref(1)
const pageSize = ref(10)
const loading = ref(false)
const noMore = ref(false)
const searchKeyword = ref('')
const shouldAnimateMap = ref<Record<number, boolean>>({})

const onCityChange = (e: any) => {
  selectedCity.value = cityList.value[e.detail.value]
  pageNum.value = 1
  noteList.value = []
  allNoteList.value = [] // 清空全部列表
  noMore.value = false
  searchKeyword.value = '' // 清空搜索
  loadNotes()
}

const changeSort = (sort: string) => {
  sortBy.value = sort
  pageNum.value = 1
  noteList.value = []
  allNoteList.value = [] // 清空全部列表
  noMore.value = false
  searchKeyword.value = '' // 清空搜索
  loadNotes()
}

const loadNotes = async () => {
  if (loading.value || noMore.value) return

  loading.value = true

  try {
    const params: any = {
      pageNum: pageNum.value,
      pageSize: pageSize.value,
      sortBy: sortBy.value,
    }

    // 只在 cityId 有有效值时才添加该参数
    if (selectedCity.value?.id != null) {
      params.cityId = selectedCity.value.id
    }

    const res = await travelNoteApi.list(params)

    const response = res.data as ApiResponse<{ list: any[] }>
    if (res.statusCode === 200 && response.code === 200) {
      const data = response.data
      if (data.list && data.list.length > 0) {
        // 初始化点赞状态
        const newNotes = data.list.map((item: any) => ({
          ...item,
          isLiked: item.isLiked || false,
          commentCount: item.commentCount !== undefined ? item.commentCount : (item.comment_count || 0)
        }))
        noteList.value.push(...newNotes)
        allNoteList.value.push(...newNotes) // 保存到全部列表
        
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
    uni.showToast({
      title: '加载失败',
      icon: 'none',
    })
  } finally {
    loading.value = false
  }
}

// 搜索功能
const handleSearch = () => {
  if (!searchKeyword.value.trim()) {
    // 如果搜索关键词为空，恢复显示所有数据
    noteList.value = [...allNoteList.value]
    return
  }

  const keyword = searchKeyword.value.toLowerCase().trim()
  const filtered = allNoteList.value.filter((note: any) => {
    // 搜索标题和内容
    const titleMatch = note.title?.toLowerCase().includes(keyword)
    const contentMatch = note.content?.toLowerCase().includes(keyword)
    // 搜索作者昵称
    const authorMatch = note.authorName?.toLowerCase().includes(keyword)
    
    return titleMatch || contentMatch || authorMatch
  })
  
  noteList.value = filtered
}

// 搜索输入时实时过滤
const onSearchInput = () => {
  handleSearch()
}

// 清除搜索
const clearSearch = () => {
  searchKeyword.value = ''
  noteList.value = [...allNoteList.value]
}

// 发布游记
const publishNote = () => {
  safeNavigateTo('/pages/travel-note/publish')
}

const loadMore = () => {
  loadNotes()
}

const viewDetail = (id: number) => {
  safeNavigateTo(`/pages/travel-note/detail?id=${id}`)
}

// 点赞切换
const toggleLike = async (note: any) => {
  // 检查登录状态
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
    // 先更新UI状态（乐观更新）
    const wasLiked = note.isLiked
    note.isLiked = !wasLiked
    if (!wasLiked) {
      // 点赞动画
      shouldAnimateMap.value[note.id] = true
      setTimeout(() => {
        shouldAnimateMap.value[note.id] = false
      }, 300)
    }

    // 调用API
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
      // 失败时回滚
      note.isLiked = wasLiked
      note.likeCount = wasLiked ? (note.likeCount || 0) + 1 : Math.max(0, (note.likeCount || 0) - 1)
      uni.showToast({
        title: data.msg || '操作失败',
        icon: 'none',
      })
    }
  } catch (error: any) {
    // 失败时回滚
    note.isLiked = !note.isLiked
    note.likeCount = note.isLiked ? (note.likeCount || 0) + 1 : Math.max(0, (note.likeCount || 0) - 1)
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

const loadCities = async () => {
  try {
    const res = await cityApi.list()
    const response = res.data as ApiResponse<any[]>
    if (res.statusCode === 200 && response.code === 200) {
      const cities = response.data || []
      cityList.value = [
        { id: null, name: '全部城市' },
        ...cities.map((city: any) => ({
          id: city.id,
          name: city.cityName || city.name,
        })),
      ]
    }
  } catch (error) {
    // 忽略城市列表加载错误
  }
}

onMounted(() => {
  loadCities().then(() => {
    selectedCity.value = cityList.value[0]
    loadNotes()
  })
})
</script>

<style scoped>
.note-list-page {
  min-height: 100vh;
  background-color: #f7f8fa;
  position: relative;
}

/* 搜索框样式 */
.search-header {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 24rpx;
  background-color: #ffffff;
  border-bottom: 1rpx solid #f0f0f0;
}

.search-icon-btn {
  width: 64rpx;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f7f8fa;
  border-radius: 50%;
  flex-shrink: 0;
  transition: all 0.3s ease;
}

.search-icon-btn:active {
  background-color: #e8e8e8;
  transform: scale(0.95);
}

.search-icon-right {
  flex-shrink: 0;
}

.search-wrapper {
  display: flex;
  align-items: center;
  padding: 20rpx 24rpx;
  background-color: #f7f8fa;
  border-radius: 48rpx;
  transition: all 0.3s ease;
}

.search-wrapper:focus-within {
  background-color: #ffffff;
  box-shadow: 0 0 0 2rpx rgba(47, 166, 106, 0.2);
}

.search-icon {
  margin-right: 12rpx;
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  font-size: 28rpx;
  color: #333333;
  background-color: transparent;
}

.clear-icon {
  margin-left: 12rpx;
  padding: 4rpx;
  flex-shrink: 0;
}

/* 筛选栏样式优化 */
.filter-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 32rpx;
  background-color: #fff;
  border-bottom: 1rpx solid #f0f0f0;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
}

.filter-item {
  padding: 14rpx 28rpx;
  background: linear-gradient(135deg, #f7f8fa 0%, #ffffff 100%);
  border-radius: 48rpx;
  font-size: 28rpx;
  color: #333333;
  font-weight: 500;
  border: 1rpx solid #e8e8e8;
  transition: all 0.3s ease;
  position: relative;
}

.filter-item::after {
  content: '▼';
  margin-left: 8rpx;
  font-size: 20rpx;
  opacity: 0.5;
}

.sort-tabs {
  display: flex;
  gap: 16rpx;
  background-color: #f7f8fa;
  padding: 6rpx;
  border-radius: 48rpx;
}

.sort-tab {
  padding: 12rpx 28rpx;
  font-size: 26rpx;
  color: #666666;
  border-radius: 48rpx;
  transition: all 0.3s ease;
}

.sort-tab.active {
  color: #ffffff;
  background: linear-gradient(135deg, #2FA66A 0%, #3BA272 100%);
  font-weight: 600;
  box-shadow: 0 4rpx 12rpx rgba(47, 166, 106, 0.3);
}

.scroll-view {
  height: calc(100vh - 200rpx);
  padding-bottom: 120rpx; /* 为浮动按钮留出空间 */
}

/* 两列布局 */
.note-list {
  display: flex;
  flex-wrap: wrap;
  padding: 24rpx;
  gap: 16rpx;
}

.note-card {
  width: calc(50% - 8rpx);
  background-color: #fff;
  border-radius: 32rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.06);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
}

.note-card:active {
  transform: translateY(-4rpx);
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.12);
}

.note-cover-wrapper {
  width: 100%;
  height: 0;
  padding-bottom: 56.25%; /* 16:9 比例 */
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.note-cover {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: #e5e5e5;
  transition: transform 0.5s ease;
}

.note-card:active .note-cover {
  transform: scale(1.05);
}

/* 内容区域 */
.note-content-wrapper {
  padding: 20rpx;
  position: relative;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

/* 第一行：头像 + 标题 */
.note-header-row {
  display: flex;
  align-items: flex-start;
  gap: 12rpx;
}

.note-author-avatar {
  width: 48rpx;
  height: 48rpx;
  border-radius: 999rpx;
  background-color: #e5e5e5;
  border: 2rpx solid #f0f0f0;
  flex-shrink: 0;
}

.note-title {
  flex: 1;
  font-size: 20rpx;
  font-weight: 600;
  color: #333333;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-width: 0;
}

/* 第二行：发布者昵称 + 点赞 + 评论 */
.note-footer-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12rpx;
}

.note-author-name {
  font-size: 22rpx;
  color: #999999;
  flex-shrink: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 120rpx;
}

/* 统计信息（横向排列） */
.note-stats {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 16rpx;
  flex-shrink: 0;
}

.note-stat-item {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 6rpx;
  transition: all 0.2s;
}

.note-stat-item:active {
  transform: scale(0.95);
}

.note-icon-box {
  width: 40rpx;
  height: 40rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background-color: #f7f8fa;
  transition: all 0.2s;
}

.note-icon-box.is-active {
  animation: pop 0.3s ease-out;
}

@keyframes pop {
  0% { transform: scale(1); }
  50% { transform: scale(1.3); }
  100% { transform: scale(1); }
}

.note-stat-icon {
  font-size: 24rpx;
  line-height: 1;
  color: #666666;
  transition: color 0.2s;
}

/* 点赞图标已点赞状态 */
.note-icon-box .icon-icon.icon-liked {
  color: rgb(162, 59, 81);
}

/* 评论图标颜色 */
.note-icon-box .icon-pinglun {
  color: #666666;
}

.note-stat-text {
  font-size: 22rpx;
  color: #666666;
  transition: all 0.2s;
}

.note-stat-text.text-active {
  color: #3ba272;
  font-weight: 600;
}

.loading {
  text-align: center;
  padding: 120rpx 40rpx;
  color: #999999;
  font-size: 28rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24rpx;
}

.loading::before {
  content: '';
  width: 48rpx;
  height: 48rpx;
  border: 4rpx solid #f3f3f3;
  border-top: 4rpx solid #2FA66A;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.no-more {
  text-align: center;
  padding: 60rpx 40rpx;
  color: #999999;
  font-size: 26rpx;
  position: relative;
}

.no-more::before {
  content: '—';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 40rpx;
  opacity: 0.3;
}

.empty-state {
  text-align: center;
  padding: 120rpx 40rpx;
  color: #9EA7B0;
  font-size: 28rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24rpx;
}

.empty-state::before {
  content: '📝';
  font-size: 120rpx;
  opacity: 0.3;
}

.empty-text {
  color: #999999;
}

/* 右下角浮动按钮 */
.fab-button {
  position: fixed;
  right: 32rpx;
  bottom: calc(32rpx + env(safe-area-inset-bottom));
  width: 112rpx;
  height: 112rpx;
  background: linear-gradient(135deg, #2FA66A 0%, #3BA272 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 24rpx rgba(47, 166, 106, 0.4);
  z-index: 999;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.fab-button:active {
  transform: scale(0.9);
  box-shadow: 0 4rpx 16rpx rgba(47, 166, 106, 0.5);
}

.fab-icon {
  color: #ffffff;
  font-size: 56rpx;
  line-height: 1;
}
</style>

