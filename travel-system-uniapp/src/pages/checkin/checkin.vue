<template>
  <view class="checkin-page">
    <!-- HeaderBar：搜索 + 筛选 -->
    <view class="header-bar">
      <view class="search-wrapper">
        <input
          class="search-input"
          v-model="searchKeyword"
          type="text"
          confirm-type="search"
          :placeholder="activeTab === 'attraction' ? '例如：天安门广场' : '例如：北京烤鸭'"
          @confirm="handleSearch"
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
      <view class="filter-btn" @click="handleSearch">
        <Search class="filter-icon" theme="outline" size="24" fill="#2FA66A" />
      </view>
    </view>

    <!-- 当前位置 / 切换城市 -->
    <view class="location-bar">
      <view class="location-left" @click="handleLocationClick">
        <text class="iconfont icon-map location-map-icon"></text>
        <text class="location-city-text">
          {{ currentCity || '定位中...' }}
        </text>
      </view>
      <view class="location-right" @click="openCitySelector">
        <text class="iconfont icon-chengshi location-city-icon"></text>
        <text class="location-switch-text">切换城市</text>
      </view>
    </view>

    <!-- 活动轮播图 -->
    <view v-if="activityList.length > 0" class="activity-banner">
      <swiper
        class="banner-swiper"
        :indicator-dots="true"
        :autoplay="true"
        :interval="3000"
        :duration="500"
        indicator-color="rgba(255,255,255,0.5)"
        indicator-active-color="#2FA66A"
        circular
      >
        <swiper-item
          v-for="activity in activityList"
          :key="activity.id"
          class="banner-item"
          @click="viewActivity(activity)"
        >
          <image
            class="banner-image"
            :src="getImageUrl(activity.imageUrl) || 'https://images.pexels.com/photos/3581368/pexels-photo-3581368.jpeg?auto=compress&cs=tinysrgb&w=800'"
            mode="aspectFill"
          />
          <view class="banner-content">
            <text class="banner-title">{{ activity.name }}</text>
            <text class="banner-desc">{{ activity.highlight }}</text>
          </view>
        </swiper-item>
      </swiper>
    </view>

    <!-- Tabs：景点 / 美食 -->
    <view class="tabs-header">
      <view
        class="tab-item"
        :class="{ active: activeTab === 'attraction' }"
        @click="switchTab('attraction')"
      >
        <LocalPin class="tab-icon" theme="outline" size="28" fill="#2FA66A" />
        <text class="tab-text">景点</text>
      </view>
      <view
        class="tab-item"
        :class="{ active: activeTab === 'food' }"
        @click="switchTab('food')"
      >
        <KnifeFork class="tab-icon" theme="outline" size="28" fill="#2FA66A" />
        <text class="tab-text">美食</text>
      </view>
    </view>

    <!-- 打卡列表 -->
    <scroll-view 
      scroll-y 
      class="checkin-scroll" 
      @scrolltolower="loadMore"
      refresher-enabled
      :refresher-triggered="refreshing"
      refresher-background="#f5f6f7"
      @refresherrefresh="onRefresh"
    >
      <view class="checkin-list">
        <view
          v-for="item in filteredList"
          :key="item.id"
          class="checkin-card"
          :class="{ 'card-animate': cardAnimate }"
          @click="viewDetail(item)"
        >
          <!-- 图片区域：16:9 比例，左上角标签 -->
          <view class="card-image-wrapper">
          <image
            class="checkin-cover"
            :src="item.cover"
            mode="aspectFill"
          />
            <view v-if="item.tag" class="card-tag" :class="`tag-${item.tag}`">
              {{ item.tag === 'hot' ? '热门' : item.tag === 'new' ? '新' : '' }}
            </view>
          </view>

          <!-- 内容区域 -->
          <view class="checkin-content">
            <!-- 标题 -->
            <text class="checkin-name">{{ item.name }}</text>
            
            <!-- 地点 - 单行显示 -->
            <view class="checkin-location">
              <LocalPin class="location-icon" theme="outline" size="18" fill="#9EA7B0" />
              <text class="location-text">{{ item.location }}</text>
            </view>

            <!-- 底部：统计 + CTA - 单行对齐 -->
            <view class="checkin-footer">
              <view class="checkin-meta">
                <text class="meta-text">已打卡 {{ item.checkinCount }} 次</text>
                <text v-if="item.distance" class="meta-divider">·</text>
                <text v-if="item.distance" class="distance-text">距离 {{ item.distance }}</text>
              </view>
              <button
                class="checkin-btn"
                :class="{ checked: item.isChecked }"
                hover-class="checkin-btn--hover"
                @click.stop="openCheckinModal(item)"
              >
                {{ item.isChecked ? '已打卡' : '去打卡' }}
              </button>
            </view>
          </view>
        </view>
      </view>

      <view v-if="loading" class="loading">
        <text>加载中...</text>
      </view>
      <view v-if="noMore && filteredList.length > 0" class="no-more">
        <text>没有更多了</text>
      </view>
      <view v-if="!loading && filteredList.length === 0" class="empty-state">
        <text>暂无数据</text>
      </view>

      <!-- 分页组件：始终在有数据时显示，用于提示当前页 -->
      <view v-if="!loading && total > 0" class="pagination-wrapper">
        <view class="pagination">
          <button
            class="page-btn"
            :disabled="pageNum === 1"
            @click="goPrevPage"
          >
            上一页
          </button>
          <text class="page-info">
            第 {{ pageNum }} / {{ totalPages }} 页
          </text>
          <button
            class="page-btn"
            :disabled="pageNum === totalPages"
            @click="goNextPage"
          >
            下一页
          </button>
        </view>
      </view>
    </scroll-view>

    <!-- 筛选弹窗 -->
    <view v-if="showFilterModal" class="filter-overlay" @click="showFilterModal = false">
      <view class="filter-content" @click.stop>
        <view class="filter-header">
          <text class="filter-title">筛选</text>
          <CloseSmall class="filter-close" @click="showFilterModal = false" theme="outline" size="24" fill="#9EA7B0" />
        </view>
        <view class="filter-body">
          <view class="filter-section">
            <text class="filter-label">排序方式</text>
            <view class="filter-options">
              <view
                v-for="sort in sortOptions"
                :key="sort.value"
                class="filter-option"
                :class="{ active: currentSort === sort.value }"
                @click="currentSort = sort.value"
              >
                {{ sort.label }}
              </view>
            </view>
          </view>
          <view class="filter-section">
            <text class="filter-label">筛选条件</text>
            <view class="filter-options">
              <view
                v-for="filter in filterOptions"
                :key="filter.value"
                class="filter-option"
                :class="{ active: activeFilters.includes(filter.value) }"
                @click="toggleFilter(filter.value)"
              >
                {{ filter.label }}
              </view>
            </view>
          </view>
        </view>
        <view class="filter-footer">
          <button class="filter-reset" @click="resetFilter">重置</button>
          <button class="filter-confirm" @click="applyFilter">确定</button>
        </view>
      </view>
    </view>

    <!-- 打卡弹窗 -->
    <view v-if="showModal" class="modal-overlay" @click="closeModal">
      <view class="modal-content" @click.stop>
        <view class="modal-header">
          <text class="modal-title">打卡 {{ currentItem?.name }}</text>
          <view class="modal-close" @click.stop="closeModal">
            <text class="modal-close-icon">×</text>
          </view>
        </view>

        <view class="modal-body">
          <!-- 上传图片 -->
          <view class="upload-section">
            <text class="section-label">上传照片</text>
            <text v-if="locationMsg" class="location-warning">{{ locationMsg }}</text>
            <view class="upload-area">
              <view
                v-for="(img, index) in uploadImages"
                :key="index"
                class="upload-item"
              >
                <image
                  class="upload-image"
                  :src="img"
                  mode="aspectFill"
                />
                <CloseSmall
                  class="upload-delete"
                  @click="removeImage(index)"
                  theme="outline"
                  size="24"
                  fill="#ffffff"
                />
              </view>
              <view
                v-if="uploadImages.length < 1"
                class="upload-add"
                @click="chooseImage"
              >
                <Add class="upload-icon" theme="outline" size="28" fill="#3ba272" />
                <text class="upload-text">添加照片</text>
              </view>
            </view>
          </view>

          <!-- 评价输入 -->
          <view class="comment-section">
            <text class="section-label">简短评价</text>
            <textarea
              v-model="checkinComment"
              class="comment-input"
              placeholder="分享你的感受..."
              maxlength="200"
            />
            <text class="char-count">{{ checkinComment.length }}/200</text>
          </view>
        </view>

        <view class="modal-footer">
          <button class="submit-btn" @click="submitCheckin">提交打卡</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, onUnmounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import LocalPin from '@icon-park/vue-next/es/icons/LocalPin'
import KnifeFork from '@icon-park/vue-next/es/icons/KnifeFork'
import CloseSmall from '@icon-park/vue-next/es/icons/CloseSmall'
import Add from '@icon-park/vue-next/es/icons/Add'
import Search from '@icon-park/vue-next/es/icons/Search'
import { activityApi } from '@/api/activity'
import { scenicSpotApi, foodApi, cityApi, checkinApi, uploadApi, type ApiResponse } from '@/api/content'
import { defaultFoodImage, defaultScenicImage } from '@/utils/config'
import { getImageUrl } from '@/utils/image'
import { useUserStore } from '@/store/user'
import { syncSelectedCityName } from '@/utils/selectedCity'

type TabType = 'attraction' | 'food'
type SortType = 'default' | 'distance' | 'hot' | 'checkin'
type FilterType = 'all' | 'checked' | 'nearby'

interface CheckinItem {
  id: number
  targetId?: number
  name: string
  cover: string
  location: string
  checkinCount: number
  type: TabType
  tag?: 'hot' | 'new'
  distance?: string
  latitude?: number
  longitude?: number
  isChecked?: boolean
}

const store = useUserStore()
const currentUser = computed(() => store.state.profile)

const activeTab = ref<TabType>('attraction')
const checkinList = ref<CheckinItem[]>([])
const pageNum = ref(1)
const pageSize = ref(10)
const total = ref(0)
const loading = ref(false)
const noMore = ref(false)
const showModal = ref(false)
const currentItem = ref<CheckinItem | null>(null)
const uploadImages = ref<string[]>([])
const checkinComment = ref('')
const locationOk = ref(false)
const locationMsg = ref('')
const searchKeyword = ref('')
const showFilterModal = ref(false)
const currentSort = ref<SortType>('default')
const activeFilters = ref<FilterType[]>(['all'])
const cardAnimate = ref(false)
const userLocation = ref<{ latitude: number; longitude: number } | null>(null)
const activityList = ref<Array<{ id: number; name: string; imageUrl?: string; highlight?: string; linkUrl?: string }>>([])
const refreshing = ref(false)
const currentCity = ref<string>('定位中...')
const currentCityId = ref<number | null>(null)
const locationStatus = ref<'idle' | 'loading' | 'success' | 'fail'>('idle')
const manualCitySelected = ref(false)
const lastCityApplyTs = ref(0)
const citySelectionPending = ref(false)
const citySelectorOpenTs = ref(0)

let locationTimer: number | null = null

// 排序选项
const sortOptions: Array<{ label: string; value: SortType }> = [
  { label: '默认', value: 'default' },
  { label: '距离最近', value: 'distance' },
  { label: '最热门', value: 'hot' },
  { label: '打卡最多', value: 'checkin' },
]

// 筛选选项
const filterOptions: Array<{ label: string; value: FilterType }> = [
  { label: '全部', value: 'all' },
  { label: '已打卡', value: 'checked' },
  { label: '附近', value: 'nearby' },
]

// 默认打卡数据（当接口异常时作为兜底）
const mockAttractions: CheckinItem[] = [
  {
    id: 1,
    name: '宽窄巷子',
    cover: defaultScenicImage,
    location: '成都市青羊区',
    checkinCount: 1234,
    type: 'attraction',
    tag: 'hot',
  },
]

const mockFoods: CheckinItem[] = [
  {
    id: 101,
    name: '火锅',
    cover: defaultFoodImage,
    location: '成都各大商圈',
    checkinCount: 3456,
    type: 'food',
    tag: 'hot',
  },
]

interface CityItem {
  id: number
  name: string
  latitude: number
  longitude: number
}

// 计算距离（简化版，实际应使用地图API）
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371 // 地球半径（km）
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

// 获取用户位置
const normalizeCityName = (name?: string) => {
  return String(name || '')
    .trim()
    .replace(/市$/, '')
    .replace(/省$/, '')
    .replace(/自治区$/, '')
    .replace(/特别行政区$/, '')
}

const mapCityItem = (raw: any): CityItem | null => {
  const name = raw?.cityName || raw?.name
  if (!raw?.id || !name) return null

  const latRaw = raw.latitude
  const lngRaw = raw.longitude
  const latitude = typeof latRaw === 'number' ? latRaw : typeof latRaw === 'string' ? parseFloat(latRaw) : NaN
  const longitude = typeof lngRaw === 'number' ? lngRaw : typeof lngRaw === 'string' ? parseFloat(lngRaw) : NaN

  return {
    id: Number(raw.id),
    name,
    latitude,
    longitude,
  }
}

const resolveLocatedCity = async (cityName: string, latitude: number, longitude: number) => {
  try {
    const resp = await cityApi.list()
    const response = resp.data as ApiResponse<any[]>
    if (resp.statusCode !== 200 || response.code !== 200) return null

    const cities = (response.data || [])
      .map((item: any) => mapCityItem(item))
      .filter((item: CityItem | null): item is CityItem => !!item)

    const normalizedName = normalizeCityName(cityName)
    if (normalizedName) {
      const matched = cities.find((city) => normalizeCityName(city.name) === normalizedName)
      if (matched) return matched
    }

    let nearest: CityItem | null = null
    let minDist = Number.POSITIVE_INFINITY
    cities.forEach((city) => {
      if (!Number.isFinite(city.latitude) || !Number.isFinite(city.longitude)) return
      const distance = calculateDistance(latitude, longitude, city.latitude, city.longitude)
      if (distance < minDist) {
        minDist = distance
        nearest = city
      }
    })

    return nearest
  } catch {
    return null
  }
}

const getUserLocation = () => {
  // 启动定位流程和超时控制
  locationStatus.value = 'loading'
  if (!manualCitySelected.value) {
    currentCity.value = '定位中...'
  }
  if (locationTimer !== null) {
    clearTimeout(locationTimer)
  }
  locationTimer = setTimeout(() => {
    if (locationStatus.value === 'loading') {
      locationStatus.value = 'fail'
      if (!manualCitySelected.value) {
        currentCity.value = '定位失败，点击重试'
      }
    }
  }, 5000)

  uni.getLocation({
    type: 'gcj02',
    altitude: false,
    geocode: true, // 开启地址解析，用于显示当前城市
    timeout: 5000,
    success: async (res) => {
      if (locationTimer !== null) {
        clearTimeout(locationTimer)
        locationTimer = null
      }
      locationStatus.value = 'success'
      userLocation.value = {
        latitude: res.latitude,
        longitude: res.longitude,
      }
      // 更新距离信息
      checkinList.value.forEach((item) => {
        if (item.latitude && item.longitude) {
          const distance = calculateDistance(
            res.latitude,
            res.longitude,
            item.latitude,
            item.longitude
          )
          item.distance = distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`
        }
      })

      // 解析城市名称
      const addr = (res as any).address || {}
      let cityName = ''
      if (addr.city) {
        cityName = addr.city.replace(/市$/, '')
      } else if (addr.province) {
        cityName = addr.province.replace(/省$/, '')
      } else if (addr.district) {
        cityName = addr.district.replace(/(区|县)$/, '')
      }
      if (cityName && !manualCitySelected.value) {
        currentCity.value = cityName
      } else {
        // 后端未返回可用的城市名时，尝试用经纬度匹配最近城市
        // /city/list 返回的 City 中 latitude/longitude 为 BigDecimal，经 JSON 可能是 number 或字符串
        try {
          cityApi
            .list()
            .then((resp) => {
              const response = resp.data as ApiResponse<any[]>
              if (resp.statusCode === 200 && response.code === 200) {
                const rawCities = (response.data || []) as any[]
                // 只保留有有效经纬度并且有城市名的城市
                const withLocation: CityItem[] = rawCities
                  .map((c: any) => {
                    const name: string | undefined = c.cityName || c.name
                    if (!name) return null

                    const latRaw = c.latitude
                    const lngRaw = c.longitude

                    const lat =
                      typeof latRaw === 'number'
                        ? latRaw
                        : typeof latRaw === 'string'
                        ? parseFloat(latRaw)
                        : NaN
                    const lng =
                      typeof lngRaw === 'number'
                        ? lngRaw
                        : typeof lngRaw === 'string'
                        ? parseFloat(lngRaw)
                        : NaN

                    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null

                    return {
                      id: c.id as number,
                      name,
                      latitude: lat,
                      longitude: lng,
                    } as CityItem
                  })
                  .filter((c): c is CityItem => !!c)

                if (!withLocation.length) return

                let nearest: CityItem | null = null
                let minDist = Number.POSITIVE_INFINITY
                withLocation.forEach((city) => {
                  const d = calculateDistance(
                    res.latitude,
                    res.longitude,
                    city.latitude,
                    city.longitude
                  )
                  if (d < minDist) {
                    minDist = d
                    nearest = city
                  }
                })

                if (nearest && nearest.name && !manualCitySelected.value) {
                  // 展示最近城市名，去掉末尾“市”
                  currentCity.value = nearest.name.replace(/市$/, '')
                }
              }
            })
            .catch(() => {
              // 静默失败，保持“定位中...”或上一次城市
            })
        } catch {
          // 忽略匹配失败
        }
      }
      // 自动按距离排序，优先展示附近景点/美食
      if (!manualCitySelected.value) {
        const locatedCity = await resolveLocatedCity(cityName, res.latitude, res.longitude)
        if (locatedCity) {
          currentCity.value = normalizeCityName(locatedCity.name)
          currentCityId.value = locatedCity.id
        } else if (cityName) {
          currentCity.value = cityName
          currentCityId.value = null
        }
        checkinList.value = []
        pageNum.value = 1
        total.value = 0
        noMore.value = false
        cardAnimate.value = false
        loadCheckinList()
      }

      if (userLocation.value) {
        currentSort.value = 'distance'
      }
    },
    fail: (err) => {
      if (locationTimer !== null) {
        clearTimeout(locationTimer)
        locationTimer = null
      }
      locationStatus.value = 'fail'
      // 根据错误类型给出提示
      let errorMsg = '获取位置失败'
      if (err.errMsg) {
        if (err.errMsg.includes('auth deny') || err.errMsg.includes('authorize')) {
          errorMsg = '需要位置权限才能使用此功能，请在设置中开启'
          // 尝试打开设置页面
          uni.openSetting({
            success: (res) => {
              if (res.authSetting['scope.userLocation']) {
                // 用户授权后重新获取位置
                getUserLocation()
              }
            }
          })
        } else if (err.errMsg.includes('timeout')) {
          errorMsg = '定位超时，请检查网络连接'
        } else if (err.errMsg.includes('fail')) {
          errorMsg = '定位服务不可用，请检查设备定位设置'
        }
      }
      if (!manualCitySelected.value) {
        currentCity.value = '定位失败，点击重试'
        currentCityId.value = null
        loadCheckinList()
      }
      uni.showToast({
        title: errorMsg,
        icon: 'none',
        duration: 2000
      })
    },
  })
}

const handleLocationClick = () => {
  // 用户点击定位区域时，失败或空闲状态下重新尝试定位
  if (locationStatus.value === 'loading') return
  manualCitySelected.value = false
  currentCityId.value = null
  getUserLocation()
}

// 过滤后的列表（包含本地分页）
const filteredList = computed(() => {
  let list = [...checkinList.value]

  // 搜索过滤
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    list = list.filter(
      (item) =>
        item.name.toLowerCase().includes(keyword) ||
        item.location.toLowerCase().includes(keyword)
    )
  }

  // 筛选过滤
  if (activeFilters.value.includes('checked')) {
    list = list.filter((item) => item.isChecked)
  }
  if (activeFilters.value.includes('nearby') && userLocation.value) {
    list = list.filter((item) => {
      if (!item.latitude || !item.longitude) return false
      const distance = calculateDistance(
        userLocation.value!.latitude,
        userLocation.value!.longitude,
        item.latitude,
        item.longitude
      )
      return distance < 10 // 10km内
    })
  }

  // 排序
  if (currentSort.value === 'distance' && userLocation.value) {
    list.sort((a, b) => {
      if (!a.latitude || !a.longitude) return 1
      if (!b.latitude || !b.longitude) return -1
      const distA = calculateDistance(
        userLocation.value!.latitude,
        userLocation.value!.longitude,
        a.latitude,
        a.longitude
      )
      const distB = calculateDistance(
        userLocation.value!.latitude,
        userLocation.value!.longitude,
        b.latitude,
        b.longitude
      )
      return distA - distB
    })
  } else if (currentSort.value === 'hot') {
    list.sort((a, b) => {
      if (a.tag === 'hot' && b.tag !== 'hot') return -1
      if (a.tag !== 'hot' && b.tag === 'hot') return 1
      return b.checkinCount - a.checkinCount
    })
  } else if (currentSort.value === 'checkin') {
    list.sort((a, b) => b.checkinCount - a.checkinCount)
  }

  // 基于过滤后的结果做本地分页
  const totalCount = list.length
  if (total.value !== totalCount) {
    total.value = totalCount
  }
  const start = (pageNum.value - 1) * pageSize.value
  const end = start + pageSize.value
  return list.slice(start, end)
})

const totalPages = computed(() => {
  if (!total.value || total.value <= 0) return 1
  return Math.max(1, Math.ceil(total.value / pageSize.value))
})

const switchTab = (tab: TabType) => {
  activeTab.value = tab
  checkinList.value = []
  pageNum.value = 1
  total.value = 0
  noMore.value = false
  cardAnimate.value = false
  searchKeyword.value = ''
  loadCheckinList()
}

const loadCheckinList = async () => {
  loading.value = true
  noMore.value = false
  try {
    if (activeTab.value === 'attraction') {
      // 为保证搜索时不过滤掉其他页的数据，这里一次性拉取较多数据，前端自行分页
      const scenicParams: {
        pageNum: number
        pageSize: number
        cityId?: number
      } = {
        pageNum: 1,
        pageSize: 1000,
      }
      if (currentCityId.value !== null) {
        scenicParams.cityId = currentCityId.value
      }
      const res = await scenicSpotApi.list(scenicParams)
      const response = res.data as ApiResponse<any>
      if (res.statusCode === 200 && response.code === 200) {
        const raw = response.data
        const rows: any[] = Array.isArray(raw?.rows)
          ? raw.rows
          : Array.isArray(raw?.list)
          ? raw.list
          : Array.isArray(raw)
          ? raw
          : []
        checkinList.value = rows.map((item: any) => ({
          id: item.id,
          targetId: item.targetId || item.id,
          name: item.name,
          cover: getImageUrl(item.imageUrl) || defaultScenicImage,
          location: item.address || `${item.province || ''}${item.city || ''}`,
          checkinCount: item.hotScore || 0,
          type: 'attraction' as TabType,
          tag: item.hotScore && item.hotScore > 10000 ? 'hot' : undefined,
          latitude: item.latitude,
          longitude: item.longitude,
          isChecked: false,
        }))
        total.value = checkinList.value.length
      } else {
        checkinList.value = [...mockAttractions]
        total.value = mockAttractions.length
      }
    } else {
      const foodParams: {
        pageNum: number
        pageSize: number
        cityId?: number
      } = {
        pageNum: 1,
        pageSize: 1000,
      }
      if (currentCityId.value !== null) {
        foodParams.cityId = currentCityId.value
      }
      const res = await foodApi.list(foodParams)
      const response = res.data as ApiResponse<any>
      if (res.statusCode === 200 && response.code === 200) {
        const raw = response.data
        const rows: any[] = Array.isArray(raw?.rows)
          ? raw.rows
          : Array.isArray(raw?.list)
          ? raw.list
          : Array.isArray(raw)
          ? raw
          : []
        checkinList.value = rows.map((item: any) => ({
          id: item.id,
          targetId: item.targetId || item.id,
          name: item.name,
          cover: getImageUrl(item.imageUrl) || defaultFoodImage,
          location: item.address || item.cityName || '',
          checkinCount: item.hotScore || 0,
          type: 'food' as TabType,
          tag: item.hotScore && item.hotScore > 10000 ? 'hot' : undefined,
          latitude: item.latitude,
          longitude: item.longitude,
          isChecked: false,
        }))
        total.value = checkinList.value.length
      } else {
        checkinList.value = [...mockFoods]
        total.value = mockFoods.length
      }
    }
    await markCheckedItems()
  } catch (error) {
    checkinList.value = activeTab.value === 'attraction' ? [...mockAttractions] : [...mockFoods]
  } finally {
    loading.value = false
    cardAnimate.value = true
  }
}

const markCheckedItems = async () => {
  const userId = currentUser.value?.id
  if (!userId || checkinList.value.length === 0) return
  try {
    const res = await checkinApi.getMyCheckins(userId, 1, 1000)
    const response = res.data as ApiResponse<{ list: any[] }>
    if (res.statusCode !== 200 || response.code !== 200) return

    const records = response.data?.list || []
    const currentTargetType = activeTab.value === 'attraction' ? 'scenic' : 'food'
    const checkedIds = new Set(
      records
        .filter((record: any) => record.targetType === currentTargetType)
        .map((record: any) => Number(record.targetId))
    )

    checkinList.value.forEach((item) => {
      item.isChecked = checkedIds.has(Number(item.targetId || item.id))
    })
  } catch (error) {
    // 不影响列表展示
  }
}

const goPrevPage = () => {
  if (pageNum.value <= 1 || loading.value) return
  pageNum.value -= 1
  loadCheckinList()
}

const goNextPage = () => {
  if (pageNum.value >= totalPages.value || loading.value) return
  pageNum.value += 1
  loadCheckinList()
}

const loadMore = () => {
  if (loading.value || noMore.value) return
  // 这里可以实现分页加载
}

const viewDetail = (item: CheckinItem) => {
  // 跳转到详情页，同时带上来源标记，方便详情页显示打卡评价区域
  const targetId = item.targetId || item.id
  if (item.type === 'attraction') {
    uni.navigateTo({ url: `/pages/scenic/detail?id=${targetId}&from=checkin` })
  } else {
    uni.navigateTo({ url: `/pages/food/detail?id=${targetId}&from=checkin` })
  }
}

const viewActivity = (activity: { id: number; linkUrl?: string }) => {
  // 统一跳转到活动详情页
  if (activity.id) {
    uni.navigateTo({ url: `/pages/activity/detail?id=${activity.id}` })
  } else {
    uni.showToast({
      title: '活动信息错误',
      icon: 'none'
    })
  }
}

const loadActivities = async () => {
  // 加载活动列表（从后端获取上线或即将开始的活动）
  try {
    const res = await activityApi.getList({ 
      status: 'online',
      pageNum: 1,
      pageSize: 10
    })
    if (res.statusCode === 200 && res.data.code === 200) {
      // 筛选出上线或即将开始的活动
      const activities = (res.data.data.rows || []).filter(
        (activity: any) => activity.status === 'online' || activity.status === 'upcoming'
      )
      activityList.value = activities.map((activity: any) => ({
        id: activity.id,
        name: activity.name || '',
        highlight: activity.highlight || '',
        imageUrl: activity.imageUrl || '',
      }))
    } else {
      // API失败时使用空数组，不显示轮播图
      activityList.value = []
    }
  } catch (error) {
    // 出错时不显示轮播图
    activityList.value = []
  }
}

const handleSearch = () => {
  const kw = searchKeyword.value.trim()
  if (!kw) {
    searchKeyword.value = ''
    return
  }
  searchKeyword.value = kw
  pageNum.value = 1
}

const clearSearch = () => {
  searchKeyword.value = ''
}

const applySelectedCity = (data: any, shouldReload = true) => {
  const cityId = Number(data?.id)
  const cityName = String(data?.name || '').trim()
  const ts = Number(data?.ts || Date.now())
  if (!cityId || !cityName) return false

  const unchanged = currentCityId.value === cityId && currentCity.value === cityName
  currentCity.value = cityName
  currentCityId.value = cityId
  manualCitySelected.value = true
  lastCityApplyTs.value = Math.max(lastCityApplyTs.value, ts)

  if (shouldReload && !unchanged) {
    checkinList.value = []
    pageNum.value = 1
    total.value = 0
    noMore.value = false
    cardAnimate.value = false
    loadCheckinList()
  }

  return true
}

const applyCityFromStorage = async () => {
  await syncSelectedCityName()
  const selected = uni.getStorageSync('ticket_selected_city') as { id?: number; name?: string; ts?: number } | null
  if (!selected || !selected.id || !selected.name) return false
  const ts = Number(selected.ts || 0)
  if (citySelectorOpenTs.value && ts <= citySelectorOpenTs.value) return false
  if (ts && ts <= lastCityApplyTs.value) return false
  return applySelectedCity(selected, true)
}

// 选择城市（跳转到城市选择页）
const openCitySelector = async () => {
  citySelectionPending.value = true
  citySelectorOpenTs.value = Date.now()
  const handleCitySelected = (data: any) => {
    citySelectionPending.value = false
    applySelectedCity(data, true)
  }

  uni.navigateTo({
    url: '/pages/city/select',
    events: {
      citySelected: handleCitySelected,
    },
    success: (res) => {
      res.eventChannel.on('citySelected', handleCitySelected)
    },
  })
}

const toggleFilter = (value: FilterType) => {
  if (value === 'all') {
    activeFilters.value = ['all']
  } else {
    const index = activeFilters.value.indexOf(value)
    if (index > -1) {
      activeFilters.value.splice(index, 1)
      if (activeFilters.value.length === 0) {
        activeFilters.value = ['all']
      }
    } else {
      // 移除 'all'
      const allIndex = activeFilters.value.indexOf('all')
      if (allIndex > -1) {
        activeFilters.value.splice(allIndex, 1)
      }
      activeFilters.value.push(value)
    }
  }
}

const resetFilter = () => {
  currentSort.value = 'default'
  activeFilters.value = ['all']
}

const applyFilter = () => {
  showFilterModal.value = false
}

// 未登录提示
const showLoginPromptDialog = () => {
  uni.showModal({
    title: '需要登录',
    content: '打卡前需要先登录账号',
    confirmText: '去登录',
    cancelText: '取消',
    success: (res) => {
      if (res.confirm) {
        uni.switchTab({ url: '/pages/profile/profile' })
      }
    }
  })
}

const openCheckinModal = (item: CheckinItem) => {
  // 打卡前先检查登录状态，未登录则提示去登录
  if (!currentUser.value) {
    showLoginPromptDialog()
    return
  }
  if (item.isChecked) {
    uni.showToast({ title: '你已经打卡过啦', icon: 'none' })
    return
  }

  currentItem.value = item
  uploadImages.value = []
  checkinComment.value = ''
  showModal.value = true
  ensureLocation()
}

const closeModal = () => {
  showModal.value = false
  currentItem.value = null
}

const chooseImage = () => {
  uni.chooseImage({
    count: 1 - uploadImages.value.length,
    success: (res) => {
      uploadImages.value.push(...res.tempFilePaths)
    },
  })
}

const removeImage = (index: number) => {
  uploadImages.value.splice(index, 1)
}

const getUploadedPhotoUrl = async () => {
  const firstImage = uploadImages.value[0]
  if (!firstImage) return undefined

  const uploadRes = await uploadApi.upload(firstImage)
  const uploadData = uploadRes.data
  if (uploadRes.statusCode !== 200 || uploadData?.code !== 200) {
    throw new Error(uploadData?.msg || '图片上传失败')
  }

  if (typeof uploadData?.data === 'string') {
    return uploadData.data
  }
  return uploadData?.data?.url
}

const submitCheckin = async () => {
  const userId = currentUser.value?.id
  if (!userId) {
    showLoginPromptDialog()
    return
  }

  if (!locationOk.value) {
    uni.showToast({ title: '请先开启定位权限', icon: 'none' })
    return
  }
  if (!currentItem.value) {
    uni.showToast({
      title: '打卡目标异常，请重试',
      icon: 'none',
    })
    return
  }

  try {
    const targetType = currentItem.value.type === 'attraction' ? 'scenic' : 'food'
    const latitude = currentItem.value.latitude
    const longitude = currentItem.value.longitude
    const photoUrl = await getUploadedPhotoUrl()

    await checkinApi.addCheckin({
      userId,
      targetType,
      targetId: currentItem.value.targetId || currentItem.value.id,
      photoUrl,
      content: checkinComment.value.trim() || undefined,
      latitude,
      longitude,
    })

    uni.showToast({
      title: '打卡成功',
      icon: 'success',
    })

    // 更新本地打卡状态，提升体验
    const item = checkinList.value.find((i) => i.id === currentItem.value!.id)
    if (item) {
      item.isChecked = true
      item.checkinCount += 1
    }

    closeModal()
  } catch (error: any) {
    uni.showToast({
      title: error?.data?.msg || error?.message || '打卡失败，请稍后重试',
      icon: 'none',
    })
  }
}

const ensureLocation = () => {
  uni.getLocation({
    type: 'gcj02',
    altitude: false,
    geocode: false,
    success: () => {
      locationOk.value = true
      locationMsg.value = ''
    },
    fail: (err) => {
      locationOk.value = false
      
      let errorMsg = '定位失败，请检查网络或授权定位'
      if (err.errMsg) {
        if (err.errMsg.includes('auth deny') || err.errMsg.includes('authorize')) {
          errorMsg = '需要位置权限，请在设置中开启'
          // 引导用户打开设置
          uni.showModal({
            title: '需要位置权限',
            content: '为了提供更好的服务，需要获取您的位置信息。是否前往设置开启？',
            confirmText: '去设置',
            cancelText: '取消',
            success: (modalRes) => {
              if (modalRes.confirm) {
                uni.openSetting({
                  success: (settingRes) => {
                    if (settingRes.authSetting['scope.userLocation']) {
                      // 用户授权后重新获取位置
                      ensureLocation()
                    }
                  }
                })
              }
            }
          })
        } else if (err.errMsg.includes('timeout')) {
          errorMsg = '定位超时，请检查网络连接'
        } else if (err.errMsg.includes('fail')) {
          errorMsg = '定位服务不可用，请检查设备定位设置'
        }
      }
      locationMsg.value = errorMsg
    },
  })
}

const onRefresh = async () => {
  refreshing.value = true
  uni.showLoading({
    title: '刷新中...',
    mask: true
  })
  try {
    // 重新加载打卡列表和活动列表
    await Promise.all([
      new Promise<void>((resolve) => {
        loadCheckinList()
        resolve()
      }),
      loadActivities()
    ])
    uni.hideLoading()
    uni.showToast({
      title: '刷新成功',
      icon: 'success',
      duration: 1500
    })
  } catch (error) {
    uni.hideLoading()
    uni.showToast({
      title: '刷新失败',
      icon: 'none',
      duration: 2000
    })
  } finally {
    // 延迟关闭刷新状态，确保用户能看到刷新效果
    setTimeout(() => {
      refreshing.value = false
    }, 500)
  }
}

onMounted(() => {
  getUserLocation()
  loadActivities()
})

onShow(async () => {
  if (citySelectionPending.value) {
    citySelectionPending.value = false
    await applyCityFromStorage()
  }
})

onUnmounted(() => {
  if (locationTimer !== null) {
    clearTimeout(locationTimer)
    locationTimer = null
  }
})
</script>

<style scoped>
.checkin-page {
  min-height: 100vh;
  background-color: #F5F6F7;
  display: flex;
  flex-direction: column;
}

/* HeaderBar 样式 */
.header-bar {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 24rpx;
  background-color: #ffffff;
  border-bottom: 1rpx solid #eeeeee;
}

.search-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  padding: 20rpx 24rpx;
  background-color: #F5F6F7;
  border-radius: 48rpx;
}

.search-input {
  flex: 1;
  font-size: 28rpx;
  color: #333333;
}

.clear-icon {
  margin-left: 12rpx;
  padding: 4rpx;
}

.search-icon-right {
  font-size: 32rpx;
  color: #9EA7B0;
  margin-left: 12rpx;
}

.filter-btn {
  width: 88rpx;
  height: 88rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #F5F6F7;
  border-radius: 48rpx;
}

.filter-icon {
  font-size: 24rpx;
}

/* 当前位置 / 切换城市 */
.location-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12rpx 24rpx 0;
  background-color: #ffffff;
}

.location-left {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.location-map-icon {
  font-size: 32rpx;
  color: #2FA66A;
}

.location-city-text {
  font-size: 26rpx;
  color: #333333;
}

.location-right {
  display: flex;
  align-items: center;
  gap: 6rpx;
}

.location-city-icon {
  font-size: 30rpx;
  color: #2FA66A;
}

.location-switch-text {
  font-size: 26rpx;
  color: #2FA66A;
}

/* Tabs 样式 */
.tabs-header {
  display: flex;
  background-color: #ffffff;
  border-bottom: 1rpx solid #eeeeee;
  position: relative;
}

.tab-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 28rpx 0;
  position: relative;
  transition: all 0.3s ease;
}

.tab-item.active {
  color: #2FA66A;
}

.tab-item.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 80rpx;
  height: 6rpx;
  background-color: #2FA66A;
  border-radius: 3rpx;
  transition: all 0.3s ease;
}

.tab-icon {
  font-size: 32rpx;
  margin-bottom: 8rpx;
  transition: all 0.3s ease;
}

.tab-text {
  font-size: 28rpx;
  color: #9EA7B0;
  transition: all 0.3s ease;
}

.tab-item.active .tab-text {
  color: #2FA66A;
  font-weight: 600;
}

/* 列表样式 */
.checkin-scroll {
  flex: 1;
}

.checkin-list {
  padding: 24rpx;
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.checkin-card {
  width: calc(50% - 8rpx);
  background-color: #ffffff;
  border-radius: 24rpx;
  overflow: hidden;
  box-shadow: 0 12rpx 36rpx rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
  animation: fadeInUp 0.4s ease;
  display: flex;
  flex-direction: column;
}

.checkin-card:active {
  transform: translateY(-8rpx);
  box-shadow: 0 16rpx 48rpx rgba(0, 0, 0, 0.12);
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 活动轮播图样式 */
.activity-banner {
  margin: 24rpx;
  border-radius: 24rpx;
  overflow: hidden;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.08);
}

.banner-swiper {
  width: 100%;
  height: 320rpx;
}

.banner-item {
  position: relative;
  width: 100%;
  height: 100%;
}

.banner-image {
  width: 100%;
  height: 100%;
}

.banner-content {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 32rpx;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.6), transparent);
}

.banner-title {
  display: block;
  font-size: 32rpx;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 8rpx;
}

.banner-desc {
  display: block;
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.9);
}

/* 图片区域 */
.card-image-wrapper {
  position: relative;
  width: 100%;
  height: 280rpx;
  overflow: hidden;
}

.checkin-cover {
  width: 100%;
  height: 100%;
  background-color: #e5e5e5;
}

.card-tag {
  position: absolute;
  top: 16rpx;
  left: 16rpx;
  padding: 8rpx 16rpx;
  border-radius: 20rpx;
  font-size: 22rpx;
  font-weight: 600;
  color: #ffffff;
  backdrop-filter: blur(10rpx);
}

.tag-hot {
  background: linear-gradient(135deg, #FF6B6B 0%, #FF8E8E 100%);
}

.tag-new {
  background: linear-gradient(135deg, #4ECDC4 0%, #6EDDD6 100%);
}

/* 内容区域 */
.checkin-content {
  padding: 20rpx;
  display: flex;
  flex-direction: column;
  min-height: 160rpx;
}

.checkin-name {
  font-size: 28rpx;
  font-weight: 600;
  color: #333333;
  display: block;
  margin-bottom: 12rpx;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex-shrink: 0;
}

.checkin-location {
  display: flex;
  align-items: center;
  margin-bottom: 16rpx;
  flex-shrink: 0;
  overflow: hidden;
}

.location-icon {
  margin-right: 6rpx;
  flex-shrink: 0;
}

.location-text {
  font-size: 24rpx;
  color: #9EA7B0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.checkin-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: auto;
  gap: 12rpx;
}

.checkin-meta {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.meta-text {
  font-size: 24rpx;
  color: #9EA7B0;
  white-space: nowrap;
  flex-shrink: 0;
}

.meta-divider {
  font-size: 24rpx;
  color: #9EA7B0;
  margin: 0 6rpx;
  flex-shrink: 0;
}

.distance-text {
  font-size: 24rpx;
  color: #9EA7B0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex-shrink: 0;
}

.checkin-btn {
  padding: 12rpx 24rpx;
  border-radius: 48rpx;
  background-color: #2FA66A;
  color: #ffffff;
  font-size: 24rpx;
  font-weight: 600;
  line-height: 1.6;
  border: none;
  transition: all 0.2s ease;
  flex-shrink: 0;
  white-space: nowrap;
}

.checkin-btn.checked {
  background-color: #dfe9e5;
  color: #6f827c;
}

.checkin-btn--hover {
  background-color: #2a8f5a;
  transform: scale(0.96);
}

.loading,
.no-more,
.empty-state {
  text-align: center;
  padding: 60rpx 40rpx;
  color: #9EA7B0;
  font-size: 28rpx;
}

/* 分页组件 */
.pagination-wrapper {
  padding: 24rpx 24rpx 40rpx;
  display: flex;
  justify-content: center;
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24rpx;
}

.page-btn {
  padding: 16rpx 32rpx;
  border-radius: 40rpx;
  font-size: 26rpx;
  border: none;
  background-color: #2FA66A;
  color: #ffffff;
}

.page-btn[disabled] {
  background-color: #d0d5dd;
  color: #ffffff;
}

.page-info {
  font-size: 26rpx;
  color: #666666;
}

/* 筛选弹窗样式 */
.filter-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.filter-content {
  width: 100%;
  max-height: 70vh;
  background-color: #ffffff;
  border-radius: 32rpx 32rpx 0 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

.filter-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 32rpx;
  border-bottom: 1rpx solid #eeeeee;
}

.filter-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333333;
}

.filter-close {
  width: 48rpx;
  height: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.filter-body {
  flex: 1;
  padding: 32rpx;
  overflow-y: auto;
}

.filter-section {
  margin-bottom: 40rpx;
}

.filter-section:last-child {
  margin-bottom: 0;
}

.filter-label {
  font-size: 28rpx;
  color: #333333;
  font-weight: 600;
  display: block;
  margin-bottom: 24rpx;
}

.filter-options {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.filter-option {
  padding: 16rpx 32rpx;
  background-color: #F5F6F7;
  border-radius: 48rpx;
  font-size: 26rpx;
  color: #666666;
  transition: all 0.2s ease;
}

.filter-option.active {
  background-color: #2FA66A;
  color: #ffffff;
}

.filter-footer {
  display: flex;
  gap: 16rpx;
  padding: 24rpx 32rpx 32rpx;
  border-top: 1rpx solid #eeeeee;
}

.filter-reset,
.filter-confirm {
  flex: 1;
  padding: 24rpx;
  border-radius: 48rpx;
  font-size: 28rpx;
  font-weight: 600;
  border: none;
}

.filter-reset {
  background-color: #F5F6F7;
  color: #666666;
}

.filter-confirm {
  background-color: #2FA66A;
  color: #ffffff;
}

/* 打卡弹窗样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease;
}

.modal-content {
  width: 90%;
  max-height: 80vh;
  background-color: #ffffff;
  border-radius: 24rpx;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  animation: scaleIn 0.3s ease;
}

@keyframes scaleIn {
  from {
    transform: scale(0.9);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 32rpx 88rpx 32rpx 32rpx;
  border-bottom: 1rpx solid #eeeeee;
}

.modal-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333333;
  line-height: 1.4;
}

.modal-close {
  position: absolute;
  top: 24rpx;
  right: 24rpx;
  width: 48rpx;
  height: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  color: #8a94a3;
  z-index: 2;
}

.modal-close-icon {
  font-size: 40rpx;
  line-height: 48rpx;
}

.modal-body {
  flex: 1;
  padding: 32rpx;
  overflow-y: auto;
}

.upload-section {
  margin-bottom: 32rpx;
}

.location-warning {
  display: block;
  margin-top: 6rpx;
  font-size: 22rpx;
  color: #f59e0b;
}

.section-label {
  font-size: 28rpx;
  color: #333333;
  font-weight: 600;
  display: block;
  margin-bottom: 16rpx;
}

.upload-area {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.upload-item {
  position: relative;
  width: 160rpx;
  height: 160rpx;
  border-radius: 16rpx;
  overflow: hidden;
}

.upload-image {
  width: 100%;
  height: 100%;
}

.upload-delete {
  position: absolute;
  top: 8rpx;
  right: 8rpx;
  width: 32rpx;
  height: 32rpx;
  background-color: rgba(0, 0, 0, 0.6);
  color: #ffffff;
  border-radius: 999rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20rpx;
}

.upload-add {
  width: 160rpx;
  height: 160rpx;
  border: 2rpx dashed #cccccc;
  border-radius: 16rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #F5F6F7;
}

.upload-icon {
  font-size: 48rpx;
  color: #999999;
  margin-bottom: 8rpx;
}

.upload-text {
  font-size: 22rpx;
  color: #999999;
}

.comment-section {
  position: relative;
}

.comment-input {
  width: 100%;
  min-height: 200rpx;
  padding: 20rpx;
  background-color: #F5F6F7;
  border-radius: 16rpx;
  font-size: 26rpx;
  color: #333333;
  box-sizing: border-box;
}

.char-count {
  position: absolute;
  bottom: 12rpx;
  right: 20rpx;
  font-size: 22rpx;
  color: #999999;
}

.modal-footer {
  padding: 24rpx 32rpx 32rpx;
  border-top: 1rpx solid #eeeeee;
}

.submit-btn {
  width: 100%;
  padding: 24rpx;
  background-color: #2FA66A;
  color: #ffffff;
  border-radius: 48rpx;
  font-size: 30rpx;
  font-weight: 600;
  border: none;
  transition: all 0.2s ease;
}

.submit-btn:active {
  transform: scale(0.98);
}
</style>
