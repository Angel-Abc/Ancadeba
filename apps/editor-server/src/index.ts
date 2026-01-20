import express, { type Application } from 'express'
import path from 'node:path'
import fs from 'node:fs'

import { invariant } from '@ancadeba/utils'
// import { LevelSchema } from '@ancadeba/schemas'

const app: Application = express()
app.use(express.json())

/**
 * Resolve game resources directory.
 *
 * This is intentionally external to the repo.
 */
const GAME_RESOURCES_DIR =
  process.env.GAME_RESOURCES_DIR ??
  path.resolve(process.cwd(), '../../game-resources')

/**
 * Ensure the directory exists at startup.
 */
invariant(
  fs.existsSync(GAME_RESOURCES_DIR),
  `Game resources directory does not exist: ${GAME_RESOURCES_DIR}`
)

/**
 * Health check
 */
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.use((req, _res, next) => {
  console.log(`${req.method} ${req.url}`)
  next()
})

// app.get('/api/levels', (_req, res) => {
//   const levelsDir = path.join(GAME_RESOURCES_DIR, 'levels')

//   if (!fs.existsSync(levelsDir)) {
//     return res.json([])
//   }

//   const files = fs.readdirSync(levelsDir).filter((f) => f.endsWith('.json'))

//   const levels = files.map((file) => {
//     const raw = fs.readFileSync(path.join(levelsDir, file), 'utf-8')
//     return LevelSchema.parse(JSON.parse(raw))
//   })

//   res.json(levels)
// })

export { app }

if (process.env.NODE_ENV !== 'test') {
  const port = Number(process.env.PORT ?? 3001)
  app.listen(port, () => {
    console.log(`Editor server listening on port ${port}`)
    console.log(`Game resources: ${GAME_RESOURCES_DIR}`)
  })
}
