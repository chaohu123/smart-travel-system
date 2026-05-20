let isNavigating = false
let navigateTimer: ReturnType<typeof setTimeout> | null = null
let lastNavigateUrl = ''
let lastNavigateTime = 0

const NAVIGATE_DEBOUNCE_TIME = 300
const NAVIGATE_TIMEOUT = 4500
const TAB_BAR_PAGES = new Set([
  '/pages/home/home',
  '/pages/route/plan',
  '/pages/checkin/checkin',
  '/pages/travel-note/list',
  '/pages/profile/profile',
])

const normalizePath = (url: string) => {
  if (!url) return ''
  const purePath = url.split('?')[0]
  return purePath.startsWith('/') ? purePath : `/${purePath}`
}

const isTabBarUrl = (url: string) => TAB_BAR_PAGES.has(normalizePath(url))

const getErrMsg = (err: any) => String(err?.errMsg || err?.message || err || '')

const isTimeoutError = (err: any) => {
  const msg = getErrMsg(err).toLowerCase()
  return msg.includes('timeout') || msg.includes('timedout')
}

const isRouteBusyError = (err: any) => {
  const msg = getErrMsg(err).toLowerCase()
  return msg.includes('webview') || msg.includes('route') || msg.includes('navigate')
}

const shouldSkipNavigate = (url: string) => {
  const now = Date.now()
  return (
    (isNavigating && lastNavigateUrl === url) ||
    (now - lastNavigateTime < NAVIGATE_DEBOUNCE_TIME && lastNavigateUrl === url)
  )
}

const lockNavigation = (url: string) => {
  if (navigateTimer) {
    clearTimeout(navigateTimer)
    navigateTimer = null
  }
  isNavigating = true
  lastNavigateUrl = url
  lastNavigateTime = Date.now()
}

const unlockNavigation = (delay = 80) => {
  if (navigateTimer) {
    clearTimeout(navigateTimer)
    navigateTimer = null
  }
  navigateTimer = setTimeout(() => {
    isNavigating = false
    lastNavigateUrl = ''
    navigateTimer = null
  }, delay)
}

const notifyRouteTimeout = () => {
  uni.showToast({
    title: '页面切换超时，请稍后重试',
    icon: 'none',
    duration: 1600,
  })
}

const withoutCallbacks = <T extends Record<string, any> | undefined>(options: T): T => {
  if (!options) return options
  const { success, fail, complete, ...rest } = options
  return rest as T
}

const runWithNavigationTimeout = (
  url: string,
  options: {
    success?: (res: any) => void
    fail?: (err: any) => void
    complete?: () => void
  } | undefined,
  runner: (handlers: {
    success: (res: any) => void
    fail: (err: any) => void
    complete: () => void
  }) => void,
  releaseDelay = 80,
) => {
  lockNavigation(url)

  return new Promise<void>((resolve, reject) => {
    let settled = false
    const timeoutTimer = setTimeout(() => {
      if (settled) return
      settled = true
      const err = { errMsg: 'route timeout' }
      unlockNavigation(0)
      notifyRouteTimeout()
      options?.fail?.(err)
      options?.complete?.()
      resolve()
    }, NAVIGATE_TIMEOUT)

    const finish = (callback: () => void) => {
      if (settled) return
      settled = true
      clearTimeout(timeoutTimer)
      callback()
    }

    runner({
      success: (res) => {
        finish(() => {
          unlockNavigation(releaseDelay)
          options?.success?.(res)
          options?.complete?.()
          resolve()
        })
      },
      fail: (err) => {
        finish(() => {
          unlockNavigation(0)
          if (isTimeoutError(err)) {
            notifyRouteTimeout()
            options?.fail?.(err)
            options?.complete?.()
            resolve()
            return
          }
          options?.fail?.(err)
          options?.complete?.()
          reject(err)
        })
      },
      complete: () => {
        if (!settled) {
          options?.complete?.()
        }
      },
    })
  })
}

export const safeNavigateTo = (
  url: string,
  options?: UniApp.NavigateToOptions,
  retryCount = 0,
): Promise<void> => {
  if (isTabBarUrl(url)) {
    return safeSwitchTab(url)
  }

  if (shouldSkipNavigate(url)) {
    return Promise.resolve()
  }

  return runWithNavigationTimeout(
    url,
    options,
    (handlers) => {
      uni.navigateTo({
        url,
        ...options,
        success: handlers.success,
        fail: (err) => {
          if (getErrMsg(err).includes('tabbar page')) {
            safeSwitchTab(url).then(handlers.success).catch(handlers.fail)
            return
          }
          if (!isTimeoutError(err) && isRouteBusyError(err) && retryCount < 1) {
            unlockNavigation(0)
            setTimeout(() => {
              safeNavigateTo(url, withoutCallbacks(options), retryCount + 1).then(handlers.success).catch(handlers.fail)
            }, 180)
            return
          }
          handlers.fail(err)
        },
        complete: handlers.complete,
      })
    },
    120,
  )
}

export const safeSwitchTab = (
  url: string,
  options?: UniApp.SwitchTabOptions,
  retryCount = 0,
): Promise<void> => {
  if (shouldSkipNavigate(url)) {
    return Promise.resolve()
  }

  return runWithNavigationTimeout(
    url,
    options,
    (handlers) => {
      uni.switchTab({
        url,
        ...options,
        success: handlers.success,
        fail: (err) => {
          if (!isTimeoutError(err) && isRouteBusyError(err) && retryCount < 1) {
            unlockNavigation(0)
            setTimeout(() => {
              safeSwitchTab(url, withoutCallbacks(options), retryCount + 1).then(handlers.success).catch(handlers.fail)
            }, 180)
            return
          }
          handlers.fail(err)
        },
        complete: handlers.complete,
      })
    },
    80,
  )
}

export const safeRedirectTo = (
  url: string,
  options?: UniApp.RedirectToOptions,
  retryCount = 0,
): Promise<void> => {
  if (shouldSkipNavigate(url)) {
    return Promise.resolve()
  }

  return runWithNavigationTimeout(
    url,
    options,
    (handlers) => {
      uni.redirectTo({
        url,
        ...options,
        success: handlers.success,
        fail: (err) => {
          if (!isTimeoutError(err) && isRouteBusyError(err) && retryCount < 1) {
            unlockNavigation(0)
            setTimeout(() => {
              safeRedirectTo(url, withoutCallbacks(options), retryCount + 1).then(handlers.success).catch(handlers.fail)
            }, 180)
            return
          }
          handlers.fail(err)
        },
        complete: handlers.complete,
      })
    },
    120,
  )
}

export const resetNavigationState = () => {
  isNavigating = false
  lastNavigateUrl = ''
  lastNavigateTime = 0
  if (navigateTimer) {
    clearTimeout(navigateTimer)
    navigateTimer = null
  }
}
