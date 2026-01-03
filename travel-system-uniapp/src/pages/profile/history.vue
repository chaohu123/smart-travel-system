<template>
  <view class="history-page">
    <view class="history-container">
      <!-- 页面头部 -->
      <view class="page-header">
        <text class="page-title">规划历史</text>
        <text class="page-subtitle">查看您的AI行程规划记录</text>
      </view>

      <!-- 筛选栏 -->
      <view class="filter-bar">
        <view
          v-for="filter in filterOptions"
          :key="filter.value"
          class="filter-item"
          :class="{ active: currentFilter === filter.value }"
          @click="switchFilter(filter.value)"
        >
          <text class="filter-text">{{ filter.label }}</text>
        </view>
      </view>

      <!-- 历史列表 -->
      <scroll-view
        scroll-y
        class="history-scroll"
        @scrolltolower="loadMore"
        :refresher-enabled="true"
        :refresher-triggered="refreshing"
        @refresherrefresh="onRefresh"
      >
        <!-- 骨架屏 -->
        <view v-if="loading && historyList.length === 0" class="skeleton-list">
          <view v-for="i in 5" :key="i" class="skeleton-item">
            <view class="skeleton-cover"></view>
            <view class="skeleton-content">
              <view class="skeleton-line"></view>
              <view class="skeleton-line short"></view>
            </view>
          </view>
        </view>

        <!-- 空状态 -->
        <view v-else-if="!loading && historyList.length === 0" class="empty-state">
          <text class="empty-icon">📋</text>
          <text class="empty-text">暂无规划记录</text>
          <text class="empty-tip">去创建您的第一个行程规划吧~</text>
          <button class="create-btn" @click="goToPlan">立即规划</button>
        </view>

        <!-- 历史记录列表 -->
        <view v-else class="history-list">
          <view
            v-for="item in historyList"
            :key="item.id"
            class="history-item"
            @click="viewDetail(item)"
          >
            <view class="item-cover-wrapper">
              <image
                v-if="item.coverImage"
                class="item-cover"
                :src="item.coverImage"
                mode="aspectFill"
              />
              <view v-else class="item-cover-placeholder">
                <text class="placeholder-icon">🗺️</text>
              </view>
              <view v-if="item.status" class="item-status" :class="`status-${item.status}`">
                {{ getStatusText(item.status) }}
              </view>
            </view>

            <view class="item-info">
              <view class="item-header">
                <text class="item-title">{{ item.title || item.routeName || '未命名行程' }}</text>
                <text class="item-time">{{ formatTime(item.createTime) }}</text>
              </view>

              <view class="item-meta">
                <text class="meta-item">
                  <text class="meta-icon">📍</text>
                  {{ item.destination || '未知目的地' }}
                </text>
                <text class="meta-item">
                  <text class="meta-icon">⏱️</text>
                  {{ item.days || 0 }}天
                </text>
              </view>

              <view v-if="item.summary" class="item-summary">
                <text class="summary-text">{{ item.summary }}</text>
              </view>

              <view class="item-footer">
                <view class="item-actions">
                  <view class="action-btn" @click.stop="sharePlan(item)">
                    <text class="iconfont icon-fenxiang"></text>
                    <text>分享</text>
                  </view>
                  <view class="action-btn" @click.stop="deletePlan(item.id)">
                    <text class="iconfont icon-shanchu"></text>
                    <text>删除</text>
                  </view>
                </view>
              </view>
            </view>
          </view>
        </view>

        <!-- 加载更多提示 -->
        <view v-if="hasMore && !loading" class="load-more">
          <text class="load-more-text">上拉加载更多</text>
        </view>
        <view v-if="!hasMore && historyList.length > 0" class="load-more">
          <text class="load-more-text">没有更多了</text>
        </view>
      </scroll-view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '@/store/user'
import { routeApi } from '@/api/route'

const store = useUserStore()
const user = computed(() => store.state.profile)

const filterOptions = [
  { value: 'all', label: '全部' },
  { value: 'completed', label: '已完成' },
  { value: 'ongoing', label: '进行中' },
  { value: 'planned', label: '计划中' }
]

const currentFilter = ref('all')
const historyList = ref<any[]>([])
const loading = ref(false)
const refreshing = ref(false)
const pageNum = ref(1)
const pageSize = ref(10)
const hasMore = ref(true)

// 切换筛选
const switchFilter = (value: string) => {
  currentFilter.value = value
  pageNum.value = 1
  hasMore.value = true
  historyList.value = []
  loadHistory(true)
}

// 加载历史记录
const loadHistory = async (reset = false) => {
  if (!user.value?.id) {
    uni.showToast({ title: '请先登录', icon: 'none' })
    return
  }

  if (reset) {
    pageNum.value = 1
    hasMore.value = true
    historyList.value = []
  }

  if (loading.value || (!reset && !hasMore.value)) {
    return
  }

  loading.value = true

  try {
    // 获取用户的路线列表（作为规划历史）
    const res = await routeApi.listMyRoutes(user.value.id)
    
    if (res && res.statusCode === 200 && res.data.code === 200) {
      let dataList = []
      
      if (Array.isArray(res.data.data)) {
        dataList = res.data.data
      } else if (res.data.data?.list) {
        dataList = res.data.data.list
      }

      // 根据筛选条件过滤
      if (currentFilter.value !== 'all') {
        dataList = dataList.filter((item: any) => {
          const status = item.status || 'planned'
          return status === currentFilter.value
        })
      }

      if (reset) {
        historyList.value = dataList
      } else {
        historyList.value.push(...dataList)
      }

      hasMore.value = dataList.length >= pageSize.value
      if (hasMore.value) {
        pageNum.value++
      }
    }
  } catch (error) {
    console.error('加载规划历史失败', error)
    // 如果API不存在，使用本地存储的模拟数据
    loadLocalHistory()
  } finally {
    loading.value = false
    refreshing.value = false
  }
}

// 加载本地历史（模拟数据）
const loadLocalHistory = () => {
  const localHistory = uni.getStorageSync(`plan_history_${user.value?.id}`) || []
  historyList.value = localHistory
  hasMore.value = false
}

// 下拉刷新
const onRefresh = () => {
  refreshing.value = true
  loadHistory(true)
}

// 加载更多
const loadMore = () => {
  if (!loading.value && hasMore.value) {
    loadHistory(false)
  }
}

// 格式化时间
const formatTime = (time: string) => {
  if (!time) return ''
  const date = new Date(time)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (days === 0) {
    return '今天'
  } else if (days === 1) {
    return '昨天'
  } else if (days < 7) {
    return `${days}天前`
  } else {
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
  }
}

// 获取状态文本
const getStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    'completed': '已完成',
    'ongoing': '进行中',
    'planned': '计划中'
  }
  return statusMap[status] || '计划中'
}

// 查看详情
const viewDetail = (item: any) => {
  if (item.id) {
    uni.navigateTo({ url: `/pages/route/detail?id=${item.id}` })
  } else {
    uni.navigateTo({ url: `/pages/route/plan` })
  }
}

// 分享规划
const sharePlan = (item: any) => {
  uni.showShareMenu({
    withShareTicket: true,
    menus: ['shareAppMessage', 'shareTimeline']
  })
  uni.showToast({ title: '分享功能开发中', icon: 'none' })
}

// 删除规划
const deletePlan = (id: number) => {
  uni.showModal({
    title: '确认删除',
    content: '确定要删除这条规划记录吗？',
    success: (res) => {
      if (res.confirm) {
        // 从列表中移除
        const index = historyList.value.findIndex(item => item.id === id)
        if (index > -1) {
          historyList.value.splice(index, 1)
          uni.showToast({ title: '删除成功', icon: 'success' })
        }
      }
    }
  })
}

// 去规划页面
const goToPlan = () => {
  uni.navigateTo({ url: '/pages/route/plan' })
}

onMounted(() => {
  if (user.value) {
    loadHistory(true)
  }
})
</script>

<style scoped>
.history-page {
  min-height: 100vh;
  background-color: #f8fafb;
}

.history-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.page-header {
  padding: 40rpx;
  background: linear-gradient(135deg, #3ba272, #57c18c);
  border-radius: 0 0 40rpx 40rpx;
}

.page-title {
  display: block;
  font-size: 48rpx;
  font-weight: bold;
  color: #fff;
  margin-bottom: 12rpx;
}

.page-subtitle {
  display: block;
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.9);
}

.filter-bar {
  display: flex;
  padding: 20rpx 40rpx;
  background: #fff;
  border-bottom: 1rpx solid #eee;
  gap: 20rpx;
}

.filter-item {
  padding: 12rpx 24rpx;
  background: #f8fafb;
  border-radius: 40rpx;
  font-size: 26rpx;
  color: #666;
  transition: all 0.3s;
}

.filter-item.active {
  background: #3ba272;
  color: #fff;
  font-weight: 600;
}

.history-scroll {
  flex: 1;
  min-height: 0;
}

.skeleton-list {
  padding: 20rpx;
}

.skeleton-item {
  display: flex;
  background: #fff;
  border-radius: 20rpx;
  padding: 20rpx;
  margin-bottom: 20rpx;
  gap: 20rpx;
}

.skeleton-cover {
  width: 200rpx;
  height: 200rpx;
  background: #f0f0f0;
  border-radius: 16rpx;
  flex-shrink: 0;
}

.skeleton-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.skeleton-line {
  height: 24rpx;
  background: #f0f0f0;
  border-radius: 4rpx;
}

.skeleton-line.short {
  width: 60%;
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
  margin-bottom: 40rpx;
}

.create-btn {
  background: linear-gradient(135deg, #3ba272, #57c18c);
  color: #fff;
  border-radius: 40rpx;
  padding: 20rpx 60rpx;
  font-size: 28rpx;
  border: none;
}

.history-list {
  padding: 20rpx;
}

.history-item {
  background: #fff;
  border-radius: 20rpx;
  overflow: hidden;
  margin-bottom: 20rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
}

.item-cover-wrapper {
  position: relative;
  width: 100%;
  height: 300rpx;
  overflow: hidden;
}

.item-cover {
  width: 100%;
  height: 100%;
}

.item-cover-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #e4f7ef, #d1f2e5);
  display: flex;
  align-items: center;
  justify-content: center;
}

.placeholder-icon {
  font-size: 80rpx;
}

.item-status {
  position: absolute;
  top: 20rpx;
  right: 20rpx;
  padding: 8rpx 16rpx;
  border-radius: 20rpx;
  font-size: 22rpx;
  color: #fff;
}

.status-completed {
  background: #3ba272;
}

.status-ongoing {
  background: #ff9800;
}

.status-planned {
  background: #999;
}

.item-info {
  padding: 24rpx;
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16rpx;
}

.item-title {
  flex: 1;
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
  margin-right: 20rpx;
}

.item-time {
  font-size: 24rpx;
  color: #999;
  flex-shrink: 0;
}

.item-meta {
  display: flex;
  gap: 30rpx;
  margin-bottom: 16rpx;
}

.meta-item {
  font-size: 24rpx;
  color: #666;
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.meta-icon {
  font-size: 28rpx;
}

.item-summary {
  margin-bottom: 20rpx;
}

.summary-text {
  font-size: 26rpx;
  color: #999;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

.item-footer {
  padding-top: 20rpx;
  border-top: 1rpx solid #f5f5f5;
}

.item-actions {
  display: flex;
  justify-content: flex-end;
  gap: 30rpx;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 8rpx;
  font-size: 26rpx;
  color: #666;
}

.action-btn .iconfont {
  font-size: 28rpx;
}

.load-more {
  text-align: center;
  padding: 40rpx;
}

.load-more-text {
  font-size: 24rpx;
  color: #999;
}
</style>

