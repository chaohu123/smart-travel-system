/**
 * 图片URL处理工具
 */

import { STATIC_BASE_URL } from './config'

// 使用统一的配置获取静态资源基础地址
const BASE_URL = STATIC_BASE_URL

/**
 * 将相对路径转换为完整的图片URL
 * @param url 图片URL（可能是相对路径或完整URL）
 * @param noCache 是否添加时间戳避免缓存（默认true）
 * @returns 完整的图片URL
 */
export const getImageUrl = (url?: string | null, noCache: boolean = true): string => {
  if (!url) {
    return '/static/default-image.jpg'
  }
  
  let fullUrl = ''
  
  // 如果已经是完整的URL（http/https开头），直接使用
  if (url.startsWith('http://') || url.startsWith('https://')) {
    fullUrl = url
  } else {
    // 如果是相对路径，添加BASE_URL
    // 处理 /uploads/ 开头的路径
    if (url.startsWith('/uploads/')) {
      fullUrl = `${BASE_URL}${url}`
    } else if (url.startsWith('uploads/')) {
      // 处理 uploads/ 开头的路径（没有前导斜杠）
      fullUrl = `${BASE_URL}/${url}`
    } else {
      // 其他情况，假设是相对路径，添加BASE_URL
      fullUrl = `${BASE_URL}${url.startsWith('/') ? url : '/' + url}`
    }
  }
  
  // 添加时间戳避免缓存（仅对本地服务器图片）
  if (noCache && fullUrl.includes(BASE_URL)) {
    const separator = fullUrl.includes('?') ? '&' : '?'
    fullUrl = `${fullUrl}${separator}_t=${Date.now()}`
  }
  
  return fullUrl
}

/**
 * 批量处理图片URL数组
 * @param urls 图片URL数组
 * @returns 处理后的图片URL数组
 */
export const getImageUrls = (urls?: (string | null)[]): string[] => {
  if (!urls || urls.length === 0) {
    return []
  }
  return urls.map(url => getImageUrl(url)).filter(url => url)
}

