<template>
  <view class="itinerary-detail-page">
    <!-- 标签切换 -->
    <view class="tabs">
      <view
        class="tab-item"
        :class="{ 'active': activeTab === 'itinerary' }"
        @click="activeTab = 'itinerary'"
      >
        <text class="tab-text">【行程】</text>
      </view>
      <view
        class="tab-item"
        :class="{ 'active': activeTab === 'map' }"
        @click="activeTab = 'map'"
      >
        <text class="tab-text">【地图】</text>
      </view>
    </view>

    <scroll-view scroll-y class="scroll-content" v-if="!loading && routeData">
      <!-- 行程概览卡片 -->
      <view class="overview-card">
        <view class="card-header">
          <view class="route-title">{{ routeData.route?.routeName || '未命名行程' }}</view>
          <view class="tags-row">
            <text
              v-for="(tag, index) in routeTags"
              :key="index"
              class="tag"
            >【{{ tag }}】</text>
            <view class="rating" v-if="routeRating">
              <text class="star">★</text>
              <text class="rating-value">{{ routeRating }}</text>
            </view>
          </view>
        </view>
        <view class="expand-section" v-if="routeData.route?.summary">
          <view class="expand-trigger" @click.stop="toggleExpand">
            <text class="expand-icon" :class="{ 'expanded': isExpanded }">{{ isExpanded ? '▼' : '▶' }}</text>
            <text class="expand-text">{{ isExpanded ? '收起' : '展开详情' }}</text>
          </view>
          <view class="card-content" v-if="isExpanded">
            <view class="summary-text">
              {{ routeData.route.summary }}
            </view>
          </view>
        </view>
      </view>

      <!-- 地图区域 -->
      <view class="map-section" v-if="activeTab === 'itinerary'">
        <view class="map-container">
          <map
            class="map"
            :latitude="mapCenter.latitude"
            :longitude="mapCenter.longitude"
            :markers="mapMarkers"
            :polyline="mapPolyline"
            :show-location="true"
            :enable-zoom="true"
            provider="amap"
          ></map>
          <view class="map-button" @click="viewFullMap">
            <text>查看完整行程地图</text>
          </view>
        </view>
      </view>

      <!-- 每日行程详情 - 统一卡片 -->
      <view class="days-section" v-if="activeTab === 'itinerary' && routeData.days && routeData.days.length > 0">
        <view class="day-card">
          <!-- 天数切换 -->
          <view class="day-tabs">
            <view
              v-for="(dayItem, dayIndex) in routeData.days"
              :key="dayItem.day?.id || dayIndex"
              class="day-tab-item"
              :class="{ 'active': selectedDayIndex === dayIndex }"
              @click="handleDayChange(dayIndex)"
            >
              <text>Day {{ dayItem.day?.dayNo || dayIndex + 1 }}</text>
            </view>
          </view>

          <!-- 当前选中天的内容 -->
          <view class="day-content" v-if="currentDayData">
            <view class="day-header">
              <text class="day-title">► Day {{ currentDayData.day?.dayNo || selectedDayIndex + 1 }}</text>
              <text class="day-date">{{ getDayDate(selectedDayIndex, currentDayData.day?.dayNo) }}</text>
            </view>

            <!-- 按新格式显示：时间段 -> 早餐 -> 路线 -> 景点 -->
            <view class="time-blocks">
              <view
                v-for="(timeGroup, timeIndex) in formatDayContent(currentDayData)"
                :key="timeIndex"
                class="time-block"
              >
                <view class="time-label">{{ timeGroup.timeLabel }}</view>

                <!-- 早餐信息 -->
                <view v-if="timeGroup.breakfast" class="breakfast-section">
                  <view class="breakfast-item">
                    <view class="poi-icon icon-food icon-breakfast">
                      <text class="food-time-label">早餐</text>
                    </view>
                    <view class="breakfast-content">
                      <view class="breakfast-name">{{ timeGroup.breakfast.name }}</view>
                      <view class="breakfast-info">
                        <text v-if="timeGroup.breakfast.address" class="breakfast-address">📍 {{ timeGroup.breakfast.address }}</text>
                        <text v-if="timeGroup.breakfast.specialty" class="breakfast-specialty">特色：{{ timeGroup.breakfast.specialty }}</text>
                        <text v-if="timeGroup.breakfast.price" class="breakfast-price">¥{{ timeGroup.breakfast.price }}</text>
                      </view>
                    </view>
                  </view>
                </view>

                <!-- 午餐信息 -->
                <view v-if="timeGroup.lunch" class="breakfast-section lunch-section">
                  <view class="breakfast-item">
                    <view class="poi-icon icon-food icon-lunch">
                      <text class="food-time-label">中餐</text>
                    </view>
                    <view class="breakfast-content">
                      <view class="breakfast-name">{{ timeGroup.lunch.name }}</view>
                      <view class="breakfast-info">
                        <text v-if="timeGroup.lunch.address" class="breakfast-address">📍 {{ timeGroup.lunch.address }}</text>
                        <text v-if="timeGroup.lunch.specialty" class="breakfast-specialty">特色：{{ timeGroup.lunch.specialty }}</text>
                        <text v-if="timeGroup.lunch.price" class="breakfast-price">¥{{ timeGroup.lunch.price }}</text>
                      </view>
                    </view>
                  </view>
                </view>

                <!-- 晚餐信息 -->
                <view v-if="timeGroup.dinner" class="breakfast-section dinner-section">
                  <view class="breakfast-item">
                    <view class="poi-icon icon-food icon-dinner">
                      <text class="food-time-label">晚餐</text>
                    </view>
                    <view class="breakfast-content">
                      <view class="breakfast-name">{{ timeGroup.dinner.name }}</view>
                      <view class="breakfast-info">
                        <text v-if="timeGroup.dinner.address" class="breakfast-address">📍 {{ timeGroup.dinner.address }}</text>
                        <text v-if="timeGroup.dinner.specialty" class="breakfast-specialty">特色：{{ timeGroup.dinner.specialty }}</text>
                        <text v-if="timeGroup.dinner.price" class="breakfast-price">¥{{ timeGroup.dinner.price }}</text>
                      </view>
                    </view>
                  </view>
                </view>

                <!-- 景点和路线信息 -->
                <view v-for="(item, itemIndex) in timeGroup.items" :key="itemIndex" class="route-item-group">
                  <!-- 路线信息（从上一个地点到当前景点） -->
                  <view v-if="item.route" class="route-info">
                    <view class="route-line"></view>
                    <view class="route-content">
                      <view class="route-text">
                        <text class="route-from">{{ item.route.from }}</text>
                        <text class="route-arrow">→</text>
                        <text class="route-to">{{ item.route.to }}</text>
                      </view>
                      <view class="route-details">
                        <text v-if="item.route.suggestedRoute" class="route-suggestion">建议路线：{{ item.route.suggestedRoute }}</text>
                        <text v-if="item.route.transport" class="route-transport">交通方式：{{ item.route.transport }}</text>
                        <text v-if="item.route.distance" class="route-distance">距离：{{ item.route.distance }}</text>
                      </view>
                    </view>
                  </view>

                  <!-- 景点信息 -->
                  <view v-if="item.scenic" class="scenic-item">
                    <view class="poi-time">{{ item.scenic.stationLabel || '第一站' }}</view>
                    <view class="poi-icon icon-scenic">
                      <text>🏛️</text>
                    </view>
                    <view class="poi-content">
                      <view class="poi-name">{{ item.scenic.name }}</view>
                      <view v-if="item.scenic.intro" class="poi-intro">
                        <text class="intro-label">景点介绍：</text>
                        <text class="intro-text">{{ item.scenic.intro }}</text>
                      </view>
                      <view v-if="item.scenic.suggestedVisitTime" class="poi-visit-time">
                        <text class="visit-time-label">游玩时间建议：</text>
                        <text class="visit-time-text">{{ item.scenic.suggestedVisitTime }}</text>
                      </view>
                      <view v-if="item.scenic.notes" class="poi-notes">
                        <text class="notes-label">注意事项：</text>
                        <text class="notes-text">{{ item.scenic.notes }}</text>
                      </view>
                      <view v-if="item.scenic.address" class="poi-address">
                        <text>📍 {{ item.scenic.address }}</text>
                      </view>
                    </view>
                  </view>
                </view>
              </view>
            </view>

            <!-- 当天景点卡片 - 横向滚动 -->
            <view class="poi-cards-section" v-if="currentDayScenics.length > 0">
              <view class="section-title">景点</view>
              <scroll-view scroll-x class="poi-scroll" show-scrollbar="false">
                <view class="poi-cards-list">
                  <view
                    v-for="scenic in currentDayScenics"
                    :key="scenic.id"
                    class="poi-card scenic-card-item"
                    @click="onViewScenic(scenic)"
                  >
                    <view class="poi-card-image-wrapper">
                      <image
                        v-if="scenic.imageUrl"
                        class="poi-card-image"
                        :src="scenic.imageUrl"
                        mode="aspectFill"
                      />
                      <view v-else class="poi-card-image-placeholder">
                        <text class="poi-card-icon">🏛️</text>
                      </view>
                    </view>
                    <view class="poi-card-content">
                      <text class="poi-card-name">{{ scenic.name }}</text>
                      <text class="poi-card-desc" v-if="scenic.address">{{ scenic.address }}</text>
                      <view class="poi-card-meta">
                        <text class="poi-card-price" v-if="scenic.price && scenic.price > 0">¥{{ scenic.price }}</text>
                        <text class="poi-card-price-free" v-else>免费</text>
                        <text class="poi-card-score" v-if="scenic.score">{{ scenic.score }}分</text>
                      </view>
                    </view>
                  </view>
                </view>
              </scroll-view>
            </view>

            <!-- 当天美食卡片 - 横向滚动 -->
            <view class="poi-cards-section" v-if="currentDayFoods.length > 0">
              <view class="section-title">美食</view>
              <scroll-view scroll-x class="poi-scroll" show-scrollbar="false">
                <view class="poi-cards-list">
                  <view
                    v-for="food in currentDayFoods"
                    :key="food.id"
                    class="poi-card food-card-item"
                    @click="onViewFood(food)"
                  >
                    <view class="poi-card-image-wrapper">
                      <image
                        v-if="food.imageUrl"
                        class="poi-card-image"
                        :src="food.imageUrl"
                        mode="aspectFill"
                      />
                      <view v-else class="poi-card-image-placeholder">
                        <text class="poi-card-icon">🍜</text>
                      </view>
                    </view>
                    <view class="poi-card-content">
                      <text class="poi-card-name">{{ food.name }}</text>
                      <text class="poi-card-desc" v-if="food.address">{{ food.address }}</text>
                      <view class="poi-card-meta">
                        <text class="poi-card-price" v-if="food.avgPrice">¥{{ food.avgPrice }}/人</text>
                        <text class="poi-card-score" v-if="food.score">{{ food.score }}分</text>
                      </view>
                    </view>
                  </view>
                </view>
              </scroll-view>
            </view>
          </view>
        </view>
      </view>

      <!-- 地图视图 -->
      <view class="map-view-section" v-if="activeTab === 'map'">
        <view class="map-container-center">
          <map
            class="full-map"
            :latitude="mapCenter.latitude"
            :longitude="mapCenter.longitude"
            :markers="mapMarkers"
            :polyline="mapPolyline"
            :show-location="true"
            :enable-zoom="true"
            provider="amap"
          ></map>
        </view>
      </view>
    </scroll-view>

    <!-- 加载状态 -->
    <view class="loading-container" v-if="loading">
      <text>加载中...</text>
    </view>

    <!-- 底部操作栏 -->
    <view class="bottom-bar">
      <button class="favorite-btn" @click="toggleFavorite">
        <text class="favorite-icon" :class="{ 'favorited': isFavorite }">{{ isFavorite ? '♥' : '♡' }}</text>
        <text class="favorite-text">收藏</text>
      </button>
      <button class="nav-btn" @click="startNavigation">
        <text class="nav-btn-text">开始导航</text>
      </button>
      <button class="enable-btn" @click="enableItinerary">
        <text>一键启用此行程</text>
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { routeApi } from '@/api/route'
import { useUserStore } from '@/store/user'
import { getCache, setCache } from '@/utils/storage'

interface RouteData {
  route?: {
    id?: number
    routeName?: string
    days?: number
    suitablePeople?: string
    summary?: string
    coverImage?: string
    favoriteCount?: number
  }
  days?: Array<{
    day?: {
      id?: number
      dayNo?: number
      title?: string
      intro?: string
    }
    pois?: Array<{
      poi?: {
        id?: number
        poiType?: string
        poiId?: number
        sort?: number
        stayTime?: number
        note?: string
      }
      detail?: any
    }>
  }>
}

const routeId = ref<number | null>(null)
const loading = ref(false)
const routeData = ref<RouteData | null>(null)
const activeTab = ref<'itinerary' | 'map'>('itinerary')
const isFavorite = ref(false)
const isExpanded = ref(false) // 卡片展开状态
const selectedDayIndex = ref(0) // 当前选中的天数索引
const store = useUserStore()
const user = computed(() => store.state.profile)

// 当前选中的天数数据
const currentDayData = computed(() => {
  if (!routeData.value?.days || routeData.value.days.length === 0) return null
  return routeData.value.days[selectedDayIndex.value] || routeData.value.days[0]
})

// 当前天的景点列表（显示所有景点，不再因为全天景点而隐藏其他景点）
const currentDayScenics = computed(() => {
  if (!currentDayData.value?.pois) return []
  
  // 按sort排序
  const sortedPois = [...currentDayData.value.pois].sort((a, b) => {
    const sortA = a.poi?.sort || 0
    const sortB = b.poi?.sort || 0
    return sortA - sortB
  })
  
  const scenicPois = sortedPois.filter(poi => poi.poi?.poiType === 'scenic' && poi.detail)
  
  // 返回所有景点，不再因为全天景点而隐藏其他景点
  return scenicPois.map(poi => poi.detail)
})

// 当前天的美食列表（去重，确保每个美食只显示一次）
const currentDayFoods = computed(() => {
  if (!currentDayData.value?.pois) return []
  
  // 按sort排序
  const sortedPois = [...currentDayData.value.pois].sort((a, b) => {
    const sortA = a.poi?.sort || 0
    const sortB = b.poi?.sort || 0
    return sortA - sortB
  })
  
  // 过滤美食并去重
  const foodMap = new Map<number, any>()
  sortedPois.forEach(poi => {
    if (poi.poi?.poiType === 'food' && poi.detail) {
      const foodId = poi.detail.id
      // 如果已经存在，保留第一个（按sort排序后的第一个）
      if (!foodMap.has(foodId)) {
        foodMap.set(foodId, poi.detail)
      }
    }
  })
  
  // 转换为数组并返回
  return Array.from(foodMap.values())
})

// 计算路线标签
const routeTags = computed(() => {
  const tags: string[] = []
  if (routeData.value?.route?.suitablePeople) {
    tags.push(routeData.value.route.suitablePeople)
  }
  // 可以根据其他字段添加更多标签
  if (routeData.value?.route?.days) {
    tags.push(`${routeData.value.route.days}天行程`)
  }
  return tags.length > 0 ? tags : ['智能规划']
})

// 计算评分（可以从收藏数等计算，这里使用默认值）
const routeRating = computed(() => {
  // 可以根据实际业务逻辑计算评分
  return '4.8'
})

// 地图相关数据
const mapCenter = ref({
  latitude: 39.9042,
  longitude: 116.4074
})

const mapMarkers = ref<any[]>([])
const mapPolyline = ref<any[]>([])

// 加载路线详情
const loadRouteDetail = async () => {
  if (!routeId.value) return

  loading.value = true
  try {
    const res = await routeApi.getDetail(routeId.value)
    console.log('========== 路线详情API返回数据 ==========')
    console.log('完整响应:', JSON.stringify(res, null, 2))
    
    if (res.statusCode === 200 && res.data.code === 200) {
      routeData.value = res.data.data
      
      console.log('路线数据:', routeData.value)
      console.log('路线名称:', routeData.value?.route?.routeName)
      console.log('天数:', routeData.value?.days?.length)
      
      // 详细打印每一天的数据
      if (routeData.value?.days) {
        routeData.value.days.forEach((dayItem: any, dayIndex: number) => {
          const dayNo = dayItem.day?.dayNo || dayIndex + 1
          console.log(`\n========== Day ${dayNo} 数据 ==========`)
          console.log('Day对象:', dayItem.day)
          console.log('POI数量:', dayItem.pois?.length || 0)
          
          if (dayItem.pois && dayItem.pois.length > 0) {
            // 按sort排序
            const sortedPois = [...dayItem.pois].sort((a: any, b: any) => {
              const sortA = a.poi?.sort || 0
              const sortB = b.poi?.sort || 0
              return sortA - sortB
            })
            
            sortedPois.forEach((poi: any, poiIndex: number) => {
              const poiType = poi.poi?.poiType || 'unknown'
              const poiId = poi.poi?.poiId
              const sort = poi.poi?.sort || 0
              const detail = poi.detail
              const name = detail?.name || '未知'
              const timeSlot = poi.poi?.timeSlot || ''
              
              console.log(`  POI[${poiIndex}] (sort=${sort}):`)
              console.log(`    类型: ${poiType}`)
              console.log(`    POI ID: ${poiId}`)
              console.log(`    名称: ${name}`)
              console.log(`    时间段: ${timeSlot || '无'}`)
              if (detail?.address) {
                console.log(`    地址: ${detail.address}`)
              }
              if (poiType === 'scenic' && detail?.suggestedVisitTime) {
                console.log(`    建议游玩时间: ${detail.suggestedVisitTime}`)
              }
            })
          } else {
            console.log('  该天没有POI数据')
          }
        })
      }
      
      console.log('========================================\n')

      // 加载收藏状态
      loadFavoriteStatus()

      // 初始化地图数据（显示当前选中天的路线）
      updateMapData()
    } else {
      console.error('API返回错误:', res.data)
      uni.showToast({ title: res.data.msg || '加载失败', icon: 'none' })
    }
  } catch (e) {
    console.error('加载路线详情失败:', e)
    uni.showToast({ title: '网络错误', icon: 'none' })
  } finally {
    loading.value = false
  }
}

// 加载收藏状态
const loadFavoriteStatus = () => {
  if (!routeId.value) return
  const favorites = getCache<number[]>('route_favorites') || []
  isFavorite.value = favorites.includes(routeId.value)
}

// 切换收藏
const toggleFavorite = async () => {
  if (!user.value) {
    uni.showToast({ title: '请先登录', icon: 'none' })
    setTimeout(() => {
      uni.switchTab({ url: '/pages/profile/profile' })
    }, 1500)
    return
  }

  if (!routeId.value) return

  try {
    await routeApi.toggleFavorite(user.value.id, routeId.value)
    isFavorite.value = !isFavorite.value

    // 更新本地缓存
    const favorites = getCache<number[]>('route_favorites') || []
    if (isFavorite.value) {
      if (!favorites.includes(routeId.value)) {
        favorites.push(routeId.value)
      }
    } else {
      const index = favorites.indexOf(routeId.value)
      if (index > -1) {
        favorites.splice(index, 1)
      }
    }
    setCache('route_favorites', favorites, 365 * 24 * 60)

    uni.showToast({
      title: isFavorite.value ? '收藏成功' : '已取消收藏',
      icon: 'success'
    })
  } catch (e) {
    console.error('切换收藏失败:', e)
    uni.showToast({ title: '操作失败', icon: 'none' })
  }
}

// 更新地图数据（根据选中的天数显示对应的路线）
const updateMapData = () => {
  // 先清空地图数据，避免显示无关内容
  mapMarkers.value = []
  mapPolyline.value = []
  
  if (!routeData.value?.days || routeData.value.days.length === 0) return

  const dayItem = routeData.value.days[selectedDayIndex.value]
  if (!dayItem || !dayItem.pois || dayItem.pois.length === 0) {
    console.log('当前天没有POI数据')
    return
  }

  const markers: any[] = []
  const polylines: any[] = []

  // 按sort排序
  const sortedPois = [...dayItem.pois].sort((a, b) => {
    const sortA = a.poi?.sort || 0
    const sortB = b.poi?.sort || 0
    return sortA - sortB
  })

  console.log(`更新地图数据 - Day ${selectedDayIndex.value + 1}, POI数量: ${sortedPois.length}`)

  const dayCoordinates: any[] = []
  const dayNo = dayItem.day?.dayNo || selectedDayIndex.value + 1
  let poiOrder = 1 // POI顺序计数器

  sortedPois.forEach((poiItem, poiIndex) => {
    const detail = poiItem.detail
    if (!detail) {
      console.warn(`POI ${poiIndex} 没有detail数据`)
      return
    }
    
    if (detail && (detail.latitude || detail.lat) && (detail.longitude || detail.lng || detail.lon)) {
      const lat = detail.latitude || detail.lat
      const lng = detail.longitude || detail.lng || detail.lon

      // 创建标记，包含顺序标签（景点显示顺序，美食不显示顺序）
      const isScenic = poiItem.poi?.poiType === 'scenic'
      const orderLabel = isScenic ? `D${dayNo}-${poiOrder}` : ''
      const poiName = getPoiName(poiItem)
      const markerTitle = orderLabel ? `${orderLabel} ${poiName}` : poiName
      
      const marker = {
        id: `day${selectedDayIndex.value}_poi${poiIndex}`,
        latitude: lat,
        longitude: lng,
        title: markerTitle,
        width: 40,
        height: 40,
        iconPath: poiItem.poi?.poiType === 'food' ? '/static/food-marker.png' : '/static/scenic-marker.png',
        callout: {
          content: markerTitle,
          color: '#333',
          fontSize: 14,
          borderRadius: 4,
          bgColor: '#fff',
          padding: 8,
          display: 'BYCLICK',
          textAlign: 'center'
        }
      }

      markers.push(marker)
      dayCoordinates.push({
        latitude: lat,
        longitude: lng
      })

      // 只有景点才增加顺序号，美食不增加（但也会显示在地图上）
      if (isScenic) {
        poiOrder++
      }
    } else {
      console.warn(`POI ${poiIndex} (${getPoiName(poiItem)}) 没有有效的坐标信息`)
    }
  })

  console.log(`地图标记数量: ${markers.length}, 坐标点数量: ${dayCoordinates.length}`)

  // 为当前天创建路线
  if (dayCoordinates.length > 1) {
    polylines.push({
      points: dayCoordinates,
      color: '#3BA272',
      width: 4,
      arrowLine: true,
      borderColor: '#2d8f5f',
      borderWidth: 1
    })
  }

  // 计算地图中心点（所有点的中心）
  if (dayCoordinates.length > 0) {
    let sumLat = 0
    let sumLng = 0
    dayCoordinates.forEach(coord => {
      sumLat += coord.latitude
      sumLng += coord.longitude
    })
    mapCenter.value = {
      latitude: sumLat / dayCoordinates.length,
      longitude: sumLng / dayCoordinates.length
    }
  }

  // 更新地图数据
  mapMarkers.value = markers
  mapPolyline.value = polylines
}

// 格式化当天内容（按照时间段分组：上午、中午、下午、晚上）
const formatDayContent = (dayData: any) => {
  if (!dayData || !dayData.pois || dayData.pois.length === 0) return []

  // 按sort排序
  const sortedPois = [...dayData.pois].sort((a, b) => {
    const sortA = a.poi?.sort || 0
    const sortB = b.poi?.sort || 0
    return sortA - sortB
  })

  // 调试信息：打印排序后的POI列表
  const dayNo = dayData.day?.dayNo || selectedDayIndex.value + 1
  console.log(`\n========== formatDayContent - Day ${dayNo} ==========`)
  console.log('排序后的POI列表:')
  sortedPois.forEach((poi: any, index: number) => {
    const poiType = poi.poi?.poiType || 'unknown'
    const sort = poi.poi?.sort || 0
    const name = poi.detail?.name || '未知'
    const timeSlot = poi.poi?.timeSlot || ''
    console.log(`  [${index}] sort=${sort}, type=${poiType}, name=${name}, timeSlot=${timeSlot}`)
  })

  // 分离景点和美食
  const scenicPois = sortedPois.filter((p: any) => p.poi?.poiType === 'scenic')
  const foodPois = sortedPois.filter((p: any) => p.poi?.poiType === 'food')

  console.log(`景点数量: ${scenicPois.length}, 美食数量: ${foodPois.length}`)

  // 检查第一个景点是否游玩时间为"全天"
  const firstScenic = scenicPois[0]
  const isFullDay = firstScenic?.detail?.suggestedVisitTime && 
                    (firstScenic.detail.suggestedVisitTime.includes('全天') || 
                     firstScenic.detail.suggestedVisitTime.includes('一天'))
  
  if (firstScenic) {
    console.log(`第一个景点: ${firstScenic.detail?.name}, 游玩时间: ${firstScenic.detail?.suggestedVisitTime}, 是否全天: ${isFullDay}`)
  }

  // 注意：即使第一个景点是全天，也应该显示所有景点，不要只显示一个
  // 全天景点只是建议游玩时间，不应该影响其他景点的显示
  // 如果第一个景点是全天且只有一个景点，才使用简化显示
  if (isFullDay && scenicPois.length === 1) {
    const morningGroup: any = {
      timeLabel: '上午',
      items: []
    }
    
    // 找到早餐
    const breakfastPoi = sortedPois.find((p: any) => {
      const timeSlot = p.poi?.timeSlot || ''
      return p.poi?.poiType === 'food' && timeSlot === 'breakfast'
    }) || sortedPois.find((p: any) => p.poi?.poiType === 'food')
    
    if (breakfastPoi && breakfastPoi.detail) {
      morningGroup.breakfast = {
        name: breakfastPoi.detail.name || '早餐',
        address: breakfastPoi.detail.address,
        specialty: breakfastPoi.detail.specialty || breakfastPoi.detail.intro,
        price: breakfastPoi.detail.avgPrice || breakfastPoi.detail.price
      }
    }
    
    // 显示第一个景点
    if (firstScenic) {
      const scenic = firstScenic.detail
      let lastLocation = morningGroup.breakfast ? morningGroup.breakfast.name : ''
      
      if (lastLocation) {
        let routeInfo = null
        if (firstScenic.route) {
          routeInfo = firstScenic.route
        } else if (firstScenic.poi?.note) {
          try {
            const noteJson = JSON.parse(firstScenic.poi.note)
            if (noteJson.from && noteJson.to) {
              routeInfo = {
                from: noteJson.from,
                to: noteJson.to,
                suggestedRoute: noteJson.suggestedRoute || '建议使用导航',
                transport: noteJson.transport || '步行/公交',
                distance: noteJson.distance || '约1公里'
              }
            }
          } catch (e) {}
        }
        
        if (!routeInfo) {
          routeInfo = {
            from: lastLocation,
            to: scenic.name,
            suggestedRoute: '建议使用导航',
            transport: '步行/公交',
            distance: '约1公里'
          }
        }
        
        morningGroup.items.push({ route: routeInfo })
      }
      
      let suggestedVisitTime = scenic.suggestedVisitTime
      if (!suggestedVisitTime && firstScenic.poi?.stayTime) {
        const stayMinutes = firstScenic.poi.stayTime
        if (stayMinutes >= 60) {
          const hours = Math.floor(stayMinutes / 60)
          const minutes = stayMinutes % 60
          suggestedVisitTime = minutes > 0 ? `约${hours}小时${minutes}分钟` : `约${hours}小时`
        } else {
          suggestedVisitTime = `约${stayMinutes}分钟`
        }
      }
      
      let notes = firstScenic.poi?.note || scenic.notes || scenic.ticketInfo
      if (notes && typeof notes === 'string' && notes.startsWith('{') && notes.includes('from')) {
        notes = scenic.notes || scenic.ticketInfo
      }
      
      morningGroup.items.push({
        scenic: {
          name: scenic.name,
          intro: scenic.intro || scenic.description,
          suggestedVisitTime: suggestedVisitTime,
          notes: notes,
          address: scenic.address,
          stationLabel: getStationLabel(1),
          sort: firstScenic.poi?.sort
        }
      })
    }
    
    return [morningGroup]
  }

  // 按时间段分组处理
  const groups: Array<{
    timeLabel: string
    breakfast?: {
      name: string
      address?: string
      specialty?: string
      price?: number
    }
    lunch?: {
      name: string
      address?: string
      specialty?: string
      price?: number
    }
    dinner?: {
      name: string
      address?: string
      specialty?: string
      price?: number
    }
    items: Array<{
      route?: {
        from: string
        to: string
        suggestedRoute?: string
        transport?: string
        distance?: string
      }
      scenic?: {
        name: string
        intro?: string
        suggestedVisitTime?: string
        notes?: string
        address?: string
        stationLabel?: string
        sort?: number
      }
    }>
  }> = []

  // 初始化时间段组
  const morningGroup: any = {
    timeLabel: '上午',
    items: []
  }
  const noonGroup: any = {
    timeLabel: '中午',
    items: []
  }
  const afternoonGroup: any = {
    timeLabel: '下午',
    items: []
  }
  const eveningGroup: any = {
    timeLabel: '晚上',
    items: []
  }

  let lastLocation = ''
  let stationIndex = 1
  let consumedFoodIds: number[] = []
  let scenicCount = 0
  let lunchInserted = false

  // 找到午餐POI
  const lunchPoi = sortedPois.find((p: any) => {
    const timeSlot = p.poi?.timeSlot || ''
    return p.poi?.poiType === 'food' && timeSlot === 'lunch'
  })

  // 计算午餐应该插入的位置（大约在1/3到1/2的景点之后）
  const totalScenics = scenicPois.length
  const lunchInsertAfterScenic = totalScenics > 0 ? Math.max(1, Math.min(totalScenics, Math.ceil(totalScenics * 0.4))) : 0

  for (const poi of sortedPois) {
    const poiType = poi.poi?.poiType
    const timeSlot = poi.poi?.timeSlot || ''
    
    // 处理早餐 - 放在上午组
    if (poiType === 'food' && timeSlot === 'breakfast' && !consumedFoodIds.includes(poi.detail?.id)) {
      if (poi.detail) {
        morningGroup.breakfast = {
          name: poi.detail.name || '早餐',
          address: poi.detail.address,
          specialty: poi.detail.specialty || poi.detail.intro,
          price: poi.detail.avgPrice || poi.detail.price
        }
        lastLocation = poi.detail.name
        consumedFoodIds.push(poi.detail.id)
      }
    }
    // 处理景点
    else if (poiType === 'scenic' && poi.detail) {
      const scenic = poi.detail
      scenicCount++
      
      // 在插入景点之前，检查是否需要插入午餐
      if (!lunchInserted && lunchPoi && scenicCount >= lunchInsertAfterScenic) {
        // 添加路线信息到午餐
        if (lastLocation && lunchPoi.detail) {
          let routeInfo = null
          if (lunchPoi.route) {
            routeInfo = lunchPoi.route
          } else if (lunchPoi.poi?.note) {
            try {
              const noteJson = JSON.parse(lunchPoi.poi.note)
              if (noteJson.from && noteJson.to) {
                routeInfo = {
                  from: noteJson.from,
                  to: noteJson.to,
                  suggestedRoute: noteJson.suggestedRoute || '建议使用导航',
                  transport: noteJson.transport || '步行/公交',
                  distance: noteJson.distance || '约1公里'
                }
              }
            } catch (e) {}
          }
          
          if (!routeInfo) {
            routeInfo = {
              from: lastLocation,
              to: lunchPoi.detail.name,
              suggestedRoute: '建议使用导航',
              transport: '步行/公交',
              distance: '约1公里'
            }
          }
          
          noonGroup.items.push({ route: routeInfo })
        }
        
        noonGroup.lunch = {
          name: lunchPoi.detail.name || '午餐',
          address: lunchPoi.detail.address,
          specialty: lunchPoi.detail.specialty || lunchPoi.detail.intro,
          price: lunchPoi.detail.avgPrice || lunchPoi.detail.price
        }
        lastLocation = lunchPoi.detail.name
        consumedFoodIds.push(lunchPoi.detail.id)
        lunchInserted = true
      }
      
      // 判断景点应该放在哪个时间段组
      let targetGroup: any = morningGroup
      if (lunchInserted) {
        // 如果午餐已插入，之后的景点放在下午组或晚上组
        if (scenicCount > lunchInsertAfterScenic) {
          targetGroup = afternoonGroup
        } else {
          targetGroup = morningGroup
        }
      } else {
        // 如果午餐还没插入，根据景点数量判断
        if (scenicCount > lunchInsertAfterScenic) {
          targetGroup = afternoonGroup
        } else {
          targetGroup = morningGroup
        }
      }
      
      // 添加路线信息
      if (lastLocation) {
        let routeInfo = null
        if (poi.route) {
          routeInfo = poi.route
        } else if (poi.poi?.note) {
          try {
            const noteJson = JSON.parse(poi.poi.note)
            if (noteJson.from && noteJson.to) {
              routeInfo = {
                from: noteJson.from,
                to: noteJson.to,
                suggestedRoute: noteJson.suggestedRoute || '建议使用导航',
                transport: noteJson.transport || '步行/公交',
                distance: noteJson.distance || '约1公里'
              }
            }
          } catch (e) {}
        }
        
        if (!routeInfo) {
          routeInfo = {
            from: lastLocation,
            to: scenic.name,
            suggestedRoute: '建议使用导航',
            transport: '步行/公交',
            distance: '约1公里'
          }
        }
        
        targetGroup.items.push({ route: routeInfo })
      }
      
      // 处理游玩时间建议
      let suggestedVisitTime = scenic.suggestedVisitTime
      if (!suggestedVisitTime && poi.poi?.stayTime) {
        const stayMinutes = poi.poi.stayTime
        if (stayMinutes >= 60) {
          const hours = Math.floor(stayMinutes / 60)
          const minutes = stayMinutes % 60
          suggestedVisitTime = minutes > 0 ? `约${hours}小时${minutes}分钟` : `约${hours}小时`
        } else {
          suggestedVisitTime = `约${stayMinutes}分钟`
        }
      }
      
      let notes = poi.poi?.note || scenic.notes || scenic.ticketInfo
      if (notes && typeof notes === 'string' && notes.startsWith('{') && notes.includes('from')) {
        notes = scenic.notes || scenic.ticketInfo
      }
      
      targetGroup.items.push({
        scenic: {
          name: scenic.name,
          intro: scenic.intro || scenic.description,
          suggestedVisitTime: suggestedVisitTime,
          notes: notes,
          address: scenic.address,
          stationLabel: getStationLabel(stationIndex++),
          sort: poi.poi?.sort
        }
      })
      
      lastLocation = scenic.name
    }
    // 处理午餐 - 如果还没有在景点处理时插入，则在这里处理（作为兜底）
    else if (poiType === 'food' && timeSlot === 'lunch' && !consumedFoodIds.includes(poi.detail?.id)) {
      if (poi.detail && !lunchInserted) {
        // 添加路线信息
        if (lastLocation) {
          let routeInfo = null
          if (poi.route) {
            routeInfo = poi.route
          } else if (poi.poi?.note) {
            try {
              const noteJson = JSON.parse(poi.poi.note)
              if (noteJson.from && noteJson.to) {
                routeInfo = {
                  from: noteJson.from,
                  to: noteJson.to,
                  suggestedRoute: noteJson.suggestedRoute || '建议使用导航',
                  transport: noteJson.transport || '步行/公交',
                  distance: noteJson.distance || '约1公里'
                }
              }
            } catch (e) {}
          }
          
          if (!routeInfo) {
            routeInfo = {
              from: lastLocation,
              to: poi.detail.name,
              suggestedRoute: '建议使用导航',
              transport: '步行/公交',
              distance: '约1公里'
            }
          }
          
          noonGroup.items.push({ route: routeInfo })
        }
        
        noonGroup.lunch = {
          name: poi.detail.name || '午餐',
          address: poi.detail.address,
          specialty: poi.detail.specialty || poi.detail.intro,
          price: poi.detail.avgPrice || poi.detail.price
        }
        lastLocation = poi.detail.name
        consumedFoodIds.push(poi.detail.id)
        lunchInserted = true
      }
    }
    // 处理晚餐 - 放在晚上组
    else if (poiType === 'food' && timeSlot === 'dinner' && !consumedFoodIds.includes(poi.detail?.id)) {
      if (poi.detail) {
        // 添加路线信息
        if (lastLocation) {
          let routeInfo = null
          if (poi.route) {
            routeInfo = poi.route
          } else if (poi.poi?.note) {
            try {
              const noteJson = JSON.parse(poi.poi.note)
              if (noteJson.from && noteJson.to) {
                routeInfo = {
                  from: noteJson.from,
                  to: noteJson.to,
                  suggestedRoute: noteJson.suggestedRoute || '建议使用导航',
                  transport: noteJson.transport || '步行/公交',
                  distance: noteJson.distance || '约1公里'
                }
              }
            } catch (e) {}
          }
          
          if (!routeInfo) {
            routeInfo = {
              from: lastLocation,
              to: poi.detail.name,
              suggestedRoute: '建议使用导航',
              transport: '步行/公交',
              distance: '约1公里'
            }
          }
          
          eveningGroup.items.push({ route: routeInfo })
        }
        
        eveningGroup.dinner = {
          name: poi.detail.name || '晚餐',
          address: poi.detail.address,
          specialty: poi.detail.specialty || poi.detail.intro,
          price: poi.detail.avgPrice || poi.detail.price
        }
        lastLocation = poi.detail.name
        consumedFoodIds.push(poi.detail.id)
      }
    }
  }

  // 按顺序添加有内容的组
  if (morningGroup.items.length > 0 || morningGroup.breakfast) {
    groups.push(morningGroup)
  }
  if (noonGroup.items.length > 0 || noonGroup.lunch) {
    groups.push(noonGroup)
  }
  if (afternoonGroup.items.length > 0) {
    groups.push(afternoonGroup)
  }
  if (eveningGroup.items.length > 0 || eveningGroup.dinner) {
    groups.push(eveningGroup)
  }

  console.log(`格式化完成，生成 ${groups.length} 个时间段组`)
  groups.forEach((group, index) => {
    console.log(`  时间段组[${index}]: ${group.timeLabel}`)
    if (group.breakfast) console.log(`    早餐: ${group.breakfast.name}`)
    if (group.lunch) console.log(`    午餐: ${group.lunch.name}`)
    if (group.dinner) console.log(`    晚餐: ${group.dinner.name}`)
    console.log(`    景点数量: ${group.items.filter((item: any) => item.scenic).length}`)
  })
  console.log('========================================\n')

  return groups
}

// 获取站点标签（第一站、第二站等）
const getStationLabel = (index: number): string => {
  const labels = ['第一站', '第二站', '第三站', '第四站', '第五站', '第六站', '第七站', '第八站', '第九站', '第十站']
  if (index <= labels.length) {
    return labels[index - 1]
  }
  return `第${index}站`
}


// 获取POI名称
const getPoiName = (poiItem: any) => {
  if (poiItem.detail?.name) {
    return poiItem.detail.name
  }
  return poiItem.poi?.note || '未知地点'
}

// 获取POI描述
const getPoiDesc = (poiItem: any) => {
  const detail = poiItem.detail
  if (!detail) return ''

  if (poiItem.poi?.poiType === 'scenic') {
    // 景点描述
    if (detail.suggestedVisitTime) {
      return `(预计${detail.suggestedVisitTime})${detail.ticketInfo ? '建议提前官预约' : ''}`
    }
    if (detail.ticketInfo) {
      return `建议提前官预约`
    }
  } else if (poiItem.poi?.poiType === 'food') {
    // 美食描述
    if (detail.intro) {
      return detail.intro.length > 20 ? detail.intro.substring(0, 20) + '...' : detail.intro
    }
  }

  return ''
}

// 获取POI图标
const getPoiIcon = (poiType?: string) => {
  if (poiType === 'scenic') return '🏛️'
  if (poiType === 'food') return '🍜'
  return '📍'
}

// 获取POI图标类名
const getPoiIconClass = (poiType?: string) => {
  if (poiType === 'scenic') return 'icon-scenic'
  if (poiType === 'food') return 'icon-food'
  return 'icon-default'
}

// 切换展开/收起
const toggleExpand = () => {
  isExpanded.value = !isExpanded.value
}

// 获取日期 - 统一格式
const getDayDate = (dayIndex: number, dayNo?: number) => {
  // 使用dayNo如果存在，否则使用dayIndex
  // dayNo是从1开始的，dayIndex是从0开始的
  const actualDayIndex = dayNo !== undefined ? dayNo - 1 : dayIndex

  // 可以根据实际需求计算日期
  const today = new Date()
  const targetDate = new Date(today)
  targetDate.setDate(today.getDate() + actualDayIndex)

  const month = targetDate.getMonth() + 1
  const date = targetDate.getDate()
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  const weekday = weekdays[targetDate.getDay()]

  // 统一格式：月日(星期)
  return `${month}月${date}日(${weekday})`
}


// 处理天数切换
const handleDayChange = (dayIndex: number) => {
  selectedDayIndex.value = dayIndex
  // 更新地图显示
  updateMapData()
}

// 查看完整地图
const viewFullMap = () => {
  activeTab.value = 'map'
  // 切换到地图视图时，确保地图数据是最新的
  updateMapData()
}

// 开始导航
const startNavigation = () => {
  if (!routeData.value?.days || routeData.value.days.length === 0) {
    uni.showToast({ title: '暂无行程数据', icon: 'none' })
    return
  }

  // 找到第一个有位置的POI
  for (const dayItem of routeData.value.days) {
    if (!dayItem.pois) continue
    for (const poiItem of dayItem.pois) {
      const detail = poiItem.detail
      if (detail && (detail.latitude || detail.lat) && (detail.longitude || detail.lng || detail.lon)) {
        const lat = detail.latitude || detail.lat
        const lng = detail.longitude || detail.lng || detail.lon
        uni.openLocation({
          latitude: lat,
          longitude: lng,
          name: getPoiName(poiItem),
          address: detail.address || ''
        })
        return
      }
    }
  }

  uni.showToast({ title: '暂无位置信息', icon: 'none' })
}

// 启用行程
const enableItinerary = () => {
  if (!routeId.value) return

  // 保存到我的行程
  const myRoutes = getCache<number[]>('my_routes') || []
  if (!myRoutes.includes(routeId.value)) {
    myRoutes.push(routeId.value)
    setCache('my_routes', myRoutes, 365 * 24 * 60)
  }

  uni.showToast({ title: '已启用此行程', icon: 'success' })
}

// 查看景点详情
const onViewScenic = (scenic: any) => {
  if (!scenic || !scenic.id) return
  uni.navigateTo({
    url: `/pages/scenic/detail?id=${scenic.id}`
  })
}

// 查看美食详情
const onViewFood = (food: any) => {
  if (!food || !food.id) return
  uni.navigateTo({
    url: `/pages/food/detail?id=${food.id}`
  })
}

onLoad((options: any) => {
  if (options.id) {
    routeId.value = Number(options.id)
    loadRouteDetail()
  }
})

onShow(() => {
  // 页面显示时刷新收藏状态
  if (routeId.value) {
    loadFavoriteStatus()
  }
})

// 监听天数切换，自动更新地图
watch(selectedDayIndex, () => {
  if (routeData.value) {
    updateMapData()
  }
})
</script>

<style scoped>
.itinerary-detail-page {
  min-height: 100vh;
  background-color: #f7f8fa;
  display: flex;
  flex-direction: column;
  width: 100%;
  box-sizing: border-box;
  overflow-x: hidden;
}


/* 标签切换 */
.tabs {
  position: fixed;
  top: env(safe-area-inset-top);
  left: 0;
  right: 0;
  height: 80rpx;
  background-color: #ffffff;
  display: flex;
  align-items: center;
  border-bottom: 1rpx solid #f0f0f0;
  z-index: 99;
}

.tab-item {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16rpx 0;
  font-size: 28rpx;
  color: #666;
  position: relative;
}

.tab-text {
  text-align: center;
}

.tab-item.active {
  color: #3BA272;
  font-weight: 600;
}

.tab-item.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 60rpx;
  height: 4rpx;
  background-color: #3BA272;
  border-radius: 2rpx;
}

/* 滚动内容 */
.scroll-content {
  margin-top: calc(80rpx + env(safe-area-inset-top));
  flex: 1;
  padding: 24rpx;
  padding-bottom: calc(200rpx + env(safe-area-inset-bottom));
  box-sizing: border-box;
  width: 100%;
}

/* 行程概览卡片 */
.overview-card {
  background-color: #ffffff;
  border-radius: 24rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
  width: 100%;
  box-sizing: border-box;
}

.card-header {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.expand-section {
  margin-top: 16rpx;
  padding-top: 16rpx;
  border-top: 1rpx solid #f0f0f0;
}

.expand-trigger {
  display: flex;
  align-items: center;
  gap: 8rpx;
  cursor: pointer;
  color: #999;
  font-size: 24rpx;
}

.expand-icon {
  font-size: 20rpx;
  transition: transform 0.3s;
  display: inline-block;
}

.expand-icon.expanded {
  transform: rotate(90deg);
}

.expand-text {
  font-size: 24rpx;
  color: #999;
}

.card-content {
  margin-top: 16rpx;
  padding-top: 16rpx;
}

.route-title {
  font-size: 36rpx;
  font-weight: 700;
  color: #333;
  line-height: 1.4;
  word-break: break-all;
}

.tags-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 16rpx;
  margin-bottom: 16rpx;
}

.tag {
  font-size: 24rpx;
  color: #3BA272;
  background-color: #f0f7f4;
  padding: 8rpx 16rpx;
  border-radius: 16rpx;
}

.rating {
  display: flex;
  align-items: center;
  gap: 4rpx;
  margin-left: auto;
}

.star {
  font-size: 28rpx;
  color: #ffd700;
}

.rating-value {
  font-size: 28rpx;
  color: #333;
  font-weight: 600;
}

.summary-text {
  font-size: 26rpx;
  color: #666;
  line-height: 1.8;
  margin-top: 16rpx;
}

/* 地图区域 */
.map-section {
  width: 100%;
  margin-bottom: 24rpx;
  display: flex;
  justify-content: center;
  align-items: center;
}

.map-container {
  position: relative;
  width: 100%;
  height: 400rpx;
  border-radius: 24rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
}

.map {
  width: 100%;
  height: 100%;
}

.map-button {
  position: absolute;
  bottom: 16rpx;
  right: 16rpx;
  background-color: rgba(255, 255, 255, 0.95);
  padding: 12rpx 24rpx;
  border-radius: 20rpx;
  font-size: 24rpx;
  color: #333;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
}

/* 每日行程 */
.days-section {
  margin-bottom: 24rpx;
  width: 100%;
  box-sizing: border-box;
}

.day-card {
  background-color: #ffffff;
  border-radius: 24rpx;
  padding: 32rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
  width: 100%;
  box-sizing: border-box;
}

/* 天数切换标签 */
.day-tabs {
  display: flex;
  gap: 16rpx;
  margin-bottom: 32rpx;
  padding-bottom: 24rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.day-tab-item {
  padding: 12rpx 24rpx;
  border-radius: 20rpx;
  background-color: #f5f5f5;
  color: #666;
  font-size: 26rpx;
  cursor: pointer;
  transition: all 0.3s;
}

.day-tab-item.active {
  background-color: #3BA272;
  color: #ffffff;
  font-weight: 600;
}

.day-header {
  display: flex;
  align-items: baseline;
  gap: 16rpx;
  margin-bottom: 24rpx;
  padding-bottom: 16rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.day-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
  flex-shrink: 0;
}

.day-date {
  font-size: 26rpx;
  color: #999;
  flex-shrink: 0;
}

.time-blocks {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.time-block {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  width: 100%;
}

.time-block:first-child .time-label {
  margin-top: 0;
}

/* POI卡片区域 */
.poi-cards-section {
  margin-top: 32rpx;
  padding-top: 32rpx;
  border-top: 1rpx solid #f0f0f0;
}

.poi-cards-section .section-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 16rpx;
}

.poi-scroll {
  width: 100%;
  white-space: nowrap;
}

.poi-cards-list {
  display: flex;
  flex-direction: row;
  gap: 16rpx;
  padding: 0 0 8rpx 0;
}

.poi-card {
  flex-shrink: 0;
  width: 220rpx;
  background-color: #ffffff;
  border-radius: 20rpx;
  overflow: hidden;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  border: 1rpx solid #f0f0f0;
}

.poi-card-image-wrapper {
  width: 100%;
  height: 0;
  padding-bottom: 75%;
  position: relative;
  overflow: hidden;
  background-color: #f0f0f0;
}

.poi-card-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.poi-card-image-placeholder {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f0f0f0;
}

.poi-card-icon {
  font-size: 60rpx;
}

.poi-card-content {
  padding: 16rpx;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.poi-card-name {
  font-size: 26rpx;
  font-weight: 600;
  color: #333333;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-width: 0;
}

.poi-card-desc {
  font-size: 22rpx;
  color: #666666;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-width: 0;
}

.poi-card-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8rpx;
  margin-top: 4rpx;
}

.poi-card-price {
  font-size: 24rpx;
  font-weight: 600;
  color: #3ba272;
  flex-shrink: 0;
}

.poi-card-price-free {
  font-size: 24rpx;
  font-weight: 600;
  color: #ff6b6b;
  flex-shrink: 0;
}

.poi-card-score {
  flex-shrink: 0;
  font-size: 22rpx;
  color: #ff9800;
  font-weight: 600;
}

.time-label {
  font-size: 28rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 12rpx;
  margin-top: 8rpx;
}

.poi-item {
  display: flex;
  align-items: flex-start;
  gap: 16rpx;
  padding: 16rpx 0;
  width: 100%;
  box-sizing: border-box;
}

.poi-time {
  font-size: 26rpx;
  color: #666;
  min-width: 80rpx;
  font-weight: 500;
}

.poi-icon {
  width: 56rpx;
  height: 56rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background-color: #f0f7f4;
  flex-shrink: 0;
  font-size: 32rpx;
}

.icon-scenic {
  background-color: #fff5e6;
}

.icon-food {
  background-color: #fff0f5;
}

.poi-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  min-width: 0;
  word-break: break-all;
}

.poi-name {
  font-size: 28rpx;
  font-weight: 600;
  color: #333;
  line-height: 1.4;
}

.poi-desc {
  font-size: 24rpx;
  color: #999;
  line-height: 1.5;
  margin-top: 4rpx;
}

.poi-note {
  font-size: 24rpx;
  color: #666;
  line-height: 1.5;
  margin-top: 4rpx;
}

/* 早餐区域样式 */
.breakfast-section {
  margin-bottom: 24rpx;
  padding: 20rpx;
  background-color: #fff8e1;
  border-radius: 16rpx;
  border-left: 4rpx solid #ff9800;
}

.lunch-section {
  background-color: #fff3e0;
  border-left-color: #ff9800;
}

.dinner-section {
  background-color: #f3e5f5;
  border-left-color: #9c27b0;
}

.icon-breakfast {
  background-color: #fff8e1;
  border: 2rpx solid #ff9800;
  width: 80rpx;
  height: 80rpx;
}

.icon-lunch {
  background-color: #fff3e0;
  border: 2rpx solid #ff9800;
  width: 80rpx;
  height: 80rpx;
}

.icon-dinner {
  background-color: #f3e5f5;
  border: 2rpx solid #9c27b0;
  width: 80rpx;
  height: 80rpx;
}

.food-time-label {
  font-size: 24rpx;
  font-weight: 600;
  color: #333;
  line-height: 1.2;
  text-align: center;
}

.breakfast-item {
  display: flex;
  align-items: flex-start;
  gap: 16rpx;
}

.breakfast-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.breakfast-name {
  font-size: 28rpx;
  font-weight: 600;
  color: #333;
}

.breakfast-info {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
  font-size: 24rpx;
  color: #666;
}

.breakfast-address,
.breakfast-specialty,
.breakfast-price {
  font-size: 24rpx;
  color: #666;
}

.breakfast-price {
  color: #ff9800;
  font-weight: 600;
}

/* 路线信息样式 */
.route-item-group {
  margin-bottom: 24rpx;
}

.route-info {
  display: flex;
  align-items: flex-start;
  gap: 16rpx;
  margin-bottom: 16rpx;
  padding: 16rpx;
  background-color: #e8f5e9;
  border-radius: 12rpx;
  position: relative;
}

.route-line {
  width: 4rpx;
  height: 100%;
  background-color: #3ba272;
  border-radius: 2rpx;
  flex-shrink: 0;
  margin-top: 8rpx;
}

.route-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.route-text {
  display: flex;
  align-items: center;
  gap: 8rpx;
  font-size: 26rpx;
  color: #333;
  font-weight: 500;
}

.route-from,
.route-to {
  color: #3ba272;
  font-weight: 600;
}

.route-arrow {
  color: #999;
  font-size: 24rpx;
}

.route-details {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
  font-size: 22rpx;
  color: #666;
  margin-top: 4rpx;
}

.route-suggestion,
.route-transport,
.route-distance {
  font-size: 22rpx;
  color: #666;
}

/* 景点详细信息样式 */
.scenic-item {
  display: flex;
  align-items: flex-start;
  gap: 16rpx;
  padding: 16rpx;
  background-color: #ffffff;
  border-radius: 12rpx;
  border: 1rpx solid #f0f0f0;
}

.poi-intro,
.poi-visit-time,
.poi-notes {
  margin-top: 8rpx;
  font-size: 24rpx;
  line-height: 1.6;
}

.intro-label,
.visit-time-label,
.notes-label {
  font-weight: 600;
  color: #333;
  margin-right: 8rpx;
}

.intro-text,
.visit-time-text,
.notes-text {
  color: #666;
}

.poi-address {
  margin-top: 8rpx;
  font-size: 22rpx;
  color: #999;
}

/* 地图视图 */
.map-view-section {
  width: 100%;
  height: calc(100vh - 200rpx);
  display: flex;
  justify-content: center;
  align-items: center;
}

.map-container-center {
  width: 100%;
  height: 100%;
  border-radius: 24rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
}

.full-map {
  width: 100%;
  height: 100%;
}

/* 加载状态 */
.loading-container {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 80rpx 32rpx;
  color: #999;
  font-size: 28rpx;
}

/* 底部操作栏 */
.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 16rpx 24rpx;
  padding-bottom: calc(16rpx + env(safe-area-inset-bottom));
  background-color: #ffffff;
  border-top: 1rpx solid #eeeeee;
  box-shadow: 0 -4rpx 16rpx rgba(0, 0, 0, 0.06);
  z-index: 100;
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.favorite-btn {
  padding: 20rpx 24rpx;
  background-color: #ffffff;
  border: 1rpx solid #e0e0e0;
  border-radius: 24rpx;
  font-size: 28rpx;
  color: #333;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
}

.favorite-icon {
  font-size: 32rpx;
  color: #333;
  line-height: 1;
  font-weight: 300;
}

.favorite-icon.favorited {
  color: #ff6b6b;
}

.favorite-text {
  font-size: 28rpx;
  color: #333;
}

.nav-btn {
  flex: 1;
  padding: 24rpx;
  background-color: #ffffff;
  border: 1rpx solid #e0e0e0;
  border-radius: 24rpx;
  font-size: 28rpx;
  color: #333;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
}

.nav-btn-text {
  font-size: 28rpx;
}

.enable-btn {
  flex: 2;
  padding: 24rpx;
  background: linear-gradient(135deg, #ff9800, #ffb74d);
  border-radius: 24rpx;
  font-size: 28rpx;
  font-weight: 600;
  color: #ffffff;
  border: none;
  box-shadow: 0 8rpx 24rpx rgba(255, 152, 0, 0.3);
}
</style>
