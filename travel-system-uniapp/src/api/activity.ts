/**
 * 活动相关API
 */

import { request } from '@/utils/http'

export interface Activity {
  id?: number
  name?: string
  highlight?: string
  description?: string
  rules?: string
  imageUrl?: string
  startTime?: string
  endTime?: string
  status?: string // online, offline, upcoming, ended
  linkUrl?: string
  relatedRouteIds?: number[]
  relatedScenicIds?: number[]
  relatedFoodIds?: number[]
  relatedNoteIds?: number[]
  createTime?: string
  updateTime?: string
}

export interface ActivityDetail extends Activity {
  relatedRoutes?: Array<{
    id?: number
    routeName?: string
    coverImage?: string
    days?: number
    favoriteCount?: number
  }>
  relatedScenics?: Array<{
    id?: number
    name?: string
    imageUrl?: string
    score?: number | string
    city?: string
  }>
  relatedFoods?: Array<{
    id?: number
    name?: string
    imageUrl?: string
    foodType?: string
    avgPrice?: number | string
  }>
  relatedNotes?: Array<{
    id?: number
    title?: string
    coverImage?: string
    authorName?: string
    viewCount?: number
  }>
}

export const activityApi = {
  // 获取活动列表
  getList: (params?: {
    pageNum?: number
    pageSize?: number
    status?: string
  }) => {
    return request<{
      code: number
      data: {
        rows: Activity[]
        total: number
      }
    }>({
      url: '/activity/list',
      method: 'GET',
      data: params,
    })
  },

  // 获取活动详情
  getDetail: (id: number) => {
    return request<{
      code: number
      data: ActivityDetail
    }>({
      url: `/activity/${id}`,
      method: 'GET',
    })
  },
}

