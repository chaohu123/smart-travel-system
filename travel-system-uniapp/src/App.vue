<template>
  <slot />
</template>

<script lang="ts">
const isTimeoutError = (msg: unknown): boolean => {
  const text = String(msg || '').toLowerCase()
  return text.includes('timeout') || text.includes('timedout')
}

const isWebviewRouteError = (msg: unknown): boolean => {
  const text = String(msg || '').toLowerCase()
  return (
    text.includes('webview') ||
    text.includes('navigateback') ||
    text.includes('routedone') ||
    text.includes('page route 错误')
  )
}

export default {
  // 小程序全局 Promise 未处理拒绝
  onUnhandledRejection(e: any) {
    const message = e?.reason?.errMsg || e?.reason?.message || e?.reason || ''
    if (isTimeoutError(message) || isWebviewRouteError(message)) {
      // 已在业务层做提示，这里吞掉全局噪音日志
      return
    }
    console.error('UnhandledRejection:', e)
  },
  // 小程序全局脚本错误
  onError(err: any) {
  if (isTimeoutError(err) || isWebviewRouteError(err)) {
      return
    }
    console.error('GlobalError:', err)
  },
}
</script>

<style>
@import "@/static/iconfont/iconfont.css";

page {
  background-color: #f7f8fa;
}
</style>
