<template>
  <view class="city-select-page">
    <!-- 顶部搜索框 -->
    <view class="search-bar">
      <view class="search-input-wrapper">
        <text class="iconfont icon-sousuo search-icon"></text>
        <input
          class="search-input"
          v-model="searchKeyword"
          type="text"
          confirm-type="search"
          placeholder="搜索城市名称或拼音"
        />
        <text v-if="searchKeyword" class="clear-text" @click="clearSearch">清空</text>
      </view>
    </view>

    <!-- 城市列表：按首字母分组 -->
    <scroll-view scroll-y class="city-scroll">
      <view
        v-for="group in groupedCityList"
        :key="group.initial"
        class="city-group"
      >
        <view class="group-header">
          <text class="group-title">{{ group.initial }}</text>
        </view>
        <view class="city-list">
          <view
            v-for="city in group.cities"
            :key="city.id"
            class="city-item"
            @click="selectCity(city)"
          >
            <view class="city-item-left">
              <image
                v-if="city.imageUrl"
                class="city-thumb"
                :src="getImageUrl(city.imageUrl)"
                mode="aspectFill"
              />
              <view v-else class="city-thumb city-thumb-placeholder">城</view>
              <text class="city-name">{{ city.name }}</text>
            </view>
          </view>
        </view>
      </view>

      <view v-if="!groupedCityList.length && !loading" class="empty">
        <text>未找到相关城市</text>
      </view>

      <view v-if="loading" class="loading">
        <text>加载中...</text>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { cityApi, type ApiResponse } from '@/api/content'
import { getImageUrl } from '@/utils/image'

interface CityItem {
  id: number
  name: string
  imageUrl?: string
  pinyinKey: string
  initial: string
}

const searchKeyword = ref('')
const allCities = ref<CityItem[]>([])
const loading = ref(false)

// 简单获取首字母：优先后端给的拼音字段，其次城市名本身
const buildCityItem = (raw: any): CityItem | null => {
  const id = raw.id
  const name: string = raw.cityName || raw.name
  if (!id || !name) return null

  const pinyinSource: string =
    raw.pinyin ||
    raw.py ||
    raw.spell ||
    raw.pinyinFull ||
    name

  const firstChar = pinyinSource.trim().charAt(0)
  let initial = '#'

  if (firstChar) {
    const upper = firstChar.toUpperCase()
    if (upper >= 'A' && upper <= 'Z') {
      initial = upper
    }
  }

  return {
    id,
    name,
    imageUrl: raw.imageUrl || '',
    pinyinKey: pinyinSource.toLowerCase(),
    initial,
  }
}

const filteredCities = computed(() => {
  const kw = searchKeyword.value.trim().toLowerCase()
  if (!kw) return allCities.value
  return allCities.value.filter((c) => {
    return (
      c.name.toLowerCase().includes(kw) ||
      c.pinyinKey.includes(kw)
    )
  })
})

const groupedCityList = computed(() => {
  const groups: Record<string, CityItem[]> = {}
  filteredCities.value.forEach((city) => {
    const key = city.initial || '#'
    if (!groups[key]) {
      groups[key] = []
    }
    groups[key].push(city)
  })

  const initials = Object.keys(groups).sort((a, b) => {
    if (a === '#') return 1
    if (b === '#') return -1
    return a.localeCompare(b)
  })

  return initials.map((initial) => ({
    initial,
    cities: groups[initial].sort((a, b) =>
      a.pinyinKey.localeCompare(b.pinyinKey)
    ),
  }))
})

const clearSearch = () => {
  searchKeyword.value = ''
}

const loadCities = async () => {
  loading.value = true
  try {
    const res = await cityApi.list()
    const response = res.data as ApiResponse<any[]>
    if (res.statusCode === 200 && response.code === 200) {
      const raw = response.data || []
      const mapped: CityItem[] = raw
        .map((c: any) => buildCityItem(c))
        .filter((c: CityItem | null): c is CityItem => !!c)
      allCities.value = mapped
    } else {
      uni.showToast({
        title: response.msg || '城市加载失败',
        icon: 'none',
      })
    }
  } catch (error) {
    uni.showToast({
      title: '城市加载失败',
      icon: 'none',
    })
  } finally {
    loading.value = false
  }
}

let eventChannel: UniApp.EventChannel | null = null

const selectCity = (city: CityItem) => {
  const selectedCity = {
    id: city.id,
    name: city.name,
    ts: Date.now(),
  }
  uni.setStorageSync('ticket_selected_city', selectedCity)
  if (eventChannel) {
    eventChannel.emit('citySelected', selectedCity)
  }
  uni.navigateBack()
}

onLoad(() => {
  // 获取打开本页面的 eventChannel 用于回传选中的城市
  try {
    // 在小程序环境下通过 uni.getOpenerEventChannel 获取
    // @ts-ignore
    eventChannel = uni.getOpenerEventChannel
      ? // @ts-ignore
        uni.getOpenerEventChannel()
      : null
  } catch {
    eventChannel = null
  }
})

onMounted(() => {
  loadCities()
})
</script>

<style scoped>
.city-select-page {
  min-height: 100vh;
  background-color: #f6f7f8;
  display: flex;
  flex-direction: column;
}

.search-bar {
  padding: 20rpx 24rpx;
  background-color: #ffffff;
  border-bottom: 1rpx solid #f0f0f0;
}

.search-input-wrapper {
  display: flex;
  align-items: center;
  padding: 16rpx 24rpx;
  background-color: #f5f6f7;
  border-radius: 48rpx;
}

.search-icon {
  font-size: 32rpx;
  color: #9ea7b0;
  margin-right: 12rpx;
}

.search-input {
  flex: 1;
  font-size: 26rpx;
  color: #333333;
}

.clear-text {
  font-size: 24rpx;
  color: #9ea7b0;
  margin-left: 12rpx;
}

.city-scroll {
  flex: 1;
}

.city-group {
  padding: 8rpx 0 0;
}

.group-header {
  padding: 8rpx 24rpx;
  background-color: #f0f2f5;
}

.group-title {
  font-size: 24rpx;
  color: #9ea7b0;
}

.city-list {
  background-color: #ffffff;
}

.city-item {
  padding: 26rpx 24rpx;
  border-bottom: 1rpx solid #f5f5f5;
}

.city-item-left {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.city-thumb {
  width: 56rpx;
  height: 56rpx;
  border-radius: 12rpx;
  flex-shrink: 0;
  background-color: #eef2f6;
}

.city-thumb-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ea7b0;
  font-size: 24rpx;
}

.city-item:last-child {
  border-bottom-width: 0;
}

.city-name {
  font-size: 28rpx;
  color: #333333;
}

.empty,
.loading {
  padding: 60rpx 24rpx;
  text-align: center;
  font-size: 26rpx;
  color: #9ea7b0;
}
</style>

