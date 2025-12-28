/**
 * 线路规划相关API
 */

import { request } from '@/utils/http'

export const routeApi = {
  // 生成旅游线路
  generate: (data: {
    cityId: number
    days: number
    tagIds: number[]
    budget?: string
    suitablePeople?: string
    useAi?: boolean
  }) => {
    return request({
      url: '/route/generate',
      method: 'POST',
      data,
      needAuth: true,
    })
  },

  // 查询线路详情
  getDetail: (id: number) => {
    return request({
      url: `/route/${id}`,
      method: 'GET',
    })
  },

  // 收藏/取消收藏线路
  toggleFavorite: (userId: number, routeId: number) => {
    return request({
      url: '/route/favorite',
      method: 'POST',
      data: { userId, routeId },
      needAuth: true,
    })
  },

  // 查询我的行程列表
  listMyRoutes: (userId: number) => {
    return request({
      url: '/route/my',
      method: 'GET',
      data: { userId },
      needAuth: true,
    })
  },
}


























