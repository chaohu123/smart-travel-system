<template>
  <view class="ticket-list-page">
    <view class="nav-bar">
      <text class="nav-icon" @click="goBack">←</text>
      <text class="nav-title">门票预订</text>
      <text class="nav-icon iconfont icon-guanyuwomen"></text>
      </view>

    <view class="filter-panel soft-shadow">
      <view class="city-row">
        <text class="city-label">当前地区</text>
        <view class="city-picker" @click="chooseCity">
          <text class="city-value">{{ currentCityName }}</text>
          <text class="city-arrow">▼</text>
        </view>
      </view>
      <view class="search-row">
        <input
          v-model="searchKeyword"
          class="search-input"
          placeholder="搜索景点名称、地址"
          confirm-type="search"
          @confirm="onSearchConfirm"
        />
        <button class="search-btn" @click="onSearchConfirm">筛选</button>
      </view>
    </view>

    <scroll-view scroll-y class="page-scroll">
      <view v-if="loading" class="loading-wrap">
        <text>景点加载中...</text>
      </view>
      <view v-else-if="pagedList.length === 0" class="empty-wrap">
        <text>{{ scenicList.length === 0 ? '当前地区暂无景点' : '未找到匹配景点' }}</text>
      </view>
      <view v-else class="list-wrap">
          <view
          v-for="item in pagedList"
            :key="item.id"
          class="scenic-card soft-shadow"
          @click="goScenicDetail(item.id)"
          >
          <view class="scenic-image-wrapper">
              <image
              class="scenic-image"
                :src="item.imageUrl ? getImageUrl(item.imageUrl) : defaultScenicImage"
                mode="aspectFill"
              />
          </view>
          <view class="scenic-content">
            <view class="name-price-row">
              <text class="scenic-name">{{ item.name }}</text>
              <text class="scenic-price" :class="{ free: !item.price || Number(item.price) === 0 }">
                {{ item.price && Number(item.price) > 0 ? `¥${Number(item.price)}起` : '免费' }}
              </text>
            </view>
            <view class="meta-line">
              <text class="meta-label">位置：</text>
              <text class="meta-text">{{ item.address || `${item.province || ''}${item.city || ''}` || '地址待完善' }}</text>
            </view>
            <view class="meta-line time-line">
              <text class="meta-label">开放时间：</text>
              <text class="meta-text one-line">{{ item.openTime || '开放时间待定' }}</text>
              <text class="meta-split">|</text>
              <text class="meta-label">游览时长：</text>
              <text class="meta-text one-line">{{ item.suggestedVisitTime || '时长待完善' }}</text>
            </view>
            <view class="card-actions-row">
              <text class="detail-hint">查看详情与门票预订 ></text>
            </view>
          </view>
        </view>
      </view>
      <view class="bottom-space"></view>
    </scroll-view>

    <view class="bottom-pager soft-shadow">
      <button class="pager-btn" :disabled="currentPage <= 1" @click="goPrevPage">上一页</button>
      <text class="pager-text">{{ currentPage }} / {{ totalPages }}</text>
      <button class="pager-btn" :disabled="currentPage >= totalPages" @click="goNextPage">下一页</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { scenicSpotApi, cityApi, type ApiResponse } from '@/api/content'
import { defaultScenicImage } from '@/utils/config'
import { getImageUrl } from '@/utils/image'
import { syncSelectedCityName } from '@/utils/selectedCity'

interface ScenicItem {
  id: number
  name: string
  imageUrl?: string
  address?: string
  province?: string
  city?: string
  openTime?: string
  suggestedVisitTime?: string
  price?: number | string | null
  cityId?: number
}

interface CityItem {
  id: number
  name: string
  latitude?: number
  longitude?: number
}

const loading = ref(false)
const scenicList = ref<ScenicItem[]>([])
const searchKeyword = ref('')
const currentCityName = ref('定位中...')
const currentCityId = ref<number | null>(null)
const cityList = ref<CityItem[]>([])
const currentPage = ref(1)
const pageSize = ref(6)
const lastCityApplyTs = ref(0)

const goBack = () => {
  uni.navigateBack()
}

const filteredList = computed(() => {
  const keyword = searchKeyword.value.trim().toLowerCase()
  if (!keyword) return scenicList.value
  return scenicList.value.filter((item) => {
    const text = `${item.name || ''}${item.address || ''}${item.city || ''}`.toLowerCase()
    return text.includes(keyword)
  })
})

const totalPages = computed(() => {
  if (!filteredList.value.length) return 1
  return Math.ceil(filteredList.value.length / pageSize.value)
})

const pagedList = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredList.value.slice(start, end)
})

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371
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

const loadCityList = async () => {
  const res = await cityApi.list()
  const data = res.data as ApiResponse<any[]>
  if (res.statusCode === 200 && data.code === 200) {
    cityList.value = (data.data || []).map((item) => ({
      id: item.id,
      name: item.cityName || item.name,
      latitude: item.latitude ? Number(item.latitude) : undefined,
      longitude: item.longitude ? Number(item.longitude) : undefined,
    }))
  }
}

const matchCityByName = (name: string) => {
  const matched = cityList.value.find((city) => name.includes(city.name.replace(/市$/, '')) || city.name.includes(name))
  return matched || null
}

const matchNearestCity = (latitude: number, longitude: number) => {
  const availableCities = cityList.value.filter((city) => Number.isFinite(city.latitude) && Number.isFinite(city.longitude))
  if (!availableCities.length) return null
  let nearest: CityItem | null = null
  let minDistance = Number.POSITIVE_INFINITY
  availableCities.forEach((city) => {
    const distance = calculateDistance(latitude, longitude, Number(city.latitude), Number(city.longitude))
    if (distance < minDistance) {
      minDistance = distance
      nearest = city
    }
  })
  return nearest
}

const getUserCityAndLoad = () => {
  uni.getLocation({
    type: 'gcj02',
    geocode: true,
    success: (res) => {
      const addr = (res as any).address || {}
      const cityName = (addr.city || addr.province || '').replace(/市|省$/, '')
      const byName = cityName ? matchCityByName(cityName) : null
      const byDistance = matchNearestCity(res.latitude, res.longitude)
      const city = byName || byDistance
      if (city) {
        currentCityName.value = city.name.replace(/市$/, '')
        currentCityId.value = city.id
      } else {
        currentCityName.value = cityName || '全国'
        currentCityId.value = null
      }
      loadScenicList()
    },
    fail: () => {
      currentCityName.value = '全国'
      currentCityId.value = null
      loadScenicList()
    },
  })
}

const loadScenicList = async () => {
  loading.value = true
  try {
    const params: { pageNum: number; pageSize: number; cityId?: number } = {
      pageNum: 1,
      pageSize: 1000,
    }
    if (currentCityId.value) {
      params.cityId = currentCityId.value
    }
    const res = await scenicSpotApi.list(params)
    const data = res.data as ApiResponse<any>
    if (res.statusCode === 200 && data.code === 200) {
      const raw = data.data
      const rows: ScenicItem[] = Array.isArray(raw?.rows)
        ? raw.rows
        : Array.isArray(raw?.list)
        ? raw.list
        : Array.isArray(raw)
        ? raw
        : []
      scenicList.value = rows
    } else {
      scenicList.value = []
    }
  } catch {
    scenicList.value = []
  } finally {
    loading.value = false
    currentPage.value = 1
  }
}

const onSearchConfirm = () => {
  currentPage.value = 1
}

const chooseCity = () => {
  const handleCitySelected = (data: { id: number; name: string }) => {
    currentCityId.value = data.id
    currentCityName.value = data.name
    currentPage.value = 1
    loadScenicList()
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

const applyCityFromStorage = async () => {
  await syncSelectedCityName()
  const selected = uni.getStorageSync('ticket_selected_city') as { id?: number; name?: string; ts?: number } | null
  if (!selected || !selected.id || !selected.name) return
  const ts = Number(selected.ts || 0)
  if (ts <= lastCityApplyTs.value) return
  if (currentCityId.value === selected.id && currentCityName.value === selected.name) {
    lastCityApplyTs.value = ts
    return
  }
  currentCityId.value = selected.id
  currentCityName.value = selected.name
  currentPage.value = 1
  lastCityApplyTs.value = ts
  loadScenicList()
}

const goPrevPage = () => {
  if (currentPage.value <= 1) return
  currentPage.value -= 1
}

const goNextPage = () => {
  if (currentPage.value >= totalPages.value) return
  currentPage.value += 1
}

const goScenicDetail = (id: number) => {
  uni.navigateTo({ url: `/pages/scenic/detail?id=${id}&from=ticket` })
}

onMounted(async () => {
  await loadCityList()
  getUserCityAndLoad()
})

onShow(async () => {
  await loadCityList()
  await applyCityFromStorage()
})
</script>

<style scoped>
.ticket-list-page {
  min-height: 100vh;
  background: #f5f7f6;
  color: #2d3436;
}

.soft-shadow {
  box-shadow: 0 10rpx 24rpx rgba(31, 54, 45, 0.06);
}

.nav-bar {
  position: sticky;
  top: 0;
  z-index: 10;
  height: 96rpx;
  padding: 0 28rpx;
  padding-top: var(--status-bar-height, 0);
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #98cfc0;
  box-sizing: content-box;
}

.nav-title {
  font-size: 34rpx;
  font-weight: 600;
  color: #ffffff;
}

.nav-icon {
  width: 60rpx;
  text-align: center;
  font-size: 34rpx;
  color: #ffffff;
}

.filter-panel {
  background: #ffffff;
  margin: 18rpx 24rpx 0;
  border-radius: 20rpx;
  padding: 18rpx;
}

.city-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}

.city-label {
  font-size: 24rpx;
  color: #879892;
}

.city-value {
  font-size: 26rpx;
  color: #3f524d;
  font-weight: 600;
}

.city-picker {
  display: flex;
  align-items: center;
  gap: 6rpx;
  padding: 4rpx 10rpx;
  border-radius: 10rpx;
  background: #f3f7f5;
}

.city-arrow {
  font-size: 18rpx;
  color: #8aa099;
}

.search-row {
  display: flex;
  gap: 12rpx;
}

.search-input {
  flex: 1;
  height: 72rpx;
  border-radius: 14rpx;
  background: #f4f8f6;
  padding: 0 20rpx;
  font-size: 26rpx;
}

.search-btn {
  margin: 0;
  width: 132rpx;
  height: 72rpx;
  line-height: 72rpx;
  border-radius: 14rpx;
  background: #7bbfab;
  color: #fff;
  border: 0;
  font-size: 26rpx;
}

.search-btn::after {
  border: 0;
}

.page-scroll {
  height: calc(100vh - 96rpx - var(--status-bar-height, 0px) - 140rpx - 124rpx);
  padding: 16rpx 24rpx 0;
  box-sizing: border-box;
}

.loading-wrap,
.empty-wrap {
  margin-top: 120rpx;
  text-align: center;
  font-size: 28rpx;
  color: #93a49f;
}

.list-wrap {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.scenic-card {
  border-radius: 24rpx;
  overflow: hidden;
  background: #ffffff;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.08);
  transition: all 0.2s;
}

.scenic-card:active {
  transform: scale(0.98);
  opacity: 0.9;
}

.scenic-image-wrapper {
  width: 100%;
  height: 0;
  padding-bottom: 35%;
  position: relative;
  overflow: hidden;
  background-color: #e5e5e5;
}

.scenic-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.scenic-content {
  padding: 24rpx;
}

.name-price-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
  margin-bottom: 16rpx;
}

.scenic-name {
  font-size: 32rpx;
  font-weight: 600;
  color: #2f3f39;
  flex: 1;
  line-height: 1.4;
}

.scenic-price {
  font-size: 28rpx;
  color: #e14f4f;
  font-weight: 700;
}

.scenic-price.free {
  color: #71b9a3;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 8rpx;
  margin-bottom: 12rpx;
}

.meta-line {
  display: flex;
  align-items: center;
  gap: 4rpx;
  margin-bottom: 10rpx;
}

.time-line {
  margin-bottom: 8rpx;
}

.meta-icon {
  font-size: 22rpx;
  color: #7a8f88;
}

.meta-label {
  font-size: 22rpx;
  color: #6e7f7a;
  flex-shrink: 0;
}

.meta-text {
  font-size: 22rpx;
  color: #666666;
  line-height: 1.5;
}

.meta-split {
  color: #b7c2be;
  margin: 0 6rpx;
  flex-shrink: 0;
}

.meta-text.one-line {
  display: inline-block;
  max-width: 240rpx;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.detail-hint {
  margin-top: 0;
  font-size: 24rpx;
  color: #80a79a;
}

.card-actions-row {
  margin-top: 14rpx;
  padding-top: 14rpx;
  border-top: 1rpx solid #f0f2f1;
}

.bottom-space {
  height: 20rpx;
}

.bottom-pager {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  background: #ffffff;
  border-top: 1rpx solid #edf1ef;
  padding: 18rpx 24rpx calc(18rpx + env(safe-area-inset-bottom));
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
}

.pager-btn {
  margin: 0;
  flex: 1;
  height: 72rpx;
  line-height: 72rpx;
  border-radius: 999rpx;
  font-size: 26rpx;
  color: #4d5f5a;
  background: #edf5f1;
  border: 0;
}

.pager-btn::after {
  border: 0;
}

.pager-btn[disabled] {
  opacity: 0.55;
}

.pager-text {
  min-width: 140rpx;
  text-align: center;
  font-size: 26rpx;
  color: #667a74;
  font-weight: 600;
}
</style>

