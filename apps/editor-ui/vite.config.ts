import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },

  /**
   * Proxy API calls to the editor-server during development.
   *
   * This keeps:
   *  - browser code free of hardcoded server URLs
   *  - CORS out of the picture
   */
  server: {
    port: 5174,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
