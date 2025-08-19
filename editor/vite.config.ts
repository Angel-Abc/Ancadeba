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
      '@utils': fileURLToPath(new URL('../utils', import.meta.url)),
      '@ioc': fileURLToPath(new URL('../engine/ioc', import.meta.url)),
      '@loader/schema': fileURLToPath(new URL('../engine/loader/schema', import.meta.url)),
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
