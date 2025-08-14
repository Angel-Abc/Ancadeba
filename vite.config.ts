import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'
import { viteStaticCopy } from 'vite-plugin-static-copy'
import { resolve } from 'node:path'

const gameFolder = process.env.GAME_FOLDER || 'sample-game'
const rootDir = fileURLToPath(new URL('.', import.meta.url))
const withEditor = process.env.WITH_EDITOR !== 'false'

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
      '@editor': fileURLToPath(new URL('./editor', import.meta.url)),
      '@app': fileURLToPath(new URL('./engine/app', import.meta.url)),
      '@builders': fileURLToPath(new URL('./engine/builders', import.meta.url)),
      '@engine': fileURLToPath(new URL('./engine/engine', import.meta.url)),
      '@ioc': fileURLToPath(new URL('./engine/ioc', import.meta.url)),
      '@loader': fileURLToPath(new URL('./engine/loader', import.meta.url)),
      '@managers': fileURLToPath(new URL('./engine/managers', import.meta.url)),
      '@messages': fileURLToPath(new URL('./engine/messages', import.meta.url)),
      '@providers': fileURLToPath(new URL('./engine/providers', import.meta.url)),
      '@registries': fileURLToPath(new URL('./engine/registries', import.meta.url)),
      '@services': fileURLToPath(new URL('./engine/services', import.meta.url)),
      '@utils': fileURLToPath(new URL('./utils', import.meta.url)),
    }
  },
  build: {
    rollupOptions: {
      input: {
        index: resolve(rootDir, 'index.html'),
        ...(withEditor ? { editor: resolve(rootDir, 'editor/editor.html') } : {}),
      },
    },
  }

})
