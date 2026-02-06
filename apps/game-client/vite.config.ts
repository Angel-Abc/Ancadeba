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
        name: 'game-resources',
        configureServer(server) {
          if (resourcesDir) {
            const targetDir = path.resolve(envDir, resourcesDir)
            server.middlewares.use('/resources', (req, res, next) => {
              const url = req.url?.split('?')[0]
              if (!url) return next()

              const filePath = path.join(
                targetDir,
                decodeURIComponent(url.startsWith('/') ? url.slice(1) : url),
              )

              if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
                const ext = path.extname(filePath).toLowerCase()
                const mimeTypes: Record<string, string> = {
                  '.json': 'application/json',
                  '.png': 'image/png',
                  '.jpg': 'image/jpeg',
                  '.jpeg': 'image/jpeg',
                  '.svg': 'image/svg+xml',
                  '.txt': 'text/plain',
                }
                res.setHeader(
                  'Content-Type',
                  mimeTypes[ext] || 'application/octet-stream',
                )
                fs.createReadStream(filePath).pipe(res)
              } else {
                next()
              }
            })
          }
        },
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
        '/resources': resourcesDir
          ? path.resolve(envDir, resourcesDir)
          : path.resolve(__dirname, 'dist', 'resources'),
      },
    },
    server: {
      fs: {
        allow: [envDir],
      },
    },
  }
})
