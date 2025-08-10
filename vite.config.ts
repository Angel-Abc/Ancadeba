import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@loader': fileURLToPath(new URL('./engine/loader', import.meta.url)),
      '@ioc': fileURLToPath(new URL('./engine/ioc', import.meta.url)),
      '@builders': fileURLToPath(new URL('./engine/builders', import.meta.url)),
      '@app': fileURLToPath(new URL('./engine/app', import.meta.url)),
      '@engine': fileURLToPath(new URL('./engine/engine', import.meta.url)),
      '@editor': fileURLToPath(new URL('./editor', import.meta.url)),
    }
  }
})
