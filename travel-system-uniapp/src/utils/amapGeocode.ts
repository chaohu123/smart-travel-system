/**
 * 地理编码（地址 → 经纬度）
 * 优先走后端代理，避免小程序 request 域名限制
 */
import { request } from '@/utils/http'
import { AMAP_WEB_KEY } from '@/utils/config'

const CACHE_PREFIX = 'amap_geocode_'
const cache = new Map<string, { latitude: number; longitude: number } | null>()

export type GeoPoint = { latitude: number; longitude: number }

export type CityCenter = { latitude: number; longitude: number }

const DEFAULT_CITY_RADIUS_KM = 80

function cacheKey(address: string, city?: string, cityId?: number) {
  return `${CACHE_PREFIX}${cityId || ''}::${city || ''}::${address.trim()}`
}

export function distanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const earthRadiusKm = 6371
  const latDistance = ((lat2 - lat1) * Math.PI) / 180
  const lngDistance = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(latDistance / 2) * Math.sin(latDistance / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(lngDistance / 2) *
      Math.sin(lngDistance / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return earthRadiusKm * c
}

export function isCoordNearCity(
  coord: GeoPoint,
  cityCenter?: CityCenter | null,
  maxKm = DEFAULT_CITY_RADIUS_KM
): boolean {
  if (!cityCenter) return true
  return distanceKm(coord.latitude, coord.longitude, cityCenter.latitude, cityCenter.longitude) <= maxKm
}

function parseLocation(location: string): GeoPoint | null {
  if (!location) return null
  const parts = location.split(',')
  if (parts.length < 2) return null
  const lng = parseFloat(parts[0])
  const lat = parseFloat(parts[1])
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  if (lat < 3 || lat > 54.5 || lng < 73 || lng > 135.5) return null
  return { latitude: lat, longitude: lng }
}

async function geocodeViaBackend(address: string, city?: string, cityId?: number): Promise<GeoPoint | null> {
  try {
    const res = await request({
      url: '/map/geocode',
      method: 'GET',
      data: { address, city: city || '', cityId: cityId || '' },
      showLoading: false,
    })
    if (res.statusCode === 200 && res.data?.code === 200 && res.data?.data) {
      const lat = parseFloat(String(res.data.data.latitude))
      const lng = parseFloat(String(res.data.data.longitude))
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        return { latitude: lat, longitude: lng }
      }
    }
  } catch {
    // fallback to direct amap
  }
  return null
}

async function geocodeViaAmap(address: string, city?: string): Promise<GeoPoint | null> {
  try {
    const cityParam = city ? `&city=${encodeURIComponent(city)}` : ''
    const url =
      `https://restapi.amap.com/v3/geocode/geo?address=${encodeURIComponent(address)}` +
      `${cityParam}&key=${AMAP_WEB_KEY}`
    const res = await new Promise<UniApp.RequestSuccessCallbackResult>((resolve, reject) => {
      uni.request({ url, method: 'GET', success: resolve, fail: reject })
    })
    const data = res.data as {
      status?: string
      geocodes?: Array<{ location?: string }>
    }
    if (data?.status !== '1' || !data.geocodes?.length) {
      return null
    }
    return parseLocation(data.geocodes[0].location || '')
  } catch {
    return null
  }
}

/**
 * 将地址解析为经纬度（带内存缓存）
 * cityCenter 用于校验结果是否落在目的地城市范围内，避免全国同名地点误匹配
 */
export async function geocodeAddress(
  address: string,
  city?: string,
  cityId?: number,
  cityCenter?: CityCenter | null
): Promise<GeoPoint | null> {
  const raw = (address || '').trim()
  if (!raw) return null
  const key = cacheKey(raw, city, cityId)
  if (cache.has(key)) return cache.get(key) ?? null

  const accept = (point: GeoPoint | null) => {
    if (!point) return null
    if (!isCoordNearCity(point, cityCenter)) return null
    return point
  }

  const backendPoint = accept(await geocodeViaBackend(raw, city, cityId))
  if (backendPoint) {
    cache.set(key, backendPoint)
    return backendPoint
  }

  const directPoint = accept(await geocodeViaAmap(raw, city))
  cache.set(key, directPoint)
  return directPoint
}
