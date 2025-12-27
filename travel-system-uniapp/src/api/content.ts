/**
 * 内容相关API（游记、景点、美食、标签、上传）
 */

import { request, uploadFile } from '@/utils/http'

// 辅助函数：过滤掉 undefined 和 null 值
const filterParams = (params: Record<string, any>): Record<string, any> => {
  const filtered: Record<string, any> = {}
  for (const key in params) {
    if (params[key] !== undefined && params[key] !== null) {
      filtered[key] = params[key]
    }
  }
  return filtered
}

// 统一的接口响应结构
export interface ApiResponse<T> {
  code: number
  msg?: string
  data: T
}

// 游记相关
export const travelNoteApi = {
  // 查询游记列表
  list: (params: {
    pageNum?: number
    pageSize?: number
    cityId?: number
    tagName?: string
    sortBy?: string
  }) => {
    return request({
      url: '/travel/note/list',
      method: 'GET',
      data: filterParams(params),
      needRetry: true,
    })
  },

  // 查询游记详情
  getDetail: (id: number, userId?: number) => {
    return request({
      url: `/travel/note/${id}`,
      method: 'GET',
      data: filterParams({ userId }),
    })
  },

  // 发布游记
  publish: (data: {
    userId: number
    title: string
    content: string
    cityId: number
    cityName?: string
    imageUrls: string[]
    scenicIds?: number[]
    tagIds?: number[]
  }) => {
    return request({
      url: '/travel/note',
      method: 'POST',
      data,
      needAuth: true,
    })
  },

  // 编辑游记
  update: (id: number, data: any) => {
    return request({
      url: `/travel/note/${id}`,
      method: 'PUT',
      data,
      needAuth: true,
    })
  },

  // 删除游记
  delete: (id: number, userId: number) => {
    return request({
      url: `/travel/note/${id}`,
      method: 'DELETE',
      data: { userId },
      needAuth: true,
    })
  },
}

// 游记互动相关
export const travelNoteInteractionApi = {
  // 点赞/取消点赞
  toggleLike: (userId: number, noteId: number) => {
    return request({
      url: '/travel/note/interaction/like',
      method: 'POST',
      data: { userId, noteId },
      needAuth: true,
      showLoading: false,
    })
  },

  // 收藏/取消收藏
  toggleFavorite: (userId: number, noteId: number) => {
    return request({
      url: '/travel/note/interaction/favorite',
      method: 'POST',
      data: { userId, noteId },
      needAuth: true,
      showLoading: false,
    })
  },

  // 发布评论
  publishComment: (data: {
    userId: number
    contentType: string
    contentId: number
    content: string
    parentId?: number
  }) => {
    return request({
      url: '/travel/note/interaction/comment',
      method: 'POST',
      data,
      needAuth: true,
      showLoading: true,
    })
  },

  // 查询评论列表
  listComments: (params: {
    contentType: string
    contentId: number
    pageNum?: number
    pageSize?: number
  }) => {
    return request({
      url: '/travel/note/interaction/comment/list',
      method: 'GET',
      data: filterParams(params),
    })
  },
}

// 景点相关
export const scenicSpotApi = {
  // 查询景点列表
  list: (params: {
    pageNum?: number
    pageSize?: number
    cityId?: number
    tagName?: string
    sortBy?: string
  }) => {
    return request({
      url: '/scenic/list',
      method: 'GET',
      data: filterParams(params),
    })
  },

  // 查询景点详情
  getDetail: (id: number) => {
    return request({
      url: `/scenic/${id}`,
      method: 'GET',
    })
  },

  // 查询热门景点
  getHot: (cityId?: number, limit?: number) => {
    return request({
      url: '/scenic/hot',
      method: 'GET',
      data: filterParams({ cityId, limit }),
    })
  },

  // 增加景点热度
  incrementHotScore: (id: number) => {
    return request({
      url: `/scenic/${id}/increment-hot`,
      method: 'POST',
    })
  },
}

// 美食相关
export const foodApi = {
  // 查询美食列表
  list: (params: {
    pageNum?: number
    pageSize?: number
    cityId?: number
    tagName?: string
    sortBy?: string
  }) => {
    return request({
      url: '/food/list',
      method: 'GET',
      data: filterParams(params),
    })
  },

  // 查询美食详情
  getDetail: (id: number) => {
    return request({
      url: `/food/${id}`,
      method: 'GET',
    })
  },

  // 查询热门美食
  getHot: (cityId?: number, limit?: number) => {
    return request({
      url: '/food/hot',
      method: 'GET',
      data: filterParams({ cityId, limit }),
    })
  },
}

// 城市相关
export const cityApi = {
  // 查询城市列表
  list: () => {
    return request({
      url: '/city/list',
      method: 'GET',
    })
  },
}

// 首页推荐相关
export const recommendApi = {
  // 推荐线路
  routes: (userId?: number, limit?: number, cityId?: number) => {
    return request<ApiResponse<any[]>>({
      url: '/recommend/routes',
      method: 'GET',
      data: filterParams({ userId, limit, cityId }),
      needRetry: true,
    })
  },
  // 推荐游记
  travelNotes: (userId?: number, limit?: number) => {
    return request<ApiResponse<any[]>>({
      url: '/recommend/travel-notes',
      method: 'GET',
      data: filterParams({ userId, limit }),
      needRetry: true,
    })
  },
  // 推荐景点
  scenicSpots: (userId?: number, cityId?: number, limit?: number, province?: string) => {
    return request<ApiResponse<any[]>>({
      url: '/recommend/scenic-spots',
      method: 'GET',
      data: filterParams({ userId, cityId, limit, province }),
      needRetry: true,
    })
  },
  // 推荐美食
  foods: (userId?: number, cityId?: number, limit?: number) => {
    return request<ApiResponse<any[]>>({
      url: '/recommend/foods',
      method: 'GET',
      data: filterParams({ userId, cityId, limit }),
      needRetry: true,
    })
  },
}

// 标签相关
export const tagApi = {
  list: () => {
    return request<ApiResponse<any[]>>({
      url: '/tag/list',
      method: 'GET',
    })
  },
}

// 上传相关
export const uploadApi = {
  upload: (filePath: string) => {
    return uploadFile('/upload', filePath)
  },
}

