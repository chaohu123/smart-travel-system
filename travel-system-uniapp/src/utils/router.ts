/**
 * 路由工具函数
 * 解决微信小程序路由跳转时的 webview 错误问题
 */

// 防抖：避免快速连续跳转
let isNavigating = false
let navigateTimer: ReturnType<typeof setTimeout> | null = null

/**
 * 安全的路由跳转（navigateTo）
 * @param url 目标页面路径
 * @param options 跳转选项
 */
export const safeNavigateTo = (url: string, options?: UniApp.NavigateToOptions) => {
  if (isNavigating) {
    console.warn('正在跳转中，忽略重复跳转请求:', url)
    return
  }

  // 清除之前的定时器
  if (navigateTimer) {
    clearTimeout(navigateTimer)
  }

  isNavigating = true

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
        }, 300)
        options?.success?.(res)
        resolve()
      },
      fail: (err) => {
        isNavigating = false
        console.error('页面跳转失败:', err)
        // 如果是 webview 错误，尝试延迟重试
        if (err.errMsg?.includes('webview') || err.errMsg?.includes('route')) {
          console.warn('检测到路由错误，延迟重试...')
          setTimeout(() => {
            safeNavigateTo(url, options).then(resolve).catch(reject)
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
 * 安全的 Tab 切换（switchTab）
 * @param url 目标页面路径
 * @param options 跳转选项
 */
export const safeSwitchTab = (url: string, options?: UniApp.SwitchTabOptions) => {
  if (isNavigating) {
    console.warn('正在跳转中，忽略重复跳转请求:', url)
    return
  }

  if (navigateTimer) {
    clearTimeout(navigateTimer)
  }

  isNavigating = true

  return new Promise<void>((resolve, reject) => {
    uni.switchTab({
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
        console.error('Tab 切换失败:', err)
        if (err.errMsg?.includes('webview') || err.errMsg?.includes('route')) {
          console.warn('检测到路由错误，延迟重试...')
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
    console.warn('正在跳转中，忽略重复跳转请求:', url)
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
        console.error('页面重定向失败:', err)
        if (err.errMsg?.includes('webview') || err.errMsg?.includes('route')) {
          console.warn('检测到路由错误，延迟重试...')
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
  if (navigateTimer) {
    clearTimeout(navigateTimer)
    navigateTimer = null
  }
}

