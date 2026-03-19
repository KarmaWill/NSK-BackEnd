import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/** 局域网版本：启动前设置 LAN=1（见 npm run dev:lan），监听 0.0.0.0 供同网段设备访问 */
const lan = process.env.LAN === '1'

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': '/src' } },
  server: {
    host: lan ? '0.0.0.0' : 'localhost',
    strictPort: false,
  },
  preview: {
    host: lan ? '0.0.0.0' : 'localhost',
    strictPort: false,
  },
  build: {
    rollupOptions: {
      input: ['index.html', 'cms.html'],
    },
  },
})
