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
    selectedScenicIds?: number[]  // 用户选择的景点ID列表（必选内容）
    selectedFoodIds?: number[]    // 用户选择的美食ID列表（必选内容）
    dailySelections?: Array<{     // 每天选择的景点和美食
      day: number
      scenicIds?: number[]
      foodIds?: number[]
    }>
    startDate?: string            // 开始日期 YYYY-MM-DD
    endDate?: string              // 结束日期 YYYY-MM-DD
  }) => {
    return request({
      url: '/route/generate',
      method: 'POST',
      data,
      needAuth: true,
      showLoading: false, // 禁用系统默认加载提示，使用自定义动画
    })
  },

  // 查询线路详情
  getDetail: (id: number) => {
    return request({
      url: `/route/${id}`,
      method: 'GET',
      showLoading: false, // 禁用默认加载提示
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

