import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

// 判断是否在GitHub Actions环境
const isGitHubCI = !!process.env.GITHUB_ACTIONS

export default defineConfig({
  base: '/warehouse-front-demo/',
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true
      }
    }
  },
  build: {
    // CI环境输出dist，本地输出到后端static文件夹
    outDir: isGitHubCI ? 'dist' : '../warehouse-backend-demo/src/main/resources/static',
    emptyOutDir: true
  }
})
