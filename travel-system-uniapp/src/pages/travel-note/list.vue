<template>
  <view class="note-list-page">
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
        <view class="note-content">
          <text class="note-title">{{ note.title }}</text>
          <view class="note-author-row">
            <image
              class="note-author-avatar"
              :src="note.authorAvatar || 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=200'"
              mode="aspectFill"
            />
            <text class="note-author-name">{{ note.authorName || '匿名用户' }}</text>
          </view>
          <view class="note-stats">
            <view class="stat-item">
              <Eyes theme="outline" size="26" fill="#8a94a3" />
              <text>{{ note.viewCount || 0 }}</text>
            </view>
            <view class="stat-item">
              <Like theme="outline" size="26" fill="#3ba272" />
              <text>{{ note.likeCount || 0 }}</text>
            </view>
          </view>
        </view>
      </view>

      <view v-if="loading" class="loading">
        <text>加载中...</text>
      </view>
      <view v-if="noMore" class="no-more">
        <text>没有更多了</text>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { travelNoteApi, cityApi } from '@/api/content'

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
const pageNum = ref(1)
const pageSize = ref(10)
const loading = ref(false)
const noMore = ref(false)

const onCityChange = (e: any) => {
  selectedCity.value = cityList.value[e.detail.value]
  pageNum.value = 1
  noteList.value = []
  loadNotes()
}

const changeSort = (sort: string) => {
  sortBy.value = sort
  pageNum.value = 1
  noteList.value = []
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
        noteList.value.push(...data.list)
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

const loadMore = () => {
  loadNotes()
}

const viewDetail = (id: number) => {
  uni.navigateTo({
    url: `/pages/travel-note/detail?id=${id}`,
  })
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
    console.error('加载城市列表失败', error)
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
}

.filter-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 32rpx;
  background-color: #fff;
  border-bottom: 1rpx solid #eee;
}

.filter-item {
  padding: 12rpx 24rpx;
  background-color: #f7f8fa;
  border-radius: 8rpx;
  font-size: 26rpx;
  color: #333;
}

.sort-tabs {
  display: flex;
  gap: 24rpx;
}

.sort-tab {
  padding: 12rpx 24rpx;
  font-size: 26rpx;
  color: #666;
}

.sort-tab.active {
  color: #3ba272;
  font-weight: 600;
}

.scroll-view {
  height: calc(100vh - 100rpx);
}

.note-card {
  background-color: #fff;
  margin: 24rpx;
  border-radius: 24rpx;
  overflow: hidden;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.08);
}

.note-cover-wrapper {
  width: 100%;
  height: 0;
  padding-bottom: 56.25%; /* 16:9 比例 */
  position: relative;
  overflow: hidden;
}

.note-cover {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: #e5e5e5;
}

.note-content {
  padding: 24rpx;
}

.note-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333333;
  display: block;
  margin-bottom: 16rpx;
  line-height: 1.5;
}

.note-author-row {
  display: flex;
  align-items: center;
  margin-bottom: 12rpx;
}

.note-author-avatar {
  width: 48rpx;
  height: 48rpx;
  border-radius: 999rpx;
  background-color: #e5e5e5;
  margin-right: 12rpx;
}

.note-author-name {
  font-size: 24rpx;
  color: #666666;
}

.note-stats {
  display: flex;
  gap: 24rpx;
  font-size: 24rpx;
  color: #999999;
}

.stat-item {
  display: flex;
  align-items: center;
}

.loading,
.no-more {
  text-align: center;
  padding: 40rpx;
  color: #999;
  font-size: 26rpx;
}
</style>

