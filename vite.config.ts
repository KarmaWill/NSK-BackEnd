import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': '/src' } },
  server: {
    host: 'localhost', // 避免 os.networkInterfaces() 在某些环境下报错，仅本机访问
  },
  build: {
    rollupOptions: {
      input: ['index.html', 'cms.html'],
    },
  },
})
