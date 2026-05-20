import { createSSRApp } from 'vue'
import App from './App.vue'

const isTimeoutMessage = (msg: unknown): boolean => {
  const text = String(msg || '').toLowerCase()
  return text.includes('timeout') || text.includes('timedout')
}

const setupGlobalTimeoutGuards = () => {
  // #ifdef MP-WEIXIN
  const wxAny = (globalThis as any).wx
  if (wxAny?.onUnhandledRejection) {
    wxAny.onUnhandledRejection((res: any) => {
      const message = res?.reason?.errMsg || res?.reason?.message || res?.reason || ''
      if (isTimeoutMessage(message)) {
        // 超时由业务层兜底提示，这里吞掉全局未处理报错
        return
      }
      console.error('UnhandledRejection:', res)
    })
  }
  if (wxAny?.onError) {
    wxAny.onError((err: any) => {
      if (isTimeoutMessage(err)) {
        return
      }
      console.error('GlobalError:', err)
    })
  }
  // #endif
}

// 在模块加载时尽早注册（避免 createApp 之前的 timeout 噪音）
setupGlobalTimeoutGuards()

export function createApp() {
  const app = createSSRApp(App)
  return {
    app,
  }
}




