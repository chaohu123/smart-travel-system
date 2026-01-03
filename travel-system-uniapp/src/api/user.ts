import { request } from '@/utils/http'

export const userApi = {
  // 测试登录：根据已存在的用户ID或手机号获取用户资料并生成本地 token
  loginByUserId: (userId: number) => {
    return request({
      url: `/admin/user/${userId}`,
      method: 'GET',
      showLoading: true,
    })
  },
  listSimple: () => {
    return request({
      url: '/admin/user/list',
      method: 'GET',
      showLoading: false,
    })
  },
  updateProfile: (payload: Record<string, any>) => {
    return request({
      url: '/admin/user/update',
      method: 'POST',
      data: payload,
      needAuth: false,
    })
  },
  updateInterests: (userId: number, interests: string[]) => {
    return request({
      url: '/admin/user/interests',
      method: 'POST',
      data: { id: userId, interests },
      needAuth: false,
    })
  },

  // 获取用户统计信息
  getStats: (userId?: number) => {
    return request({
      url: '/user/stats',
      method: 'GET',
      data: userId ? { userId } : {},
      showLoading: false,
    })
  },

  // 获取用户详细信息（包含等级、经验、勋章）
  getProfile: (userId: number) => {
    return request({
      url: '/user/profile',
      method: 'GET',
      data: { userId },
      showLoading: true,
    })
  },
}

