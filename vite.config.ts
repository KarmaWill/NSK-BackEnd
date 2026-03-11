import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': '/src' } },
  server: {
    host: true, // 允许局域网访问（本机 IP:5173）
  },
  build: {
    rollupOptions: {
      input: ['index.html', 'cms.html'],
    },
  },
})
