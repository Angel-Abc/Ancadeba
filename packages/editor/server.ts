import { config as loadEnv } from 'dotenv'
import express from 'express'
import cors from 'cors'
import { promises as fs } from 'fs'
import path from 'path'

loadEnv()
loadEnv({ path: '.env.local', override: true })

const basePath = process.env.GAME_DIR ?? process.env.VITE_DATA_PATH ?? '/data'
const resolvedBase = path.resolve(basePath)
console.log(`Serving data from ${resolvedBase}`)

export const createServer = () => {
  const app = express()
  app.use(express.json())

  const allowedOrigin = process.env.VITE_EDITOR_ORIGIN ?? 'http://localhost:5174'
  app.use(cors({ origin: allowedOrigin }))

  const safeJoin = (subPath: string): string => {
    const filePath = path.resolve(resolvedBase, subPath)
    if (!filePath.startsWith(resolvedBase + path.sep) && filePath !== resolvedBase) {
      throw new Error('Invalid path')
    }
    return filePath
  }

  const relativePath = (p: string) => p.replace(/^\/data\/?/, '')

  app.get('/data/*subPath', async (req, res) => {
    try {
      const filePath = safeJoin(relativePath(req.path))
      const data = await fs.readFile(filePath, 'utf8')
      res.json(JSON.parse(data))
    } catch {
      res.sendStatus(404)
    }
  })

  app.put('/data/*subPath', async (req, res) => {
    try {
      const filePath = safeJoin(relativePath(req.path))
      await fs.mkdir(path.dirname(filePath), { recursive: true })
      await fs.writeFile(filePath, JSON.stringify(req.body, null, 2))
      res.sendStatus(204)
    } catch {
      res.sendStatus(500)
    }
  })

  return app
}

if (process.env.NODE_ENV !== 'test') {
  const port = 3000
  createServer().listen(port, () => {
    console.log(`Server listening on port ${port}`)
  })
}
