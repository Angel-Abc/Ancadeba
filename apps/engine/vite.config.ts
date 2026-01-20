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

      if (!filePath.startsWith(GAME_RESOURCES_DIR)) {
        res.statusCode = 403
        return res.end('Forbidden')
      }

      if (!fs.existsSync(filePath)) {
        return next()
      }

      res.end(fs.readFileSync(filePath))
    })
  },

  publicDir: false,
})
