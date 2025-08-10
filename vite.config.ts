import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'
import { viteStaticCopy } from 'vite-plugin-static-copy'
import { resolve } from 'node:path'

const gameFolder = process.env.GAME_FOLDER || 'sample-game'
const rootDir = fileURLToPath(new URL('.', import.meta.url))
const withEditor = process.env.WITH_EDITOR !== 'false'

export default defineConfig({
  plugins: [
    react(),
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
      '@loader': fileURLToPath(new URL('./engine/loader', import.meta.url)),
      '@ioc': fileURLToPath(new URL('./engine/ioc', import.meta.url)),
      '@builders': fileURLToPath(new URL('./engine/builders', import.meta.url)),
      '@app': fileURLToPath(new URL('./engine/app', import.meta.url)),
      '@engine': fileURLToPath(new URL('./engine/engine', import.meta.url)),
      '@editor': fileURLToPath(new URL('./editor', import.meta.url)),
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
