import { createSSRApp } from 'vue'
import App from './App.vue'
import { install } from '@icon-park/vue-next/es/all'

export function createApp() {
  const app = createSSRApp(App)
  install(app)
  return {
    app,
  }
}





