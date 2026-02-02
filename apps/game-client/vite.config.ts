import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'

export default defineConfig(({ mode }) => {
  const envDir = path.resolve(__dirname, '../../')
  const env = loadEnv(mode, envDir)
  const resourcesDir = env.VITE_GAME_RESOURCES_DIR

  return {
    plugins: [
      react(),
      {
        name: 'copy-game-resources',
        closeBundle: () => {
          if (resourcesDir) {
            const src = path.resolve(envDir, resourcesDir)
            const dest = path.resolve(__dirname, 'dist', 'resources')

            if (fs.existsSync(src)) {
              console.log(`Copying game resources from ${src} to ${dest}`)
              fs.cpSync(src, dest, { recursive: true })
            } else {
              console.warn(`Game resources directory not found at ${src}`)
            }
          }
        },
      },
    ],
    envDir: '../../', // Load .env from the root of the monorepo
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  }
})
