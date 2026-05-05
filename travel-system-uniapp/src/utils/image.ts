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
    // 不返回本地静态路径，交给调用方使用各自的默认图
    return ''
  }
  
  const rawUrl = String(url).trim()
  if (!rawUrl) return ''

  let fullUrl = ''
  
  // 如果已经是完整的URL（http/https开头），直接使用
  if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) {
    fullUrl = rawUrl
  } else {
    // 如果是相对路径，添加BASE_URL
    // 处理 /uploads/ 开头的路径
    if (rawUrl.startsWith('/uploads/')) {
      fullUrl = `${BASE_URL}${rawUrl}`
    } else if (rawUrl.startsWith('uploads/')) {
      // 处理 uploads/ 开头的路径（没有前导斜杠）
      fullUrl = `${BASE_URL}/${rawUrl}`
    } else {
      // 其他情况，假设是相对路径，添加BASE_URL
      fullUrl = `${BASE_URL}${rawUrl.startsWith('/') ? rawUrl : '/' + rawUrl}`
    }
  }

  // 小程序端兜底：如果后端返回了 localhost/127.0.0.1，替换为配置中的静态域名/IP
  try {
    const base = new URL(BASE_URL)
    const targetOrigin = `${base.protocol}//${base.host}`
    fullUrl = fullUrl
      .replace(/^https?:\/\/localhost(?::\d+)?/i, targetOrigin)
      .replace(/^https?:\/\/127\.0\.0\.1(?::\d+)?/i, targetOrigin)
  } catch (e) {
    // 忽略 URL 解析失败
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

