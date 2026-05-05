<template>
  <view class="footprint-page">
    <view class="header-bar">
      <view class="back-btn" @click="goBack">
        <text class="iconfont icon-arrow-left">‹</text>
      </view>
      <view class="title-section">
        <text v-if="currentCity" class="current-city">
          <text class="iconfont icon-weizhi"></text> {{ currentCity }}
        </text>
        <text v-else class="current-city muted">定位中或未授权</text>
      </view>
      <view class="placeholder"></view>
    </view>

    <view class="map-container">
      <!-- #ifdef MP-WEIXIN -->
      <view class="map-wrapper">
        <map
          id="footprintMap"
          class="china-map"
          provider="amap"
          :latitude="mapCenter.latitude"
          :longitude="mapCenter.longitude"
          :scale="mapScale"
          :min-scale="3"
          :max-scale="18"
          :markers="mapMarkers"
          :polygons="mapPolygons"
          :show-location="showLocationDot"
          :enable-zoom="true"
          :enable-scroll="true"
          :enable-rotate="false"
          :show-compass="false"
          :enable-overlooking="false"
          :enable-3d="false"
          :enable-satellite="false"
          :enable-traffic="false"
          @markertap="onMarkerTap"
          @regionchange="onRegionChange"
        />
        <view class="map-fab-col">
          <view class="map-fab map-fab--primary" @click="fitFootprintBounds">
            <text class="map-fab-text map-fab-text--light">全览</text>
          </view>
          <view class="map-fab map-fab--secondary" @click="recenterOnMe">
            <text class="map-fab-text">定位</text>
          </view>
        </view>
      </view>
      <!-- #endif -->
      <!-- #ifndef MP-WEIXIN -->
      <view class="map-wrapper">
        <map
          id="footprintMap"
          class="china-map"
          provider="amap"
          :latitude="mapCenter.latitude"
          :longitude="mapCenter.longitude"
          :scale="mapScale"
          :markers="mapMarkers"
          :polygons="mapPolygons"
          :show-location="showLocationDot"
          :enable-zoom="true"
          :enable-scroll="true"
          @markertap="onMarkerTap"
          @regionchange="onRegionChange"
        />
        <view class="map-fab-col">
          <view class="map-fab map-fab--primary" @click="fitFootprintBounds">
            <text class="map-fab-text map-fab-text--light">全览</text>
          </view>
          <view class="map-fab map-fab--secondary" @click="recenterOnMe">
            <text class="map-fab-text">定位</text>
          </view>
        </view>
      </view>
      <!-- #endif -->
    </view>

    <!-- 气泡：点击标记后展示（部分机型 markertap 已带 callout，此为补充） -->
    <view v-if="activeCallout" class="callout-panel soft-shadow">
      <text class="callout-text">{{ activeCallout }}</text>
      <text class="callout-close" @click="activeCallout = ''">×</text>
    </view>

    <view class="stats-bar">
      <view class="stat-item">
        <text class="stat-value" :class="{ 'stat-value--muted': !stats.provinces }">{{ stats.provinces || 0 }}</text>
        <text class="stat-label">省份</text>
      </view>
      <view class="stat-divider"></view>
      <view class="stat-item">
        <text class="stat-value" :class="{ 'stat-value--muted': !stats.cities }">{{ stats.cities || 0 }}</text>
        <text class="stat-label">城市</text>
      </view>
      <view class="stat-divider"></view>
      <view class="stat-item">
        <text class="stat-value" :class="{ 'stat-value--muted': !stats.attractions }">{{ stats.attractions || 0 }}</text>
        <text class="stat-label">景点</text>
      </view>
      <view class="stat-divider"></view>
      <view class="stat-item">
        <text class="stat-value" :class="{ 'stat-value--muted': !stats.foods }">{{ stats.foods || 0 }}</text>
        <text class="stat-label">美食</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, getCurrentInstance } from 'vue'
import { onShow, onPullDownRefresh } from '@dcloudio/uni-app'
import { checkinApi } from '@/api/content'
import { useUserStore } from '@/store/user'
import { fetchDistrictRings } from '@/utils/amapDistrict'

const store = useUserStore()
const user = computed(() => store.state.profile)
const mapPageProxy = getCurrentInstance()?.proxy

const stats = ref({
  provinces: 0,
  cities: 0,
  attractions: 0,
  foods: 0,
})

const checkinData = ref<
  Array<{
    id: number
    targetType: string
    targetId: number
    cityName?: string
    provinceName?: string
    targetName?: string
    latitude?: number
    longitude?: number
  }>
>([])

const checkedProvinces = ref<Set<string>>(new Set())
const checkedCities = ref<Set<string>>(new Set())
/** 已到达的省级行政区全称关键词（与高德 district 查询一致，如「广东省」） */
const visitedProvinceKeywords = ref<Set<string>>(new Set())

const cityCoordinates: Record<string, { latitude: number; longitude: number }> = {
  北京: { latitude: 39.9042, longitude: 116.4074 },
  上海: { latitude: 31.2304, longitude: 121.4737 },
  广州: { latitude: 23.1291, longitude: 113.2644 },
  深圳: { latitude: 22.5431, longitude: 114.0579 },
  杭州: { latitude: 30.2741, longitude: 120.1551 },
  南京: { latitude: 32.0603, longitude: 118.7969 },
  成都: { latitude: 30.6624, longitude: 104.0633 },
  重庆: { latitude: 29.563, longitude: 106.5516 },
  西安: { latitude: 34.3416, longitude: 108.9398 },
  武汉: { latitude: 30.5928, longitude: 114.3055 },
  天津: { latitude: 39.3434, longitude: 117.3616 },
  苏州: { latitude: 31.2989, longitude: 120.5853 },
  长沙: { latitude: 28.2278, longitude: 112.9388 },
  郑州: { latitude: 34.7466, longitude: 113.6254 },
  济南: { latitude: 36.6512, longitude: 117.1201 },
  青岛: { latitude: 36.0671, longitude: 120.3826 },
  厦门: { latitude: 24.4798, longitude: 118.0819 },
  福州: { latitude: 26.0745, longitude: 119.2965 },
  昆明: { latitude: 25.0389, longitude: 102.7183 },
  合肥: { latitude: 31.8206, longitude: 117.2272 },
  南昌: { latitude: 28.682, longitude: 115.8579 },
}

const provinceNameMap: Record<string, string> = {
  北京市: '北京',
  天津市: '天津',
  河北省: '河北',
  山西省: '山西',
  内蒙古自治区: '内蒙古',
  辽宁省: '辽宁',
  吉林省: '吉林',
  黑龙江省: '黑龙江',
  上海市: '上海',
  江苏省: '江苏',
  浙江省: '浙江',
  安徽省: '安徽',
  福建省: '福建',
  江西省: '江西',
  山东省: '山东',
  河南省: '河南',
  湖北省: '湖北',
  湖南省: '湖南',
  广东省: '广东',
  广西壮族自治区: '广西',
  海南省: '海南',
  重庆市: '重庆',
  四川省: '四川',
  贵州省: '贵州',
  云南省: '云南',
  西藏自治区: '西藏',
  陕西省: '陕西',
  甘肃省: '甘肃',
  青海省: '青海',
  宁夏回族自治区: '宁夏',
  新疆维吾尔自治区: '新疆',
  台湾省: '台湾',
  香港特别行政区: '香港',
  澳门特别行政区: '澳门',
}

/** 省级行政区查询关键词（高德行政区域查询） */
const CHINA_PROVINCE_KEYWORDS = [
  '北京市',
  '天津市',
  '河北省',
  '山西省',
  '内蒙古自治区',
  '辽宁省',
  '吉林省',
  '黑龙江省',
  '上海市',
  '江苏省',
  '浙江省',
  '安徽省',
  '福建省',
  '江西省',
  '山东省',
  '河南省',
  '湖北省',
  '湖南省',
  '广东省',
  '广西壮族自治区',
  '海南省',
  '重庆市',
  '四川省',
  '贵州省',
  '云南省',
  '西藏自治区',
  '陕西省',
  '甘肃省',
  '青海省',
  '宁夏回族自治区',
  '新疆维吾尔自治区',
]

/** 短省名 → 高德查询用全称（如 广东 → 广东省） */
const shortProvinceToSearchKeyword = (short: string): string | null => {
  if (!short) return null
  const row = Object.entries(provinceNameMap).find(([, v]) => v === short)
  if (row) return row[0]
  if (short.endsWith('省') || short.endsWith('市') || short.endsWith('自治区')) return short
  if (short === '内蒙古') return '内蒙古自治区'
  if (short === '广西') return '广西壮族自治区'
  if (short === '宁夏') return '宁夏回族自治区'
  if (short === '新疆') return '新疆维吾尔自治区'
  if (short === '香港') return '香港特别行政区'
  if (short === '澳门') return '澳门特别行政区'
  return `${short}省`
}

const currentCity = ref('')
const mapCenter = ref({ latitude: 35.0, longitude: 104.0 })
const mapScale = ref(10)
const showLocationDot = ref(false)
const mapMarkers = ref<any[]>([])
const mapPolygons = ref<any[]>([])
const activeCallout = ref('')
let polygonLoadGen = 0

let markerIdSeq = 10001

const normalizeCityName = (cityName: string): string => {
  if (!cityName) return ''
  return cityName
    .replace(/市|省|自治区|特别行政区|壮族自治区|回族自治区|维吾尔自治区|地区|县|区/g, '')
    .trim()
}

const findCityCoordinates = (cityName: string): { latitude: number; longitude: number } | null => {
  if (!cityName) return null
  if (cityCoordinates[cityName]) return cityCoordinates[cityName]
  const normalized = normalizeCityName(cityName)
  if (normalized && cityCoordinates[normalized]) return cityCoordinates[normalized]
  for (const key in cityCoordinates) {
    if (key.includes(normalized) || normalized.includes(key)) {
      return cityCoordinates[key]
    }
  }
  return null
}

const goBack = () => {
  uni.navigateBack()
}

const onRegionChange = () => {}

/** 根据打卡点粗略调整视野（非微信端无 includePoints 时使用） */
const fitBoundsFromMarkers = () => {
  const pts = mapMarkers.value
  if (!pts.length) return
  let minLat = 90
  let maxLat = -90
  let minLng = 180
  let maxLng = -180
  for (const p of pts) {
    minLat = Math.min(minLat, p.latitude)
    maxLat = Math.max(maxLat, p.latitude)
    minLng = Math.min(minLng, p.longitude)
    maxLng = Math.max(maxLng, p.longitude)
  }
  mapCenter.value = {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
  }
  const latSpan = Math.max(0.12, maxLat - minLat)
  const lngSpan = Math.max(0.12, maxLng - minLng)
  const span = Math.max(latSpan, lngSpan * 0.85)
  let scale = 13
  if (span > 10) scale = 4
  else if (span > 6) scale = 5
  else if (span > 3) scale = 6
  else if (span > 1.5) scale = 7
  else if (span > 0.8) scale = 9
  else if (span > 0.35) scale = 11
  else if (span > 0.15) scale = 12
  mapScale.value = scale
}

const fitFootprintBounds = () => {
  const pts = mapMarkers.value
  if (!pts.length) {
    uni.showToast({ title: '暂无城市打卡点', icon: 'none' })
    return
  }
  // #ifdef MP-WEIXIN
  if (mapPageProxy) {
    try {
      const ctx = uni.createMapContext('footprintMap', mapPageProxy as any)
      ctx.includePoints?.({
        points: pts.map((p) => ({
          latitude: p.latitude,
          longitude: p.longitude,
        })),
        padding: [80, 80, 120, 80],
      })
      return
    } catch {
      /* empty */
    }
  }
  // #endif
  fitBoundsFromMarkers()
}

const recenterOnMe = () => {
  showLocationDot.value = true
  getUserLocation()
}

const onMarkerTap = (e: any) => {
  const mid = e?.detail?.markerId
  const m = mapMarkers.value.find((x) => x.id === mid || String(x.id) === String(mid))
  if (m?.callout?.content) {
    activeCallout.value = m.callout.content
  }
}

const formatCityCalloutLabel = (displayCity: string) => {
  if (!displayCity) return '目的地'
  if (displayCity.endsWith('市') || displayCity.endsWith('州') || displayCity.endsWith('县')) {
    return displayCity
  }
  return `${displayCity}市`
}

/** 请求定位权限并显示蓝点 */
const initLocation = () => {
  // #ifdef MP-WEIXIN
  uni.authorize({
    scope: 'scope.userLocation',
    success: () => {
      showLocationDot.value = true
      getUserLocation()
    },
    fail: () => {
      uni.showModal({
        title: '需要位置权限',
        content: '展示附近足迹与地图定位需要开启位置权限，可在设置中打开。',
        confirmText: '去设置',
        success: (r) => {
          if (r.confirm) {
            uni.openSetting({})
          }
        },
      })
      showLocationDot.value = false
    },
  })
  // #endif
  // #ifndef MP-WEIXIN
  showLocationDot.value = true
  getUserLocation()
  // #endif
}

const getUserLocation = () => {
  uni.getLocation({
    type: 'gcj02',
    geocode: true,
    success: (res) => {
      let cityName = ''
      if (res.address?.city) {
        cityName = res.address.city.replace(/市$/, '')
      } else if (res.address?.province) {
        cityName = res.address.province.replace(/省$/, '')
      }
      if (!cityName) {
        const keys = Object.keys(cityCoordinates)
        let best = ''
        let d = Infinity
        for (const k of keys) {
          const c = cityCoordinates[k]
          const dist =
            (c.latitude - res.latitude) * (c.latitude - res.latitude) +
            (c.longitude - res.longitude) * (c.longitude - res.longitude)
          if (dist < d) {
            d = dist
            best = k
          }
        }
        cityName = best
      }
      currentCity.value = cityName
      mapCenter.value = { latitude: res.latitude, longitude: res.longitude }
      mapScale.value = 11
    },
    fail: () => {
      uni.showToast({ title: '获取位置失败，可手动缩放地图查看', icon: 'none' })
      mapCenter.value = { latitude: 35.0, longitude: 104.0 }
      mapScale.value = 5
    },
  })
}

/** 城市打卡次数 → 地图标记（薄荷系图标用默认 marker + callout） */
const buildCityMarkers = () => {
  const cityMap = new Map<
    string,
    {
      displayCity: string
      count: number
      lat: number
      lng: number
    }
  >()

  checkinData.value.forEach((item: any) => {
    const cityName = item.cityName || item.city
    let lat = item.latitude
    let lng = item.longitude
    if (lat && typeof lat === 'object') lat = parseFloat(String(lat))
    if (lng && typeof lng === 'object') lng = parseFloat(String(lng))
    let coords: { latitude: number; longitude: number } | null = null
    if (lat != null && lng != null) {
      const la = Number(lat)
      const ln = Number(lng)
      if (!Number.isNaN(la) && !Number.isNaN(ln) && la >= 18 && la <= 54 && ln >= 73 && ln <= 135) {
        coords = { latitude: la, longitude: ln }
      }
    }
    if (!coords && cityName) {
      const f = findCityCoordinates(cityName)
      if (f) coords = f
    }
    if (!coords) return
    const displayCity = normalizeCityName(cityName || '') || '目的地'
    const key = `${displayCity}_${coords.latitude}_${coords.longitude}`
    const exist = cityMap.get(key)
    if (exist) exist.count += 1
    else
      cityMap.set(key, {
        displayCity,
        count: 1,
        lat: coords.latitude,
        lng: coords.longitude,
      })
  })

  const scenicCountByCity = (cityDisplay: string) =>
    checkinData.value.filter(
      (x: any) =>
        normalizeCityName(x.cityName || x.city || '') === cityDisplay && x.targetType === 'scenic',
    ).length

  const foodCountByCity = (cityDisplay: string) =>
    checkinData.value.filter(
      (x: any) =>
        normalizeCityName(x.cityName || x.city || '') === cityDisplay && x.targetType === 'food',
    ).length

  mapMarkers.value = []
  cityMap.forEach((data) => {
    const sid = markerIdSeq++
    const scenicN = scenicCountByCity(data.displayCity)
    const foodN = foodCountByCity(data.displayCity)
    const line = `已到达${formatCityCalloutLabel(data.displayCity)}，景点${scenicN}个 · 美食${foodN}个`
    mapMarkers.value.push({
      id: sid,
      latitude: data.lat,
      longitude: data.lng,
      title: data.displayCity,
      width: 28,
      height: 28,
      anchor: { x: 0.5, y: 1 },
      callout: {
        content: line,
        color: '#2d3f39',
        fontSize: 13,
        borderRadius: 10,
        bgColor: '#e8f5f1',
        padding: 10,
        display: 'BYCLICK',
        textAlign: 'center',
      },
    })
  })
}

const MINT_FILL = '#7fc4b199'
const MINT_STROKE = '#1a6b4a'
const GRAY_FILL = '#d8dedc99'
const GRAY_STROKE = '#b0b8b5'

const POLYGON_FETCH_BATCH = 6

/** 拉取省级多边形：已到达=薄荷绿，未到达=浅灰（高德；支持多块边界；仅最后一次刷新生效） */
const loadProvincePolygons = async () => {
  const gen = ++polygonLoadGen
  const visited = visitedProvinceKeywords.value
  const grayPolys: any[] = []
  const mintPolys: any[] = []
  const kws = [...CHINA_PROVINCE_KEYWORDS]

  for (let i = 0; i < kws.length; i += POLYGON_FETCH_BATCH) {
    if (gen !== polygonLoadGen) return
    const chunk = kws.slice(i, i + POLYGON_FETCH_BATCH)
    const chunkResults = await Promise.all(
      chunk.map(async (keyword) => {
        const isVisited = visited.has(keyword)
        const rings = (await fetchDistrictRings(keyword)) || []
        return { isVisited, rings }
      }),
    )
    for (const { isVisited, rings } of chunkResults) {
      for (const pts of rings) {
        if (pts.length < 3) continue
        const poly = {
          points: pts,
          strokeWidth: isVisited ? 2 : 1,
          strokeColor: isVisited ? MINT_STROKE : GRAY_STROKE,
          fillColor: isVisited ? MINT_FILL : GRAY_FILL,
        }
        if (isVisited) mintPolys.push(poly)
        else grayPolys.push(poly)
      }
    }
  }

  if (gen === polygonLoadGen) {
    mapPolygons.value = [...grayPolys, ...mintPolys]
  }
}

const applyFootprintFromList = (list: any[]) => {
  checkinData.value = list
  const provinceSet = new Set<string>()
  const citySet = new Set<string>()
  const provinceKw = new Set<string>()
  let attractionCount = 0
  let foodCount = 0

  list.forEach((item: any) => {
    if (item.targetType === 'scenic') attractionCount++
    else if (item.targetType === 'food') foodCount++

    let provinceName = item.provinceName || item.province
    let cityName = item.cityName || item.city
    if (provinceName) {
      const fullKw =
        provinceNameMap[provinceName] !== undefined
          ? provinceName
          : shortProvinceToSearchKeyword(
              provinceName.replace(
                /省|市|自治区|特别行政区|壮族自治区|回族自治区|维吾尔自治区/g,
                '',
              ) || provinceName,
            )
      const short = provinceNameMap[provinceName] || provinceName
      const cleaned = short.replace(
        /省|市|自治区|特别行政区|壮族自治区|回族自治区|维吾尔自治区/g,
        '',
      )
      if (cleaned) provinceSet.add(cleaned)
      if (fullKw) provinceKw.add(fullKw)
    }
    if (cityName) {
      const nc = normalizeCityName(cityName)
      if (nc) citySet.add(nc)
    }
  })

  checkedProvinces.value = provinceSet
  checkedCities.value = citySet
  visitedProvinceKeywords.value = provinceKw

  stats.value = {
    provinces: provinceSet.size,
    cities: citySet.size,
    attractions: attractionCount,
    foods: foodCount,
  }

  buildCityMarkers()
  loadProvincePolygons()
}

const loadCheckinData = async () => {
  if (!user.value?.id) return
  try {
    const res = await checkinApi.getMyCheckins(user.value.id, 1, 1000)
    if (res.statusCode === 200 && res.data.code === 200) {
      const data = res.data.data || {}
      const list = data.list || []
      applyFootprintFromList(list)
      return
    }
  } catch {
    /* empty */
  }
  applyFootprintFromList([
    {
      id: 1,
      targetId: 1,
      cityName: '北京',
      provinceName: '北京市',
      targetType: 'scenic',
      latitude: 39.9042,
      longitude: 116.4074,
    },
    {
      id: 2,
      targetId: 2,
      cityName: '上海',
      provinceName: '上海市',
      targetType: 'scenic',
      latitude: 31.2304,
      longitude: 121.4737,
    },
  ])
}

watch(
  () => user.value?.id,
  (id) => {
    if (id) void loadCheckinData()
  },
)

onMounted(() => {
  initLocation()
  if (user.value?.id) {
    void loadCheckinData()
  } else {
    uni.showToast({ title: '登录后同步足迹', icon: 'none' })
    visitedProvinceKeywords.value = new Set()
    buildCityMarkers()
    void loadProvincePolygons()
  }
})

/** 从系统设置返回后：若已授权则打开蓝点并重拉定位；同步足迹数据 */
onShow(() => {
  uni.getSetting({
    success: (res) => {
      if (res.authSetting['scope.userLocation']) {
        showLocationDot.value = true
        getUserLocation()
      }
    },
  })
  if (user.value?.id) {
    void loadCheckinData()
  }
})

onPullDownRefresh(async () => {
  initLocation()
  if (user.value?.id) {
    await loadCheckinData()
  }
  uni.stopPullDownRefresh()
})
</script>

<style scoped>
.footprint-page {
  width: 100%;
  height: 100vh;
  max-height: 100vh;
  background: linear-gradient(180deg, #f2f7f5 0%, #ffffff 100%);
  display: flex;
  flex-direction: column;
  padding-bottom: env(safe-area-inset-bottom);
  overflow: hidden;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.header-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 30rpx;
  padding-top: calc(44rpx + env(safe-area-inset-top));
  background: #fff;
  box-shadow: 0 2rpx 8rpx rgba(45, 80, 70, 0.06);
  position: sticky;
  top: 0;
  z-index: 100;
  min-height: 88rpx;
}

.back-btn {
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48rpx;
  color: #333;
  font-weight: bold;
}

.title-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.current-city {
  font-size: 24rpx;
  color: #3d5a50;
  line-height: 1;
}

.current-city.muted {
  color: #9aa9a3;
}

.placeholder {
  width: 60rpx;
}

.map-container {
  flex: 1;
  display: flex;
  align-items: stretch;
  justify-content: center;
  padding: 20rpx;
  overflow: hidden;
  position: relative;
  min-height: 0;
  height: 0;
}

.map-wrapper {
  width: 100%;
  height: 100%;
  flex: 1;
  min-height: 500rpx;
  border-radius: 24rpx;
  overflow: hidden;
  box-shadow: 0 8rpx 24rpx rgba(45, 80, 70, 0.08);
  background: #eef4f1;
  position: relative;
}

.china-map {
  width: 100%;
  height: 100%;
}

.map-fab-col {
  position: absolute;
  right: 20rpx;
  bottom: 28rpx;
  z-index: 30;
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  pointer-events: box-none;
}

.map-fab {
  padding: 14rpx 24rpx;
  border-radius: 999rpx;
  box-shadow: 0 6rpx 18rpx rgba(45, 80, 70, 0.18);
  display: flex;
  align-items: center;
  justify-content: center;
}

.map-fab--primary {
  background: #3ba272;
}

.map-fab--secondary {
  background: #ffffff;
  border: 1rpx solid #c5ddd4;
}

.map-fab-text {
  font-size: 24rpx;
  font-weight: 600;
  color: #3d5a50;
  line-height: 1;
}

.map-fab-text--light {
  color: #ffffff;
}

.callout-panel {
  position: fixed;
  left: 32rpx;
  right: 32rpx;
  bottom: 200rpx;
  z-index: 200;
  background: #ffffff;
  border-radius: 20rpx;
  padding: 20rpx 48rpx 20rpx 24rpx;
  display: flex;
  align-items: flex-start;
  gap: 16rpx;
  border: 1rpx solid #d5ebe3;
}

.callout-text {
  flex: 1;
  font-size: 26rpx;
  color: #344843;
  line-height: 1.5;
}

.callout-close {
  position: absolute;
  right: 16rpx;
  top: 12rpx;
  font-size: 36rpx;
  color: #9aa9a3;
  padding: 8rpx;
}

.soft-shadow {
  box-shadow: 0 8rpx 28rpx rgba(45, 80, 70, 0.12);
}

.stats-bar {
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 28rpx 32rpx;
  padding-bottom: calc(28rpx + env(safe-area-inset-bottom));
  background: #fff;
  box-shadow: 0 -4rpx 16rpx rgba(45, 80, 70, 0.06);
  position: sticky;
  bottom: 0;
  z-index: 100;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
  flex: 1;
}

.stat-value {
  font-size: 40rpx;
  font-weight: 700;
  color: #3ba272;
  line-height: 1;
}

.stat-value--muted {
  color: #c5ddd4;
}

.stat-label {
  font-size: 24rpx;
  color: #7a9088;
  line-height: 1;
}

.stat-divider {
  width: 1rpx;
  height: 60rpx;
  background: #e5ebe8;
  margin: 0 12rpx;
}
</style>
