type CachePayload<T> = {
  value: T
  /** 过期时间戳（毫秒），0 表示不过期 */
  expire: number
}

const now = () => Date.now()

/**
 * 设置缓存，支持分钟级过期
 * @param minutes 过期分钟，默认 0 表示不过期
 */
export const setCache = <T = any>(key: string, value: T, minutes = 0) => {
  const payload: CachePayload<T> = {
    value,
    expire: minutes > 0 ? now() + minutes * 60 * 1000 : 0,
  }
  uni.setStorageSync(key, payload)
}

/**
 * 读取缓存，自动处理过期与清理
 */
export const getCache = <T = any>(key: string): T | null => {
  try {
    const payload = uni.getStorageSync(key) as CachePayload<T> | null
    if (!payload) return null
    if (payload.expire && payload.expire > 0 && payload.expire < now()) {
      removeCache(key)
      return null
    }
    return payload.value as T
  } catch (e) {
    return null
  }
}

export const removeCache = (key: string) => {
  try {
    uni.removeStorageSync(key)
  } catch (e) {
    // ignore
  }
}

