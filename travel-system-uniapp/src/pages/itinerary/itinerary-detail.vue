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

    <!-- 隐藏画布：用于动态生成 marker 图标（需常驻，否则在“行程”Tab内更新地图时回调不触发） -->
    <canvas
      canvas-id="poi-marker-canvas"
      style="position: fixed; left: -9999px; top: -9999px; width: 64px; height: 64px;"
    ></canvas>

    <!-- 地图须在 scroll-view 外，否则微信小程序原生 map 无法渲染 -->
    <view
      v-if="!loading && routeData && activeTab === 'itinerary'"
      class="map-section map-section--outer"
    >
      <view class="map-container">
        <map
          :key="'day-' + mapRenderKey"
          id="route-day-map"
          class="map"
          :latitude="mapCenter.latitude"
          :longitude="mapCenter.longitude"
          :scale="mapScale"
          :markers="mapMarkers"
          :polyline="mapPolyline"
          :show-location="true"
          :enable-zoom="true"
          :enable-scroll="true"
          provider="amap"
          @markertap="onMarkerTap"
          @callouttap="onCalloutTap"
        >
          <cover-view v-if="activeMarkerCallout" class="map-marker-callout">
            <cover-view class="map-marker-callout-title">{{ activeMarkerCallout.title }}</cover-view>
            <cover-view v-if="activeMarkerCallout.address" class="map-marker-callout-address">{{ activeMarkerCallout.address }}</cover-view>
            <cover-view v-if="activeMarkerCallout.typeLabel" class="map-marker-callout-type">{{ activeMarkerCallout.typeLabel }}</cover-view>
            <cover-view class="map-marker-callout-close" @tap.stop="activeMarkerCallout = null">×</cover-view>
          </cover-view>
        </map>
        <view v-if="!hasMapPoints" class="map-empty-overlay">
          <text class="map-empty-text">暂无坐标，请确认景点/美食已填写地址</text>
        </view>
        <view class="map-route-summary">
          <text class="map-summary-title">Day {{ currentMapSummary.dayNo }}</text>
          <text class="map-summary-desc">{{ currentMapSummary.poiCount }}个地点 · 路线为示意连线</text>
        </view>
        <view class="map-button" @click="viewFullMap">
          <text>查看完整行程地图</text>
        </view>
      </view>
    </view>

    <view
      v-if="!loading && routeData && activeTab === 'map'"
      class="map-full-page"
    >
      <view class="map-full-map-wrap">
        <map
          :key="'full-' + mapRenderKey"
          id="route-full-map"
          class="full-map"
          :latitude="mapCenter.latitude"
          :longitude="mapCenter.longitude"
          :scale="mapScale"
          :markers="mapMarkers"
          :polyline="mapPolyline"
          :show-location="true"
          :enable-zoom="true"
          :enable-scroll="true"
          provider="amap"
          @markertap="onMarkerTap"
          @callouttap="onCalloutTap"
          @labeltap="onMarkerTap"
          @updated="onFullMapUpdated"
        ></map>
        <view v-if="!hasMapPoints" class="map-empty-overlay">
          <text class="map-empty-text">暂无坐标，请确认景点/美食已填写地址</text>
        </view>
      </view>

      <view v-if="activeMarkerCallout" class="map-full-marker-info">
        <view class="map-full-marker-info-header">
          <text class="map-full-marker-info-title">{{ activeMarkerCallout.title }}</text>
          <text class="map-full-marker-info-close" @click.stop="activeMarkerCallout = null">×</text>
        </view>
        <text v-if="activeMarkerCallout.typeLabel" class="map-full-marker-info-type">{{ activeMarkerCallout.typeLabel }}</text>
        <text v-if="activeMarkerCallout.address" class="map-full-marker-info-address">{{ activeMarkerCallout.address }}</text>
      </view>

      <view class="map-full-toolbar">
        <scroll-view scroll-x class="map-chip-scroll" :show-scrollbar="false">
          <view class="map-chip-list">
            <view
              class="map-chip"
              :class="{ active: routeMapMode === 'full' }"
              @click="showFullRouteMap"
            >全程</view>
            <view
              v-for="(dayItem, dayIndex) in routeData.days"
              :key="dayItem.day?.id || dayIndex"
              class="map-chip"
              :class="{ active: routeMapMode === 'day' && selectedDayIndex === dayIndex }"
              @click="showMapDay(dayIndex)"
            >Day {{ dayItem.day?.dayNo || dayIndex + 1 }}</view>
          </view>
        </scroll-view>
      </view>

      <view v-if="fullMapLegends.length > 0" class="map-full-legend">
        <text class="map-full-legend-title">行程图例</text>
        <view class="map-full-legend-list">
          <view v-for="item in fullMapLegends" :key="item.dayNo" class="map-full-legend-item">
            <view class="map-full-legend-color" :style="{ backgroundColor: item.color }"></view>
            <text class="map-full-legend-text">Day {{ item.dayNo }}</text>
          </view>
        </view>
      </view>

      <view v-if="currentMapPoiList.length > 0" class="map-full-poi-panel">
        <view class="map-full-poi-panel-title">当日地点（{{ currentMapPoiList.length }}）</view>
        <scroll-view scroll-y class="map-full-poi-scroll" :show-scrollbar="false">
          <view
            v-for="item in currentMapPoiList"
            :key="item.markerId"
            class="map-full-poi-item"
            :class="{ active: activeMarkerId === item.markerId }"
            @click="focusMapPoi(item.markerId)"
          >
            <view class="map-full-poi-item-index">{{ item.orderLabel }}</view>
            <view class="map-full-poi-item-body">
              <text class="map-full-poi-item-name">{{ item.title }}</text>
              <text v-if="item.address" class="map-full-poi-item-address">{{ item.address }}</text>
            </view>
            <text class="map-full-poi-item-type">{{ item.typeLabel }}</text>
          </view>
        </scroll-view>
      </view>
    </view>

    <scroll-view scroll-y class="scroll-content" v-if="!loading && routeData && activeTab === 'itinerary'">
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

            <!-- 纯 AI 文案：结构化展示（上午/下午标题 + 时间安排/详细行程/交通方式） -->
            <view v-if="useAiTimelineOnly" class="time-blocks">
              <view
                v-for="(block, blockIndex) in aiTimelineBlocks"
                :key="`ai-${blockIndex}`"
                class="time-block"
              >
                <view class="time-label">{{ block.label }}</view>
                <view class="time-description">
                  <template v-if="block.fields.rawFallback">
                    <text class="time-description-text">{{ block.fields.rawFallback }}</text>
                  </template>
                  <template v-else>
                    <view v-if="block.fields.title" class="ai-segment-title">{{ block.fields.title }}</view>
                    <view v-if="block.fields.timeSchedule" class="ai-segment-row">
                      <text class="ai-segment-text">* 时间安排：{{ block.fields.timeSchedule }}</text>
                    </view>
                    <view v-if="block.fields.detail" class="ai-segment-row">
                      <text class="ai-segment-text">* 详细行程：{{ block.fields.detail }}</text>
                    </view>
                    <view v-if="block.fields.transport" class="ai-segment-row">
                      <text class="ai-segment-text">* 交通方式：{{ block.fields.transport }}</text>
                    </view>
                  </template>
                </view>
              </view>
            </view>

            <!-- 回退：按 POI 结构化展示 -->
            <view v-else class="time-blocks">
              <view
                v-for="(timeGroup, timeIndex) in formatDayContent(currentDayData)"
                :key="timeIndex"
                class="time-block"
              >
                <view class="time-label">{{ timeGroup.timeLabel }}</view>
                <view v-if="timeGroup.description" class="time-description">
                  <text class="time-description-text">{{ timeGroup.description }}</text>
                </view>

                <!-- 早餐信息 -->
                <view v-if="timeGroup.breakfast" class="breakfast-section">
                  <view class="breakfast-item">
                    <view class="poi-icon icon-food icon-breakfast">
                      <text class="food-time-label">早餐</text>
                    </view>
                    <view class="breakfast-content">
                      <view class="breakfast-name">{{ timeGroup.breakfast.name }}</view>
                      <view class="breakfast-info">
                        <text v-if="timeGroup.breakfast.address" class="breakfast-address"><text class="iconfont icon-weizhi"></text> {{ timeGroup.breakfast.address }}</text>
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
                        <text v-if="timeGroup.lunch.address" class="breakfast-address"><text class="iconfont icon-weizhi"></text> {{ timeGroup.lunch.address }}</text>
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
                        <text v-if="timeGroup.dinner.address" class="breakfast-address"><text class="iconfont icon-weizhi"></text> {{ timeGroup.dinner.address }}</text>
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
                      <text class="iconfont icon-jingdian"></text>
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
                        <text><text class="iconfont icon-weizhi"></text> {{ item.scenic.address }}</text>
                      </view>
                    </view>
                  </view>
                </view>
              </view>
            </view>

            <!-- 当天景点卡片 - 横向滚动 -->
            <view class="poi-cards-section" v-if="!useAiTimelineOnly && currentDayScenics.length > 0">
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
                        class="poi-card-image"
                        :src="scenic.imageUrl ? getImageUrl(scenic.imageUrl) : defaultScenicImage"
                        mode="aspectFill"
                      />
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
            <view class="poi-cards-section" v-if="!useAiTimelineOnly && currentDayFoods.length > 0">
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
                        class="poi-card-image"
                        :src="food.imageUrl ? getImageUrl(food.imageUrl) : defaultFoodImage"
                        mode="aspectFill"
                      />
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
import { ref, computed, watch, nextTick, getCurrentInstance } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { routeApi } from '@/api/route'
import { useUserStore } from '@/store/user'
import { getCache, setCache } from '@/utils/storage'
import { defaultFoodImage, defaultScenicImage } from '@/utils/config'
import { getImageUrl } from '@/utils/image'
import { geocodeAddress, isCoordNearCity, type CityCenter } from '@/utils/amapGeocode'
import { extractPlacesFromAiIntro, dayHasAiIntro, type AiMapStop } from '@/utils/aiMapLocations'

interface RouteData {
  route?: {
    id?: number
    routeName?: string
    cityId?: number
    days?: number
    suitablePeople?: string
    summary?: string
    coverImage?: string
    favoriteCount?: number
  }
  city?: {
    id?: number
    cityName?: string
    province?: string
    latitude?: number
    longitude?: number
  }
  days?: Array<{
    day?: {
      id?: number
      dayNo?: number
      title?: string
      intro?: string
    }
    mapStops?: Array<{
      name?: string
      sortOrder?: number
      latitude?: number
      longitude?: number
    }>
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

const safeText = (value: any): string => {
  if (value == null) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  try {
    return JSON.stringify(value)
  } catch (e) {
    return ''
  }
}

const parseDayIntro = (dayData: any) => {
  const intro = dayData?.day?.intro
  const empty = { morning: '', noon: '', afternoon: '', evening: '' }
  if (!intro) return empty
  const introText = safeText(intro).trim()
  if (!introText) return empty

  try {
    if (introText.startsWith('{') && introText.endsWith('}')) {
      const parsed = JSON.parse(introText)
      return {
        morning: safeText(parsed?.morning),
        noon: safeText(parsed?.noon || parsed?.lunch),
        afternoon: safeText(parsed?.afternoon),
        evening: safeText(parsed?.evening),
      }
    }
  } catch (e) {
    // fallback plain text
  }

  return {
    morning: introText,
    noon: '',
    afternoon: '',
    evening: '',
  }
}

/** 解析 AI 时段文案：主题行 + * 时间安排 / * 详细行程 / * 交通方式 */
interface AiBlockFields {
  title: string
  timeSchedule: string
  detail: string
  transport: string
  rawFallback: string
}

const parseAiBlockFields = (text: string): AiBlockFields => {
  const raw = safeText(text).trim()
  const empty: AiBlockFields = { title: '', timeSchedule: '', detail: '', transport: '', rawFallback: '' }
  if (!raw) return empty

  const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0)
  const timeRe = /^\*?\s*时间安排[：:]\s*(.+)$/
  const detailRe = /^\*?\s*详细行程[：:]\s*(.+)$/
  const transRe = /^\*?\s*交通方式[：:]\s*(.+)$/

  const isFieldLine = (line: string) => timeRe.test(line) || detailRe.test(line) || transRe.test(line)
  const firstFieldIdx = lines.findIndex((l) => isFieldLine(l))

  if (firstFieldIdx === -1) {
    return { title: '', timeSchedule: '', detail: '', transport: '', rawFallback: raw }
  }

  const title = firstFieldIdx > 0 ? lines.slice(0, firstFieldIdx).join('\n').trim() : ''

  let timeSchedule = ''
  let detail = ''
  let transport = ''
  let pendingDetail = false

  for (let i = firstFieldIdx; i < lines.length; i++) {
    const line = lines[i]
    const tm = line.match(timeRe)
    if (tm) {
      timeSchedule = tm[1].trim()
      pendingDetail = false
      continue
    }
    const dm = line.match(detailRe)
    if (dm) {
      detail = dm[1].trim()
      pendingDetail = true
      continue
    }
    const trm = line.match(transRe)
    if (trm) {
      transport = trm[1].trim()
      pendingDetail = false
      continue
    }
    if (pendingDetail) {
      detail += (detail ? '\n' : '') + line
    }
  }

  const hasStruct = !!(timeSchedule || detail || transport)
  if (!hasStruct) {
    return { title: '', timeSchedule: '', detail: '', transport: '', rawFallback: raw }
  }
  return { title, timeSchedule, detail, transport, rawFallback: '' }
}

const aiTimelineBlocks = computed(() => {
  const day = currentDayData.value
  if (!day) return []
  const intro = parseDayIntro(day)
  const rawBlocks = [
    { key: 'morning', label: '上午', text: safeText(intro.morning).trim() },
    { key: 'noon', label: '中午', text: safeText(intro.noon).trim() },
    { key: 'afternoon', label: '下午', text: safeText(intro.afternoon).trim() },
    { key: 'evening', label: '晚上', text: safeText(intro.evening).trim() },
  ]
  return rawBlocks
    .filter((b) => b.text.length > 0)
    .map((b) => ({
      label: b.label,
      fields: parseAiBlockFields(b.text),
    }))
})

const useAiTimelineOnly = computed(() => aiTimelineBlocks.value.length > 0)

const isNarrativeRelevant = (text: string, names: string[]) => {
  const content = safeText(text).trim()
  if (!content) return false
  if (!names || names.length === 0) return false
  return names.some((name) => !!name && content.includes(name))
}

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
const mapScale = ref(12)
const routeMapMode = ref<'day' | 'full'>('day')
const mapRenderKey = ref(0)
const hasMapPoints = ref(false)
const mapPageInstance = getCurrentInstance()
const activeMarkerCallout = ref<{ title: string; address?: string; typeLabel?: string } | null>(null)
const activeMarkerId = ref<number | null>(null)
const markerMetaMap = ref<Record<number, { title: string; address?: string; typeLabel?: string }>>({})

// 动态 marker 图标缓存（小程序 map 的 iconPath 需要本地路径/临时文件路径）
const markerIconCache = ref<{ scenic?: string; food?: string }>({})
let mapUpdateGen = 0
const DAY_LINE_COLORS = ['#3BA272', '#2F7DDB', '#F59E0B', '#EF4444', '#8B5CF6', '#14B8A6', '#EC4899']

const getDayLineColor = (dayNo: number) => DAY_LINE_COLORS[(Math.max(1, dayNo) - 1) % DAY_LINE_COLORS.length]

const getSortedDayPois = (dayItem: any) => {
  return [...(dayItem?.pois || [])].sort((a, b) => {
    const sortA = a.poi?.sort || 0
    const sortB = b.poi?.sort || 0
    return sortA - sortB
  })
}

const getValidPoiCoords = (pois: any[]) => {
  return pois
    .map((poiItem) => extractPoiCoord(poiItem?.detail))
    .filter((coord): coord is { latitude: number; longitude: number } => !!coord)
}

const getUniqueCoords = (coords: Array<{ latitude: number; longitude: number }>) => {
  const seen = new Set<string>()
  return coords.filter((coord) => {
    if (!Number.isFinite(coord?.latitude) || !Number.isFinite(coord?.longitude)) return false
    const key = `${coord.latitude},${coord.longitude}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

const updateMapViewport = (coords: Array<{ latitude: number; longitude: number }>) => {
  const validCoords = getUniqueCoords(coords)
  if (!validCoords.length) return

  let sumLat = 0
  let sumLng = 0
  let minLat = validCoords[0].latitude
  let maxLat = validCoords[0].latitude
  let minLng = validCoords[0].longitude
  let maxLng = validCoords[0].longitude

  validCoords.forEach((coord) => {
    sumLat += coord.latitude
    sumLng += coord.longitude
    minLat = Math.min(minLat, coord.latitude)
    maxLat = Math.max(maxLat, coord.latitude)
    minLng = Math.min(minLng, coord.longitude)
    maxLng = Math.max(maxLng, coord.longitude)
  })

  mapCenter.value = {
    latitude: sumLat / validCoords.length,
    longitude: sumLng / validCoords.length,
  }

  const span = Math.max(maxLat - minLat, maxLng - minLng)
  mapScale.value = span > 1.2 ? 7 : span > 0.5 ? 9 : span > 0.18 ? 11 : span > 0.06 ? 12 : span > 0.025 ? 13 : span > 0.01 ? 14 : 15
}

const currentMapSummary = computed(() => {
  const dayItem = currentDayData.value
  const markerCount = mapMarkers.value.length
  const pois = getSortedDayPois(dayItem)
  const validFromPoi = getValidPoiCoords(pois).length
  return {
    dayNo: dayItem?.day?.dayNo || selectedDayIndex.value + 1,
    poiCount: markerCount || validFromPoi,
  }
})

const currentMapPoiList = computed(() => {
  const list: Array<{
    markerId: number
    orderLabel: string
    title: string
    address?: string
    typeLabel: string
  }> = []
  mapMarkers.value.forEach((marker) => {
    const meta = markerMetaMap.value[marker.id] || marker.meta
    if (!meta) return
    list.push({
      markerId: marker.id,
      orderLabel: marker.label?.content ? String(marker.label.content) : '·',
      title: meta.title,
      address: meta.address,
      typeLabel: meta.typeLabel || '地点',
    })
  })
  return list
})

const fullMapLegends = computed(() => {
  if (activeTab.value !== 'map' || routeMapMode.value !== 'full' || !routeData.value?.days?.length) return []
  return routeData.value.days.map((day, idx) => {
    const dayNo = Number(day?.day?.dayNo || idx + 1)
    return {
      dayNo,
      color: getDayLineColor(dayNo),
    }
  })
})

const createPoiMarkerIcon = (type: 'scenic' | 'food'): Promise<string> => {
  if (markerIconCache.value[type]) {
    return Promise.resolve(markerIconCache.value[type] as string)
  }

  return new Promise((resolve) => {
    try {
      const ctx = uni.createCanvasContext('poi-marker-canvas')
      const size = 64
      const r = 22
      const cx = size / 2
      const cy = 28

      // 背景圆
      ctx.clearRect(0, 0, size, size)
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, 2 * Math.PI)
      ctx.closePath()

      const fill = type === 'food' ? '#3BA272' : '#5D92B0'
      ctx.setFillStyle(fill)
      ctx.fill()

      // 白色描边
      ctx.setStrokeStyle('#FFFFFF')
      ctx.setLineWidth(4)
      ctx.stroke()

      // 小尾巴（三角形）
      ctx.beginPath()
      ctx.moveTo(cx, cy + r + 2)
      ctx.lineTo(cx - 10, cy + r + 18)
      ctx.lineTo(cx + 10, cy + r + 18)
      ctx.closePath()
      ctx.setFillStyle(fill)
      ctx.fill()
      ctx.setStrokeStyle('#FFFFFF')
      ctx.setLineWidth(3)
      ctx.stroke()

      // 中心白点
      ctx.beginPath()
      ctx.arc(cx, cy, 7, 0, 2 * Math.PI)
      ctx.closePath()
      ctx.setFillStyle('#FFFFFF')
      ctx.fill()

      ctx.draw(false, () => {
        setTimeout(() => {
          uni.canvasToTempFilePath({
            canvasId: 'poi-marker-canvas',
            success: (res: any) => {
              markerIconCache.value[type] = res.tempFilePath
              resolve(res.tempFilePath)
            },
            fail: () => {
              // 失败则用默认 marker（不设置 iconPath）
              resolve('')
            },
          })
        }, 60)
      })
    } catch {
      resolve('')
    }
  })
}

// 加载路线详情
const loadRouteDetail = async () => {
  if (!routeId.value) return

  loading.value = true
  try {
    const res = await routeApi.getDetail(routeId.value)

    if (res.statusCode === 200 && res.data.code === 200) {
      routeData.value = res.data.data

      // 加载收藏状态
      loadFavoriteStatus()

      await enrichRouteCoordinates(routeData.value)
      mapRenderKey.value += 1
    } else {
      uni.showToast({ title: res.data.msg || '加载失败', icon: 'none' })
    }
  } catch (e) {
    uni.showToast({ title: '网络错误', icon: 'none' })
  } finally {
    loading.value = false
    await nextTick()
    if (routeData.value) {
      refreshMapAfterMount()
    }
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
    uni.showToast({ title: '操作失败', icon: 'none' })
  }
}

const toCoordNumber = (v: any): number | null => {
  const n = typeof v === 'number' ? v : parseFloat(String(v))
  return Number.isFinite(n) ? n : null
}

const isChinaCoord = (lat: number, lng: number) => lat >= 3 && lat <= 54.5 && lng >= 73 && lng <= 135.5

const extractPoiCoord = (detail: any): { latitude: number; longitude: number } | null => {
  if (!detail) return null
  const latRaw = detail.latitude ?? detail.lat
  const lngRaw = detail.longitude ?? detail.lng ?? detail.lon
  let lat = toCoordNumber(latRaw)
  let lng = toCoordNumber(lngRaw)
  if (lat == null || lng == null) return null
  if (!isChinaCoord(lat, lng) && isChinaCoord(lng, lat)) {
    const swappedLat = lng
    const swappedLng = lat
    lat = swappedLat
    lng = swappedLng
  }
  if (!isChinaCoord(lat, lng)) return null
  return { latitude: lat, longitude: lng }
}

const normalizeCityName = (value: any): string => {
  return String(value || '')
    .trim()
    .replace(/(特别行政区|自治州|地区|盟|市|省)$/u, '')
}

const resolveRouteCityName = (data: RouteData | null): string => {
  if (!data) return ''
  if (data.city?.cityName) return normalizeCityName(data.city.cityName)
  if (!data?.days?.length) return ''
  for (const dayItem of data.days) {
    for (const poiItem of dayItem.pois || []) {
      const detail = poiItem?.detail
      if (detail?.city) return normalizeCityName(detail.city)
      if (detail?.province) return normalizeCityName(detail.province)
    }
  }
  return ''
}

const resolveRouteCityCenter = (data: RouteData | null): CityCenter | null => {
  if (!data?.city) return null
  const lat = toCoordNumber(data.city.latitude)
  const lng = toCoordNumber(data.city.longitude)
  if (lat == null || lng == null || !isChinaCoord(lat, lng)) return null
  return { latitude: lat, longitude: lng }
}

const isCoordInRouteCity = (coord: { latitude: number; longitude: number } | null, data: RouteData | null) => {
  if (!coord) return false
  return isCoordNearCity(coord, resolveRouteCityCenter(data))
}

const geocodePoiDetail = async (
  detail: any,
  cityName?: string,
  cityId?: number,
  cityCenter?: CityCenter | null
): Promise<{ latitude: number; longitude: number } | null> => {
  const city = normalizeCityName(cityName || detail?.city || detail?.province)
  const address = String(detail?.address || '').trim()
  const name = String(detail?.name || '').trim()
  const cityLabel = city ? `${city}市` : ''
  const candidates = Array.from(
    new Set(
      [
        cityLabel && name ? `${cityLabel}${name}` : '',
        city && name ? `${city}${name}` : '',
        cityLabel && address ? `${cityLabel}${address}` : '',
        city && address ? `${city}${address}` : '',
        address,
        name,
      ].filter(Boolean)
    )
  )
  for (const query of candidates) {
    const coord = await geocodeAddress(query, city || undefined, cityId, cityCenter)
    if (coord) return coord
  }
  return null
}

const getPoiName = (poiItem: any) => {
  if (poiItem?.detail?.name) return poiItem.detail.name
  return poiItem?.poi?.note || '未知地点'
}

const applyCoordToDetail = (detail: any, coord: { latitude: number; longitude: number }) => {
  if (!detail) return
  detail.latitude = coord.latitude
  detail.longitude = coord.longitude
}

/** 为缺少经纬度的 POI 做地理编码兜底 */
const enrichRouteCoordinates = async (data: RouteData | null) => {
  if (!data?.days?.length) return
  const cityName = resolveRouteCityName(data)
  const cityId = data?.route?.cityId
  const cityCenter = resolveRouteCityCenter(data)
  const tasks: Promise<void>[] = []
  for (const dayItem of data.days) {
    for (const poiItem of dayItem.pois || []) {
      const detail = poiItem?.detail
      if (!detail) continue
      const existing = extractPoiCoord(detail)
      if (existing && isCoordInRouteCity(existing, data)) continue
      if (existing && !isCoordInRouteCity(existing, data)) {
        detail.latitude = undefined
        detail.longitude = undefined
      }
      tasks.push(
        geocodePoiDetail(detail, cityName, cityId, cityCenter).then((coord) => {
          if (coord) applyCoordToDetail(detail, coord)
        })
      )
    }
  }
  if (tasks.length) {
    await Promise.all(tasks)
  }
}

const findPoiDetailByName = (dayItem: any, placeName: string) => {
  const target = placeName.trim()
  if (!target || !dayItem?.pois?.length) return null
  for (const poiItem of dayItem.pois) {
    const name = String(poiItem?.detail?.name || '').trim()
    if (!name) continue
    if (name === target || name.includes(target) || target.includes(name)) {
      return poiItem.detail
    }
  }
  return null
}

type ResolvedAiMapStop = AiMapStop & {
  latitude: number
  longitude: number
  address: string
}

const resolveAiMapStopsForDay = async (dayItem: any, cityName: string, cityId?: number): Promise<ResolvedAiMapStop[]> => {
  const cityCenter = resolveRouteCityCenter(routeData.value)
  const backendStops = dayItem?.mapStops
  if (Array.isArray(backendStops) && backendStops.length > 0) {
    return backendStops
      .map((stop: any, index: number) => {
        const lat = toCoordNumber(stop?.latitude)
        const lng = toCoordNumber(stop?.longitude)
        if (lat == null || lng == null || !isChinaCoord(lat, lng)) return null
        const coord = { latitude: lat, longitude: lng }
        if (!isCoordNearCity(coord, cityCenter)) return null
        return {
          name: String(stop?.name || ''),
          period: '',
          periodOrder: index + 1,
          sortOrder: Number(stop?.sortOrder || index + 1),
          latitude: lat,
          longitude: lng,
          address: String(stop?.name || ''),
        } as ResolvedAiMapStop
      })
      .filter((item): item is ResolvedAiMapStop => !!item && !!item.name)
  }

  const intro = parseDayIntro(dayItem)
  const stops = extractPlacesFromAiIntro(intro)
  const resolved: ResolvedAiMapStop[] = []

  for (const stop of stops) {
    const matchedDetail = findPoiDetailByName(dayItem, stop.name)
    let coord = matchedDetail ? extractPoiCoord(matchedDetail) : null
    if (coord && !isCoordNearCity(coord, cityCenter)) {
      coord = null
    }
    const address = matchedDetail?.address ? String(matchedDetail.address) : stop.name
    if (!coord) {
      coord = await geocodePoiDetail(
        { name: stop.name, address: stop.name, city: cityName },
        cityName,
        cityId,
        cityCenter
      )
    }
    if (coord) {
      resolved.push({
        ...stop,
        latitude: coord.latitude,
        longitude: coord.longitude,
        address,
      })
    }
  }
  return resolved
}

const buildStopsMapData = (
  stops: ResolvedAiMapStop[],
  dayNo: number,
  lineColor: string,
  scenicIcon?: string,
  foodIcon?: string,
  metaStore?: Record<number, { title: string; address?: string; typeLabel?: string }>
): MapBuildResult => {
  const markers: any[] = []
  const polylines: any[] = []
  const dayCoordinates: Array<{ latitude: number; longitude: number }> = []

  stops.forEach((stop, index) => {
    const markerId = dayNo * 10000 + stop.sortOrder
    const markerTitle = `${stop.period} · ${stop.name}`
    const meta = {
      title: stop.name,
      address: stop.address,
      typeLabel: stop.period,
    }
    if (metaStore) {
      metaStore[markerId] = meta
    }

    const marker: any = {
      id: markerId,
      latitude: stop.latitude,
      longitude: stop.longitude,
      title: markerTitle,
      width: 46,
      height: 46,
      meta,
      callout: {
        content: stop.address ? `${stop.name}\n${stop.address}` : stop.name,
        color: '#333333',
        fontSize: 14,
        borderRadius: 8,
        bgColor: '#ffffff',
        padding: 10,
        display: 'BYCLICK',
        textAlign: 'center',
      },
      label: {
        content: String(index + 1),
        color: '#ffffff',
        fontSize: 14,
        anchorX: -5,
        anchorY: -36,
        bgColor: '#5D92B0',
        borderRadius: 12,
        padding: 4,
      },
      joinCluster: false,
    }
    if (scenicIcon) marker.iconPath = scenicIcon
    markers.push(marker)
    dayCoordinates.push({ latitude: stop.latitude, longitude: stop.longitude })
  })

  if (dayCoordinates.length > 1) {
    polylines.push({
      points: dayCoordinates,
      color: lineColor,
      width: 5,
      arrowLine: true,
      dottedLine: false,
      borderColor: '#FFFFFF',
      borderWidth: 2,
    })
  }

  return { markers, polylines, coords: dayCoordinates }
}

const buildMapForDay = async (
  dayItem: any,
  dayNo: number,
  lineColor: string,
  metaStore?: Record<number, { title: string; address?: string; typeLabel?: string }>,
  scenicIcon?: string,
  foodIcon?: string
): Promise<MapBuildResult> => {
  const cityName = resolveRouteCityName(routeData.value)
  const cityId = routeData.value?.route?.cityId
  const intro = parseDayIntro(dayItem)
  const aiStops = extractPlacesFromAiIntro(intro)
  const sortedPois = getSortedDayPois(dayItem || { pois: [] })
  const poiResult = buildDayMapData(sortedPois, dayNo, lineColor, scenicIcon, foodIcon, metaStore)

  const backendStopCount = Array.isArray(dayItem?.mapStops) ? dayItem.mapStops.length : 0
  if (backendStopCount >= 2 || aiStops.length >= 1) {
    const resolved = await resolveAiMapStopsForDay(dayItem, cityName, cityId)
    if (resolved.length >= 2) {
      return buildStopsMapData(resolved, dayNo, lineColor, scenicIcon, foodIcon, metaStore)
    }
    if (resolved.length > poiResult.coords.length) {
      return buildStopsMapData(resolved, dayNo, lineColor, scenicIcon, foodIcon, metaStore)
    }
    if (resolved.length === 1 && poiResult.coords.length === 0) {
      return buildStopsMapData(resolved, dayNo, lineColor, scenicIcon, foodIcon, metaStore)
    }
  }

  return poiResult
}

const refreshMapAfterMount = async () => {
  activeMarkerCallout.value = null
  activeMarkerId.value = null
  if (activeTab.value === 'map') {
    await updateFullMapData()
  } else {
    await updateMapData()
  }
}

const resolveMarkerMeta = (markerId: number) => {
  const meta = markerMetaMap.value[markerId]
  if (meta) return meta

  const marker = mapMarkers.value.find(
    (item) => item.id === markerId || String(item.id) === String(markerId)
  )
  if (!marker) return null

  if (marker.meta) return marker.meta

  const title = String(marker.title || marker.callout?.content || '').trim()
  if (!title) return null

  const lines = title.split('\n')
  return {
    title: lines[0] || title,
    address: lines[1] || '',
    typeLabel: marker.label?.content === '餐' ? '美食' : '景点',
  }
}

const showMarkerInfo = (markerId: number) => {
  const meta = resolveMarkerMeta(markerId)
  if (!meta) return
  activeMarkerId.value = markerId
  activeMarkerCallout.value = meta
}

const onMarkerTap = (e: any) => {
  const markerId = Number(e?.detail?.markerId)
  if (!Number.isFinite(markerId)) return
  showMarkerInfo(markerId)
}

const onCalloutTap = (e: any) => {
  const markerId = Number(e?.detail?.markerId)
  if (!Number.isFinite(markerId)) return
  showMarkerInfo(markerId)
}

const pendingMapFitCoords = ref<Array<{ latitude: number; longitude: number }> | null>(null)

const onFullMapUpdated = () => {
  if (activeTab.value !== 'map' || !pendingMapFitCoords.value?.length) return
  fitMapBounds(pendingMapFitCoords.value, 'route-full-map')
  pendingMapFitCoords.value = null
}

const focusMapPoi = (markerId: number) => {
  const marker = mapMarkers.value.find((item) => item.id === markerId)
  if (!marker) return
  showMarkerInfo(markerId)
  mapCenter.value = {
    latitude: marker.latitude,
    longitude: marker.longitude,
  }
  mapScale.value = 14
  const mapId = activeTab.value === 'map' ? 'route-full-map' : 'route-day-map'
  fitMapBounds([{ latitude: marker.latitude, longitude: marker.longitude }], mapId)
}

const fitMapBounds = (
  coords: Array<{ latitude: number; longitude: number }>,
  mapId: string
) => {
  if (!coords.length || !mapPageInstance) return
  nextTick(() => {
    setTimeout(() => {
      try {
        const ctx = uni.createMapContext(mapId, mapPageInstance as any)
        ctx.includePoints({
          points: coords.map((p) => ({ latitude: p.latitude, longitude: p.longitude })),
          padding: [48, 48, 48, 48],
        })
      } catch {
        // ignore
      }
    }, 120)
  })
}

type MapBuildResult = {
  markers: any[]
  polylines: any[]
  coords: Array<{ latitude: number; longitude: number }>
}

const buildDayMapData = (
  sortedPois: any[],
  dayNo: number,
  lineColor: string,
  scenicIcon?: string,
  foodIcon?: string,
  metaStore?: Record<number, { title: string; address?: string; typeLabel?: string }>
): MapBuildResult => {
  const markers: any[] = []
  const polylines: any[] = []
  const dayCoordinates: Array<{ latitude: number; longitude: number }> = []
  let poiOrder = 1

  sortedPois.forEach((poiItem, poiIndex) => {
    const detail = poiItem?.detail
    if (!detail) return
    const coord = extractPoiCoord(detail)
    if (!coord) return
    if (!isCoordInRouteCity(coord, routeData.value)) return

    const isScenic = poiItem.poi?.poiType === 'scenic'
    const orderLabel = isScenic ? `D${dayNo}-${poiOrder}` : ''
    const poiName = getPoiName(poiItem)
    const markerTitle = orderLabel ? `${orderLabel} ${poiName}` : poiName
    const markerAddress = String(detail.address || '').trim()
    const markerId = Number(poiItem?.poi?.id || dayNo * 1000 + poiIndex + 1)
    const isFood = poiItem.poi?.poiType === 'food'
    const calloutContent = markerAddress ? `${poiName}\n${markerAddress}` : poiName
    const meta = {
      title: poiName,
      address: markerAddress,
      typeLabel: isFood ? '美食' : '景点',
    }
    if (metaStore) {
      metaStore[markerId] = meta
    }

    const marker: any = {
      id: markerId,
      latitude: coord.latitude,
      longitude: coord.longitude,
      title: markerTitle,
      width: isFood ? 40 : 46,
      height: isFood ? 40 : 46,
      meta,
      callout: {
        content: calloutContent,
        color: '#333333',
        fontSize: 14,
        borderRadius: 8,
        bgColor: '#ffffff',
        padding: 10,
        display: 'BYCLICK',
        textAlign: 'center',
      },
      label: {
        content: isFood ? '餐' : String(poiOrder),
        color: '#ffffff',
        fontSize: 14,
        anchorX: -5,
        anchorY: -36,
        bgColor: isFood ? '#3BA272' : '#5D92B0',
        borderRadius: 12,
        padding: 4,
      },
      joinCluster: false,
    }
    const icon = isFood ? foodIcon : scenicIcon
    if (icon) marker.iconPath = icon

    markers.push(marker)
    dayCoordinates.push(coord)
    if (isScenic) poiOrder++
  })

  if (dayCoordinates.length > 1) {
    polylines.push({
      points: dayCoordinates,
      color: lineColor,
      width: 5,
      arrowLine: true,
      dottedLine: false,
      borderColor: '#FFFFFF',
      borderWidth: 2,
    })
  }

  return { markers, polylines, coords: dayCoordinates }
}

const getActiveMapId = () => (activeTab.value === 'map' ? 'route-full-map' : 'route-day-map')

const applyMapBuildResult = (result: MapBuildResult, mapId?: string) => {
  const targetMapId = mapId || getActiveMapId()
  hasMapPoints.value = result.coords.length > 0
  if (result.coords.length) {
    updateMapViewport(result.coords)
  }
  mapMarkers.value = [...result.markers]
  mapPolyline.value = [...result.polylines]
  if (result.coords.length) {
    if (targetMapId === 'route-full-map') {
      pendingMapFitCoords.value = [...result.coords]
    }
    fitMapBounds(result.coords, targetMapId)
  }
}

// 更新地图数据（根据选中的天数显示对应的路线）
const updateMapData = async () => {
  routeMapMode.value = 'day'
  activeMarkerCallout.value = null
  activeMarkerId.value = null
  const gen = ++mapUpdateGen
  const nextMeta: Record<number, { title: string; address?: string; typeLabel?: string }> = {}

  if (!routeData.value?.days?.length) {
    mapMarkers.value = []
    mapPolyline.value = []
    markerMetaMap.value = {}
    hasMapPoints.value = false
    return
  }

  const dayItem = routeData.value.days[selectedDayIndex.value]
  if (!dayItem) {
    mapMarkers.value = []
    mapPolyline.value = []
    markerMetaMap.value = {}
    hasMapPoints.value = false
    return
  }

  const intro = parseDayIntro(dayItem)
  if (!dayHasAiIntro(intro) && !(dayItem.pois?.length)) {
    mapMarkers.value = []
    mapPolyline.value = []
    markerMetaMap.value = {}
    hasMapPoints.value = false
    return
  }

  const dayNo = dayItem.day?.dayNo || selectedDayIndex.value + 1

  const result = await buildMapForDay(dayItem, dayNo, '#1F8F66', nextMeta)
  if (gen !== mapUpdateGen) return
  markerMetaMap.value = { ...nextMeta }
  applyMapBuildResult(result)

  Promise.all([createPoiMarkerIcon('scenic'), createPoiMarkerIcon('food')]).then(async ([scenicIcon, foodIcon]) => {
    if (gen !== mapUpdateGen) return
    const iconMeta: Record<number, { title: string; address?: string; typeLabel?: string }> = {}
    const withIcons = await buildMapForDay(dayItem, dayNo, '#1F8F66', iconMeta, scenicIcon, foodIcon)
    markerMetaMap.value = { ...iconMeta }
    applyMapBuildResult(withIcons)
  }).catch(() => {})
}

const updateFullMapData = async () => {
  routeMapMode.value = 'full'
  activeMarkerCallout.value = null
  activeMarkerId.value = null
  const gen = ++mapUpdateGen

  const days = routeData.value?.days || []
  if (!days.length) {
    mapMarkers.value = []
    mapPolyline.value = []
    markerMetaMap.value = {}
    hasMapPoints.value = false
    return
  }

  const buildFull = async (
    scenicIcon?: string,
    foodIcon?: string,
    metaStore?: Record<number, { title: string; address?: string; typeLabel?: string }>
  ): Promise<MapBuildResult> => {
    const markers: any[] = []
    const polylines: any[] = []
    const allCoords: Array<{ latitude: number; longitude: number }> = []

    for (let dayIdx = 0; dayIdx < days.length; dayIdx++) {
      const dayItem = days[dayIdx]
      const dayNo = Number(dayItem?.day?.dayNo || dayIdx + 1)
      const dayResult = await buildMapForDay(
        dayItem,
        dayNo,
        getDayLineColor(dayNo),
        metaStore,
        scenicIcon,
        foodIcon
      )
      markers.push(...dayResult.markers)
      polylines.push(...dayResult.polylines)
      allCoords.push(...dayResult.coords)
    }

    return { markers, polylines, coords: allCoords }
  }

  const nextMeta: Record<number, { title: string; address?: string; typeLabel?: string }> = {}
  const base = await buildFull(undefined, undefined, nextMeta)
  if (gen !== mapUpdateGen) return
  markerMetaMap.value = { ...nextMeta }
  pendingMapFitCoords.value = base.coords.length ? [...base.coords] : null
  applyMapBuildResult(base, 'route-full-map')

  Promise.all([createPoiMarkerIcon('scenic'), createPoiMarkerIcon('food')]).then(async ([scenicIcon, foodIcon]) => {
    if (gen !== mapUpdateGen) return
    const iconMeta: Record<number, { title: string; address?: string; typeLabel?: string }> = {}
    const withIcons = await buildFull(scenicIcon, foodIcon, iconMeta)
    markerMetaMap.value = { ...iconMeta }
    pendingMapFitCoords.value = withIcons.coords.length ? [...withIcons.coords] : null
    applyMapBuildResult(withIcons, 'route-full-map')
  }).catch(() => {})
}

// 格式化当天内容（按照时间段分组：上午、中午、下午、晚上）
const formatDayContent = (dayData: any) => {
  if (!dayData || !dayData.pois || dayData.pois.length === 0) return []
  const dayIntro = parseDayIntro(dayData)
  const poiNames = (dayData.pois || [])
    .map((p: any) => safeText(p?.detail?.name).trim())
    .filter((name: string) => !!name)

  // 按sort排序
  const sortedPois = [...dayData.pois].sort((a, b) => {
    const sortA = a.poi?.sort || 0
    const sortB = b.poi?.sort || 0
    return sortA - sortB
  })

  // 分离景点和美食
  const scenicPois = sortedPois.filter((p: any) => p.poi?.poiType === 'scenic')
  const foodPois = sortedPois.filter((p: any) => p.poi?.poiType === 'food')

  // 检查第一个景点是否游玩时间为"全天"
  const firstScenic = scenicPois[0]
  const isFullDay = firstScenic?.detail?.suggestedVisitTime && 
                    (firstScenic.detail.suggestedVisitTime.includes('全天') || 
                     firstScenic.detail.suggestedVisitTime.includes('一天'))
  
  // 注意：即使第一个景点是全天，也应该显示所有景点，不要只显示一个
  // 全天景点只是建议游玩时间，不应该影响其他景点的显示
  // 如果第一个景点是全天且只有一个景点，才使用简化显示
  if (isFullDay && scenicPois.length === 1) {
    const morningGroup: any = {
      timeLabel: '上午',
      description: dayIntro.morning,
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
    description: isNarrativeRelevant(dayIntro.morning, poiNames) ? dayIntro.morning : '',
    items: []
  }
  const noonGroup: any = {
    timeLabel: '中午',
    description: isNarrativeRelevant(dayIntro.noon, poiNames) ? dayIntro.noon : '',
    items: []
  }
  const afternoonGroup: any = {
    timeLabel: '下午',
    description: isNarrativeRelevant(dayIntro.afternoon, poiNames) ? dayIntro.afternoon : '',
    items: []
  }
  const eveningGroup: any = {
    timeLabel: '晚上',
    description: isNarrativeRelevant(dayIntro.evening, poiNames) ? dayIntro.evening : '',
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
  if (poiType === 'scenic') return '景'
  if (poiType === 'food') return '食'
  return '点'
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
  if (selectedDayIndex.value === dayIndex) {
    void updateMapData()
    return
  }
  selectedDayIndex.value = dayIndex
}

const showFullRouteMap = () => {
  routeMapMode.value = 'full'
  void updateFullMapData()
}

const showMapDay = (dayIndex: number) => {
  selectedDayIndex.value = dayIndex
  routeMapMode.value = 'day'
  void updateMapData()
}

// 查看完整地图
const viewFullMap = () => {
  activeTab.value = 'map'
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
    // 浏览量 +1（与列表点击进详情一致，其它入口打开详情也会计数）
    routeApi.recordView(routeId.value)
      .then(() => {
        // 本页立即同步展示（列表页会在 onShow 时刷新为后端真实值）
        const r: any = routeData.value?.route
        if (r) r.viewCount = Number(r.viewCount || 0) + 1
      })
      .catch(() => {})
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
  if (routeData.value && activeTab.value !== 'map') {
    void updateMapData()
  }
})

watch(activeTab, (tab) => {
  if (!routeData.value) return
  activeMarkerCallout.value = null
  activeMarkerId.value = null
  nextTick(async () => {
    mapRenderKey.value += 1
    await nextTick()
    if (tab === 'map') {
      await updateFullMapData()
    } else {
      await updateMapData()
    }
  })
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

/* 滚动内容（地图已移至 scroll-view 外） */
.scroll-content {
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

/* 地图区域（位于 scroll-view 外） */
.map-section--outer {
  margin-top: calc(80rpx + env(safe-area-inset-top));
  padding: 0 24rpx;
  box-sizing: border-box;
}

.map-section {
  width: 100%;
  margin-bottom: 24rpx;
  display: flex;
  justify-content: center;
  align-items: center;
}

.map-empty-overlay {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  z-index: 11;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(247, 248, 250, 0.88);
  pointer-events: none;
}

.map-empty-text {
  font-size: 24rpx;
  color: #647067;
  padding: 0 32rpx;
  text-align: center;
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

.map-route-summary {
  position: absolute;
  top: 16rpx;
  left: 16rpx;
  z-index: 10;
  max-width: 360rpx;
  padding: 12rpx 16rpx;
  background: rgba(255, 255, 255, 0.94);
  border-radius: 14rpx;
  box-shadow: 0 4rpx 14rpx rgba(0, 0, 0, 0.12);
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.map-summary-title {
  font-size: 24rpx;
  color: #1f2a24;
  font-weight: 700;
  line-height: 1.2;
}

.map-summary-desc {
  font-size: 20rpx;
  color: #647067;
  line-height: 1.3;
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

.map-marker-callout {
  position: absolute;
  left: 16rpx;
  right: 16rpx;
  bottom: 72rpx;
  background: rgba(255, 255, 255, 0.98);
  border-radius: 16rpx;
  padding: 18rpx 56rpx 18rpx 18rpx;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.14);
}

.map-marker-callout--full {
  bottom: 96rpx;
}

.map-marker-callout-title {
  font-size: 26rpx;
  color: #1f2a24;
  font-weight: 700;
  line-height: 1.4;
}

.map-marker-callout-address {
  font-size: 22rpx;
  color: #647067;
  line-height: 1.5;
  margin-top: 6rpx;
}

.map-marker-callout-type {
  font-size: 20rpx;
  color: #3ba272;
  font-weight: 600;
  margin-top: 6rpx;
}

.map-marker-callout-close {
  position: absolute;
  top: 10rpx;
  right: 14rpx;
  font-size: 34rpx;
  color: #999;
  line-height: 1;
  width: 40rpx;
  text-align: center;
}

.map-poi-panel {
  position: absolute;
  left: 20rpx;
  right: 20rpx;
  bottom: 96rpx;
  z-index: 14;
  max-height: 280rpx;
  background: rgba(255, 255, 255, 0.98);
  border-radius: 18rpx;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.14);
  padding: 14rpx 12rpx 10rpx;
}

.map-poi-panel-title {
  font-size: 22rpx;
  color: #333;
  font-weight: 600;
  margin-bottom: 8rpx;
  padding: 0 6rpx;
}

.map-poi-scroll {
  max-height: 220rpx;
}

.map-poi-item {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 12rpx 10rpx;
  border-radius: 12rpx;
}

.map-poi-item.active {
  background: #eef8f2;
}

.map-poi-item-index {
  width: 44rpx;
  height: 44rpx;
  border-radius: 22rpx;
  background: #3ba272;
  color: #fff;
  font-size: 20rpx;
  font-weight: 700;
  line-height: 44rpx;
  text-align: center;
  flex-shrink: 0;
}

.map-poi-item-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.map-poi-item-name {
  font-size: 24rpx;
  color: #1f2a24;
  font-weight: 600;
}

.map-poi-item-address {
  font-size: 20rpx;
  color: #647067;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.map-poi-item-type {
  font-size: 20rpx;
  color: #3ba272;
  flex-shrink: 0;
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

.day-narrative-card {
  background: #f7fbf9;
  border: 1rpx solid #e1f0e8;
  border-radius: 16rpx;
  padding: 18rpx 20rpx;
  margin-bottom: 20rpx;
}

.narrative-title {
  font-size: 24rpx;
  color: #3ba272;
  font-weight: 600;
  margin-bottom: 10rpx;
}

.narrative-block {
  margin-top: 8rpx;
}

.narrative-label {
  font-size: 24rpx;
  color: #333;
  font-weight: 600;
}

.narrative-text {
  font-size: 24rpx;
  color: #555;
  line-height: 1.6;
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

.time-description {
  background: #f7fbf9;
  border: 1rpx solid #e1f0e8;
  border-radius: 12rpx;
  padding: 14rpx 16rpx;
}

.time-description-text {
  font-size: 24rpx;
  color: #4f5b53;
  line-height: 1.6;
}

.ai-segment-title {
  font-size: 26rpx;
  font-weight: 600;
  color: #333;
  line-height: 1.5;
  margin-bottom: 12rpx;
}

.ai-segment-row {
  margin-bottom: 10rpx;
}

.ai-segment-row:last-child {
  margin-bottom: 0;
}

.ai-segment-text {
  font-size: 24rpx;
  color: #4f5b53;
  line-height: 1.65;
  display: block;
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

/* 全屏地图页 */
.map-full-page {
  display: flex;
  flex-direction: column;
  margin-top: calc(80rpx + env(safe-area-inset-top));
  padding: 0 24rpx 24rpx;
  padding-bottom: calc(24rpx + 120rpx + env(safe-area-inset-bottom));
  box-sizing: border-box;
  height: calc(100vh - 80rpx - env(safe-area-inset-top));
  min-height: 0;
}

.map-full-map-wrap {
  position: relative;
  flex: 1;
  min-height: 420rpx;
  border-radius: 24rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
}

.full-map {
  width: 100%;
  height: 100%;
}

.map-full-marker-info {
  flex-shrink: 0;
  margin-top: 16rpx;
  padding: 20rpx 24rpx;
  background: #ffffff;
  border-radius: 16rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
}

.map-full-marker-info-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16rpx;
}

.map-full-marker-info-title {
  flex: 1;
  font-size: 28rpx;
  color: #1f2a24;
  font-weight: 700;
  line-height: 1.4;
}

.map-full-marker-info-close {
  font-size: 36rpx;
  color: #999;
  line-height: 1;
}

.map-full-marker-info-type {
  display: block;
  margin-top: 8rpx;
  font-size: 22rpx;
  color: #3ba272;
  font-weight: 600;
}

.map-full-marker-info-address {
  display: block;
  margin-top: 8rpx;
  font-size: 24rpx;
  color: #647067;
  line-height: 1.5;
}

.map-full-toolbar {
  flex-shrink: 0;
  margin-top: 16rpx;
}

.map-full-legend {
  flex-shrink: 0;
  margin-top: 12rpx;
  padding: 14rpx 16rpx;
  background: #ffffff;
  border-radius: 16rpx;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.06);
}

.map-full-legend-title {
  font-size: 22rpx;
  color: #333;
  font-weight: 600;
  margin-bottom: 10rpx;
}

.map-full-legend-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx 20rpx;
}

.map-full-legend-item {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.map-full-legend-color {
  width: 24rpx;
  height: 8rpx;
  border-radius: 999rpx;
}

.map-full-legend-text {
  font-size: 22rpx;
  color: #555;
}

.map-full-poi-panel {
  flex-shrink: 0;
  margin-top: 12rpx;
  padding: 14rpx 12rpx 10rpx;
  background: #ffffff;
  border-radius: 16rpx;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.06);
  max-height: 240rpx;
}

.map-full-poi-panel-title {
  font-size: 22rpx;
  color: #333;
  font-weight: 600;
  margin-bottom: 8rpx;
  padding: 0 6rpx;
}

.map-full-poi-scroll {
  max-height: 180rpx;
}

.map-full-poi-item {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 12rpx 8rpx;
  border-radius: 12rpx;
}

.map-full-poi-item.active {
  background: #eef8f2;
}

.map-full-poi-item-index {
  min-width: 40rpx;
  height: 40rpx;
  border-radius: 20rpx;
  background: #5d92b0;
  color: #ffffff;
  font-size: 20rpx;
  font-weight: 600;
  line-height: 40rpx;
  text-align: center;
}

.map-full-poi-item-body {
  flex: 1;
  min-width: 0;
}

.map-full-poi-item-name {
  display: block;
  font-size: 24rpx;
  color: #1f2a24;
  font-weight: 600;
  line-height: 1.4;
}

.map-full-poi-item-address {
  display: block;
  margin-top: 4rpx;
  font-size: 20rpx;
  color: #647067;
  line-height: 1.4;
}

.map-full-poi-item-type {
  flex-shrink: 0;
  font-size: 20rpx;
  color: #3ba272;
  font-weight: 600;
}

.map-chip-scroll {
  width: 100%;
  white-space: nowrap;
}

.map-chip-list {
  display: flex;
  flex-direction: row;
  gap: 12rpx;
  padding: 4rpx 0;
}

.map-chip {
  flex-shrink: 0;
  min-width: 96rpx;
  height: 56rpx;
  padding: 0 20rpx;
  border-radius: 28rpx;
  background: rgba(255, 255, 255, 0.94);
  color: #425047;
  font-size: 24rpx;
  font-weight: 600;
  line-height: 56rpx;
  text-align: center;
  box-shadow: 0 4rpx 14rpx rgba(0, 0, 0, 0.12);
}

.map-chip.active {
  background: #3ba272;
  color: #ffffff;
}

.map-legend-panel {
  position: absolute;
  left: 20rpx;
  top: 20rpx;
  z-index: 12;
  background: rgba(255, 255, 255, 0.94);
  border-radius: 16rpx;
  padding: 14rpx 16rpx;
  box-shadow: 0 6rpx 18rpx rgba(0, 0, 0, 0.12);
}

.map-legend-title {
  font-size: 22rpx;
  color: #333;
  font-weight: 600;
  margin-bottom: 10rpx;
}

.map-legend-list {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.map-legend-item {
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.map-legend-color {
  width: 24rpx;
  height: 8rpx;
  border-radius: 999rpx;
}

.map-legend-text {
  font-size: 22rpx;
  color: #555;
  line-height: 1;
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
