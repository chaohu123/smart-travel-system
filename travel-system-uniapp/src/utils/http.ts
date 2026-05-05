import { getCache, removeCache, setCache } from './storage'
import { API_BASE_URL } from './config'
import { getImageUrl } from './image'

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

// 递归规范化响应中的上传图片路径，避免小程序把 /uploads/... 识别为本地资源
const normalizeUploadUrlInData = (value: any): any => {
  if (value === null || value === undefined) return value

  if (typeof value === 'string') {
    const raw = value.trim()
    if (raw.startsWith('/uploads/') || raw.startsWith('uploads/')) {
      return getImageUrl(raw, false)
    }
    return value
  }

  if (Array.isArray(value)) {
    return value.map((item) => normalizeUploadUrlInData(item))
  }

  if (typeof value === 'object') {
    const out: Record<string, any> = {}
    Object.keys(value).forEach((key) => {
      out[key] = normalizeUploadUrlInData((value as Record<string, any>)[key])
    })
    return out
  }

  return value
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

          // 统一将 /uploads/... 转成完整URL，防止页面遗漏转换导致图片加载失败
          if (res && res.data) {
            ;(res as any).data = normalizeUploadUrlInData(res.data)
          }
          
          // 缓存成功的 GET 请求结果
          if (enableCache && method === 'GET' && res.statusCode === 200 && res.data) {
            setCache(cacheKey, res.data, cacheTime)
          }
          
          resolve(res as any)
        },
        fail: (err) => {
          const errMsg = String((err as any)?.errMsg || '')
          // 对 timeout 做统一兜底，避免调用侧未 catch 时出现 Error: timeout
          if (errMsg.includes('timeout')) {
            resolve({
              statusCode: 408,
              data: {
                code: 408,
                msg: '请求超时，请稍后重试',
              },
            } as any)
            return
          }
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
        const errMsg = String((err as any)?.errMsg || '')
        // timeout 已在 fail 中兜底为 resolve，不再二次重试
        if (errMsg.includes('timeout')) {
          return Promise.resolve({
            statusCode: 408,
            data: { code: 408, msg: '请求超时，请稍后重试' },
          } as any)
        }
        return run().catch(() => Promise.reject(err))
      })
    : run()

  pendingRequests.set(requestKey, requestPromise)

  return requestPromise
}

export const uploadFile = (url: string, filePath: string, timeout: number = 60000) => {
  const token = getToken()
  const fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`

  return new Promise<UniApp.UploadFileSuccessCallbackResult & { statusCode: number; data: any }>((resolve, reject) => {
    uni.uploadFile({
      url: fullUrl,
      filePath,
      name: 'file',
      header: token ? { Authorization: `Bearer ${token}` } : {},
      timeout,
      success: (res) => {
        let normalizedData: any = res.data
        try {
          // uploadFile 在小程序中常返回字符串
          if (typeof res.data === 'string') {
            normalizedData = JSON.parse(res.data)
          }
        } catch (e) {
          normalizedData = res.data
        }
        resolve({
          ...(res as any),
          data: normalizeUploadUrlInData(normalizedData),
        } as any)
      },
      fail: (err) => {
        const errMsg = String((err as any)?.errMsg || '')
        if (errMsg.includes('timeout')) {
          resolve({
            statusCode: 408,
            data: { code: 408, msg: '上传超时，请稍后重试' },
          } as any)
          return
        }
        reject(err)
      },
    })
  })
}





















