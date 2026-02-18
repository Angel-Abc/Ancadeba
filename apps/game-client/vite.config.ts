import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'

function normalizePathForCompare(filePath: string): string {
  const normalized = path.normalize(filePath)
  return process.platform === 'win32' ? normalized.toLowerCase() : normalized
}

function isPathInsideDirectory(
  targetDir: string,
  resolvedPath: string,
): boolean {
  const normalizedTargetDir = normalizePathForCompare(path.resolve(targetDir))
  const normalizedResolvedPath = normalizePathForCompare(
    path.resolve(resolvedPath),
  )
  const targetPrefix = normalizedTargetDir.endsWith(path.sep)
    ? normalizedTargetDir
    : `${normalizedTargetDir}${path.sep}`

  return (
    normalizedResolvedPath === normalizedTargetDir ||
    normalizedResolvedPath.startsWith(targetPrefix)
  )
}

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

              let relativePath: string
              try {
                relativePath = decodeURIComponent(
                  url.startsWith('/') ? url.slice(1) : url,
                )
              } catch {
                return next()
              }

              const normalizedRelativePath = path
                .normalize(relativePath)
                .replace(/^([/\\])+/, '')
              const resolvedPath = path.resolve(
                targetDir,
                normalizedRelativePath,
              )

              if (!isPathInsideDirectory(targetDir, resolvedPath)) {
                return next()
              }

              if (
                fs.existsSync(resolvedPath) &&
                fs.statSync(resolvedPath).isFile()
              ) {
                const ext = path.extname(resolvedPath).toLowerCase()
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
                fs.createReadStream(resolvedPath).pipe(res)
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
        '@ancadeba/content': path.resolve(
          __dirname,
          '../../packages/content/src/index.ts',
        ),
        '@ancadeba/engine': path.resolve(
          __dirname,
          '../../packages/engine/src/index.ts',
        ),
        '@ancadeba/engine-ui': path.resolve(
          __dirname,
          '../../packages/engine-ui/src/index.ts',
        ),
        '@ancadeba/ui': path.resolve(
          __dirname,
          '../../packages/ui/src/index.ts',
        ),
        '@ancadeba/utils': path.resolve(
          __dirname,
          '../../packages/utils/src/index.ts',
        ),
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
