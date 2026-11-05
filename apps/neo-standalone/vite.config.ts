import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

/** Option A only. docs/009a-vite-proxy.md. The page never calls Host itself. */
export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: 5179,
    strictPort: true,
    cors: false,
    proxy: {
      '/orchestrator': {
        target: 'http://127.0.0.1:3082',
        changeOrigin: true,
        configure(proxy) {
          proxy.on('proxyReq', proxyReq => {
            proxyReq.setHeader('x-orchestrator-request', '1')
            proxyReq.setHeader('origin', 'http://127.0.0.1:3082')
          })
        },
      },
    },
  },
})
