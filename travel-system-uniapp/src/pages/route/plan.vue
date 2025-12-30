<template>
  <view class="plan-page">
    <view class="page-bg"></view>
    <scroll-view scroll-y class="plan-scroll">
      <!-- 条件选择区（卡片） -->
      <view class="plan-form">
        <!-- 标题 -->
        <view class="form-header">
          <text class="header-title">智能生成你的完美行程</text>
        </view>

        <!-- 目的地 -->
        <view class="form-item">
          <text class="form-label">目的地</text>
          <input
            class="destination-input"
            v-model="destination"
            placeholder="北京"
            placeholder-style="color: #999999; font-weight: normal;"
            @input="onDestinationInput"
            type="text"
            maxlength="50"
          />
          <text class="form-hint">支持自然输入，如"北京3日游"</text>
        </view>

        <!-- 出行日期选择 -->
        <view class="form-item">
          <text class="form-label">游玩时间</text>
          <view class="date-picker-container">
            <view class="date-input-wrapper">
              <picker mode="date" :value="startDate" :start="minDate" @change="onStartDateChange" class="date-picker-item">
                <view class="date-input">
                  <text class="date-label">开始日期</text>
                  <text class="date-value" :class="{ placeholder: !startDate }">
                    {{ startDate ? formatDate(startDate) : '选择开始日期' }}
                  </text>
                </view>
              </picker>
              <text class="date-separator">至</text>
              <picker mode="date" :value="endDate" :start="startDate || minDate" @change="onEndDateChange" class="date-picker-item">
                <view class="date-input">
                  <text class="date-label">结束日期</text>
                  <text class="date-value" :class="{ placeholder: !endDate }">
                    {{ endDate ? formatDate(endDate) : '选择结束日期' }}
                  </text>
                </view>
              </picker>
              <view class="calendar-icon-wrapper">
                <text class="calendar-icon">📅</text>
              </view>
            </view>
          </view>
          <text class="form-hint">点击输入框右侧日历图标选择具体游玩时间</text>
          <view v-if="travelDays > 0" class="days-display">
            <text class="days-text">共 {{ travelDays }} 天 {{ travelDays - 1 }} 晚</text>
          </view>
        </view>

        <!-- 旅行偏好（多选 Tag） -->
        <view class="form-item">
          <text class="form-label">旅行偏好 <text class="label-optional">(可多选)</text></text>
          <view class="tag-list">
            <view
              v-for="tag in tagList"
              :key="tag.id"
              class="tag-item"
              :class="{ active: selectedTags.includes(tag.id) }"
              :style="selectedTags.includes(tag.id) ? { backgroundColor: tag.color, borderColor: tag.color } : {}"
              @click="toggleTag(tag.id)"
            >
              <text>{{ tag.name }}</text>
            </view>
          </view>
        </view>

        <!-- 同行人 -->
        <view class="form-item">
          <text class="form-label">同行人</text>
          <view class="companion-list">
            <view
              v-for="companion in companionList"
              :key="companion.id"
              class="companion-item"
              :class="{ active: selectedCompanion === companion.id }"
              @click="selectCompanion(companion.id)"
            >
              <text>{{ companion.name }}</text>
            </view>
          </view>
        </view>

        <!-- 每天选择景点和美食 -->
        <view class="form-item">
          <text class="form-label">每日行程选择 <text class="label-optional">(可选)</text></text>
          <text class="form-hint">为每一天选择想要去的景点和美食，可从待选列表、收藏列表或全部列表中选择</text>

          <!-- 待选列表提示 -->
          <view v-if="pendingScenics.length > 0 || pendingFoods.length > 0" class="pending-notice">
            <text class="pending-notice-icon">📋</text>
            <text class="pending-notice-text">
              您有{{ pendingScenics.length + pendingFoods.length }}个待选项目，可在选择时添加到任意天数
            </text>
          </view>

          <view class="daily-selections">
            <view
              v-for="(day, dayIndex) in dailySelections"
              :key="dayIndex"
              class="day-selection-card"
            >
              <view class="day-selection-header">
                <text class="day-selection-title">第{{ dayIndex + 1 }}天</text>
                <view class="day-selection-actions">
                  <text class="action-link" @click="openDaySelector(dayIndex, 'scenic')">
                    选择景点 ({{ day.scenicIds.length }})
                  </text>
                  <text class="action-link" @click="openDaySelector(dayIndex, 'food')">
                    选择美食 ({{ day.foodIds.length }})
                  </text>
                </view>
              </view>

              <view v-if="day.scenicIds.length > 0 || day.foodIds.length > 0" class="day-selection-content">
                <view v-if="day.scenicIds.length > 0" class="selection-items">
                  <text class="selection-label">景点：</text>
                  <view class="selection-tags">
                    <view
                      v-for="scenicId in day.scenicIds"
                      :key="scenicId"
                      class="selection-tag"
                    >
                      <text>{{ getScenicName(scenicId) }}</text>
                      <text class="tag-close" @click="removeScenic(dayIndex, scenicId)">×</text>
                    </view>
                  </view>
                </view>
                <view v-if="day.foodIds.length > 0" class="selection-items">
                  <text class="selection-label">美食：</text>
                  <view class="selection-tags">
                    <view
                      v-for="foodId in day.foodIds"
                      :key="foodId"
                      class="selection-tag"
                    >
                      <text>{{ getFoodName(foodId) }}</text>
                      <text class="tag-close" @click="removeFood(dayIndex, foodId)">×</text>
                    </view>
                  </view>
                </view>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- "开始智能规划"按钮（核心按钮） -->
      <view class="submit-section">
        <button
          class="submit-btn"
          :class="{ disabled: !canSubmit }"
          @click="generateRoute"
        >
          <text>开始智能规划</text>
        </button>
      </view>

      <!-- 线路结果展示（如果有历史记录） -->
      <view v-if="recentRoutes.length > 0" class="recent-routes">
        <view class="section-title">最近生成的线路</view>
        <view
          v-for="route in recentRoutes"
          :key="route.id"
          class="route-item"
          @click="viewRoute(route.id)"
        >
          <text class="route-item-title">{{ route.title }}</text>
          <text class="route-item-arrow">›</text>
        </view>
      </view>
    </scroll-view>

    <!-- 加载中 - 飞机飞向旋转地球动画 -->
    <view v-if="loading" class="loading-overlay">
      <view class="loading-content">
        <view class="loading-animation">
          <!-- 旋转的地球 -->
          <view class="earth-container">
            <text class="earth-icon">🌍</text>
          </view>
          <!-- 飞行的飞机 -->
          <view class="airplane-container">
            <text class="airplane-icon">✈️</text>
          </view>
        </view>
        <text class="loading-text">正在为您规划行程...</text>
      </view>
    </view>

    <!-- 选择器弹窗 -->
    <view v-if="selectorVisible" class="selector-modal" @click="closeSelector">
      <view class="selector-content" @click.stop>
        <view class="selector-header">
          <text class="selector-title">{{ selectorTitle }}</text>
          <text class="selector-close" @click="closeSelector">×</text>
        </view>
        <view class="selector-tabs">
          <view
            class="selector-tab"
            :class="{ active: selectorTab === 'pending' }"
            @click="selectorTab = 'pending'"
          >
            <text>待选列表</text>
            <text v-if="getPendingCount() > 0" class="tab-badge">{{ getPendingCount() }}</text>
          </view>
          <view
            class="selector-tab"
            :class="{ active: selectorTab === 'favorite' }"
            @click="selectorTab = 'favorite'"
          >
            <text>我的收藏</text>
          </view>
          <view
            class="selector-tab"
            :class="{ active: selectorTab === 'all' }"
            @click="selectorTab = 'all'"
          >
            <text>全部</text>
          </view>
        </view>
        <scroll-view scroll-y class="selector-list">
          <view
            v-for="item in selectorList"
            :key="item.id"
            class="selector-item"
            :class="{ selected: isSelected(item.id) }"
            @click="toggleSelect(item.id)"
          >
            <text class="selector-item-name">{{ item.name }}</text>
            <text v-if="isSelected(item.id)" class="selector-check">✓</text>
          </view>
          <view v-if="selectorList.length === 0" class="selector-empty">
            <text>暂无数据</text>
          </view>
        </scroll-view>
        <view class="selector-footer">
          <button class="selector-btn" @click="confirmSelection">确定</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { routeApi } from '@/api/route'
import { cityApi, tagApi, scenicSpotApi, foodApi } from '@/api/content'
import { useUserStore } from '@/store/user'
import { getCache, setCache, removeCache } from '@/utils/storage'

// API 响应类型定义
interface ApiResponse<T = any> {
  code: number
  msg?: string
  data: T
}

const cityList = ref<{ id: number; name: string }[]>([])
const destination = ref('北京')
const selectedDayIndex = ref(1) // 默认选择"3天"
const selectedTags = ref<number[]>([])
const selectedCompanion = ref<number>(1) // 默认选择"独行"
const loading = ref(false)
const recentRoutes = ref<any[]>([])
const store = useUserStore()
const user = computed(() => store.state.profile)

// 日期选择相关
const startDate = ref<string>('')
const endDate = ref<string>('')
const minDate = ref<string>(new Date().toISOString().split('T')[0])

// 每天的选择数据
const dailySelections = ref<Array<{ scenicIds: number[], foodIds: number[] }>>([])

// 选择器相关
const selectorVisible = ref(false)
const selectorTab = ref<'pending' | 'favorite' | 'all'>('pending') // 添加待选列表标签
const selectorType = ref<'scenic' | 'food'>('scenic')
const selectorDayIndex = ref(0)
const selectorList = ref<Array<{ id: number, name: string }>>([])
const selectorTempSelected = ref<number[]>([])

// 收藏列表缓存
const favoriteScenics = ref<Array<{ id: number, name: string }>>([])
const favoriteFoods = ref<Array<{ id: number, name: string }>>([])
const allScenics = ref<Array<{ id: number, name: string }>>([])
const allFoods = ref<Array<{ id: number, name: string }>>([])

// 待选列表（从详情页添加的景点和美食）
const pendingScenics = ref<Array<{ id: number, name: string }>>([])
const pendingFoods = ref<Array<{ id: number, name: string }>>([])

// 天数选项
const dayOptions = ref([
  { label: '2天', value: 2 },
  { label: '3天', value: 3 },
  { label: '4天', value: 4 },
  { label: '5天', value: 5 },
  { label: '6天', value: 6 },
  { label: '7天', value: 7 },
  { label: '2天1晚', value: 2 },
  { label: '3天2晚', value: 3 },
  { label: '5天4晚', value: 5 },
])

// 旅行偏好标签（从API获取）
const tagList = ref<Array<{ id: number; name: string; color: string }>>([])

// 标签颜色预设（循环使用）
const tagColors = [
  '#3ba272', // 绿色
  '#ff6b9d', // 粉色
  '#ff9800', // 橙色
  '#9c27b0', // 紫色
  '#2196f3', // 蓝色
  '#f44336', // 红色
  '#00bcd4', // 青色
  '#ffc107', // 黄色
]

// 同行人选项
const companionList = ref([
  { id: 1, name: '独行' },
  { id: 2, name: '情侣' },
  { id: 3, name: '家庭' },
  { id: 4, name: '朋友' },
  { id: 5, name: '亲子' },
])

const canSubmit = computed(() => {
  return destination.value.trim() !== '' && selectedTags.value.length > 0 && startDate.value !== '' && endDate.value !== ''
})

// 目的地输入处理（支持自然语言解析，如"北京3日游"）
const onDestinationInput = (e: any) => {
  const input = e.detail.value
  destination.value = input

  // 尝试从输入中解析天数，如"北京3日游" -> 提取"3"
  const dayMatch = input.match(/(\d+)[日天]/)
  if (dayMatch) {
    const days = parseInt(dayMatch[1])
    const dayOption = dayOptions.value.find(opt => opt.value === days)
    if (dayOption) {
      selectedDayIndex.value = dayOptions.value.indexOf(dayOption)
    }
  }
}

// 计算出行天数
const travelDays = computed(() => {
  if (!startDate.value || !endDate.value) return 0
  const start = new Date(startDate.value)
  const end = new Date(endDate.value)
  const diffTime = Math.abs(end.getTime() - start.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
  return diffDays
})

// 格式化日期显示
const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  const month = date.getMonth() + 1
  const day = date.getDate()
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  const weekday = weekdays[date.getDay()]
  return `${month}月${day}日(${weekday})`
}

// 开始日期变化
const onStartDateChange = (e: any) => {
  const selectedDate = e.detail.value
  if (!endDate.value || selectedDate <= endDate.value) {
    startDate.value = selectedDate
    updateDailySelections()
  } else {
    uni.showToast({
      title: '开始日期不能晚于结束日期',
      icon: 'none'
    })
  }
}

// 结束日期变化
const onEndDateChange = (e: any) => {
  const selectedDate = e.detail.value
  if (!startDate.value) {
    uni.showToast({
      title: '请先选择开始日期',
      icon: 'none'
    })
    return
  }
  if (selectedDate >= startDate.value) {
    endDate.value = selectedDate
    updateDailySelections()
  } else {
    uni.showToast({
      title: '结束日期不能早于开始日期',
      icon: 'none'
    })
  }
}

// 更新每天选择数组
const updateDailySelections = () => {
  const days = travelDays.value
  if (days > 0) {
    while (dailySelections.value.length < days) {
      dailySelections.value.push({ scenicIds: [], foodIds: [] })
    }
    while (dailySelections.value.length > days) {
      dailySelections.value.pop()
    }
  }
}

// 天数选择变化（保留兼容性）
const onDayChange = (e: any) => {
  selectedDayIndex.value = e.detail.value
  const days = dayOptions.value[selectedDayIndex.value]?.value || 3
  // 更新每天选择数组
  while (dailySelections.value.length < days) {
    dailySelections.value.push({ scenicIds: [], foodIds: [] })
  }
  while (dailySelections.value.length > days) {
    dailySelections.value.pop()
  }
}

// 选择同行人
const selectCompanion = (companionId: number) => {
  selectedCompanion.value = companionId
}

const viewRoute = (routeId: number) => {
  uni.navigateTo({
    url: `/pages/itinerary/itinerary-detail?id=${routeId}`,
  })
}

const toggleTag = (tagId: number) => {
  const index = selectedTags.value.indexOf(tagId)
  if (index > -1) {
    selectedTags.value.splice(index, 1)
  } else {
    selectedTags.value.push(tagId)
  }
}

// 从目的地文本中提取城市名称
const extractCityFromDestination = (dest: string): string => {
  // 移除天数相关文字，如"3日游"、"3天"等
  const cleaned = dest.replace(/\d+[日天]游?/g, '').trim()
  return cleaned || dest
}

// 根据城市名称查找城市ID
const findCityId = (cityName: string): number | null => {
  const city = cityList.value.find(c =>
    c.name.includes(cityName) || cityName.includes(c.name)
  )
  return city ? city.id : null
}

const generateRoute = async () => {
  if (!canSubmit.value) {
    uni.showToast({
      title: '请完成必填项',
      icon: 'none',
    })
    return
  }

  // 先隐藏系统默认的加载提示（防止API调用时显示）
  uni.hideLoading()
  loading.value = true

  try {
    // 从目的地中提取城市名称
    const cityName = extractCityFromDestination(destination.value)
    let cityId = findCityId(cityName)

    // 如果找不到城市，尝试使用第一个城市或提示用户
    if (!cityId && cityList.value.length > 0) {
      // 可以尝试模糊匹配或使用默认城市
      cityId = cityList.value[0].id
    }

    if (!cityId) {
      uni.showToast({
        title: '未找到对应城市，请检查目的地输入',
        icon: 'none',
        duration: 2000,
      })
      loading.value = false
      return
    }

    // 优先使用日期选择的天数，否则使用下拉选择的天数
    let selectedDays = travelDays.value
    if (selectedDays === 0) {
      selectedDays = dayOptions.value[selectedDayIndex.value]?.value || 3
    }

    // 验证日期选择
    if (!startDate.value || !endDate.value) {
      uni.showToast({
        title: '请选择游玩时间',
        icon: 'none',
      })
      loading.value = false
      return
    }

    // 获取同行人名称
    const companion = companionList.value.find(c => c.id === selectedCompanion.value)
    const suitablePeople = companion ? companion.name : '独行'

    // 构建每天选择的数据
    const dailySelectionsData = dailySelections.value.map((day, index) => ({
      day: index + 1,
      scenicIds: day.scenicIds || [],
      foodIds: day.foodIds || [],
    }))

    const res = await routeApi.generate({
      cityId: cityId,
      days: selectedDays,
      tagIds: selectedTags.value,
      suitablePeople: suitablePeople,
      useAi: true,
      dailySelections: dailySelectionsData,
      startDate: startDate.value,
      endDate: endDate.value,
    })

    if (res.statusCode === 200 && res.data.code === 200) {
      const routeId = res.data.data.routeId

      if (!routeId) {
        uni.showToast({
          title: '路线ID获取失败',
          icon: 'none'
        })
        loading.value = false
        return
      }

      // 关闭加载动画
      loading.value = false

      // 等待一小段时间确保后端数据完全生成，避免跳转超时
      await new Promise(resolve => setTimeout(resolve, 800))

      // 跳转到详情页，使用 encodeURIComponent 确保参数正确传递
      const detailUrl = `/pages/itinerary/itinerary-detail?id=${encodeURIComponent(routeId)}`
      console.log('[generateRoute] 准备跳转到详情页:', detailUrl)

      uni.navigateTo({
        url: detailUrl,
        success: () => {
          console.log('[generateRoute] 跳转成功')
        },
        fail: (err) => {
          console.error('[generateRoute] navigateTo 失败:', err)
          // 如果跳转失败，尝试使用 redirectTo
          uni.redirectTo({
            url: detailUrl,
            success: () => {
              console.log('[generateRoute] redirectTo 成功')
            },
            fail: (redirectErr) => {
              console.error('[generateRoute] redirectTo 也失败:', redirectErr)
              uni.showToast({
                title: '页面跳转失败，请手动刷新',
                icon: 'none',
                duration: 3000
              })
            }
          })
        }
      })
    } else {
      uni.showToast({
        title: res.data.msg || '生成失败',
        icon: 'none',
      })
    }
  } catch (error) {
    uni.showToast({
      title: '网络错误',
      icon: 'none',
    })
  } finally {
    loading.value = false
  }
}

const loadCities = async () => {
  try {
    const res = await cityApi.list()
    const response = res.data as ApiResponse<any[]>
    if (res.statusCode === 200 && response.code === 200) {
      const cities = response.data || []
      cityList.value = cities.map((city: any) => ({
        id: city.id,
        name: city.cityName || city.name,
      }))
    }
  } catch (error) {
    console.error('加载城市列表失败', error)
  }
}

// 加载标签列表
const loadTags = async () => {
  try {
    const res = await tagApi.list()
    const response = res.data as ApiResponse<any[]>
    if (res.statusCode === 200 && response.code === 200) {
      const tags = response.data || []
      // 将标签数据转换为前端需要的格式，并分配颜色
      tagList.value = tags.map((tag: any, index: number) => ({
        id: tag.id,
        name: tag.tagName || tag.name,
        color: tagColors[index % tagColors.length], // 循环使用颜色
      }))
      console.log('标签列表加载成功:', tagList.value)
    }
  } catch (error) {
    console.error('加载标签列表失败', error)
    // 如果加载失败，使用空数组
    tagList.value = []
  }
}

// 打开选择器
const openDaySelector = async (dayIndex: number, type: 'scenic' | 'food') => {
  selectorDayIndex.value = dayIndex
  selectorType.value = type

  // 优先显示待选列表（如果有的话）
  loadPendingAdditions()
  const hasPending = type === 'scenic' ? pendingScenics.value.length > 0 : pendingFoods.value.length > 0
  selectorTab.value = hasPending ? 'pending' : (user.value ? 'favorite' : 'all')

  selectorTempSelected.value = [...(type === 'scenic'
    ? dailySelections.value[dayIndex].scenicIds
    : dailySelections.value[dayIndex].foodIds)]

  await loadSelectorList()
  selectorVisible.value = true
}

// 获取待选列表数量
const getPendingCount = () => {
  if (selectorType.value === 'scenic') {
    return pendingScenics.value.length
  } else {
    return pendingFoods.value.length
  }
}

// 加载选择器列表
const loadSelectorList = async () => {
  try {
    if (selectorTab.value === 'pending') {
      // 显示待选列表
      if (selectorType.value === 'scenic') {
        selectorList.value = pendingScenics.value
      } else {
        selectorList.value = pendingFoods.value
      }
    } else if (selectorTab.value === 'favorite') {
      // 加载收藏列表
      if (selectorType.value === 'scenic') {
        if (favoriteScenics.value.length === 0) {
          const res = await scenicSpotApi.getMyFavorites(user.value!.id)
          if (res.statusCode === 200 && res.data.code === 200) {
            favoriteScenics.value = (res.data.data?.list || []).map((item: any) => ({
              id: item.id,
              name: item.name,
            }))
          }
        }
        selectorList.value = favoriteScenics.value
      } else {
        if (favoriteFoods.value.length === 0) {
          const res = await foodApi.getMyFavorites(user.value!.id)
          if (res.statusCode === 200 && res.data.code === 200) {
            favoriteFoods.value = (res.data.data?.list || []).map((item: any) => ({
              id: item.id,
              name: item.name,
            }))
          }
        }
        selectorList.value = favoriteFoods.value
      }
    } else {
      // 加载全部列表（根据城市筛选）
      const cityName = extractCityFromDestination(destination.value)
      const cityId = findCityId(cityName)

      if (selectorType.value === 'scenic') {
        if (allScenics.value.length === 0 || cityId) {
          const res = await scenicSpotApi.list({ cityId: cityId || undefined, pageSize: 100 })
          if (res.statusCode === 200 && res.data.code === 200) {
            allScenics.value = (res.data.data?.list || []).map((item: any) => ({
              id: item.id,
              name: item.name,
            }))
          }
        }
        selectorList.value = allScenics.value
      } else {
        if (allFoods.value.length === 0 || cityId) {
          const res = await foodApi.list({ cityId: cityId || undefined, pageSize: 100 })
          if (res.statusCode === 200 && res.data.code === 200) {
            allFoods.value = (res.data.data?.list || []).map((item: any) => ({
              id: item.id,
              name: item.name,
            }))
          }
        }
        selectorList.value = allFoods.value
      }
    }
  } catch (error) {
    console.error('加载选择器列表失败:', error)
    uni.showToast({ title: '加载失败', icon: 'none' })
  }
}

// 监听选择器标签切换
watch(selectorTab, () => {
  loadSelectorList()
})

// 判断是否已选择
const isSelected = (id: number) => {
  return selectorTempSelected.value.includes(id)
}

// 切换选择
const toggleSelect = (id: number) => {
  const index = selectorTempSelected.value.indexOf(id)
  if (index > -1) {
    selectorTempSelected.value.splice(index, 1)
  } else {
    selectorTempSelected.value.push(id)
  }
}

// 确认选择
const confirmSelection = () => {
  if (selectorType.value === 'scenic') {
    dailySelections.value[selectorDayIndex.value].scenicIds = [...selectorTempSelected.value]
    // 注意：不从待选列表中移除，允许用户在不同天数重复选择
  } else {
    dailySelections.value[selectorDayIndex.value].foodIds = [...selectorTempSelected.value]
    // 注意：不从待选列表中移除，允许用户在不同天数重复选择
  }

  closeSelector()

  // 显示成功提示
  const count = selectorTempSelected.value.length
  if (count > 0) {
    uni.showToast({
      title: `已添加${count}项到第${selectorDayIndex.value + 1}天`,
      icon: 'success',
      duration: 2000
    })
  }
}

// 关闭选择器
const closeSelector = () => {
  selectorVisible.value = false
  selectorTempSelected.value = []
}

// 移除景点
const removeScenic = (dayIndex: number, scenicId: number) => {
  const index = dailySelections.value[dayIndex].scenicIds.indexOf(scenicId)
  if (index > -1) {
    dailySelections.value[dayIndex].scenicIds.splice(index, 1)
  }
}

// 移除美食
const removeFood = (dayIndex: number, foodId: number) => {
  const index = dailySelections.value[dayIndex].foodIds.indexOf(foodId)
  if (index > -1) {
    dailySelections.value[dayIndex].foodIds.splice(index, 1)
  }
}

// 获取景点名称
const getScenicName = (id: number) => {
  // 优先从待选列表查找，然后从收藏列表，最后从全部列表
  const scenic = [...pendingScenics.value, ...favoriteScenics.value, ...allScenics.value].find(s => s.id === id)
  return scenic?.name || `景点${id}`
}

// 获取美食名称
const getFoodName = (id: number) => {
  // 优先从待选列表查找，然后从收藏列表，最后从全部列表
  const food = [...pendingFoods.value, ...favoriteFoods.value, ...allFoods.value].find(f => f.id === id)
  return food?.name || `美食${id}`
}

// 计算选择器标题
const selectorTitle = computed(() => {
  const dayText = `第${selectorDayIndex.value + 1}天`
  const typeText = selectorType.value === 'scenic' ? '景点' : '美食'
  return `${dayText} - 选择${typeText}`
})

// 加载待选列表（从详情页添加的景点和美食）
const loadPendingAdditions = () => {
  const pendingAdditions = getCache<Array<{ type: 'scenic' | 'food', id: number, name: string }>>('route_pending_additions')

  // 清空现有待选列表
  pendingScenics.value = []
  pendingFoods.value = []

  if (pendingAdditions && pendingAdditions.length > 0) {
    // 处理每个待添加项
    pendingAdditions.forEach((item) => {
      if (item.type === 'scenic') {
        // 检查是否已存在
        if (!pendingScenics.value.find(s => s.id === item.id)) {
          pendingScenics.value.push({ id: item.id, name: item.name })
          // 同时更新allScenics以便显示名称
          if (!allScenics.value.find(s => s.id === item.id)) {
            allScenics.value.push({ id: item.id, name: item.name })
          }
        }
      } else if (item.type === 'food') {
        // 检查是否已存在
        if (!pendingFoods.value.find(f => f.id === item.id)) {
          pendingFoods.value.push({ id: item.id, name: item.name })
          // 同时更新allFoods以便显示名称
          if (!allFoods.value.find(f => f.id === item.id)) {
            allFoods.value.push({ id: item.id, name: item.name })
          }
        }
      }
    })
  }
}

// 从待选列表中移除已选择的项（当用户选择后）
const removeFromPending = (type: 'scenic' | 'food', id: number) => {
  const pendingAdditions = getCache<Array<{ type: 'scenic' | 'food', id: number, name: string }>>('route_pending_additions')

  if (pendingAdditions && pendingAdditions.length > 0) {
    const filtered = pendingAdditions.filter(item => !(item.type === type && item.id === id))
    if (filtered.length !== pendingAdditions.length) {
      if (filtered.length > 0) {
        setCache('route_pending_additions', filtered, 60 * 24)
      } else {
        removeCache('route_pending_additions')
      }
      // 重新加载待选列表
      loadPendingAdditions()
    }
  }
}

onMounted(() => {
  loadCities()
  loadTags()
  // 初始化每天选择数组
  const days = dayOptions.value[selectedDayIndex.value]?.value || 3
  for (let i = 0; i < days; i++) {
    dailySelections.value.push({ scenicIds: [], foodIds: [] })
  }

  // 加载待选列表
  loadPendingAdditions()
})

// 页面显示时也加载待选列表（处理从详情页返回的情况）
onShow(() => {
  loadPendingAdditions()
})
</script>

<style scoped>
.plan-page {
  min-height: 100vh;
  background-color: #f7f8fa;
  display: flex;
  flex-direction: column;
  position: relative;
}

.page-bg {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(180deg, #f0f8f5 0%, #f7f8fa 100%);
  z-index: 0;
}

.plan-scroll {
  flex: 1;
  position: relative;
  z-index: 1;
}

.plan-form {
  background-color: #ffffff;
  border-radius: 32rpx;
  padding: 48rpx 32rpx;
  margin: 32rpx 24rpx;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.06);
}

.form-header {
  margin-bottom: 48rpx;
  padding-bottom: 32rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.header-title {
  font-size: 38rpx;
  font-weight: 700;
  color: #333333;
  line-height: 1.4;
}

.form-item {
  margin-bottom: 48rpx;
}

.form-item:last-child {
  margin-bottom: 0;
}

.form-label {
  display: block;
  font-size: 28rpx;
  color: #333333;
  font-weight: 600;
  margin-bottom: 20rpx;
}

.label-optional {
  font-weight: 400;
  color: #999999;
  font-size: 24rpx;
}

.form-hint {
  display: block;
  font-size: 22rpx;
  color: #999999;
  margin-top: 12rpx;
  line-height: 1.5;
  word-wrap: break-word;
  white-space: normal;
}

.destination-input {
  width: 100%;
  padding: 28rpx 24rpx;
  background-color: #f7f8fa;
  border-radius: 16rpx;
  font-size: 32rpx;
  font-weight: 600;
  color: #333333;
  border: 2rpx solid transparent;
  transition: all 0.2s;
  box-sizing: border-box;
  line-height: 1.5;
  min-height: 88rpx;
  display: block;
}

.destination-input:focus {
  background-color: #ffffff;
  border-color: #3ba272;
}

.picker-view {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 28rpx 24rpx;
  background-color: #f7f8fa;
  border-radius: 16rpx;
  color: #333333;
  font-size: 28rpx;
  border: 2rpx solid transparent;
  transition: all 0.2s;
}

.picker-view:active {
  background-color: #ffffff;
  border-color: #3ba272;
}

.picker-arrow {
  font-size: 32rpx;
  color: #cccccc;
  margin-left: 12rpx;
  font-weight: 300;
}

/* 日期选择器样式 */
.date-picker-container {
  width: 100%;
}

.date-input-wrapper {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 28rpx 24rpx;
  background-color: #f7f8fa;
  border-radius: 16rpx;
  border: 2rpx solid transparent;
  transition: all 0.2s;
  position: relative;
}

.date-picker-item {
  flex: 1;
}

.date-picker-item:active {
  opacity: 0.8;
}

.date-input {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.date-label {
  font-size: 22rpx;
  color: #999999;
}

.date-value {
  font-size: 28rpx;
  color: #333333;
  font-weight: 500;
}

.date-value.placeholder {
  color: #999999;
  font-weight: normal;
}

.date-separator {
  font-size: 24rpx;
  color: #999999;
  margin: 0 8rpx;
  padding-top: 24rpx;
}

.calendar-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56rpx;
  height: 56rpx;
  background-color: #3ba272;
  border-radius: 12rpx;
  flex-shrink: 0;
}

.calendar-icon {
  font-size: 32rpx;
  line-height: 1;
}

.days-display {
  margin-top: 12rpx;
  padding: 12rpx 20rpx;
  background-color: #e8f5e9;
  border-radius: 8rpx;
  display: inline-block;
}

.days-text {
  font-size: 24rpx;
  color: #2e7d32;
  font-weight: 500;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
  margin-top: 8rpx;
}

.tag-item {
  padding: 18rpx 32rpx;
  background-color: #f7f8fa;
  border-radius: 999rpx;
  font-size: 26rpx;
  color: #666666;
  border: 2rpx solid #e5e5e5;
  transition: all 0.2s;
  line-height: 1;
}

.tag-item.active {
  color: #ffffff;
  border-color: transparent;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.15);
  transform: translateY(-2rpx);
}

.companion-list {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
  margin-top: 8rpx;
}

.companion-item {
  padding: 18rpx 32rpx;
  background-color: #f7f8fa;
  border-radius: 999rpx;
  font-size: 26rpx;
  color: #666666;
  border: 2rpx solid #e5e5e5;
  transition: all 0.2s;
  line-height: 1;
}

.companion-item.active {
  background-color: #3ba272;
  color: #ffffff;
  border-color: #3ba272;
  box-shadow: 0 4rpx 12rpx rgba(59, 162, 114, 0.3);
  transform: translateY(-2rpx);
}

.submit-section {
  padding: 0 24rpx 32rpx;
}

.submit-btn {
  width: 100%;
  padding: 32rpx;
  background: linear-gradient(135deg, #3ba272 0%, #6fd3a5 100%);
  color: #ffffff;
  border-radius: 24rpx;
  font-size: 32rpx;
  font-weight: 600;
  box-shadow: 0 12rpx 32rpx rgba(59, 162, 114, 0.4);
  border: none;
  transition: all 0.3s;
}

.submit-btn:active:not(.disabled) {
  transform: translateY(2rpx);
  box-shadow: 0 8rpx 24rpx rgba(59, 162, 114, 0.3);
}

.submit-btn.disabled {
  background: #cccccc;
  box-shadow: none;
  opacity: 0.6;
}

.recent-routes {
  padding: 24rpx;
}

.section-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #333333;
  margin-bottom: 16rpx;
}

.route-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx;
  background-color: #ffffff;
  border-radius: 16rpx;
  margin-bottom: 16rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
}

.route-item-title {
  font-size: 28rpx;
  color: #333333;
}

.route-item-arrow {
  font-size: 32rpx;
  color: #cccccc;
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.loading-content {
  background-color: #ffffff;
  border-radius: 32rpx;
  padding: 80rpx 60rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 40rpx;
  box-shadow: 0 16rpx 48rpx rgba(0, 0, 0, 0.2);
}

.loading-animation {
  position: relative;
  width: 300rpx;
  height: 300rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 旋转的地球 */
.earth-container {
  position: absolute;
  width: 200rpx;
  height: 200rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: rotateEarth 3s linear infinite;
}

.earth-icon {
  font-size: 200rpx;
  line-height: 1;
}

@keyframes rotateEarth {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 飞行的飞机 */
.airplane-container {
  position: absolute;
  width: 300rpx;
  height: 300rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: flyAround 4s ease-in-out infinite;
}

.airplane-icon {
  font-size: 80rpx;
  line-height: 1;
  transform-origin: center;
}

@keyframes flyAround {
  0% {
    transform: translateX(-120rpx) translateY(-120rpx) rotate(-45deg);
  }
  25% {
    transform: translateX(120rpx) translateY(-120rpx) rotate(45deg);
  }
  50% {
    transform: translateX(120rpx) translateY(120rpx) rotate(135deg);
  }
  75% {
    transform: translateX(-120rpx) translateY(120rpx) rotate(225deg);
  }
  100% {
    transform: translateX(-120rpx) translateY(-120rpx) rotate(315deg);
  }
}

.loading-text {
  font-size: 30rpx;
  color: #333333;
  font-weight: 600;
  text-align: center;
}

/* 每天选择区域 */
.daily-selections {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  margin-top: 16rpx;
}

.day-selection-card {
  background-color: #f7f8fa;
  border-radius: 16rpx;
  padding: 24rpx;
  border: 2rpx solid #e5e5e5;
}

.day-selection-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16rpx;
}

.day-selection-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #333333;
}

.day-selection-actions {
  display: flex;
  gap: 24rpx;
}

.action-link {
  font-size: 24rpx;
  color: #3ba272;
  text-decoration: underline;
}

.day-selection-content {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.selection-items {
  display: flex;
  flex-wrap: wrap;
  gap: 8rpx;
  align-items: center;
}

.selection-label {
  font-size: 24rpx;
  color: #666666;
  flex-shrink: 0;
}

.selection-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8rpx;
  flex: 1;
}

.selection-tag {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 8rpx 16rpx;
  background-color: #ffffff;
  border-radius: 8rpx;
  font-size: 24rpx;
  color: #333333;
  border: 1rpx solid #e5e5e5;
}

.tag-close {
  font-size: 32rpx;
  color: #999999;
  line-height: 1;
  cursor: pointer;
}

/* 选择器弹窗 */
.selector-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.selector-content {
  width: 90%;
  max-width: 600rpx;
  max-height: 80vh;
  background-color: #ffffff;
  border-radius: 24rpx;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.selector-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 32rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.selector-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333333;
}

.selector-close {
  font-size: 48rpx;
  color: #999999;
  line-height: 1;
}

.selector-tabs {
  display: flex;
  border-bottom: 1rpx solid #f0f0f0;
}

.selector-tab {
  flex: 1;
  padding: 24rpx;
  text-align: center;
  font-size: 28rpx;
  color: #666666;
  border-bottom: 4rpx solid transparent;
}

.selector-tab.active {
  color: #3ba272;
  border-bottom-color: #3ba272;
}

.selector-list {
  flex: 1;
  max-height: 60vh;
  padding: 16rpx;
}

.selector-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx;
  background-color: #f7f8fa;
  border-radius: 12rpx;
  margin-bottom: 12rpx;
  border: 2rpx solid transparent;
}

.selector-item.selected {
  background-color: #e8f5e9;
  border-color: #3ba272;
}

.selector-item-name {
  font-size: 28rpx;
  color: #333333;
  flex: 1;
}

.selector-check {
  font-size: 32rpx;
  color: #3ba272;
  font-weight: 600;
}

.selector-empty {
  padding: 80rpx 32rpx;
  text-align: center;
  color: #999999;
  font-size: 28rpx;
}

.selector-footer {
  padding: 24rpx;
  border-top: 1rpx solid #f0f0f0;
}

.selector-btn {
  width: 100%;
  padding: 24rpx;
  background: linear-gradient(135deg, #3ba272, #6fd3a5);
  color: #ffffff;
  border-radius: 16rpx;
  font-size: 28rpx;
  font-weight: 600;
  border: none;
}

/* 待选列表提示 */
.pending-notice {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 16rpx 20rpx;
  background-color: #e8f5e9;
  border-radius: 12rpx;
  margin-top: 16rpx;
  border-left: 4rpx solid #3ba272;
}

.pending-notice-icon {
  font-size: 32rpx;
  flex-shrink: 0;
}

.pending-notice-text {
  font-size: 24rpx;
  color: #2e7d32;
  line-height: 1.5;
  flex: 1;
}

/* 标签页徽章 */
.tab-badge {
  display: inline-block;
  min-width: 32rpx;
  height: 32rpx;
  padding: 0 8rpx;
  background-color: #ff5722;
  color: #ffffff;
  border-radius: 16rpx;
  font-size: 20rpx;
  line-height: 32rpx;
  text-align: center;
  margin-left: 8rpx;
}
</style>


