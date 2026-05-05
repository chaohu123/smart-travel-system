<template>
  <view class="hot-routes-page">
    <!-- 路线列表 -->
    <scroll-view
      scroll-y
      class="routes-scroll"
      refresher-enabled
      :refresher-triggered="refreshing"
      @refresherrefresh="onRefresh"
    >
      <!-- 顶部搜索与筛选（简洁版） -->
      <view class="filter-bar">
        <view class="search-box">
          <text class="search-icon iconfont icon-sousuo"></text>
          <input
            class="search-input"
            v-model="keyword"
            placeholder="搜索路线名称/简介"
            confirm-type="search"
            @confirm="onSearchConfirm"
          />
          <view v-if="keyword" class="clear-btn" @click="clearKeyword">
            <text class="clear-icon">×</text>
          </view>
        </view>

        <view class="bar-actions">
          <view class="filter-entry" @click.stop="filterPopupVisible = true">
            <text class="iconfont icon-qita filter-entry-icon"></text>
            <text class="filter-entry-text">筛选</text>
            <text v-if="filterActiveHint" class="filter-dot"></text>
          </view>
          <view class="result-hint" v-if="!loading && routeList.length > 0">
            <text class="hint-text">共 {{ filteredRoutes.length }} 条</text>
          </view>
        </view>
      </view>

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
          v-for="route in pagedRoutes"
          :key="route.id"
          class="route-card"
          @click="onViewRoute(route)"
        >
          <!-- 封面图片 -->
          <view class="route-cover-wrapper">
            <image
              class="route-cover"
              :src="route.coverImage || 'https://ts2.tc.mm.bing.net/th/id/OIP-C.D0FxyIfldS08x95YBJdFQAHaFj?rs=1&pid=ImgDetMain&o=7&rm=3'"
              mode="aspectFill"
            />
            <view class="route-overlay"></view>
            <!-- 热度标签 -->
            <view class="route-hot-badge" v-if="getHotIndex(route) <= 3">
              <text class="hot-icon iconfont icon-menpiao"></text>
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
                <text class="stat-icon iconfont icon-liulan"></text>
                <text class="stat-value">{{ formatCount(route.viewCount) }}</text>
              </view>
              <view class="stat-divider"></view>
              <view class="stat-item">
                <text class="stat-icon iconfont icon-aixin"></text>
                <text class="stat-value">{{ formatCount(route.favoriteCount) }}</text>
              </view>
              <view class="stat-divider"></view>
              <view class="stat-item">
                <text class="stat-icon iconfont icon-weizhi"></text>
                <text class="stat-value">{{ formatCount(route.useCount) }}</text>
              </view>
            </view>
          </view>
        </view>

        <!-- 空状态 -->
        <view v-if="!loading && filteredRoutes.length === 0" class="empty-state">
          <text class="empty-icon iconfont icon-map"></text>
          <text class="empty-text">{{ routeList.length === 0 ? '暂无热门路线' : '没有符合条件的路线' }}</text>
          <text class="empty-desc">{{ routeList.length === 0 ? '稍后再来看看吧' : '试试调整搜索或筛选条件' }}</text>
        </view>
      </view>
    </scroll-view>

    <!-- 底部居中分页 -->
    <view v-if="!loading && filteredRoutes.length > 0" class="pagination-dock">
      <view class="pagination">
        <button
          class="page-btn"
          :disabled="pageNum === 1"
          @click="goPrevPage"
        >
          上一页
        </button>
        <text class="page-info">第 {{ pageNum }} / {{ totalPages }} 页</text>
        <button
          class="page-btn"
          :disabled="pageNum === totalPages"
          @click="goNextPage"
        >
          下一页
        </button>
      </view>
    </view>

    <!-- 筛选弹层 -->
    <view
      v-if="filterPopupVisible"
      class="filter-mask"
      @click="filterPopupVisible = false"
    >
      <view class="filter-popup" @click.stop>
        <view class="filter-popup-title">筛选</view>

        <view class="filter-field">
          <text class="filter-label">天数</text>
          <view class="chip-row">
            <view
              v-for="d in dayOptions"
              :key="d.value"
              class="chip"
              :class="{ active: filterDays === d.value }"
              @click="filterDays = d.value"
            >
              {{ d.label }}
            </view>
          </view>
        </view>

        <view class="filter-field">
          <text class="filter-label">排序</text>
          <view class="chip-row">
            <view
              v-for="s in sortOptions"
              :key="s.value"
              class="chip"
              :class="{ active: sortKey === s.value }"
              @click="sortKey = s.value"
            >
              {{ s.label }}
            </view>
          </view>
        </view>

        <view class="filter-popup-actions">
          <view class="filter-action ghost" @click="resetFilters">重置</view>
          <view class="filter-action primary" @click="filterPopupVisible = false">完成</view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { onPullDownRefresh, onShow } from '@dcloudio/uni-app'
import { recommendApi, type ApiResponse } from '@/api/content'
import { routeApi } from '@/api/route'
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

// 搜索与筛选（顶部入口 + 弹层）
const keyword = ref('')
const filterPopupVisible = ref(false)
const filterDays = ref<number | 0>(0) // 0=全部
const sortKey = ref<'hot' | 'view' | 'fav' | 'use' | 'daysAsc' | 'daysDesc'>('hot')

const dayOptions = [
  { value: 0, label: '全部' },
  { value: 2, label: '2天' },
  { value: 3, label: '3天' },
  { value: 4, label: '4天' },
  { value: 5, label: '5天' },
  { value: 6, label: '6天' },
  { value: 7, label: '7天' },
]

const sortOptions = [
  { value: 'hot' as const, label: '默认热度' },
  { value: 'view' as const, label: '浏览量最高' },
  { value: 'fav' as const, label: '收藏量最高' },
  { value: 'use' as const, label: '使用量最高' },
  { value: 'daysAsc' as const, label: '天数最少' },
  { value: 'daysDesc' as const, label: '天数最多' },
]

const filterActiveHint = computed(() => !!(filterDays.value || sortKey.value !== 'hot'))

const normalizedKeyword = computed(() => keyword.value.trim().toLowerCase())

const filteredRoutes = computed(() => {
  let list = routeList.value.slice()

  const kw = normalizedKeyword.value
  if (kw) {
    list = list.filter(r => {
      const name = (r.routeName || '').toLowerCase()
      const summary = (r.summary || '').toLowerCase()
      return name.includes(kw) || summary.includes(kw)
    })
  }

  // 天数筛选
  if (filterDays.value) {
    list = list.filter(r => Number(r.days || 0) === Number(filterDays.value))
  }

  // 排序（默认保持后端返回顺序，即“默认热度”）
  const safeNum = (n?: number) => (typeof n === 'number' && !Number.isNaN(n) ? n : 0)
  if (sortKey.value === 'view') list.sort((a, b) => safeNum(b.viewCount) - safeNum(a.viewCount))
  if (sortKey.value === 'fav') list.sort((a, b) => safeNum(b.favoriteCount) - safeNum(a.favoriteCount))
  if (sortKey.value === 'use') list.sort((a, b) => safeNum(b.useCount) - safeNum(a.useCount))
  if (sortKey.value === 'daysAsc') list.sort((a, b) => safeNum(a.days) - safeNum(b.days))
  if (sortKey.value === 'daysDesc') list.sort((a, b) => safeNum(b.days) - safeNum(a.days))

  return list
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredRoutes.value.length / pageSize.value)))
const pagedRoutes = computed(() => {
  const start = (pageNum.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredRoutes.value.slice(start, end)
})

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
  // 乐观更新：让用户立即看到 +1（真正数值以回到列表后的刷新为准）
  if (route && route.id) {
    route.viewCount = Number(route.viewCount || 0) + 1
    routeApi.recordView(route.id).catch(() => {
      // 失败时不回滚，避免频繁闪动；回到列表会自动刷新纠正
    })
  }
  uni.navigateTo({ url: `/pages/itinerary/itinerary-detail?id=${route.id}` })
}

// 加载路线列表
const loadRoutes = async (reset = false) => {
  if (loading.value) return

  loading.value = true
  if (reset) {
    pageNum.value = 1
    routeList.value = []
  }

  try {
    const userId = user.value?.id
    // 一次拉取足够多数据，前端本地分页，便于稳定展示底部分页组件
    const limit = 1000
    const res = await recommendApi.routes(userId, limit) as any
    const data = res.data as ApiResponse<RouteItem[]>

    if (res.statusCode === 200 && data.code === 200) {
      const newRoutes = data.data || []
      routeList.value = newRoutes
    } else {
      uni.showToast({
        title: data.msg || '加载失败',
        icon: 'none',
      })
    }
  } catch (error: any) {
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

const goPrevPage = () => {
  if (pageNum.value <= 1 || loading.value) return
  pageNum.value -= 1
}

const goNextPage = () => {
  if (pageNum.value >= totalPages.value || loading.value) return
  pageNum.value += 1
}

const onSearchConfirm = () => {
  pageNum.value = 1
}

const clearKeyword = () => {
  keyword.value = ''
}

const resetFilters = () => {
  keyword.value = ''
  filterDays.value = 0
  sortKey.value = 'hot'
  pageNum.value = 1
}

watch([normalizedKeyword, filterDays, sortKey], () => {
  pageNum.value = 1
})

watch([filteredRoutes], () => {
  if (pageNum.value > totalPages.value) pageNum.value = totalPages.value
})

onMounted(() => {
  loadRoutes(true)
})

// 从详情页返回后刷新一次，确保 viewCount 与后端一致
onShow(() => {
  if (routeList.value.length > 0) {
    loadRoutes(false)
  }
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

/* 滚动区域 */
.routes-scroll {
  flex: 1;
  padding: 24rpx 24rpx 180rpx;
  box-sizing: border-box;
}

/* 搜索与筛选 */
.filter-bar {
  position: sticky;
  top: 0;
  z-index: 10;
  padding: 16rpx 0 18rpx;
  margin-bottom: 8rpx;
  background: rgba(247, 248, 250, 0.92);
  backdrop-filter: blur(14rpx);
}

.search-box {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 14rpx 16rpx;
  border-radius: 999rpx;
  background: #ffffff;
  border: 1rpx solid #e5eee8;
  box-shadow: 0 8rpx 20rpx rgba(53, 83, 69, 0.10);
}

.search-icon {
  font-size: 28rpx;
  line-height: 1;
  color: #667085;
}

.search-input {
  flex: 1;
  font-size: 26rpx;
  color: #333333;
}

.clear-btn {
  width: 52rpx;
  height: 52rpx;
  border-radius: 999rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f2f4f7;
}

.clear-icon {
  font-size: 34rpx;
  line-height: 1;
  color: #667085;
}

.bar-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
  margin-top: 14rpx;
}

.filter-entry {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 12rpx 18rpx;
  background: #ffffff;
  border-radius: 999rpx;
  border: 1rpx solid #e5eee8;
  box-shadow: 0 6rpx 16rpx rgba(53, 83, 69, 0.08);
  position: relative;
}

.filter-entry-icon {
  font-size: 24rpx;
  color: #3ba272;
}

.filter-entry-text {
  font-size: 24rpx;
  color: #344054;
  font-weight: 600;
}

.filter-dot {
  position: absolute;
  top: 8rpx;
  right: 12rpx;
  width: 12rpx;
  height: 12rpx;
  border-radius: 50%;
  background: #ff6b6b;
}

.result-hint {
  padding: 0 8rpx;
}

.hint-text {
  font-size: 22rpx;
  color: #667085;
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
/* 底部居中分页 */
.pagination-dock {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 20;
  padding: 16rpx 24rpx calc(env(safe-area-inset-bottom) + 16rpx);
  background: linear-gradient(180deg, rgba(247, 248, 250, 0) 0%, rgba(247, 248, 250, 0.94) 28%, #f7f8fa 100%);
  display: flex;
  justify-content: center;
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20rpx;
  background: #ffffff;
  border-radius: 999rpx;
  border: 1rpx solid #e5eee8;
  padding: 10rpx 14rpx;
  box-shadow: 0 10rpx 26rpx rgba(53, 83, 69, 0.12);
}

.page-btn {
  min-width: 110rpx;
  padding: 10rpx 22rpx;
  border-radius: 999rpx;
  font-size: 24rpx;
  border: none;
  background-color: #2fa66a;
  color: #ffffff;
  line-height: 1.4;
}

.page-btn[disabled] {
  background-color: #d0d5dd;
  color: #ffffff;
}

.page-info {
  font-size: 24rpx;
  color: #666666;
}

/* 筛选弹层 */
.filter-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 200;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40rpx 32rpx;
  box-sizing: border-box;
}

.filter-popup {
  width: 100%;
  max-width: 640rpx;
  background: #ffffff;
  border-radius: 24rpx;
  padding: 28rpx 28rpx 24rpx;
  box-shadow: 0 16rpx 48rpx rgba(0, 0, 0, 0.12);
}

.filter-popup-title {
  font-size: 32rpx;
  font-weight: 700;
  color: #333;
  margin-bottom: 22rpx;
  text-align: center;
}

.filter-field {
  margin-bottom: 26rpx;
}

.filter-label {
  display: block;
  font-size: 24rpx;
  color: #72807a;
  margin-bottom: 12rpx;
}

.chip-row {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 12rpx;
}

.chip {
  padding: 12rpx 22rpx;
  border-radius: 999rpx;
  font-size: 24rpx;
  color: #5a6762;
  background: #f5f7f6;
  border: 1rpx solid #e8eeea;
}

.chip.active {
  background: #e8f7ef;
  color: #3ba272;
  border-color: #b8e0cc;
  font-weight: 600;
}

.filter-popup-actions {
  display: flex;
  flex-direction: row;
  gap: 16rpx;
  margin-top: 8rpx;
}

.filter-action {
  flex: 1;
  text-align: center;
  padding: 22rpx 0;
  border-radius: 999rpx;
  font-size: 28rpx;
}

.filter-action.ghost {
  background: #f5f7f6;
  color: #5a6762;
  border: 1rpx solid #e8eeea;
}

.filter-action.primary {
  background: linear-gradient(135deg, #3ba272 0%, #57c18c 100%);
  color: #ffffff;
  font-weight: 600;
}
</style>

