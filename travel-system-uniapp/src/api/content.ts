/**
 * 内容相关API（游记、景点、美食、推荐等）
 */

import { request, uploadFile } from '@/utils/http'

// API 响应类型
export interface ApiResponse<T = any> {
  code: number
  msg: string
  data: T
}

// 推荐API
export const recommendApi = {
  // 推荐旅游线路
  routes: (userId?: number, limit: number = 10) => {
    return request({
      url: '/recommend/routes',
      method: 'GET',
      data: { userId, limit },
      showLoading: false,
    })
  },

  // 推荐游记
  travelNotes: (userId?: number, limit: number = 10) => {
    return request({
      url: '/recommend/travel-notes',
      method: 'GET',
      data: { userId, limit },
      showLoading: false,
    })
  },

  // 推荐景点
  scenicSpots: (userId?: number, cityId?: number, limit: number = 3, province?: string) => {
    return request({
      url: '/recommend/scenic-spots',
      method: 'GET',
      data: { userId, cityId, limit, province },
      showLoading: false,
    })
  },

  // 推荐美食
  foods: (userId?: number, cityId?: number, limit: number = 10, province?: string) => {
    return request({
      url: '/recommend/foods',
      method: 'GET',
      data: { userId, cityId, limit, province },
      showLoading: false,
    })
  },
}

// 景点API
export const scenicSpotApi = {
  // 查询景点列表
  list: (params?: {
    pageNum?: number
    pageSize?: number
    cityId?: number
    tagName?: string
    sortBy?: string
  }) => {
    return request({
      url: '/scenic/list',
      method: 'GET',
      data: params || {},
      showLoading: false,
    })
  },

  // 查询景点详情
  getDetail: (id: number) => {
    return request({
      url: `/scenic/${id}`,
      method: 'GET',
      showLoading: true,
    })
  },

  // 查询热门景点
  getHot: (cityId?: number, limit: number = 10) => {
    return request({
      url: '/scenic/hot',
      method: 'GET',
      data: { cityId, limit },
      showLoading: false,
    })
  },

  // 增加景点热度
  incrementHotScore: (id: number) => {
    return request({
      url: `/scenic/${id}/increment-hot`,
      method: 'POST',
      showLoading: false,
      needAuth: false,
    })
  },

  // 获取用户收藏的景点列表
  getMyFavorites: (userId: number, pageNum: number = 1, pageSize: number = 10) => {
    return request({
      url: '/scenic/my/favorites',
      method: 'GET',
      data: { userId, pageNum, pageSize },
      needAuth: true,
    })
  },
}

// 游记API
export const travelNoteApi = {
  // 查询游记列表
  list: (params?: {
    pageNum?: number
    pageSize?: number
    cityId?: number
    tagName?: string
    sortBy?: string
  }) => {
    return request({
      url: '/travel/note/list',
      method: 'GET',
      data: params || {},
      showLoading: false,
    })
  },

  // 查询游记详情
  getDetail: (id: number, userId?: number) => {
    return request({
      url: `/travel/note/${id}`,
      method: 'GET',
      data: { userId },
      showLoading: true,
    })
  },

  // 发布游记
  publish: (data: {
    userId: number
    title: string
    content?: string
    cityId?: number
    cityName?: string
    imageUrls?: string[]
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

  // 更新游记
  update: (id: number, data: {
    userId: number
    title: string
    content?: string
    cityId?: number
    cityName?: string
    imageUrls?: string[]
    scenicIds?: number[]
    tagIds?: number[]
  }) => {
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

  // 我收藏的游记列表
  listMyFavorites: (userId: number, pageNum: number = 1, pageSize: number = 10) => {
    return request({
      url: '/travel/note/my/favorites',
      method: 'GET',
      data: { userId, pageNum, pageSize },
      needAuth: true,
    })
  },

  // 我发布的游记列表
  listMyNotes: (userId: number, pageNum: number = 1, pageSize: number = 10, status?: string) => {
    return request({
      url: '/travel/note/my/list',
      method: 'GET',
      data: { userId, pageNum, pageSize, status },
      needAuth: true,
    })
  },

  // 设为私人游记
  setPrivate: (id: number, userId: number, isPrivate: boolean) => {
    return request({
      url: `/travel/note/${id}/private`,
      method: 'PUT',
      data: { userId, isPrivate },
      needAuth: true,
    })
  },
}

// 游记互动API
export const travelNoteInteractionApi = {
  // 点赞/取消点赞
  toggleLike: (userId: number, noteId: number) => {
    return request({
      url: '/travel/note/interaction/like',
      method: 'POST',
      data: { userId, noteId },
      needAuth: true,
    })
  },

  // 收藏/取消收藏
  toggleFavorite: (userId: number, noteId: number) => {
    return request({
      url: '/travel/note/interaction/favorite',
      method: 'POST',
      data: { userId, noteId },
      needAuth: true,
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
      data: params,
      showLoading: false,
    })
  },

  // 获取用户点赞的游记列表
  listMyLikes: (userId: number, pageNum: number = 1, pageSize: number = 10) => {
    return request({
      url: '/travel/note/my/likes',
      method: 'GET',
      data: { userId, pageNum, pageSize },
      needAuth: true,
    })
  },

  // 获取用户评论列表
  listMyComments: (userId: number, pageNum: number = 1, pageSize: number = 10) => {
    return request({
      url: '/travel/note/my/comments',
      method: 'GET',
      data: { userId, pageNum, pageSize },
      needAuth: true,
    })
  },
}

// 美食API
export const foodApi = {
  // 查询美食列表
  list: (params?: {
    pageNum?: number
    pageSize?: number
    cityId?: number
    tagName?: string
    sortBy?: string
  }) => {
    return request({
      url: '/food/list',
      method: 'GET',
      data: params || {},
      showLoading: false,
    })
  },

  // 查询美食详情
  getDetail: (id: number) => {
    return request({
      url: `/food/${id}`,
      method: 'GET',
      showLoading: true,
    })
  },

  // 查询热门美食
  getHot: (cityId?: number, limit: number = 10) => {
    return request({
      url: '/food/hot',
      method: 'GET',
      data: { cityId, limit },
      showLoading: false,
    })
  },

  // 获取用户收藏的美食列表
  getMyFavorites: (userId: number, pageNum: number = 1, pageSize: number = 10) => {
    return request({
      url: '/food/my/favorites',
      method: 'GET',
      data: { userId, pageNum, pageSize },
      needAuth: true,
    })
  },
}

// 打卡API
export const checkinApi = {
  // 获取我的打卡列表
  getMyCheckins: (userId: number, pageNum: number = 1, pageSize: number = 100) => {
    return request({
      url: '/checkin/my',
      method: 'GET',
      data: { userId, pageNum, pageSize },
      showLoading: false,
      needAuth: true,
    })
  },
  // 获取用户足迹统计（城市、省份、美食数量等）
  getFootprintStats: (userId: number) => {
    return request({
      url: '/checkin/footprint/stats',
      method: 'GET',
      data: { userId },
      showLoading: false,
      needAuth: true,
    })
  },
}

// 城市API
export const cityApi = {
  // 查询城市列表
  list: () => {
    return request({
      url: '/city/list',
      method: 'GET',
      showLoading: false,
    })
  },
}

// 标签API
export const tagApi = {
  // 查询标签列表
  list: () => {
    return request({
      url: '/tag/list',
      method: 'GET',
      showLoading: false,
    })
  },
}

// 上传API
export const uploadApi = {
  // 上传图片
  upload: (filePath: string) => {
    return uploadFile('/upload/image', filePath)
  },
}
