import { getCache, removeCache } from './storage'
import { API_BASE_URL } from './config'

export interface RequestOptions extends UniApp.RequestOptions {
  needAuth?: boolean
  showLoading?: boolean
  needRetry?: boolean
}

const BASE_URL = API_BASE_URL

const getToken = () => getCache<string>('token')

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
    header = {},
    data,
    ...rest
  } = options

  const token = getToken()
  const headers: Record<string, any> = { ...header }
  if (token) {
    headers.Authorization = `Bearer ${token}`
    // 调试信息：显示token和请求头
    if (needAuth) {
      console.log('🔐 [HTTP请求] 需要认证的请求:', {
        url: url,
        token: token,
        tokenLength: token.length,
        tokenPreview: token.substring(0, 30) + '...',
        authorizationHeader: headers.Authorization,
        authorizationPreview: headers.Authorization.substring(0, 40) + '...'
      })
    }
  }

  if (needAuth && !token) {
    console.error('❌ [HTTP请求] 需要认证但token为空:', url)
    handleAuthFail()
    return Promise.reject(new Error('no-token'))
  }

  if (showLoading) {
    uni.showLoading({ title: '加载中', mask: true })
  }

  // 清理 data 中的 undefined 和 null 值
  const cleanedData = data ? cleanParams(data) : undefined

  const run = () =>
    new Promise<UniApp.RequestSuccessCallbackResult & { data: any }>((resolve, reject) => {
      // 设置默认超时时间为60秒，如果options中指定了timeout则使用指定的值
      const timeout = (rest as any).timeout || 60000
      
      const fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`
      
      uni.request({
        url: fullUrl,
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
          resolve(res as any)
        },
        fail: (err) => {
          reject(err)
        },
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





















