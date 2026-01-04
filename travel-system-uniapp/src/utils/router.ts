/**
 * 路由工具函数
 * 解决微信小程序路由跳转时的 webview 错误问题
 */

// 防抖：避免快速连续跳转
let isNavigating = false
let navigateTimer: ReturnType<typeof setTimeout> | null = null
let lastNavigateUrl = '' // 记录上次跳转的URL
let lastNavigateTime = 0 // 记录上次跳转的时间
const NAVIGATE_DEBOUNCE_TIME = 300 // 300ms 防抖时间

/**
 * 安全的路由跳转（navigateTo）
 * @param url 目标页面路径
 * @param options 跳转选项
 */
export const safeNavigateTo = (url: string, options?: UniApp.NavigateToOptions) => {
  const now = Date.now()
  
  // 防抖：如果正在跳转，且是同一个 URL，则忽略（防止重复点击）
  if (isNavigating && lastNavigateUrl === url) {
    return Promise.resolve()
  }
  
  // 防抖：如果距离上次跳转时间太短，且是同一个URL，则忽略
  if (now - lastNavigateTime < NAVIGATE_DEBOUNCE_TIME && lastNavigateUrl === url) {
    return Promise.resolve()
  }

  // 清除之前的定时器
  if (navigateTimer) {
    clearTimeout(navigateTimer)
    navigateTimer = null
  }

  isNavigating = true
  lastNavigateUrl = url
  lastNavigateTime = now

  // 使用 Promise 包装，确保跳转完成后再允许下一次跳转
  return new Promise<void>((resolve, reject) => {
    uni.navigateTo({
      url,
      ...options,
      success: (res) => {
        // 延迟重置状态，确保页面加载完成
        navigateTimer = setTimeout(() => {
          isNavigating = false
          navigateTimer = null
          lastNavigateUrl = '' // 清除URL记录
        }, 300) // 减少延迟时间，提升响应速度
        options?.success?.(res)
        resolve()
      },
      fail: (err) => {
        // 立即重置状态，允许重试
        isNavigating = false
        lastNavigateUrl = ''
        if (navigateTimer) {
          clearTimeout(navigateTimer)
          navigateTimer = null
        }
        
        // 处理超时错误
        if (err.errMsg?.includes('timeout') || err.errMsg?.includes('timedout')) {
          // 超时错误不重试，直接拒绝
          options?.fail?.(err)
          reject(err)
          return
        }
        
        // 如果是 webview 错误，尝试延迟重试
        if (err.errMsg?.includes('webview') || err.errMsg?.includes('route')) {
          setTimeout(() => {
            safeNavigateTo(url, options).then(resolve).catch(reject)
          }, 500)
        } else {
          // 其他错误也尝试重试一次
          setTimeout(() => {
            isNavigating = false
            lastNavigateUrl = ''
            safeNavigateTo(url, options).then(resolve).catch(reject)
          }, 300)
        }
      },
      complete: () => {
        options?.complete?.()
      }
    })
  })
}

/**
 * 安全的 Tab 切换（switchTab）
 * @param url 目标页面路径
 * @param options 跳转选项
 */
export const safeSwitchTab = (url: string, options?: UniApp.SwitchTabOptions) => {
  const now = Date.now()
  
  // 防抖：如果正在跳转，且是同一个 URL，则忽略
  if (isNavigating && lastNavigateUrl === url) {
    return Promise.resolve()
  }
  
  // 防抖：如果距离上次跳转时间太短，且是同一个URL，则忽略
  if (now - lastNavigateTime < NAVIGATE_DEBOUNCE_TIME && lastNavigateUrl === url) {
    return Promise.resolve()
  }

  if (navigateTimer) {
    clearTimeout(navigateTimer)
  }

  isNavigating = true
  lastNavigateUrl = url
  lastNavigateTime = now

  return new Promise<void>((resolve, reject) => {
    uni.switchTab({
      url,
      ...options,
      success: (res) => {
        navigateTimer = setTimeout(() => {
          isNavigating = false
          navigateTimer = null
          lastNavigateUrl = ''
        }, 200) // Tab切换更快
        options?.success?.(res)
        resolve()
      },
      fail: (err) => {
        isNavigating = false
        lastNavigateUrl = ''
        if (err.errMsg?.includes('webview') || err.errMsg?.includes('route')) {
          setTimeout(() => {
            safeSwitchTab(url, options).then(resolve).catch(reject)
          }, 500)
        } else {
          options?.fail?.(err)
          reject(err)
        }
      },
      complete: () => {
        options?.complete?.()
      }
    })
  })
}

/**
 * 安全的重定向（redirectTo）
 * @param url 目标页面路径
 * @param options 跳转选项
 */
export const safeRedirectTo = (url: string, options?: UniApp.RedirectToOptions) => {
  if (isNavigating) {
    return
  }

  if (navigateTimer) {
    clearTimeout(navigateTimer)
  }

  isNavigating = true

  return new Promise<void>((resolve, reject) => {
    uni.redirectTo({
      url,
      ...options,
      success: (res) => {
        navigateTimer = setTimeout(() => {
          isNavigating = false
          navigateTimer = null
        }, 300)
        options?.success?.(res)
        resolve()
      },
      fail: (err) => {
        isNavigating = false
        if (err.errMsg?.includes('webview') || err.errMsg?.includes('route')) {
          setTimeout(() => {
            safeRedirectTo(url, options).then(resolve).catch(reject)
          }, 500)
        } else {
          options?.fail?.(err)
          reject(err)
        }
      },
      complete: () => {
        options?.complete?.()
      }
    })
  })
}

/**
 * 重置导航状态（在页面 onLoad 时调用）
 */
export const resetNavigationState = () => {
  isNavigating = false
  lastNavigateUrl = ''
  lastNavigateTime = 0
  if (navigateTimer) {
    clearTimeout(navigateTimer)
    navigateTimer = null
  }
}

