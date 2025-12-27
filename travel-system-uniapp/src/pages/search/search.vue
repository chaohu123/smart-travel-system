<template>
  <view class="search-page">
    <view class="search-bar-wrapper">
      <view class="search-bar">
        <Search class="search-icon" theme="outline" size="26" fill="#5f6c7b" />
        <input
          class="search-input"
          v-model="keyword"
          type="text"
          confirm-type="search"
          placeholder="搜索游记 / 景点 / 美食"
          @confirm="onSearch"
        />
        <CloseSmall
          v-if="keyword"
          class="clear-icon"
          @click="clearKeyword"
          theme="outline"
          size="22"
          fill="#a0a8b4"
        />
      </view>
      <button class="search-btn" @click="onSearch">搜索</button>
    </view>

    <view class="history" v-if="history.length">
      <view class="history-title">
        <text>最近搜索</text>
        <text class="history-clear" @click="clearHistory">清空</text>
      </view>
      <view class="history-tags">
        <view v-for="item in history" :key="item" class="history-chip" @click="useHistory(item)">
          {{ item }}
        </view>
      </view>
    </view>

    <view class="tabs">
      <view
        v-for="tab in tabs"
        :key="tab.key"
        class="tab"
        :class="{ active: activeTab === tab.key }"
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
      </view>
    </view>

    <scroll-view scroll-y class="result-scroll" @scrolltolower="loadMore">
      <view v-if="!hasSearched" class="tip-text">
        <text>输入关键词开始搜索</text>
      </view>

      <view v-else>
        <view v-if="activeTab === 'note'">
          <view v-for="item in results.notes" :key="item.id" class="result-card" @click="openNote(item)">
            <text class="result-title">{{ item.title }}</text>
            <text class="result-sub">{{ item.cityName || '热门城市' }}</text>
          </view>
        </view>

        <view v-else-if="activeTab === 'scenic'">
          <view v-for="item in results.scenics" :key="item.id" class="result-card" @click="openScenic(item)">
            <text class="result-title">{{ item.name }}</text>
            <text class="result-sub">{{ item.address || item.intro }}</text>
          </view>
        </view>

        <view v-else>
          <view v-for="item in results.foods" :key="item.id" class="result-card" @click="openFood(item)">
            <text class="result-title">{{ item.name }}</text>
            <text class="result-sub">{{ item.foodType || item.address }}</text>
          </view>
        </view>

        <view v-if="loading" class="tip-text">加载中...</view>
        <view v-else-if="noMore && hasSearched" class="tip-text">没有更多了</view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { travelNoteApi, scenicSpotApi, foodApi } from '@/api/content'
import { getCache, setCache } from '@/utils/storage'

const keyword = ref('')
const hasSearched = ref(false)
const loading = ref(false)
const noMore = ref(false)
const page = ref(1)
const pageSize = 10

const history = ref<string[]>(getCache('search_history') || [])
const tabs = [
  { key: 'note', label: '游记' },
  { key: 'scenic', label: '景点' },
  { key: 'food', label: '美食' },
]
const activeTab = ref<'note' | 'scenic' | 'food'>('note')
const results = ref({
  notes: [] as any[],
  scenics: [] as any[],
  foods: [] as any[],
})

const onSearch = () => {
  hasSearched.value = true
  if (!keyword.value) {
    uni.showToast({ title: '请输入关键词', icon: 'none' })
    return
  }
  page.value = 1
  noMore.value = false
  saveHistory(keyword.value)
  fetchData()
}

const clearKeyword = () => {
  keyword.value = ''
}

const saveHistory = (kw: string) => {
  const list = [kw, ...history.value.filter((i) => i !== kw)].slice(0, 8)
  history.value = list
  setCache('search_history', list, 24 * 60)
}

const clearHistory = () => {
  history.value = []
  setCache('search_history', [])
}

const useHistory = (kw: string) => {
  keyword.value = kw
  onSearch()
}

const fetchData = async () => {
  loading.value = true
  try {
    const [noteRes, scenicRes, foodRes] = await Promise.all([
      travelNoteApi.list({ pageNum: page.value, pageSize }),
      scenicSpotApi.list({ pageNum: page.value, pageSize }),
      foodApi.list({ pageNum: page.value, pageSize }),
    ])
    if (noteRes.statusCode === 200 && (noteRes.data as any).code === 200) {
      const rows = (noteRes.data as any).data?.rows || (noteRes.data as any).data || []
      const filtered = rows.filter((n: any) => n.title?.includes(keyword.value))
      results.value.notes = page.value === 1 ? filtered : results.value.notes.concat(filtered)
      if (filtered.length < pageSize) noMore.value = true
    }
    if (scenicRes.statusCode === 200 && (scenicRes.data as any).code === 200) {
      const rows = (scenicRes.data as any).data?.rows || (scenicRes.data as any).data || []
      const filtered = rows.filter((n: any) => n.name?.includes(keyword.value))
      results.value.scenics = page.value === 1 ? filtered : results.value.scenics.concat(filtered)
    }
    if (foodRes.statusCode === 200 && (foodRes.data as any).code === 200) {
      const rows = (foodRes.data as any).data?.rows || (foodRes.data as any).data || []
      const filtered = rows.filter((n: any) => n.name?.includes(keyword.value))
      results.value.foods = page.value === 1 ? filtered : results.value.foods.concat(filtered)
    }
  } finally {
    loading.value = false
  }
}

const loadMore = () => {
  if (loading.value || noMore.value || !hasSearched.value) return
  page.value += 1
  fetchData()
}

const openNote = (item: any) => {
  uni.navigateTo({ url: `/pages/travel-note/detail?id=${item.id}` })
}
const openScenic = (item: any) => {
  uni.navigateTo({ url: `/pages/scenic/detail?id=${item.id}` })
}
const openFood = (item: any) => {
  uni.navigateTo({ url: `/pages/food/detail?id=${item.id}` })
}

onMounted(() => {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1] as any
  const options = (currentPage.options || {}) as { keyword?: string }
  if (options.keyword) {
    keyword.value = decodeURIComponent(options.keyword)
    onSearch()
  }
})
</script>

<style scoped>
.search-page {
  min-height: 100vh;
  background-color: #f7f8fa;
  display: flex;
  flex-direction: column;
}

.search-bar-wrapper {
  padding: 16rpx 24rpx;
  display: flex;
  align-items: center;
  gap: 16rpx;
  background-color: #ffffff;
}

.search-bar {
  flex: 1;
  display: flex;
  align-items: center;
  padding: 16rpx 20rpx;
  border-radius: 999rpx;
  background-color: #f5f5f5;
}

.search-icon {
  font-size: 26rpx;
  margin-right: 8rpx;
}

.search-input {
  flex: 1;
  font-size: 26rpx;
  color: #333333;
}

.clear-icon {
  font-size: 26rpx;
  color: #999999;
  padding-left: 8rpx;
}

.search-btn {
  padding: 16rpx 24rpx;
  font-size: 26rpx;
  background-color: #3ba272;
  color: #ffffff;
  border-radius: 16rpx;
}

.history {
  padding: 16rpx 24rpx;
}

.history-title {
  display: flex;
  justify-content: space-between;
  color: #666;
  font-size: 26rpx;
  margin-bottom: 10rpx;
}

.history-clear {
  color: #3ba272;
}

.history-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

.history-chip {
  padding: 10rpx 18rpx;
  background: #f2f4f7;
  border-radius: 12rpx;
  font-size: 24rpx;
  color: #444;
}

.tabs {
  display: flex;
  background: #ffffff;
  border-bottom: 1rpx solid #eee;
}

.tab {
  flex: 1;
  text-align: center;
  padding: 18rpx 0;
  font-size: 28rpx;
  color: #888;
}

.tab.active {
  color: #3ba272;
  font-weight: 600;
  border-bottom: 4rpx solid #3ba272;
}

.result-scroll {
  flex: 1;
}

.tip-text {
  padding: 80rpx 40rpx;
  text-align: center;
  font-size: 26rpx;
  color: #999999;
}

.result-card {
  padding: 20rpx 24rpx;
  background: #ffffff;
  border-bottom: 1rpx solid #f1f1f1;
}

.result-title {
  display: block;
  font-size: 30rpx;
  font-weight: 600;
  color: #333;
}

.result-sub {
  display: block;
  margin-top: 6rpx;
  font-size: 24rpx;
  color: #888;
}
</style>



