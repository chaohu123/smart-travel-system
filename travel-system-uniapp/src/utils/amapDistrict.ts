/**
 * 高德 Web 服务 - 行政区划边界（足迹页省级多边形）
 * 小程序后台需配置 request 合法域名：https://restapi.amap.com
 * Key 类型：Web 服务（与 manifest 中小程序地图 Key 可为同一开放平台应用下不同 Key）
 */

import { AMAP_WEB_KEY } from '@/utils/config'

const CACHE_PREFIX = 'amap_district_rings_'
const MAX_POINTS_PER_RING = 200

export type MapPoint = { latitude: number; longitude: number }

function trimPoints(points: MapPoint[]): MapPoint[] {
  if (points.length <= MAX_POINTS_PER_RING) return points
  const step = Math.ceil(points.length / MAX_POINTS_PER_RING)
  const sampled: MapPoint[] = []
  for (let i = 0; i < points.length; i += step) {
    sampled.push(points[i])
  }
  if (sampled.length > 1) {
    const a = sampled[0]
    const b = sampled[sampled.length - 1]
    if (a.latitude !== b.latitude || a.longitude !== b.longitude) {
      sampled.push({ ...a })
    }
  }
  return sampled
}

/** 解析 polyline：「经度,纬度;…」，多块以 | 分隔 */
function parseAmapPolylineRings(polyline: string | undefined): MapPoint[][] {
  if (!polyline) return []
  const rings: MapPoint[][] = []
  for (const block of polyline.split('|')) {
    const pts: MapPoint[] = []
    for (const seg of block.split(';')) {
      const t = seg.trim()
      if (!t) continue
      const parts = t.split(',')
      if (parts.length < 2) continue
      const lng = parseFloat(parts[0])
      const lat = parseFloat(parts[1])
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        pts.push({ latitude: lat, longitude: lng })
      }
    }
    const trimmed = trimPoints(pts)
    if (trimmed.length >= 3) rings.push(trimmed)
  }
  return rings
}

export type DistrictRings = MapPoint[][]

/**
 * 拉取行政区边界（可能多块：如海岛），每块为闭合点序列
 */
export async function fetchDistrictRings(keyword: string): Promise<DistrictRings | null> {
  if (!AMAP_WEB_KEY) {
    return null
  }
  const cacheKey = CACHE_PREFIX + keyword
  try {
    const cached = uni.getStorageSync(cacheKey) as DistrictRings | string | null
    if (cached && Array.isArray(cached) && cached.length > 0) {
      return cached as DistrictRings
    }
  } catch {
    /* empty */
  }

  const url =
    `https://restapi.amap.com/v3/config/district?keywords=${encodeURIComponent(keyword)}` +
    `&subdistrict=0&extensions=all&key=${encodeURIComponent(AMAP_WEB_KEY)}`

  return new Promise((resolve) => {
    uni.request({
      url,
      method: 'GET',
      success: (res: any) => {
        const data = res.data as {
          status?: string
          districts?: Array<{ polyline?: string }>
        }
        if (res.statusCode !== 200 || data?.status !== '1' || !data?.districts?.length) {
          resolve(null)
          return
        }
        const polyline = data.districts[0]?.polyline
        const rings = parseAmapPolylineRings(polyline)
        if (!rings.length) {
          resolve(null)
          return
        }
        try {
          uni.setStorageSync(cacheKey, rings)
        } catch {
          /* empty */
        }
        resolve(rings)
      },
      fail: () => resolve(null),
    })
  })
}
