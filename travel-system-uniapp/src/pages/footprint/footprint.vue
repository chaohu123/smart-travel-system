<template>
  <view class="footprint-page">
    <!-- 顶部导航栏 -->
    <view class="header-bar">
      <view class="back-btn" @click="goBack">
        <text class="iconfont icon-arrow-left">‹</text>
      </view>
      <view class="title-section">
        <text v-if="currentCity" class="current-city">📍 {{ currentCity }}</text>
      </view>
      <view class="placeholder"></view>
    </view>

    <!-- 地图区域 -->
    <view class="map-container">
      <!-- 隐藏的 canvas 用于生成蓝色圆点图标 -->
      <canvas
        canvas-id="blue-circle-canvas"
        id="blue-circle-canvas"
        style="position: fixed; left: -9999px; width: 30px; height: 30px;"
      ></canvas>
      
      <view class="map-wrapper">
        <!-- 使用高德地图 -->
        <map
          class="china-map"
          :latitude="mapCenter.latitude"
          :longitude="mapCenter.longitude"
          :scale="mapScale"
          :min-scale="3"
          :max-scale="18"
          :markers="userLocationMarker"
          :circles="mapCircles"
          :polygons="mapPolygons"
          :show-location="false"
          :enable-zoom="true"
          :enable-scroll="true"
          :enable-rotate="false"
          :show-compass="false"
          :enable-overlooking="false"
          :enable-3D="false"
          :enable-satellite="false"
          :enable-traffic="false"
          provider="amap"
          @regionchange="onRegionChange"
          @tap="onMapTap"
          @updated="onMapUpdated"
        >
        </map>
      </view>
    </view>

    <!-- 底部统计信息 -->
    <view class="stats-bar">
      <view class="stat-item">
        <text class="stat-value">{{ stats.provinces || 0 }}</text>
        <text class="stat-label">省份</text>
      </view>
      <view class="stat-divider"></view>
      <view class="stat-item">
        <text class="stat-value">{{ stats.cities || 0 }}</text>
        <text class="stat-label">城市</text>
      </view>
      <view class="stat-divider"></view>
      <view class="stat-item">
        <text class="stat-value">{{ stats.attractions || 0 }}</text>
        <text class="stat-label">景点</text>
      </view>
      <view class="stat-divider"></view>
      <view class="stat-item">
        <text class="stat-value">{{ stats.foods || 0 }}</text>
        <text class="stat-label">美食</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { checkinApi } from '@/api/content'
import { useUserStore } from '@/store/user'

const store = useUserStore()
const user = computed(() => store.state.profile)

// 统计数据
const stats = ref({
  provinces: 0,
  cities: 0,
  attractions: 0,
  foods: 0,
})

// 打卡数据
const checkinData = ref<Array<{
  id: number
  targetType: string
  targetId: number
  cityName?: string
  provinceName?: string
  targetName?: string
  latitude?: number
  longitude?: number
}>>([])

// 已打卡的省份和城市
const checkedProvinces = ref<Set<string>>(new Set())
const checkedCities = ref<Set<string>>(new Set())

// 城市坐标数据（主要城市经纬度）
const cityCoordinates: Record<string, { latitude: number; longitude: number }> = {
  '北京': { latitude: 39.9042, longitude: 116.4074 },
  '上海': { latitude: 31.2304, longitude: 121.4737 },
  '广州': { latitude: 23.1291, longitude: 113.2644 },
  '深圳': { latitude: 22.5431, longitude: 114.0579 },
  '杭州': { latitude: 30.2741, longitude: 120.1551 },
  '南京': { latitude: 32.0603, longitude: 118.7969 },
  '成都': { latitude: 30.6624, longitude: 104.0633 },
  '重庆': { latitude: 29.5630, longitude: 106.5516 },
  '西安': { latitude: 34.3416, longitude: 108.9398 },
  '武汉': { latitude: 30.5928, longitude: 114.3055 },
  '天津': { latitude: 39.3434, longitude: 117.3616 },
  '苏州': { latitude: 31.2989, longitude: 120.5853 },
  '长沙': { latitude: 28.2278, longitude: 112.9388 },
  '郑州': { latitude: 34.7466, longitude: 113.6254 },
  '济南': { latitude: 36.6512, longitude: 117.1201 },
  '青岛': { latitude: 36.0671, longitude: 120.3826 },
  '大连': { latitude: 38.9140, longitude: 121.6147 },
  '厦门': { latitude: 24.4798, longitude: 118.0819 },
  '福州': { latitude: 26.0745, longitude: 119.2965 },
  '昆明': { latitude: 25.0389, longitude: 102.7183 },
  '贵阳': { latitude: 26.6470, longitude: 106.6302 },
  '南宁': { latitude: 22.8170, longitude: 108.3669 },
  '海口': { latitude: 20.0444, longitude: 110.1999 },
  '三亚': { latitude: 18.2479, longitude: 109.5027 },
  '哈尔滨': { latitude: 45.7731, longitude: 126.6167 },
  '长春': { latitude: 43.8171, longitude: 125.3235 },
  '沈阳': { latitude: 41.8057, longitude: 123.4315 },
  '石家庄': { latitude: 38.0428, longitude: 114.5149 },
  '太原': { latitude: 37.8706, longitude: 112.5489 },
  '呼和浩特': { latitude: 40.8414, longitude: 111.7519 },
  '乌鲁木齐': { latitude: 43.8256, longitude: 87.6168 },
  '拉萨': { latitude: 29.6626, longitude: 91.1149 },
  '西宁': { latitude: 36.6171, longitude: 101.7782 },
  '银川': { latitude: 38.4872, longitude: 106.2309 },
  '兰州': { latitude: 36.0611, longitude: 103.8343 },
  '合肥': { latitude: 31.8206, longitude: 117.2272 },
  '南昌': { latitude: 28.6820, longitude: 115.8579 },
  '洛阳': { latitude: 34.6197, longitude: 112.4540 },
  '开封': { latitude: 34.7971, longitude: 114.3074 },
  '桂林': { latitude: 25.2345, longitude: 110.1999 },
  '丽江': { latitude: 26.8550, longitude: 100.2277 },
  '大理': { latitude: 25.6065, longitude: 100.2676 },
  '张家界': { latitude: 29.1171, longitude: 110.4792 },
  '黄山': { latitude: 30.1329, longitude: 118.1689 },
  '九寨沟': { latitude: 33.2600, longitude: 103.9140 },
  '敦煌': { latitude: 40.1411, longitude: 94.6619 },
  '承德': { latitude: 40.9516, longitude: 117.9634 },
  '秦皇岛': { latitude: 39.9354, longitude: 119.6005 },
  '烟台': { latitude: 37.4638, longitude: 121.4479 },
  '威海': { latitude: 37.5133, longitude: 122.1204 },
  '宁波': { latitude: 29.8683, longitude: 121.5440 },
  '温州': { latitude: 28.0006, longitude: 120.6994 },
  '无锡': { latitude: 31.4912, longitude: 120.3124 },
  '扬州': { latitude: 32.3932, longitude: 119.4129 },
  '镇江': { latitude: 32.1877, longitude: 119.4528 },
  '嘉兴': { latitude: 30.7522, longitude: 120.7555 },
  '绍兴': { latitude: 30.0303, longitude: 120.5820 },
  '湖州': { latitude: 30.8930, longitude: 120.0868 },
  '台州': { latitude: 28.6564, longitude: 121.4208 },
  '金华': { latitude: 29.0790, longitude: 119.6474 },
  '衢州': { latitude: 28.9706, longitude: 118.8590 },
  '舟山': { latitude: 30.0160, longitude: 122.2072 },
  '丽水': { latitude: 28.4518, longitude: 119.9229 },
}

// 省份名称映射（处理可能的别名）
const provinceNameMap: Record<string, string> = {
  '北京市': '北京',
  '天津市': '天津',
  '河北省': '河北',
  '山西省': '山西',
  '内蒙古自治区': '内蒙古',
  '辽宁省': '辽宁',
  '吉林省': '吉林',
  '黑龙江省': '黑龙江',
  '上海市': '上海',
  '江苏省': '江苏',
  '浙江省': '浙江',
  '安徽省': '安徽',
  '福建省': '福建',
  '江西省': '江西',
  '山东省': '山东',
  '河南省': '河南',
  '湖北省': '湖北',
  '湖南省': '湖南',
  '广东省': '广东',
  '广西壮族自治区': '广西',
  '海南省': '海南',
  '重庆市': '重庆',
  '四川省': '四川',
  '贵州省': '贵州',
  '云南省': '云南',
  '西藏自治区': '西藏',
  '陕西省': '陕西',
  '甘肃省': '甘肃',
  '青海省': '青海',
  '宁夏回族自治区': '宁夏',
  '新疆维吾尔自治区': '新疆',
  '台湾省': '台湾',
  '香港特别行政区': '香港',
  '澳门特别行政区': '澳门',
}

// 用户当前位置
const userLocation = ref<{
  latitude: number
  longitude: number
  city?: string
} | null>(null)

// 当前所在城市
const currentCity = ref<string>('')

// 地图中心点（初始为中国中心，获取位置后更新为用户位置）
const mapCenter = ref({
  latitude: 35.0,
  longitude: 104.0,
})

// 地图缩放级别（初始为10级显示城市级别，用户可以缩放查看完整地图）
const mapScale = ref(10)

// 是否允许地图自动调整（设置为false，防止地图自动缩放到标记点）
const autoFit = ref(false)

const mapLoaded = ref(false)

// 用户当前位置标记（蓝色三角形）
const userLocationMarker = ref<any[]>([])

// 地图圆圈（用于黄色高亮显示打卡过的城市）
const mapCircles = ref<any[]>([])

// 地图多边形（用于高亮省份，但需要精确的省份边界数据）
const mapPolygons = ref<any[]>([])

// 地图点击事件（点击黄色圆圈区域时显示城市信息）
const onMapTap = (e: any) => {
  // 可以在这里处理点击地图时的逻辑
  // 如果需要显示城市信息，可以通过坐标判断点击的是哪个城市
  console.log('[Footprint] 地图被点击', e)
}

// 地图区域变化事件
const onRegionChange = (e: any) => {
  // 减少日志输出，避免频繁打印
  // console.log('[Footprint] 地图区域变化', e)
}

// 地图更新完成事件
const onMapUpdated = () => {
  // 地图更新后，确保保持固定视角
  // 如果需要，可以在这里重置地图中心和缩放级别
}

// 返回上一页
const goBack = () => {
  uni.navigateBack()
}

// 使用 canvas 创建蓝色圆点图标
const createBlueCircleIcon = (): Promise<string> => {
  return new Promise((resolve, reject) => {
    // 使用 nextTick 确保 canvas 已渲染
    setTimeout(() => {
      try {
        // 创建 canvas 上下文
        const ctx = uni.createCanvasContext('blue-circle-canvas')
        
        // 设置 canvas 尺寸
        const size = 30
        const radius = size / 2 - 2 // 圆点半径
        
        // 绘制蓝色圆点
        ctx.beginPath()
        ctx.arc(size / 2, size / 2, radius, 0, 2 * Math.PI)
        ctx.closePath()
        
        // 填充蓝色
        ctx.setFillStyle('#1890FF')
        ctx.fill()
        
        // 绘制白色边框
        ctx.setStrokeStyle('#FFFFFF')
        ctx.setLineWidth(2)
        ctx.stroke()
        
        // 绘制完成
        ctx.draw(false, () => {
          // 延迟一下确保绘制完成
          setTimeout(() => {
            // 将 canvas 转换为临时文件路径
            uni.canvasToTempFilePath({
              canvasId: 'blue-circle-canvas',
              success: (res: any) => {
                console.log('[Footprint] 蓝色圆点图标生成成功', res.tempFilePath)
                resolve(res.tempFilePath)
              },
              fail: (err: any) => {
                console.error('[Footprint] 生成图标失败', err)
                reject(err)
              },
            })
          }, 200)
        })
      } catch (error) {
        console.error('[Footprint] Canvas 创建失败', error)
        reject(error)
      }
    }, 100) // 延迟 100ms 确保 canvas 已渲染
  })
}

// 根据坐标查找城市名称
const getCityByCoordinates = (latitude: number, longitude: number): string => {
  // 根据坐标查找最近的城市
  let nearestCity = ''
  let minDistance = Infinity
  
  // 使用兼容性更好的方式遍历
  for (const key in cityCoordinates) {
    if (cityCoordinates.hasOwnProperty(key)) {
      const coords = cityCoordinates[key]
      const distance = Math.sqrt(
        Math.pow(coords.latitude - latitude, 2) + 
        Math.pow(coords.longitude - longitude, 2)
      )
      if (distance < minDistance) {
        minDistance = distance
        nearestCity = key
      }
    }
  }
  
  console.log(`[Footprint] 坐标查找城市: (${latitude}, ${longitude}) -> ${nearestCity}, 距离: ${minDistance.toFixed(4)}`)
  return nearestCity
}

// 获取用户当前位置
const getUserLocation = () => {
  // 在开发模式下，微信开发者工具使用的是模拟位置（虚拟位置）
  // 可以通过"模拟器" -> "模拟位置"菜单设置模拟位置
  // 真机预览时会获取真实位置
  console.log('[Footprint] 📍 开始获取位置...')
  console.log('[Footprint] 💡 提示：开发模式下使用的是模拟位置，可通过开发者工具"模拟器"菜单设置')
  
  uni.getLocation({
    type: 'gcj02', // 返回可以用于uni.openLocation的经纬度
    geocode: true, // 开启地址解析
    success: (res) => {
      console.log('[Footprint] 获取位置成功', res)
      console.log('[Footprint] 📍 坐标信息:', {
        latitude: res.latitude,
        longitude: res.longitude,
        isSimulated: '开发模式下为模拟位置，真机为真实位置',
      })
      
      let cityName = ''
      
      // 尝试多种方式获取城市名称
      if (res.address?.city) {
        cityName = res.address.city.replace(/市$/, '')
      } else if (res.address?.province) {
        cityName = res.address.province.replace(/省$/, '')
      } else if (res.address?.district) {
        // 如果只有区县信息，尝试从区县推断城市
        cityName = res.address.district.replace(/区$|县$/, '')
      }
      
      // 如果地址解析没有返回城市，根据坐标查找最近的城市
      if (!cityName) {
        cityName = getCityByCoordinates(res.latitude, res.longitude)
        console.log('[Footprint] 通过坐标查找城市:', cityName)
      }
      
      userLocation.value = {
        latitude: res.latitude,
        longitude: res.longitude,
        city: cityName,
      }
      
      // 更新地图中心点为用户位置
      mapCenter.value = {
        latitude: res.latitude,
        longitude: res.longitude,
      }
      
      // 设置当前城市
      currentCity.value = cityName
      
      // 创建用户当前位置的蓝色圆点标记
      // 使用 canvas 动态生成蓝色圆点图标
      createBlueCircleIcon().then((iconPath) => {
        userLocationMarker.value = [{
          id: 'user-location',
          latitude: res.latitude,
          longitude: res.longitude,
          title: '我的位置',
          iconPath: iconPath, // 蓝色圆点图标
          width: 30,
          height: 30,
          anchor: { x: 0.5, y: 0.5 }, // 锚点设置在中心
          callout: {
            content: `📍 ${currentCity.value || '我的位置'}`,
            color: '#333',
            fontSize: 14,
            borderRadius: 8,
            bgColor: '#1890FF', // 蓝色背景
            padding: 8,
            display: 'BYCLICK',
            textAlign: 'center',
            borderColor: '#0050B3', // 深蓝色边框
            borderWidth: 2,
          },
        }]
      }).catch(() => {
        // 如果生成图标失败，使用默认图标
        console.warn('[Footprint] 生成蓝色圆点图标失败，使用默认图标')
        userLocationMarker.value = [{
          id: 'user-location',
          latitude: res.latitude,
          longitude: res.longitude,
          title: '我的位置',
          iconPath: '', // 使用默认红色图标
          width: 30,
          height: 30,
          anchor: { x: 0.5, y: 0.5 }, // 锚点设置在中心
          callout: {
            content: `📍 ${currentCity.value || '我的位置'}`,
            color: '#333',
            fontSize: 14,
            borderRadius: 8,
            bgColor: '#1890FF', // 蓝色背景
            padding: 8,
            display: 'BYCLICK',
            textAlign: 'center',
            borderColor: '#0050B3',
            borderWidth: 2,
          },
        }]
      })
      
      console.log('[Footprint] 用户位置:', {
        latitude: res.latitude,
        longitude: res.longitude,
        city: currentCity.value,
        address: res.address,
      })
    },
    fail: (err) => {
      console.error('[Footprint] 获取位置失败', err)
      uni.showToast({
        title: '获取位置失败，请检查定位权限',
        icon: 'none',
        duration: 2000,
      })
      // 如果获取位置失败，使用默认的中国中心点
      mapCenter.value = {
        latitude: 35.0,
        longitude: 104.0,
      }
      mapScale.value = 5 // 显示整个中国
    },
  })
}

// 标准化城市名称（移除"市"、"省"等后缀，用于匹配）
const normalizeCityName = (cityName: string): string => {
  if (!cityName) return ''
  // 移除常见的后缀
  return cityName.replace(/市|省|自治区|特别行政区|壮族自治区|回族自治区|维吾尔自治区|地区|县|区/g, '').trim()
}

// 查找城市坐标（支持模糊匹配）
const findCityCoordinates = (cityName: string): { latitude: number; longitude: number } | null => {
  if (!cityName) return null
  
  // 直接匹配
  if (cityCoordinates[cityName]) {
    return cityCoordinates[cityName]
  }
  
  // 标准化后匹配
  const normalized = normalizeCityName(cityName)
  if (normalized && cityCoordinates[normalized]) {
    return cityCoordinates[normalized]
  }
  
  // 模糊匹配：查找包含该城市名的键（使用兼容性更好的方式）
  for (const key in cityCoordinates) {
    if (cityCoordinates.hasOwnProperty(key)) {
      const coords = cityCoordinates[key]
      if (key.includes(normalized) || normalized.includes(key)) {
        return coords
      }
    }
  }
  
  return null
}

// 省份中心点坐标（作为备选方案）
const provinceCenters: Record<string, { latitude: number; longitude: number }> = {
  '北京': { latitude: 39.9042, longitude: 116.4074 },
  '上海': { latitude: 31.2304, longitude: 121.4737 },
  '天津': { latitude: 39.3434, longitude: 117.3616 },
  '重庆': { latitude: 29.5630, longitude: 106.5516 },
  '河北': { latitude: 38.0428, longitude: 114.5149 },
  '山西': { latitude: 37.8706, longitude: 112.5489 },
  '内蒙古': { latitude: 40.8414, longitude: 111.7519 },
  '辽宁': { latitude: 41.8057, longitude: 123.4315 },
  '吉林': { latitude: 43.8171, longitude: 125.3235 },
  '黑龙江': { latitude: 45.7731, longitude: 126.6167 },
  '江苏': { latitude: 32.0603, longitude: 118.7969 },
  '浙江': { latitude: 30.2741, longitude: 120.1551 },
  '安徽': { latitude: 31.8206, longitude: 117.2272 },
  '福建': { latitude: 26.0745, longitude: 119.2965 },
  '江西': { latitude: 28.6820, longitude: 115.8579 },
  '山东': { latitude: 36.6512, longitude: 117.1201 },
  '河南': { latitude: 34.7466, longitude: 113.6254 },
  '湖北': { latitude: 30.5928, longitude: 114.3055 },
  '湖南': { latitude: 28.2278, longitude: 112.9388 },
  '广东': { latitude: 23.1291, longitude: 113.2644 },
  '广西': { latitude: 22.8170, longitude: 108.3669 },
  '海南': { latitude: 20.0444, longitude: 110.1999 },
  '四川': { latitude: 30.6624, longitude: 104.0633 },
  '贵州': { latitude: 26.6470, longitude: 106.6302 },
  '云南': { latitude: 25.0389, longitude: 102.7183 },
  '西藏': { latitude: 29.6626, longitude: 91.1149 },
  '陕西': { latitude: 34.3416, longitude: 108.9398 },
  '甘肃': { latitude: 36.0611, longitude: 103.8343 },
  '青海': { latitude: 36.6171, longitude: 101.7782 },
  '宁夏': { latitude: 38.4872, longitude: 106.2309 },
  '新疆': { latitude: 43.8256, longitude: 87.6168 },
  '台湾': { latitude: 25.0330, longitude: 121.5654 },
  '香港': { latitude: 22.3193, longitude: 114.1694 },
  '澳门': { latitude: 22.1987, longitude: 113.5439 },
}

// 更新地图标记（只创建黄色圆圈，不创建红色标记点）
const updateMapMarkers = () => {
  mapCircles.value = []
  
  console.log('[Footprint] 开始更新地图标记，打卡数据数量:', checkinData.value.length)
  
  // 为每个打卡的城市创建标记
  const cityMarkerMap = new Map<string, {
    city: string
    province: string
    count: number
    coordinates: { latitude: number; longitude: number }
  }>()
  
  checkinData.value.forEach((item: any, index: number) => {
    // 详细日志
    console.log(`[Footprint] 处理第 ${index + 1} 条数据:`, {
      cityName: item.cityName,
      city: item.city,
      provinceName: item.provinceName,
      province: item.province,
      latitude: item.latitude,
      longitude: item.longitude,
      targetName: item.targetName,
      targetType: item.targetType,
    })
    
    const cityName = item.cityName || item.city
    const provinceName = item.provinceName || item.province
    let lat = item.latitude
    let lng = item.longitude
    
    // 转换 BigDecimal 为 number（如果后端返回的是对象）
    if (lat && typeof lat === 'object') {
      lat = parseFloat(lat.toString())
    }
    if (lng && typeof lng === 'object') {
      lng = parseFloat(lng.toString())
    }
    
    // 验证坐标有效性（确保是数字且在合理范围内）
    if (lat != null && lng != null) {
      lat = Number(lat)
      lng = Number(lng)
      // 检查是否为有效数字且在合理范围内（中国范围：纬度 18-54，经度 73-135）
      if (isNaN(lat) || isNaN(lng) || lat < 18 || lat > 54 || lng < 73 || lng > 135) {
        console.warn(`[Footprint] 坐标无效，已跳过: lat=${lat}, lng=${lng}`)
        lat = null
        lng = null
      }
    }
    
    // 获取城市坐标
    let coordinates: { latitude: number; longitude: number } | null = null
    
    // 优先使用数据中的经纬度
    if (lat != null && lng != null && !isNaN(lat) && !isNaN(lng)) {
      coordinates = { latitude: lat, longitude: lng }
      console.log(`[Footprint] 使用数据中的坐标:`, coordinates)
    } else if (cityName) {
      // 尝试从城市名称查找坐标
      coordinates = findCityCoordinates(cityName)
      if (coordinates) {
        console.log(`[Footprint] 从城市名称找到坐标: ${cityName} ->`, coordinates)
      } else {
        console.log(`[Footprint] 城市名称未找到坐标: ${cityName}`)
      }
    }
    
    // 如果城市坐标不存在，尝试使用省份中心点
    if (!coordinates && provinceName) {
      const normalizedProvince = normalizeCityName(provinceName)
      if (normalizedProvince && provinceCenters[normalizedProvince]) {
        coordinates = provinceCenters[normalizedProvince]
        console.log(`[Footprint] 使用省份中心点: ${normalizedProvince} ->`, coordinates)
      }
    }
    
    if (coordinates) {
      const normalizedCity = cityName ? normalizeCityName(cityName) : (provinceName ? normalizeCityName(provinceName) : '未知')
      const key = `${normalizedCity}_${provinceName || ''}`
      
      if (cityMarkerMap.has(key)) {
        const existing = cityMarkerMap.get(key)!
        existing.count++
        console.log(`[Footprint] 增加城市计数: ${key} -> ${existing.count}`)
      } else {
        cityMarkerMap.set(key, {
          city: normalizedCity,
          province: provinceName || '',
          count: 1,
          coordinates,
        })
        console.log(`[Footprint] 添加新城市标记: ${key}`, coordinates)
      }
    } else {
      console.warn(`[Footprint] 跳过无坐标的数据:`, { cityName, provinceName, lat, lng })
    }
  })
  
  console.log(`[Footprint] 城市标记映射完成，共 ${cityMarkerMap.size} 个城市`)
  
  // 为打卡过的城市创建黄色圆圈高亮（不显示红色标记点）
  cityMarkerMap.forEach((data, key) => {
    // 再次验证坐标有效性
    const lat = data.coordinates.latitude
    const lng = data.coordinates.longitude
    
    if (isNaN(lat) || isNaN(lng) || lat < 18 || lat > 54 || lng < 73 || lng > 135) {
      console.warn(`[Footprint] 跳过无效坐标的城市: ${data.city}`, { lat, lng })
      return
    }
    
    // 为每个打卡城市添加黄色圆圈高亮
    const circle = {
      latitude: lat,
      longitude: lng,
      color: '#FFD700', // 黄色边框
      fillColor: '#FFD70066', // 半透明黄色填充（更明显）
      radius: 30000, // 30公里半径（增大范围，更明显）
      strokeWidth: 3, // 增加边框宽度
    }
    mapCircles.value.push(circle)
    
    console.log(`[Footprint] 添加黄色圆圈: ${data.city}`, { lat, lng })
  })
  
  console.log('[Footprint] 地图标记更新完成', {
    circles: mapCircles.value.length,
    cities: Array.from(cityMarkerMap.keys()),
  })
}

// 加载打卡数据
const loadCheckinData = async () => {
  if (!user.value?.id) {
    console.log('[Footprint] 用户未登录')
    mapLoaded.value = true
    return
  }

  try {
    // 获取打卡列表
    const res = await checkinApi.getMyCheckins(user.value.id, 1, 1000)
    
    if (res.statusCode === 200 && res.data.code === 200) {
      const data = res.data.data || {}
      const list = data.list || []
      
      console.log('[Footprint] API返回的原始数据:', {
        statusCode: res.statusCode,
        code: res.data.code,
        data: data,
        listLength: list.length,
        firstItem: list[0] || null,
      })
      
      checkinData.value = list
      
      console.log('[Footprint] 保存的打卡数据:', checkinData.value)
      
      // 提取省份和城市信息
      const provinceSet = new Set<string>()
      const citySet = new Set<string>()
      let attractionCount = 0
      let foodCount = 0
      
      console.log('[Footprint] 原始数据列表:', list)
      
      list.forEach((item: any, index: number) => {
        console.log(`[Footprint] 处理第 ${index + 1} 条数据用于统计:`, {
          targetType: item.targetType,
          cityName: item.cityName,
          city: item.city,
          provinceName: item.provinceName,
          province: item.province,
        })
        
        // 统计景点和美食数量
        if (item.targetType === 'scenic') {
          attractionCount++
        } else if (item.targetType === 'food') {
          foodCount++
        }
        
        // 提取省份和城市
        let provinceName = item.provinceName || item.province
        let cityName = item.cityName || item.city
        
        // 标准化省份名称
        if (provinceName) {
          provinceName = provinceNameMap[provinceName] || provinceName
          // 移除可能的"省"、"市"、"自治区"等后缀
          provinceName = provinceName.replace(/省|市|自治区|特别行政区|壮族自治区|回族自治区|维吾尔自治区/g, '')
          if (provinceName) {
            provinceSet.add(provinceName)
          }
        }
        
        // 标准化城市名称
        if (cityName) {
          const normalizedCity = normalizeCityName(cityName)
          if (normalizedCity) {
            citySet.add(normalizedCity)
          }
        }
      })
      
      console.log('[Footprint] 统计结果:', {
        provinceSet: Array.from(provinceSet),
        citySet: Array.from(citySet),
        attractionCount,
        foodCount,
      })
      
      checkedProvinces.value = provinceSet
      checkedCities.value = citySet
      
      // 更新统计数据
      stats.value = {
        provinces: provinceSet.size,
        cities: citySet.size,
        attractions: attractionCount,
        foods: foodCount,
      }
      
      // 更新地图标记
      updateMapMarkers()
      
      console.log('[Footprint] 数据加载完成', {
        provinces: Array.from(provinceSet),
        cities: Array.from(citySet),
        stats: stats.value,
        circles: mapCircles.value.length,
      })
    } else {
      console.error('[Footprint] API返回错误', res.data)
    }
  } catch (e: any) {
    console.error('[Footprint] 加载打卡数据失败', e)
    // 如果接口不存在或失败，使用模拟数据
    if (e.statusCode === 404 || !e.statusCode) {
      console.log('[Footprint] 接口不存在，使用模拟数据')
      // 模拟数据
      checkedProvinces.value = new Set(['北京', '上海', '广东', '浙江'])
      checkedCities.value = new Set(['北京', '上海', '广州', '深圳', '杭州'])
      stats.value = {
        provinces: 4,
        cities: 5,
        attractions: 12,
        foods: 8,
      }
      
      // 创建模拟的打卡数据
      checkinData.value = [
        { id: 1, targetId: 1, cityName: '北京', provinceName: '北京', targetType: 'scenic', latitude: 39.9042, longitude: 116.4074 },
        { id: 2, targetId: 2, cityName: '上海', provinceName: '上海', targetType: 'scenic', latitude: 31.2304, longitude: 121.4737 },
        { id: 3, targetId: 3, cityName: '广州', provinceName: '广东', targetType: 'scenic', latitude: 23.1291, longitude: 113.2644 },
        { id: 4, targetId: 4, cityName: '深圳', provinceName: '广东', targetType: 'food', latitude: 22.5431, longitude: 114.0579 },
        { id: 5, targetId: 5, cityName: '杭州', provinceName: '浙江', targetType: 'scenic', latitude: 30.2741, longitude: 120.1551 },
      ]
      
      updateMapMarkers()
    }
  }
}

onMounted(() => {
  // 立即显示地图，不等待数据加载
  mapLoaded.value = true
  
  // 获取用户当前位置
  getUserLocation()
  
  if (user.value) {
    loadCheckinData()
  } else {
    uni.showToast({
      title: '请先登录',
      icon: 'none',
    })
  }
})
</script>

<style scoped>
.footprint-page {
  width: 100%;
  height: 100vh;
  max-height: 100vh;
  background: linear-gradient(180deg, #f8fafb 0%, #ffffff 100%);
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

/* 顶部导航栏 */
.header-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 30rpx;
  padding-top: calc(44rpx + env(safe-area-inset-top));
  background: #fff;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
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
  cursor: pointer;
}

.back-btn .iconfont {
  font-size: 48rpx;
  line-height: 1;
}

.title-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4rpx;
}

.page-title {
  font-size: 36rpx;
  font-weight: 600;
  color: #333;
  line-height: 1.2;
}

.current-city {
  font-size: 24rpx;
  color: #666;
  line-height: 1;
}

.placeholder {
  width: 60rpx;
}

/* 地图容器 */
.map-container {
  flex: 1;
  display: flex;
  align-items: stretch;
  justify-content: center;
  padding: 20rpx;
  overflow: hidden;
  position: relative;
  min-height: 0;
  height: 0; /* 配合 flex: 1 使用 */
}

.map-wrapper {
  width: 100%;
  height: 100%;
  flex: 1;
  min-height: 500rpx;
  border-radius: 24rpx;
  overflow: hidden;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.08);
  background: #fff;
  position: relative;
}

.china-map {
  width: 100%;
  height: 100%;
}

/* 底部统计栏 */
.stats-bar {
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 30rpx 40rpx;
  padding-bottom: calc(30rpx + env(safe-area-inset-bottom));
  background: #fff;
  box-shadow: 0 -2rpx 8rpx rgba(0, 0, 0, 0.05);
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
  color: #3BA272;
  line-height: 1;
}

.stat-label {
  font-size: 24rpx;
  color: #666;
  line-height: 1;
}

.stat-divider {
  width: 1rpx;
  height: 60rpx;
  background: #E5E5E5;
  margin: 0 20rpx;
}
</style>
