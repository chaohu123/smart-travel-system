<template>
  <view class="history-page">
    <scroll-view
      scroll-y
      class="history-scroll"
      refresher-enabled
      :refresher-triggered="refreshing"
      @refresherrefresh="onRefresh"
    >
      <view v-if="loading && allHistory.length === 0" class="skeleton-container">
        <view v-for="i in 4" :key="i" class="route-card-skeleton">
          <view class="skeleton-cover"></view>
          <view class="skeleton-content">
            <view class="skeleton-title"></view>
            <view class="skeleton-desc"></view>
            <view class="skeleton-meta"></view>
          </view>
        </view>
      </view>

      <view v-else-if="!loading && allHistory.length === 0" class="empty-wrap">
        <view class="empty-state">
          <text class="empty-icon iconfont icon-map"></text>
          <text class="empty-text">暂无规划历史</text>
          <text class="empty-desc">去生成一条专属路线吧</text>
          <button class="create-btn" @click="goToPlan">立即规划</button>
        </view>
      </view>

      <view v-else class="list-shell">
        <view class="list-meta">
          <text class="meta-text">共 {{ filteredHistory.length }} 条规划记录</text>
          <text class="meta-text">第 {{ currentPage }} / {{ totalPages }} 页</text>
        </view>

        <view v-if="filteredHistory.length === 0 && allHistory.length > 0" class="filter-empty">
          <text class="filter-empty-text">暂无符合条件的记录</text>
          <text class="filter-empty-link" @click="resetFilters">清空条件</text>
        </view>

        <view class="routes-list">
        <view
          v-for="route in pagedHistory"
          :key="route.id"
          class="route-card"
          @click="viewDetail(route)"
        >
          <view class="route-cover-wrapper">
            <image
              class="route-cover"
              :src="route.coverImage || defaultCover"
              mode="aspectFill"
            />
            <view class="route-overlay"></view>
            <view class="route-days-badge">
              <text class="days-text">{{ route.days || 0 }}天</text>
            </view>
          </view>

          <view class="route-info">
            <view class="route-header">
              <text class="route-name">{{ route.routeName || route.title || '未命名路线' }}</text>
              <view class="route-actions" @click.stop>
                <text class="route-time">{{ formatTime(route.createTime) }}</text>
                <text class="action-btn" @click.stop="openEdit(route)">编辑</text>
                <text class="action-divider">|</text>
                <text class="action-btn danger" @click.stop="confirmDelete(route)">删除</text>
              </view>
            </view>
            <text class="route-summary" v-if="route.summary">{{ route.summary }}</text>
            <view class="route-stats">
              <view class="stat-item stat-loc">
                <text class="iconfont icon-weizhi stat-icon"></text>
                <text class="stat-value stat-value-loc">{{ route.destination || '未知目的地' }}</text>
              </view>
              <view class="stat-right">
                <view class="stat-item stat-compact">
                  <text class="iconfont icon-aixin stat-icon"></text>
                  <text class="stat-value stat-value-num">{{ formatCount(route.favoriteCount) }}</text>
                </view>
                <view class="stat-divider"></view>
                <view class="stat-item stat-compact">
                  <text class="iconfont icon-liulan stat-icon"></text>
                  <text class="stat-value stat-value-num">{{ formatCount(route.viewCount) }}</text>
                </view>
              </view>
            </view>
          </view>
        </view>
        </view>
      </view>
    </scroll-view>

    <view
      v-if="!loading || allHistory.length > 0"
      class="bottom-dock"
    >
      <view class="bottom-dock-inner">
        <view class="search-row">
          <text class="iconfont icon-sousuo search-icon"></text>
          <input
            class="search-input"
            v-model="searchKeyword"
            type="text"
            confirm-type="search"
            placeholder="搜索路线名"
            placeholder-style="color:#b8c4bf;"
          />
          <text
            v-if="searchKeyword"
            class="clear-icon-text"
            @click="searchKeyword = ''"
          >×</text>
        </view>
        <view class="filter-entry-row">
          <view class="filter-pill" @click.stop="filterPopupVisible = true">
            <text class="iconfont icon-chengshi filter-pill-icon"></text>
            <text class="filter-pill-text">按目的地/日期筛选</text>
            <text v-if="filterActiveHint" class="filter-pill-dot"></text>
          </view>
        </view>
        <view v-if="filteredHistory.length > 0" class="pager-inner">
          <view
            class="pager-nav-btn"
            :class="{ disabled: currentPage === 1 }"
            @click="prevPage"
          >上一页</view>
          <view class="pager-pages">
            <view
              v-for="page in visiblePages"
              :key="page"
              class="pager-page-btn"
              :class="{ active: currentPage === page }"
              @click="goPage(page)"
            >
              {{ page }}
            </view>
          </view>
          <view
            class="pager-nav-btn"
            :class="{ disabled: currentPage === totalPages }"
            @click="nextPage"
          >下一页</view>
        </view>
      </view>
    </view>

    <view
      v-if="filterPopupVisible"
      class="filter-mask"
      @click="filterPopupVisible = false"
    >
      <view class="filter-popup" @click.stop>
        <view class="filter-popup-title">筛选</view>
        <view class="filter-field">
          <text class="filter-label">目的地</text>
          <picker
            mode="selector"
            :range="destinationPickerRange"
            :value="destPickerIndex"
            @change="onDestPickerChange"
          >
            <view class="filter-picker-value">
              <text>{{ filterDest || '全部' }}</text>
              <text class="filter-picker-arrow">›</text>
            </view>
          </picker>
        </view>
        <view class="filter-field">
          <text class="filter-label">时间范围</text>
          <view class="date-chip-row">
            <view
              v-for="p in datePresetOptions"
              :key="p.key"
              class="date-chip"
              :class="{ active: filterDatePreset === p.key }"
              @click="filterDatePreset = p.key"
            >
              {{ p.label }}
            </view>
          </view>
        </view>
        <view class="filter-popup-actions">
          <view class="filter-btn ghost" @click="resetFilters">重置</view>
          <view class="filter-btn primary" @click="filterPopupVisible = false">完成</view>
        </view>
      </view>
    </view>

    <!-- 编辑名称弹窗 -->
    <view
      v-if="editPopupVisible"
      class="filter-mask"
      @click="editPopupVisible = false"
    >
      <view class="filter-popup" @click.stop>
        <view class="filter-popup-title">编辑路线名称</view>
        <view class="filter-field">
          <text class="filter-label">名称</text>
          <view class="filter-picker-value">
            <input
              class="edit-input"
              v-model="editName"
              type="text"
              maxlength="50"
              placeholder="输入新的路线名称"
              placeholder-style="color:#b8c4bf;"
            />
          </view>
        </view>
        <view class="filter-popup-actions">
          <view class="filter-btn ghost" @click="editPopupVisible = false">取消</view>
          <view class="filter-btn primary" @click="submitEdit">保存</view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useUserStore } from '@/store/user'
import { routeApi } from '@/api/route'
import { safeSwitchTab } from '@/utils/router'

interface HistoryRouteItem {
  id: number
  routeName?: string
  title?: string
  days?: number
  coverImage?: string
  summary?: string
  destination?: string
  createTime?: string
  favoriteCount?: number
  viewCount?: number
}

const defaultCover = 'https://ts2.tc.mm.bing.net/th/id/OIP-C.D0FxyIfldS08x95YBJdFQAHaFj?rs=1&pid=ImgDetMain&o=7&rm=3'
const pageSize = 10
const loading = ref(false)
const refreshing = ref(false)
const allHistory = ref<HistoryRouteItem[]>([])
const currentPage = ref(1)
const searchKeyword = ref('')
const filterDest = ref('')
const filterDatePreset = ref<'all' | 'today' | 'week' | 'month'>('all')
const filterPopupVisible = ref(false)
const editPopupVisible = ref(false)
const editRouteId = ref<number | null>(null)
const editName = ref('')

const store = useUserStore()
const user = computed(() => store.state.profile)

const formatCount = (count?: number) => {
  if (!count) return '0'
  if (count >= 10000) return `${(count / 10000).toFixed(1)}w`
  return String(count)
}

const formatTime = (time?: string) => {
  if (!time) return ''
  const date = new Date(time)
  if (Number.isNaN(date.getTime())) return ''
  const diff = Date.now() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days <= 0) return '今天'
  if (days === 1) return '昨天'
  if (days < 7) return `${days}天前`
  return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })
}

const normalizeRoute = (item: any): HistoryRouteItem => {
  return {
    id: Number(item.id || 0),
    routeName: item.routeName || item.title,
    title: item.title,
    days: Number(item.days || 0),
    coverImage: item.coverImage || item.imageUrl,
    summary: item.summary,
    destination: item.destination || item.cityName || item.city || '未知目的地',
    createTime: item.createTime,
    favoriteCount: Number(item.favoriteCount || 0),
    viewCount: Number(item.viewCount || 0),
  }
}

const datePresetOptions = [
  { key: 'all' as const, label: '全部' },
  { key: 'today' as const, label: '今天' },
  { key: 'week' as const, label: '近7天' },
  { key: 'month' as const, label: '近30天' },
]

const matchesDateFilter = (createTime?: string) => {
  if (filterDatePreset.value === 'all') return true
  if (!createTime) return true
  const t = new Date(createTime).getTime()
  if (Number.isNaN(t)) return true
  const now = Date.now()
  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)
  if (filterDatePreset.value === 'today') return t >= startOfToday.getTime()
  if (filterDatePreset.value === 'week') return now - t <= 7 * 24 * 60 * 60 * 1000
  if (filterDatePreset.value === 'month') return now - t <= 30 * 24 * 60 * 60 * 1000
  return true
}

const filteredHistory = computed(() => {
  let list = allHistory.value
  const kw = searchKeyword.value.trim().toLowerCase()
  if (kw) {
    list = list.filter((r) => {
      const name = (r.routeName || r.title || '').toLowerCase()
      return name.includes(kw)
    })
  }
  if (filterDest.value) {
    list = list.filter((r) => (r.destination || '') === filterDest.value)
  }
  list = list.filter((r) => matchesDateFilter(r.createTime))
  return list
})

const filterActiveHint = computed(
  () => !!(filterDest.value || filterDatePreset.value !== 'all'),
)

const destinationPickerRange = computed(() => {
  const set = new Set<string>()
  allHistory.value.forEach((r) => {
    if (r.destination) set.add(r.destination)
  })
  return ['全部', ...Array.from(set).sort()]
})

const destPickerIndex = computed(() => {
  const range = destinationPickerRange.value
  const key = filterDest.value ? filterDest.value : '全部'
  const idx = range.indexOf(key)
  return idx >= 0 ? idx : 0
})

const onDestPickerChange = (e: any) => {
  const idx = Number(e.detail.value)
  const range = destinationPickerRange.value
  const v = range[idx]
  filterDest.value = v === '全部' ? '' : v
}

const resetFilters = () => {
  searchKeyword.value = ''
  filterDest.value = ''
  filterDatePreset.value = 'all'
  currentPage.value = 1
}

const mergeHistory = (serverList: any[], localList: any[]) => {
  const safeNum = (v: any) => {
    const n = Number(v)
    return Number.isFinite(n) ? n : 0
  }
  const pickMaxCount = (a: any, b: any) => Math.max(safeNum(a), safeNum(b))

  const merged = new Map<number, HistoryRouteItem>()
  ;[...serverList, ...localList].forEach((raw: any) => {
    const item = normalizeRoute(raw)
    if (!item.id) return
    const exist = merged.get(item.id)
    if (!exist) {
      merged.set(item.id, item)
      return
    }
    merged.set(item.id, {
      ...exist,
      ...item,
      routeName: item.routeName || exist.routeName,
      destination: item.destination || exist.destination,
      coverImage: item.coverImage || exist.coverImage,
      summary: item.summary || exist.summary,
      createTime: item.createTime || exist.createTime,
      // 计数类字段：本地缓存可能是旧值/0，不应覆盖后端真实值
      viewCount: pickMaxCount(exist.viewCount, item.viewCount),
      favoriteCount: pickMaxCount(exist.favoriteCount, item.favoriteCount),
      useCount: pickMaxCount(exist.useCount, item.useCount),
    })
  })
  return Array.from(merged.values()).sort((a, b) => {
    const at = new Date(a.createTime || '').getTime() || 0
    const bt = new Date(b.createTime || '').getTime() || 0
    return bt - at
  })
}

const totalPages = computed(() => {
  const n = filteredHistory.value.length
  if (n === 0) return 1
  return Math.ceil(n / pageSize)
})
const pagedHistory = computed(() => {
  const list = filteredHistory.value
  const start = (currentPage.value - 1) * pageSize
  return list.slice(start, start + pageSize)
})
const visiblePages = computed(() => {
  const total = totalPages.value
  if (total <= 5) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }
  let start = Math.max(1, currentPage.value - 2)
  let end = Math.min(total, start + 4)
  if (end - start < 4) {
    start = Math.max(1, end - 4)
  }
  const pages: number[] = []
  for (let i = start; i <= end; i++) pages.push(i)
  return pages
})

watch([searchKeyword, filterDest, filterDatePreset], () => {
  currentPage.value = 1
})

watch(
  () => [filteredHistory.value.length, totalPages.value] as const,
  () => {
    if (currentPage.value > totalPages.value) {
      currentPage.value = Math.max(1, totalPages.value)
    }
  },
)

const loadHistory = async (reset = false) => {
  if (!user.value?.id) {
    allHistory.value = []
    currentPage.value = 1
    return
  }
  if (loading.value) return
  loading.value = true
  try {
    const local = uni.getStorageSync(`plan_history_${user.value.id}`) || []
    let serverList: any[] = []
    const res = await routeApi.listMyRoutes(user.value.id)
    if (res?.statusCode === 200 && res?.data?.code === 200) {
      serverList = Array.isArray(res.data.data) ? res.data.data : (res.data.data?.list || [])
    }
    allHistory.value = mergeHistory(serverList, local)
    if (reset) currentPage.value = 1
  } catch (e) {
    const local = uni.getStorageSync(`plan_history_${user.value.id}`) || []
    allHistory.value = mergeHistory([], local)
    if (reset) currentPage.value = 1
  } finally {
    loading.value = false
    refreshing.value = false
  }
}

const onRefresh = () => {
  refreshing.value = true
  loadHistory(true)
}

const prevPage = () => {
  if (currentPage.value > 1) currentPage.value -= 1
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) currentPage.value += 1
}

const goPage = (page: number) => {
  if (page < 1 || page > totalPages.value) return
  currentPage.value = page
}

const viewDetail = (item: HistoryRouteItem) => {
  if (!item.id) return
  uni.navigateTo({
    url: `/pages/itinerary/itinerary-detail?id=${encodeURIComponent(item.id)}`,
    success: () => {
      // 先跳转，后异步处理“默认 +1”
      setTimeout(() => {
        // 乐观更新：列表 +1（返回列表时也会用后端刷新校准）
        item.viewCount = Number(item.viewCount || 0) + 1

        // 更新本地缓存，避免 merge 时被旧缓存覆盖
        try {
          const userId = user.value?.id
          if (userId) {
            const storageKey = `plan_history_${userId}`
            const history = (uni.getStorageSync(storageKey) || []) as any[]
            const next = history.map((it) => {
              if (Number(it?.id) !== Number(item.id)) return it
              return { ...it, viewCount: Number(it?.viewCount || 0) + 1 }
            })
            uni.setStorageSync(storageKey, next)
          }
        } catch {
          // ignore
        }

        // 后台记录浏览（不阻塞跳转）
        routeApi.recordView(Number(item.id)).catch(() => {})
      }, 0)
    },
  })
}

const openEdit = (item: HistoryRouteItem) => {
  editRouteId.value = Number(item.id)
  editName.value = (item.routeName || item.title || '').trim()
  editPopupVisible.value = true
}

const submitEdit = async () => {
  const rid = editRouteId.value
  const name = editName.value.trim()
  if (!rid) return
  if (!name) {
    uni.showToast({ title: '请输入名称', icon: 'none' })
    return
  }
  try {
    await routeApi.updateName(rid, name)
  } catch (e) {
    // ignore: 仍允许本地更新
  }

  // 更新本地缓存
  const userId = user.value?.id
  if (userId) {
    const storageKey = `plan_history_${userId}`
    const history = (uni.getStorageSync(storageKey) || []) as any[]
    const next = history.map((it) => {
      if (Number(it?.id) !== Number(rid)) return it
      return { ...it, routeName: name, title: name }
    })
    uni.setStorageSync(storageKey, next)
  }

  // 更新内存列表
  allHistory.value = allHistory.value.map((r) => (r.id === rid ? { ...r, routeName: name, title: name } : r))
  editPopupVisible.value = false
  uni.showToast({ title: '已保存', icon: 'success' })
}

const confirmDelete = (item: HistoryRouteItem) => {
  const rid = Number(item.id)
  if (!rid) return
  uni.showModal({
    title: '删除路线',
    content: '确定要删除这条路线吗？删除后不可恢复。',
    confirmText: '删除',
    cancelText: '取消',
    success: async (res) => {
      if (!res.confirm) return
      try {
        await routeApi.discard(rid)
      } catch (e) {
        // ignore
      }
      const userId = user.value?.id
      if (userId) {
        const storageKey = `plan_history_${userId}`
        const history = (uni.getStorageSync(storageKey) || []) as any[]
        uni.setStorageSync(storageKey, history.filter((it) => Number(it?.id) !== Number(rid)))
      }
      allHistory.value = allHistory.value.filter((r) => r.id !== rid)
      uni.showToast({ title: '已删除', icon: 'success' })
    },
  })
}

const goToPlan = () => {
  safeSwitchTab('/pages/route/plan').catch(() => {})
}

onMounted(() => {
  loadHistory(true)
})

onShow(() => {
  loadHistory(true)
})
</script>

<style scoped>
.history-page {
  min-height: 100vh;
  background-color: #f7f8fa;
  display: flex;
  flex-direction: column;
}

.history-scroll {
  flex: 1;
  padding: 24rpx 24rpx 320rpx;
  box-sizing: border-box;
}

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

.skeleton-title,
.skeleton-desc,
.skeleton-meta {
  height: 26rpx;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s ease-in-out infinite;
  border-radius: 8rpx;
}

.skeleton-title {
  height: 32rpx;
}

.skeleton-desc {
  width: 80%;
}

.skeleton-meta {
  width: 60%;
}

@keyframes skeleton-loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

.list-shell {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.list-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #ffffff;
  border-radius: 16rpx;
  padding: 16rpx 20rpx;
  border: 1rpx solid #edf2ef;
}

.meta-text {
  font-size: 22rpx;
  color: #72807a;
}

.routes-list {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
  padding-bottom: 24rpx;
}

.route-card {
  background-color: #ffffff;
  border-radius: 22rpx;
  overflow: hidden;
  border: 1rpx solid #edf2ef;
  box-shadow: 0 8rpx 22rpx rgba(53, 83, 69, 0.08);
  padding: 16rpx;
  display: flex;
  gap: 16rpx;
}

.route-cover-wrapper {
  position: relative;
  width: 220rpx;
  min-width: 220rpx;
  height: 180rpx;
  border-radius: 16rpx;
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
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.05) 0%, rgba(0, 0, 0, 0.32) 100%);
}

.route-days-badge {
  position: absolute;
  top: 16rpx;
  right: 16rpx;
  padding: 8rpx 16rpx;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 999rpx;
}

.days-text {
  font-size: 22rpx;
  font-weight: 600;
  color: #ffffff;
  line-height: 1;
}

.route-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.route-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8rpx;
  gap: 12rpx;
}

.route-actions {
  display: flex;
  align-items: center;
  gap: 12rpx;
  flex: 0 0 auto;
  flex-shrink: 0;
}

.action-btn {
  font-size: 22rpx;
  color: #3ba272;
  padding: 8rpx 10rpx;
  border-radius: 999rpx;
  background: #f3fbf6;
}

.action-btn.danger {
  color: #d64545;
  background: #fff4f4;
}

.action-divider {
  font-size: 22rpx;
  color: #c8c8c8;
}

.edit-input {
  width: 100%;
  font-size: 28rpx;
  color: #333;
}

.route-name {
  flex: 1;
  font-size: 28rpx;
  font-weight: 600;
  color: #333333;
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.route-time {
  font-size: 22rpx;
  color: #999999;
  white-space: nowrap;
}

.route-summary {
  font-size: 22rpx;
  color: #666666;
  line-height: 1.55;
  margin-bottom: 12rpx;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 68rpx;
}

.route-stats {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  align-items: center;
  gap: 12rpx;
  padding-top: 10rpx;
  border-top: 1rpx solid #f0f0f0;
  margin-top: auto;
  min-width: 0;
  overflow: hidden;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4rpx;
  min-width: 0;
}

.stat-loc {
  flex: 1 1 0;
  min-width: 0;
  overflow: hidden;
}

.stat-right {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  align-items: center;
  flex: 0 0 auto;
  flex-shrink: 0;
}

.stat-compact {
  flex: 0 0 auto;
}

.stat-icon {
  font-size: 22rpx;
  color: #3ba272;
  flex-shrink: 0;
}

.stat-value {
  font-size: 20rpx;
  color: #666666;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.stat-value-loc {
  flex: 1 1 auto;
  min-width: 0;
  max-width: 100%;
}

.stat-value-num {
  max-width: 72rpx;
}

.stat-divider {
  width: 1rpx;
  height: 24rpx;
  background-color: #e5e5e5;
  flex-shrink: 0;
  margin: 0 6rpx;
}

.filter-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16rpx;
  padding: 32rpx 24rpx;
  background: #fff8f0;
  border-radius: 16rpx;
  border: 1rpx solid #ffe8cc;
}

.filter-empty-text {
  font-size: 24rpx;
  color: #996633;
}

.filter-empty-link {
  font-size: 24rpx;
  color: #3ba272;
  font-weight: 600;
}

.empty-wrap {
  min-height: 72vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
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

.create-btn {
  margin-top: 20rpx;
  background: linear-gradient(135deg, #3ba272, #57c18c);
  color: #fff;
  border: none;
  border-radius: 999rpx;
  padding: 0 56rpx;
  line-height: 72rpx;
  font-size: 28rpx;
}

.bottom-dock {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 100;
  padding: 12rpx 24rpx calc(env(safe-area-inset-bottom) + 12rpx);
  background: linear-gradient(180deg, rgba(247, 248, 250, 0) 0%, rgba(247, 248, 250, 0.92) 18%, #f7f8fa 100%);
  pointer-events: none;
}

.bottom-dock-inner {
  pointer-events: auto;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 12rpx;
}

.search-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 12rpx;
  background: #ffffff;
  border-radius: 999rpx;
  padding: 12rpx 20rpx;
  border: 1rpx solid #e5eee8;
  box-shadow: 0 6rpx 20rpx rgba(53, 83, 69, 0.08);
}

.search-icon {
  font-size: 28rpx;
  color: #3ba272;
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  min-width: 0;
  font-size: 26rpx;
  color: #333;
  height: 44rpx;
  line-height: 44rpx;
}

.clear-icon-text {
  font-size: 36rpx;
  color: #c0c8c4;
  line-height: 1;
  padding: 0 4rpx;
  flex-shrink: 0;
}

.filter-entry-row {
  display: flex;
  justify-content: center;
}

.filter-pill {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  padding: 14rpx 28rpx;
  background: #ffffff;
  border-radius: 999rpx;
  border: 1rpx solid #e5eee8;
  box-shadow: 0 8rpx 22rpx rgba(53, 83, 69, 0.1);
  position: relative;
}

.filter-pill-icon {
  font-size: 26rpx;
  color: #3ba272;
}

.filter-pill-text {
  font-size: 24rpx;
  color: #3d4a44;
  font-weight: 500;
}

.filter-pill-dot {
  position: absolute;
  top: 10rpx;
  right: 18rpx;
  width: 12rpx;
  height: 12rpx;
  border-radius: 50%;
  background: #ff6b6b;
}

.pager-inner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14rpx;
  background: #ffffff;
  border-radius: 999rpx;
  padding: 10rpx 12rpx;
  border: 1rpx solid #e5eee8;
  box-shadow: 0 10rpx 26rpx rgba(53, 83, 69, 0.12);
}

.pager-nav-btn {
  min-width: 102rpx;
  text-align: center;
  font-size: 22rpx;
  color: #3ba272;
  padding: 10rpx 0;
  border-radius: 999rpx;
  background: #f3fbf6;
}

.pager-nav-btn.disabled {
  color: #c8c8c8;
  background: #f6f6f6;
}

.pager-pages {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.pager-page-btn {
  min-width: 52rpx;
  height: 52rpx;
  border-radius: 26rpx;
  background: #f5f7f6;
  color: #5a6762;
  font-size: 22rpx;
  line-height: 52rpx;
  text-align: center;
}

.pager-page-btn.active {
  background: linear-gradient(135deg, #3ba272 0%, #57c18c 100%);
  color: #ffffff;
  font-weight: 600;
}

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
  margin-bottom: 24rpx;
  text-align: center;
}

.filter-field {
  margin-bottom: 28rpx;
}

.filter-label {
  display: block;
  font-size: 24rpx;
  color: #72807a;
  margin-bottom: 12rpx;
}

.filter-picker-value {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 24rpx;
  background: #f7fbf9;
  border-radius: 16rpx;
  border: 1rpx solid #e5eee8;
  font-size: 28rpx;
  color: #333;
}

.filter-picker-arrow {
  font-size: 32rpx;
  color: #b8c4bf;
}

.date-chip-row {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 12rpx;
}

.date-chip {
  padding: 12rpx 22rpx;
  border-radius: 999rpx;
  font-size: 24rpx;
  color: #5a6762;
  background: #f5f7f6;
  border: 1rpx solid #e8eeea;
}

.date-chip.active {
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

.filter-btn {
  flex: 1;
  text-align: center;
  padding: 22rpx 0;
  border-radius: 999rpx;
  font-size: 28rpx;
}

.filter-btn.ghost {
  background: #f5f7f6;
  color: #5a6762;
  border: 1rpx solid #e8eeea;
}

.filter-btn.primary {
  background: linear-gradient(135deg, #3ba272 0%, #57c18c 100%);
  color: #ffffff;
  font-weight: 600;
}
</style>
