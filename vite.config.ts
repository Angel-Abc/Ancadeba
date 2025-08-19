import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'
import { viteStaticCopy } from 'vite-plugin-static-copy'
import { resolve } from 'node:path'

const gameFolder = process.env.GAME_FOLDER || 'sample-game'
const rootDir = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  envPrefix: ['VITE_', 'LOG_', 'GAME_'],
  plugins: [
    react({
      jsxRuntime: 'automatic'
    }),
    viteStaticCopy({
      targets: [
        { src: `${gameFolder}/**/*`, dest: 'data' },
      ],
      watch: {
        reloadPageOnChange: true,
      }
    })
  ],
  resolve: {
    alias: {
      '@actions': fileURLToPath(new URL('./packages/engine/actions', import.meta.url)),
      '@app': fileURLToPath(new URL('./packages/engine/app', import.meta.url)),
      '@builders': fileURLToPath(new URL('./packages/engine/builders', import.meta.url)),
      '@conditions': fileURLToPath(new URL('./packages/engine/conditions', import.meta.url)),
      '@core': fileURLToPath(new URL('./packages/engine/core', import.meta.url)),
      '@ioc': fileURLToPath(new URL('./packages/engine/ioc', import.meta.url)),
      '@inputs': fileURLToPath(new URL('./packages/engine/inputs', import.meta.url)),
      '@loader': fileURLToPath(new URL('./packages/engine/loader', import.meta.url)),
      '@managers': fileURLToPath(new URL('./packages/engine/managers', import.meta.url)),
      '@messages': fileURLToPath(new URL('./packages/engine/messages', import.meta.url)),
      '@providers': fileURLToPath(new URL('./packages/engine/providers', import.meta.url)),
      '@registries': fileURLToPath(new URL('./packages/engine/registries', import.meta.url)),
      '@services': fileURLToPath(new URL('./packages/engine/services', import.meta.url)),
      '@utils': fileURLToPath(new URL('./packages/shared/utils', import.meta.url)),
    }
  },
  build: {
    rollupOptions: {
      input: {
        index: resolve(rootDir, 'index.html'),
      },
    },
  }

})
