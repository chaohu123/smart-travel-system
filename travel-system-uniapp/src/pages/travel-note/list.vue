<template>
  <view class="note-list-page">
    <!-- 搜索行：城市下拉 + 搜索输入 + 清除/语音 -->
    <view class="search-row">
      <picker
        mode="selector"
        :range="cityList"
        range-key="name"
        @change="onCityChange"
      >
        <view class="city-picker">
          {{ selectedCity?.name || '全部城市' }}
        </view>
      </picker>
      <view class="search-input-wrapper">
        <text class="iconfont icon-sousuo search-icon"></text>
        <input
          class="search-input"
          v-model="searchKeyword"
          type="text"
          confirm-type="search"
          placeholder="搜索游记内容或作者昵称"
          @confirm="handleSearch"
          @input="onSearchInput"
        />
        <CloseSmall
          v-if="searchKeyword"
          class="clear-icon"
          @click="clearSearch"
          theme="outline"
          size="18"
          fill="#9EA7B0"
        />
      </view>
    </view>

    <!-- 筛选/排序行：排序切换（最热/最新）+ 筛选按钮 -->
    <view class="filter-row">
      <view class="sort-buttons">
        <view
          class="sort-btn"
          :class="{ active: sortBy === 'hot' }"
          @click="changeSort('hot')"
        >
          最热
        </view>
        <view
          class="sort-btn"
          :class="{ active: sortBy === 'time' }"
          @click="changeSort('time')"
        >
          最新
        </view>
      </view>
      <view class="filter-btn" @click="showFilterPanel = true">
        <text class="filter-text">筛选</text>
        <view v-if="hasActiveFilter" class="filter-badge"></view>
      </view>
    </view>

    <!-- 筛选面板 -->
    <view v-if="showFilterPanel" class="filter-panel-overlay" @click="showFilterPanel = false">
      <view class="filter-panel" @tap.stop>
        <view class="filter-panel-header">
          <text class="filter-panel-title">筛选</text>
          <view class="filter-panel-close" @click="showFilterPanel = false">
            <text class="close-icon">×</text>
          </view>
        </view>
        <view class="filter-panel-content">
          <!-- 省份筛选 -->
          <view class="filter-section">
            <text class="filter-section-title">省份</text>
            <view class="filter-options">
              <view
                class="filter-option"
                :class="{ active: selectedProvince === null }"
                @click="selectProvince(null)"
              >
                全部
              </view>
              <view
                v-for="province in provinceList"
                :key="province"
                class="filter-option"
                :class="{ active: selectedProvince === province }"
                @click="selectProvince(province)"
              >
                {{ province }}
              </view>
            </view>
          </view>
          <!-- 城市筛选 -->
          <view class="filter-section">
            <text class="filter-section-title">城市</text>
            <view class="filter-options">
              <view
                class="filter-option"
                :class="{ active: selectedFilterCity === null }"
                @click="selectFilterCity(null)"
              >
                全部
              </view>
              <view
                v-for="city in filteredCityList"
                :key="city.id ?? 'all'"
                class="filter-option"
                :class="{ active: selectedFilterCity === city.id }"
                @click="selectFilterCity(city.id)"
              >
                {{ city.name }}
              </view>
            </view>
          </view>
        </view>
        <view class="filter-panel-footer">
          <view class="filter-reset-btn" @click="resetFilter">重置</view>
          <view class="filter-confirm-btn" @click="applyFilter">确定</view>
        </view>
      </view>
    </view>

    <!-- 卡片列表（两列瀑布/等高卡片） -->
    <scroll-view
      scroll-y
      class="scroll-view"
      @scrolltolower="loadMore"
      @scroll="onScroll"
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
          @click="viewDetail(note.id)"
        >
          <!-- 图片区域（16:9，顶部圆角，cover模式） -->
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
            <!-- 左上角标签（热/新/状态） -->
            <view v-if="getNoteTag(note)" class="note-tag">
              {{ getNoteTag(note) }}
            </view>
          </view>

          <!-- 信息区（白底，轻微内阴影/分割） -->
          <view class="note-info">
            <!-- 第一行：作者头像 + 昵称 + 发布时间 -->
            <view class="note-meta-row">
              <image
                class="note-author-avatar"
                :src="getImageUrl(note.authorAvatar) || defaultAvatar"
                mode="aspectFill"
                @tap.stop="viewAuthorProfile(note.userId)"
              />
              <text class="note-author-name">{{ note.authorName || '匿名用户' }}</text>
              <text class="note-publish-time">{{ formatTime(note.createTime) }}</text>
            </view>

            <!-- 第二行：文章标题（粗体，单行截断带省略号） -->
            <view class="note-title-row">
              <text class="note-title">{{ note.title }}</text>
            </view>

            <!-- 第三行：地点/类别 -->
            <view class="note-location-row">
              <text class="note-location">{{ note.cityName || '未知地点' }}</text>
            </view>

            <!-- 底部：三个小图标与数据（点赞数、评论数、收藏数）- 平均分布 -->
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
        <text class="empty-text">{{ searchKeyword ? '未找到相关游记' : '暂无游记' }}</text>
        <view v-if="!searchKeyword" class="empty-action" @click="publishNote">
          <text>发布游记</text>
        </view>
      </view>
      <view v-else-if="networkError" class="error-state">
        <text class="error-text">网络错误，请重试</text>
        <view class="error-action" @click="retryLoad">
          <text>重试</text>
        </view>
      </view>
    </scroll-view>

    <!-- FAB浮动发布按钮 -->
    <view class="fab-container">
      <view
        class="fab-button"
        :class="{ expanded: fabExpanded }"
        @click="toggleFab"
      >
        <text class="iconfont icon-tianjia fab-icon"></text>
      </view>
      <!-- FAB弹出菜单 -->
      <view v-if="fabExpanded" class="fab-overlay" @click="toggleFab">
        <view class="fab-menu" @tap.stop>
          <view class="fab-menu-item" @click="handleFabAction('publish')">
            <text class="fab-menu-icon iconfont icon-bianji"></text>
            <text class="fab-menu-text">写游记</text>
          </view>
          <view class="fab-menu-item" @click="handleFabAction('image')">
            <text class="fab-menu-icon iconfont icon-camera"></text>
            <text class="fab-menu-text">发图片</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, onUnmounted, nextTick } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { travelNoteApi, cityApi, travelNoteInteractionApi } from '@/api/content'
import CloseSmall from '@icon-park/vue-next/es/icons/CloseSmall'
import { safeNavigateTo } from '@/utils/router'
import { useUserStore } from '@/store/user'
import { getImageUrl } from '@/utils/image'
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
const cityList = ref<{ id: number | null; name: string; province?: string | null }[]>([
  { id: null, name: '全部城市', province: null },
])
const selectedCity = ref<{ id: number | null; name: string; province?: string | null } | null>(null)
const sortBy = ref('hot')
const noteList = ref<any[]>([])
const allNoteList = ref<any[]>([])
const pageNum = ref(1)
const pageSize = ref(10)
const loading = ref(false)
const noMore = ref(false)
const searchKeyword = ref('')
const networkError = ref(false)
const shouldAnimateMap = ref<Record<number, boolean>>({})
const imageLoadedMap = ref<Record<number, boolean>>({})
const fabExpanded = ref(false)

// 筛选相关
const showFilterPanel = ref(false)
const selectedProvince = ref<string | null>(null)
const selectedFilterCity = ref<number | null>(null)
const provinceList = ref<string[]>([])
const filteredCityList = ref<{ id: number | null; name: string; province?: string | null }[]>([])

// 占位图和默认头像
// 使用base64编码的占位图，避免网络请求失败
const placeholderImage = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIyNSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIyNSIgZmlsbD0iI0U1RTVFNSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5RUE3QjAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5Mb2FkaW5nLi4uPC90ZXh0Pjwvc3ZnPg=='
const defaultAvatar = 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=200'

// 滚动位置记录（用于懒加载）
const scrollTop = ref(0)
let initialLoadStarted = false
let skipNextShowRefresh = true
let lastListRefreshTime = 0
const LIST_REFRESH_INTERVAL = 3000

// 城市选择
const onCityChange = (e: any) => {
  selectedCity.value = cityList.value[e.detail.value]
  pageNum.value = 1
  noteList.value = []
  allNoteList.value = []
  noMore.value = false
  searchKeyword.value = ''
  networkError.value = false
  loadNotes()
}

// 排序切换
const changeSort = (sort: string) => {
  sortBy.value = sort
  pageNum.value = 1
  noteList.value = []
  allNoteList.value = []
  noMore.value = false
  searchKeyword.value = ''
  networkError.value = false
  loadNotes()
}

// 加载游记列表
const loadNotes = async () => {
  // 如果正在加载或没有更多数据，则不加载
  if (loading.value || noMore.value) return

  loading.value = true
  networkError.value = false

  try {
    const params: any = {
      pageNum: pageNum.value,
      pageSize: pageSize.value,
      sortBy: sortBy.value,
    }

    if (selectedCity.value?.id != null) {
      params.cityId = selectedCity.value.id
    }

    const res = await travelNoteApi.list(params)
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
        allNoteList.value.push(...newNotes)
        
        // 初始化图片加载状态（只加载前几个可见的图片）
        newNotes.forEach((note: any, index: number) => {
          if (note.coverImage) {
            // 前6个图片立即加载，其他的延迟加载
            if (index < 6) {
              imageLoadedMap.value[note.id] = true
            } else {
              imageLoadedMap.value[note.id] = false
            }
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

// 搜索功能
const handleSearch = () => {
  if (!searchKeyword.value.trim()) {
    noteList.value = [...allNoteList.value]
    return
  }

  const keyword = searchKeyword.value.toLowerCase().trim()
  const filtered = allNoteList.value.filter((note: any) => {
    const titleMatch = note.title?.toLowerCase().includes(keyword)
    const contentMatch = note.content?.toLowerCase().includes(keyword)
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

// 加载更多
const loadMore = () => {
  // 只有在没有搜索关键词时才加载更多
  if (!searchKeyword.value.trim() && !loading.value && !noMore.value) {
    loadNotes()
  }
}

// 滚动事件（用于懒加载）- 使用节流优化性能
let scrollTimer: ReturnType<typeof setTimeout> | null = null
const onScroll = (e: any) => {
  scrollTop.value = e.detail.scrollTop
  
  // 节流：每200ms检查一次懒加载
  if (scrollTimer) {
    clearTimeout(scrollTimer)
  }
  scrollTimer = setTimeout(() => {
    checkLazyLoad()
  }, 200)
}

// 检查懒加载 - 优化：只加载可见区域的图片
const checkLazyLoad = () => {
  // 计算可见区域（简化处理：加载前10个卡片的图片）
  const visibleCount = 10
  noteList.value.slice(0, visibleCount).forEach((note: any) => {
    if (!imageLoadedMap.value[note.id] && note.coverImage) {
      // 立即标记为加载中，避免重复检查
      imageLoadedMap.value[note.id] = true
    }
  })
}

// 图片加载完成
const onImageLoad = (noteId: number) => {
  imageLoadedMap.value[noteId] = true
}

// 图片加载错误
const onImageError = (noteId: number) => {
  imageLoadedMap.value[noteId] = false
}

// 获取游记标签（热/新）
const getNoteTag = (note: any) => {
  if (sortBy.value === 'hot' && (note.likeCount || 0) > 50) {
    return '热'
  }
  if (sortBy.value === 'time') {
    const date = new Date(note.createTime)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    if (days <= 1) {
      return '新'
    }
  }
  return null
}

// 点击防抖
let lastClickTime = 0
const CLICK_DEBOUNCE_TIME = 300

// 查看详情
const viewDetail = (id: number) => {
  const now = Date.now()
  if (now - lastClickTime < CLICK_DEBOUNCE_TIME) {
    return // 防止快速重复点击
  }
  lastClickTime = now
  safeNavigateTo(`/pages/travel-note/detail?id=${id}`)
}

// 查看作者主页
const viewAuthorProfile = (userId: number) => {
  const now = Date.now()
  if (now - lastClickTime < CLICK_DEBOUNCE_TIME) {
    return // 防止快速重复点击
  }
  lastClickTime = now
  
  if (userId) {
    safeNavigateTo(`/pages/profile/user-home?userId=${userId}`)
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
    if (!wasLiked) {
      shouldAnimateMap.value[note.id] = true
      setTimeout(() => {
        shouldAnimateMap.value[note.id] = false
      }, 300)
    }

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

// 加载城市列表
const loadCities = async () => {
  try {
    const res = await cityApi.list()
    const response = res.data as ApiResponse<any[]>
    if (res.statusCode === 200 && response.code === 200) {
      const cities = response.data || []
      const cityData = cities.map((city: any) => ({
        id: city.id,
        name: city.cityName || city.name,
        province: city.province || city.provinceName || extractProvince(city.cityName || city.name),
      }))
      
      cityList.value = [
        { id: null, name: '全部城市', province: null },
        ...cityData,
      ]
      
      // 提取省份列表（去重）
      const provinces = new Set<string>()
      cityData.forEach((city: any) => {
        if (city.province) {
          provinces.add(city.province)
        }
      })
      provinceList.value = Array.from(provinces).sort()
      
      // 初始化筛选城市列表
      filteredCityList.value = [...cityList.value]
    }
  } catch (error) {
    // 忽略城市列表加载错误
  }
}

// 从城市名称提取省份（简单处理，如果城市名包含省份信息）
const extractProvince = (cityName: string): string | null => {
  // 常见省份映射（可以根据实际情况扩展）
  const provinceMap: Record<string, string> = {
    '北京': '北京',
    '上海': '上海',
    '天津': '天津',
    '重庆': '重庆',
    '成都': '四川',
    '西安': '陕西',
    '杭州': '浙江',
    '厦门': '福建',
    '广州': '广东',
    '深圳': '广东',
    '南京': '江苏',
    '苏州': '江苏',
    '武汉': '湖北',
    '长沙': '湖南',
    '郑州': '河南',
    '济南': '山东',
    '青岛': '山东',
    '大连': '辽宁',
    '沈阳': '辽宁',
    '哈尔滨': '黑龙江',
    '长春': '吉林',
    '石家庄': '河北',
    '太原': '山西',
    '合肥': '安徽',
    '南昌': '江西',
    '福州': '福建',
    '南宁': '广西',
    '海口': '海南',
    '昆明': '云南',
    '贵阳': '贵州',
    '拉萨': '西藏',
    '兰州': '甘肃',
    '西宁': '青海',
    '银川': '宁夏',
    '乌鲁木齐': '新疆',
    '呼和浩特': '内蒙古',
  }
  
  for (const [city, province] of Object.entries(provinceMap)) {
    if (cityName.includes(city)) {
      return province
    }
  }
  
  return null
}

// 选择省份
const selectProvince = (province: string | null) => {
  selectedProvince.value = province
  // 根据省份过滤城市列表
  if (province) {
    filteredCityList.value = cityList.value.filter(
      (city) => city.province === province || city.id === null
    )
  } else {
    filteredCityList.value = cityList.value
  }
  // 如果当前选择的城市不在筛选后的列表中，清空城市选择
  if (selectedFilterCity.value !== null) {
    const exists = filteredCityList.value.some((city) => city.id === selectedFilterCity.value)
    if (!exists) {
      selectedFilterCity.value = null
    }
  }
}

// 选择筛选城市
const selectFilterCity = (cityId: number | null) => {
  selectedFilterCity.value = cityId
}

// 重置筛选
const resetFilter = () => {
  selectedProvince.value = null
  selectedFilterCity.value = null
  filteredCityList.value = cityList.value
}

// 应用筛选
const applyFilter = () => {
  showFilterPanel.value = false
  
  // 如果选择了筛选城市，更新选中的城市
  if (selectedFilterCity.value !== null) {
    const city = cityList.value.find((c) => c.id === selectedFilterCity.value)
    if (city) {
      selectedCity.value = city
    }
  } else {
    selectedCity.value = cityList.value[0] // 全部城市
  }
  
  // 重新加载数据
  pageNum.value = 1
  noteList.value = []
  allNoteList.value = []
  noMore.value = false
  searchKeyword.value = ''
  networkError.value = false
  loadNotes()
}

// 是否有激活的筛选条件
const hasActiveFilter = computed(() => {
  return selectedProvince.value !== null || selectedFilterCity.value !== null
})

// FAB相关
const toggleFab = () => {
  fabExpanded.value = !fabExpanded.value
}

const handleFabAction = (action: string) => {
  fabExpanded.value = false
  if (action === 'publish') {
    publishNote()
  } else if (action === 'image') {
    // 发图片功能，暂时跳转到发布页面
    publishNote()
  }
}

const publishNote = () => {
  safeNavigateTo('/pages/travel-note/publish')
}

// 重试加载
const resetAndLoadNotes = () => {
  networkError.value = false
  pageNum.value = 1
  noteList.value = []
  allNoteList.value = []
  noMore.value = false
  loadNotes()
}

const retryLoad = () => {
  resetAndLoadNotes()
}

// 使用 onLoad 来获取页面参数
onLoad(() => {
  initialLoadStarted = true
  loadCities().then(() => {
    selectedCity.value = cityList.value[0]
    resetAndLoadNotes()
    lastListRefreshTime = Date.now()
  })
})

// 从其他页面返回时刷新列表（避免仍显示审核前的旧数据）
onShow(() => {
  if (!initialLoadStarted) return
  if (skipNextShowRefresh) {
    skipNextShowRefresh = false
    return
  }
  const now = Date.now()
  if (now - lastListRefreshTime < LIST_REFRESH_INTERVAL) return
  lastListRefreshTime = now
  resetAndLoadNotes()
})

onMounted(() => {
  // 如果还没有加载数据，则加载（用于 tabbar 切换的情况）
  if (!initialLoadStarted && noteList.value.length === 0 && !loading.value) {
    initialLoadStarted = true
    loadCities().then(() => {
      selectedCity.value = cityList.value[0]
      loadNotes()
    })
  }
})

onUnmounted(() => {
  fabExpanded.value = false
  // 清理滚动定时器
  if (scrollTimer) {
    clearTimeout(scrollTimer)
    scrollTimer = null
  }
})
</script>

<style scoped>
.note-list-page {
  min-height: 100vh;
  background-color: #F6F7F8;
  position: relative;
}

/* 搜索行 */
.search-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 24rpx;
  background-color: #FFFFFF;
  border-bottom: 1rpx solid #F0F0F0;
}

.city-picker {
  padding: 16rpx 24rpx;
  padding-right: 48rpx;
  background-color: #F6F7F8;
  border-radius: 48rpx;
  font-size: 24rpx;
  color: #333333;
  white-space: nowrap;
  position: relative;
  height: 64rpx;
  display: flex;
  align-items: center;
  box-sizing: border-box;
}

.city-picker::after {
  content: '▼';
  position: absolute;
  right: 16rpx;
  top: 50%;
  transform: translateY(-50%);
  font-size: 20rpx;
  color: #9EA7B0;
}

.search-input-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 16rpx 24rpx;
  background-color: #F6F7F8;
  border-radius: 48rpx;
  height: 64rpx;
  box-sizing: border-box;
  min-width: 0;
}

.search-icon {
  flex-shrink: 0;
  font-size: 40rpx;
  color: #9EA7B0;
}

.search-input {
  flex: 1;
  font-size: 24rpx;
  color: #333333;
  background-color: transparent;
}

.clear-icon {
  flex-shrink: 0;
  padding: 4rpx;
}

/* 筛选/排序行 */
.filter-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 24rpx;
  background-color: #FFFFFF;
  border-bottom: 1rpx solid #F0F0F0;
}

.sort-buttons {
  display: flex;
  gap: 16rpx;
  background-color: #F6F7F8;
  padding: 6rpx;
  border-radius: 48rpx;
  width: fit-content;
}

.sort-btn {
  padding: 12rpx 28rpx;
  font-size: 24rpx;
  color: #666666;
  border-radius: 48rpx;
  transition: all 120ms ease;
}

.sort-btn.active {
  color: #FFFFFF;
  background-color: #2FA66A;
  font-weight: 600;
}

/* 筛选按钮 */
.filter-btn {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 12rpx 24rpx;
  background-color: #F6F7F8;
  border-radius: 48rpx;
  font-size: 24rpx;
  color: #666666;
  position: relative;
  transition: all 120ms ease;
}

.filter-btn:active {
  transform: scale(0.95);
  opacity: 0.8;
}

.filter-text {
  font-size: 24rpx;
  color: #666666;
}

.filter-badge {
  position: absolute;
  top: 8rpx;
  right: 8rpx;
  width: 12rpx;
  height: 12rpx;
  background-color: #FF6B6B;
  border-radius: 50%;
  border: 2rpx solid #FFFFFF;
}

/* 筛选面板 */
.filter-panel-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  align-items: flex-end;
  animation: fadeIn 200ms ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.filter-panel {
  width: 100%;
  max-height: 80vh;
  background-color: #FFFFFF;
  border-radius: 32rpx 32rpx 0 0;
  display: flex;
  flex-direction: column;
  animation: slideUp 300ms ease;
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

.filter-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 32rpx 24rpx;
  border-bottom: 1rpx solid #F0F0F0;
}

.filter-panel-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333333;
}

.filter-panel-close {
  width: 48rpx;
  height: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background-color: #F6F7F8;
  transition: all 120ms ease;
}

.filter-panel-close:active {
  transform: scale(0.95);
  opacity: 0.8;
}

.close-icon {
  font-size: 48rpx;
  color: #666666;
  line-height: 1;
  font-weight: 300;
}

.filter-panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 24rpx;
}

.filter-section {
  margin-bottom: 48rpx;
}

.filter-section:last-child {
  margin-bottom: 0;
}

.filter-section-title {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: #333333;
  margin-bottom: 24rpx;
}

.filter-options {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.filter-option {
  padding: 16rpx 32rpx;
  background-color: #F6F7F8;
  border-radius: 48rpx;
  font-size: 24rpx;
  color: #666666;
  transition: all 120ms ease;
  border: 2rpx solid transparent;
}

.filter-option:active {
  transform: scale(0.95);
}

.filter-option.active {
  background-color: #2FA66A;
  color: #FFFFFF;
  font-weight: 600;
  border-color: #2FA66A;
}

.filter-panel-footer {
  display: flex;
  gap: 16rpx;
  padding: 24rpx;
  border-top: 1rpx solid #F0F0F0;
  background-color: #FFFFFF;
}

.filter-reset-btn {
  flex: 1;
  padding: 24rpx;
  background-color: #F6F7F8;
  border-radius: 48rpx;
  text-align: center;
  font-size: 28rpx;
  color: #666666;
  transition: all 120ms ease;
}

.filter-reset-btn:active {
  transform: scale(0.95);
  opacity: 0.8;
}

.filter-confirm-btn {
  flex: 1;
  padding: 24rpx;
  background-color: #2FA66A;
  border-radius: 48rpx;
  text-align: center;
  font-size: 28rpx;
  color: #FFFFFF;
  font-weight: 600;
  transition: all 120ms ease;
}

.filter-confirm-btn:active {
  transform: scale(0.95);
  opacity: 0.8;
}

/* 滚动区域 */
.scroll-view {
  height: calc(100vh - 200rpx);
  padding-bottom: 180rpx;
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

.note-tag {
  position: absolute;
  top: 12rpx;
  left: 12rpx;
  padding: 4rpx 12rpx;
  background-color: rgba(47, 166, 106, 0.9);
  color: #FFFFFF;
  font-size: 20rpx;
  border-radius: 20rpx;
  font-weight: 600;
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

/* FAB浮动按钮 */
.fab-container {
  position: fixed;
  right: 32rpx;
  bottom: calc(120rpx + env(safe-area-inset-bottom));
  z-index: 999;
}

.fab-button {
  width: 112rpx;
  height: 112rpx;
  background-color: #2FA66A;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 24rpx rgba(47, 166, 106, 0.4);
  transition: all 120ms ease;
}

.fab-button:active {
  transform: scale(0.9);
}

.fab-icon {
  color: #FFFFFF;
  font-size: 56rpx;
  line-height: 1;
  transition: transform 120ms ease;
}

.fab-button.expanded .fab-icon {
  transform: rotate(45deg);
}

/* FAB弹出菜单 */
.fab-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.4);
  z-index: 998;
  animation: fadeIn 120ms ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.fab-menu {
  position: absolute;
  right: 32rpx;
  bottom: calc(120rpx + env(safe-area-inset-bottom) + 112rpx + 24rpx);
  display: flex;
  flex-direction: column;
  gap: 24rpx;
  animation: slideUp 120ms ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.fab-menu-item {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 20rpx 32rpx;
  background-color: #FFFFFF;
  border-radius: 48rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.1);
  transition: all 120ms ease;
}

.fab-menu-item:active {
  transform: scale(0.95);
  background-color: #F6F7F8;
}

.fab-menu-icon {
  font-size: 40rpx;
}

.fab-menu-text {
  font-size: 28rpx;
  color: #333333;
  font-weight: 500;
}
</style>
