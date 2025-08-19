import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'
import { resolve } from 'node:path'

const rootDir = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  root: rootDir,
  envPrefix: ['VITE_', 'LOG_', 'GAME_'],
  plugins: [
    react({
      jsxRuntime: 'automatic',
    }),
  ],
  resolve: {
    alias: {
      '@utils': fileURLToPath(new URL('../shared/utils', import.meta.url)),
      '@ioc': fileURLToPath(new URL('../shared/ioc', import.meta.url)),
      '@editor': fileURLToPath(new URL('.', import.meta.url)),
      '@loader/schema': fileURLToPath(new URL('../shared/loader/schema', import.meta.url)),
    },
  },
  build: {
    rollupOptions: {
      input: resolve(rootDir, 'index.html'),
    },
  },
  server: {
    port: 5174,
  },
})
