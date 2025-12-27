import { getCache, removeCache } from './storage'

export interface RequestOptions extends UniApp.RequestOptions {
  needAuth?: boolean
  showLoading?: boolean
  needRetry?: boolean
}

const BASE_URL = 'http://localhost:8080/api/v1'

const getToken = () => getCache<string>('token')

const handleAuthFail = () => {
  removeCache('token')
  removeCache('user')
  uni.showToast({ title: '登录已失效，请重新登录', icon: 'none' })
  setTimeout(() => {
    uni.switchTab({ url: '/pages/profile/profile' })
  }, 400)
}

export const request = <T = any>(options: RequestOptions) => {
  const {
    url,
    needAuth = false,
    showLoading = true,
    needRetry = false,
    header = {},
    ...rest
  } = options

  const token = getToken()
  const headers: Record<string, any> = { ...header }
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  if (needAuth && !token) {
    handleAuthFail()
    return Promise.reject(new Error('no-token'))
  }

  if (showLoading) {
    uni.showLoading({ title: '加载中', mask: true })
  }

  const run = () =>
    new Promise<UniApp.RequestSuccessCallbackResult & { data: any }>((resolve, reject) => {
      uni.request({
        url: url.startsWith('http') ? url : `${BASE_URL}${url}`,
        header: headers,
        ...rest,
        success: (res) => {
          if (res.statusCode === 401 || res.statusCode === 403) {
            handleAuthFail()
            reject(res)
            return
          }
          resolve(res as any)
        },
        fail: reject,
        complete: () => {
          if (showLoading) {
            uni.hideLoading()
          }
        },
      })
    })

  if (!needRetry) {
    return run()
  }

  return run().catch((err) => {
    return run().catch(() => Promise.reject(err))
  })
}

export const uploadFile = (url: string, filePath: string) => {
  const token = getToken()
  return uni.uploadFile({
    url: url.startsWith('http') ? url : `${BASE_URL}${url}`,
    filePath,
    name: 'file',
    header: token ? { Authorization: `Bearer ${token}` } : {},
  })
}














