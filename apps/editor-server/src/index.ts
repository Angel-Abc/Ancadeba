import express from 'express'
import rateLimit from 'express-rate-limit'
import path from 'node:path'
import fs from 'node:fs'
import dotenv from 'dotenv'
import { fileURLToPath } from 'node:url'

// Resolve repo root and load .env from there
const currentDir = path.dirname(fileURLToPath(import.meta.url))
const packageRoot = path.resolve(currentDir, '..')
const repoRoot = path.resolve(packageRoot, '..', '..')

dotenv.config({ path: path.join(repoRoot, '.env') })

const app = express()

const port = Number(process.env.PORT ?? 3001)
const gameDirEnv = (process.env.GAME_DIR ?? '').trim()

const readPositiveInteger = (
  value: string | undefined,
  fallback: number,
  label: string
): number => {
  if (!value) {
    return fallback
  }

  const parsed = Number.parseInt(value, 10)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    console.warn(
      `[editor-server] Invalid ${label}. Using fallback value: ${fallback}`
    )
    return fallback
  }

  return parsed
}

const limiterWindowMs = readPositiveInteger(
  process.env.RATE_LIMIT_WINDOW_MS,
  60_000,
  'RATE_LIMIT_WINDOW_MS'
)
const limiterMaxRequests = readPositiveInteger(
  process.env.RATE_LIMIT_MAX,
  120,
  'RATE_LIMIT_MAX'
)

const rateLimiter = rateLimit({
  windowMs: limiterWindowMs,
  max: limiterMaxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({ error: 'Too many requests' })
  }
})

if (!gameDirEnv) {
  throw new TypeError(
    '[editor-server] Missing GAME_DIR. Set it in .env at repo root.'
  )
}

const baseDir = path.isAbsolute(gameDirEnv)
  ? gameDirEnv
  : path.resolve(repoRoot, gameDirEnv)

// Basic validation of configured directory
if (!fs.existsSync(baseDir) || !fs.statSync(baseDir).isDirectory()) {
  console.error(`[editor-server] GAME_DIR path is invalid: ${baseDir}`)
  process.exit(1)
}

app.use(rateLimiter)

// Serve only JSON files from configured directory
// Express 5 uses path-to-regexp v8; use a RegExp for *.json
app.get(/^\/.+\.json$/i, (req, res) => {
  const reqPath = req.path.replace(/^\/+/, '')
  const unsafePath = path.join(baseDir, reqPath)
  const filePath = path.resolve(unsafePath)

  // Prevent path traversal by ensuring filePath stays within baseDir
  const relative = path.relative(baseDir, filePath)
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    return res.status(400).json({ error: 'Invalid path' })
  }

  fs.access(filePath, fs.constants.R_OK, (err) => {
    if (err) {
      return res.status(404).json({ error: 'File not found' })
    }

    res.type('application/json')
    res.sendFile(filePath)
  })
})

app.get('/', (_req, res) => {
  res.json({ ok: true, baseDir })
})

app.listen(port, () => {
  console.log(`[editor-server] Listening on http://localhost:${port}`)
  console.log(`[editor-server] Serving JSON from: ${baseDir}`)
})
