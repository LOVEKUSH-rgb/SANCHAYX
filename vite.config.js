import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3003,
    host: true,
    allowedHosts: ['sibling-selection-snowiness.ngrok-free.dev'],
    open: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      }
    },
    fs: {
      allow: [
        '.',
        'C:/Users/Yash Srivastava/.gemini/antigravity-ide/brain'
      ]
    }
  }
})