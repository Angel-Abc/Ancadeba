import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [react({ jsxRuntime: 'automatic' })],
  resolve: {
    alias: {
      '@actions': fileURLToPath(new URL('./packages/engine/actions', import.meta.url)),
      '@app': fileURLToPath(new URL('./packages/engine/app', import.meta.url)),
      '@builders': fileURLToPath(new URL('./packages/engine/builders', import.meta.url)),
      '@conditions': fileURLToPath(new URL('./packages/engine/conditions', import.meta.url)),
      '@core': fileURLToPath(new URL('./packages/engine/core', import.meta.url)),
      '@ioc': fileURLToPath(new URL('./packages/shared/ioc', import.meta.url)),
      '@inputs': fileURLToPath(new URL('./packages/engine/inputs', import.meta.url)),
      '@loader/schema': fileURLToPath(new URL('./packages/shared/loader/schema', import.meta.url)),
      '@loader': fileURLToPath(new URL('./packages/engine/loader', import.meta.url)),
      '@managers': fileURLToPath(new URL('./packages/engine/managers', import.meta.url)),
      '@messages': fileURLToPath(new URL('./packages/engine/messages', import.meta.url)),
      '@providers': fileURLToPath(new URL('./packages/engine/providers', import.meta.url)),
      '@registries': fileURLToPath(new URL('./packages/engine/registries', import.meta.url)),
      '@services': fileURLToPath(new URL('./packages/engine/services', import.meta.url)),
      '@utils': fileURLToPath(new URL('./packages/shared/utils', import.meta.url)),
      '@editor': fileURLToPath(new URL('./packages/editor', import.meta.url)),
    }
  }
})
