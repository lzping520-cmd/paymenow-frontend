import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
    proxy: {
      // 开发期：所有 /api 请求代理到后端
      '/api': {
        target: process.env.VITE_BACKEND || 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  // 环境变量前缀 VITE_ 会注入前端
  envPrefix: 'VITE_',
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
})
