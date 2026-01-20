import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import fs from 'node:fs'

const GAME_RESOURCES_DIR =
  process.env.GAME_RESOURCES_DIR ??
  path.resolve(process.cwd(), '../../game-resources')

export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },

  server: {
    fs: {
      allow: [path.resolve(__dirname), GAME_RESOURCES_DIR],
    },
    middlewareMode: false,
  },

  /**
   * Custom middleware to expose game resources under /__resources
   */
  configureServer(server) {
    server.middlewares.use('/__resources', (req, res, next) => {
      if (!req.url) return next()

      const filePath = path.join(GAME_RESOURCES_DIR, req.url)

      // Security: prevent path traversal
      if (!filePath.startsWith(GAME_RESOURCES_DIR)) {
        res.statusCode = 403
        res.setHeader('Content-Type', 'text/plain')
        return res.end('Forbidden')
      }

      // Check if file exists
      if (!fs.existsSync(filePath)) {
        return next()
      }

      // Security: only serve files (not directories)
      const stats = fs.statSync(filePath)
      if (!stats.isFile()) {
        return next()
      }

      // Set appropriate content type
      const ext = path.extname(filePath).toLowerCase()
      const contentTypes: Record<string, string> = {
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.webp': 'image/webp',
        '.mp3': 'audio/mpeg',
        '.wav': 'audio/wav',
        '.ogg': 'audio/ogg',
      }
      res.setHeader(
        'Content-Type',
        contentTypes[ext] ?? 'application/octet-stream',
      )

      try {
        res.end(fs.readFileSync(filePath))
      } catch (err) {
        res.statusCode = 500
        res.setHeader('Content-Type', 'text/plain')
        res.end('Internal Server Error')
      }
    })
  },

  publicDir: false,
})
