import { getCache, removeCache, setCache } from './storage'
import { API_BASE_URL } from './config'

export interface RequestOptions extends UniApp.RequestOptions {
  needAuth?: boolean
  showLoading?: boolean
  needRetry?: boolean
  enableCache?: boolean // 是否启用缓存
  cacheTime?: number // 缓存时间（秒），默认5分钟
}

const BASE_URL = API_BASE_URL

const getToken = () => getCache<string>('token')

// 请求去重：正在进行的请求
const pendingRequests = new Map<string, Promise<any>>()

// 生成请求的唯一键
const getRequestKey = (url: string, method: string, data: any): string => {
  const dataStr = data ? JSON.stringify(data) : ''
  return `${method}:${url}:${dataStr}`
}

const handleAuthFail = () => {
  removeCache('token')
  removeCache('user')
  uni.showToast({ title: '登录已失效，请重新登录', icon: 'none' })
  setTimeout(() => {
    uni.switchTab({ url: '/pages/profile/profile' })
  }, 400)
}

// 清理参数中的 undefined 和 null 值
const cleanParams = (params: any): any => {
  if (!params || typeof params !== 'object') {
    return params
  }

  if (Array.isArray(params)) {
    return params.map(cleanParams).filter(item => item !== undefined && item !== null)
  }

  const cleaned: Record<string, any> = {}
  for (const key in params) {
    if (Object.prototype.hasOwnProperty.call(params, key)) {
      const value = params[key]
      // 跳过 undefined、null 和字符串 "undefined"、"null"
      if (value !== undefined && value !== null && value !== 'undefined' && value !== 'null') {
        cleaned[key] = value
      }
    }
  }
  return cleaned
}

export const request = <T = any>(options: RequestOptions) => {
  const {
    url,
    needAuth = false,
    showLoading = true,
    needRetry = false,
    enableCache = false,
    cacheTime = 5 * 60, // 默认5分钟
    header = {},
    data,
    method = 'GET',
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

  // 清理 data 中的 undefined 和 null 值
  const cleanedData = data ? cleanParams(data) : undefined

  // 生成请求键（用于去重和缓存）
  const requestKey = getRequestKey(url, method, cleanedData)
  const cacheKey = `api_cache_${requestKey}`

  // 检查缓存（仅 GET 请求且启用缓存）
  if (enableCache && method === 'GET') {
    const cached = getCache<any>(cacheKey)
    if (cached) {
      return Promise.resolve({
        statusCode: 200,
        data: cached
      } as any)
    }
  }

  // 检查是否有正在进行的相同请求（请求去重）
  if (pendingRequests.has(requestKey)) {
    return pendingRequests.get(requestKey)!
  }

  if (showLoading) {
    uni.showLoading({ title: '加载中', mask: true })
  }

  const run = () =>
    new Promise<UniApp.RequestSuccessCallbackResult & { data: any }>((resolve, reject) => {
      // 设置默认超时时间为60秒，如果options中指定了timeout则使用指定的值
      const timeout = (rest as any).timeout || 60000
      
      const fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`
      
      uni.request({
        url: fullUrl,
        method: method as any,
        header: headers,
        data: cleanedData,
        timeout: timeout,
        ...rest,
        success: (res) => {
          if (res.statusCode === 401 || res.statusCode === 403) {
            handleAuthFail()
            reject(res)
            return
          }
          
          // 缓存成功的 GET 请求结果
          if (enableCache && method === 'GET' && res.statusCode === 200 && res.data) {
            setCache(cacheKey, res.data, cacheTime)
          }
          
          resolve(res as any)
        },
        fail: (err) => {
          reject(err)
        },
        complete: () => {
          if (showLoading) {
            uni.hideLoading()
          }
          // 请求完成，从待处理列表中移除
          pendingRequests.delete(requestKey)
        },
      })
    })

  // 将请求添加到待处理列表
  const requestPromise = needRetry
    ? run().catch((err) => {
        return run().catch(() => Promise.reject(err))
      })
    : run()

  pendingRequests.set(requestKey, requestPromise)

  return requestPromise
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





















