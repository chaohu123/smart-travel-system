import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'
import path from 'path'

// 基于官方模板的简化版配置，支持 Vue3 + uni-app
export default defineConfig({
  plugins: [uni()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
})






























<<<<<<< HEAD

=======
>>>>>>> 299642f29c0d19bfedecf29490a18cfe2ad7de4f
