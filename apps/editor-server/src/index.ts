import express, { type Application } from 'express'
import path from 'node:path'
import fs from 'node:fs'
import { invariant } from '@ancadeba/utils'
import { loadJsonResource } from './loader'

const app: Application = express()
app.use(express.json())

const GAME_RESOURCES_DIR =
  process.env.GAME_RESOURCES_DIR ??
  path.resolve(process.cwd(), '../../game-resources')

invariant(
  fs.existsSync(GAME_RESOURCES_DIR),
  `Game resources directory does not exist: ${GAME_RESOURCES_DIR}`
)

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.use((req, _res, next) => {
  console.log(`${req.method} ${req.url}`)
  next()
})

app.get('/api/game', (_req, res) => {
  var resourcePath = `${GAME_RESOURCES_DIR}/game.json`
  const result = loadJsonResource(resourcePath, 'game')
  res.json(result)
})

app.get('/api/:category/:resource', (req, res) => {
  const { category, resource } = req.params
  const resourcePath = `${GAME_RESOURCES_DIR}/${category}/${resource}.json`
  const result = loadJsonResource(resourcePath, category)
  res.json(result)
})

if (process.env.NODE_ENV !== 'test') {
  const port = Number(process.env.PORT ?? 3001)
  app.listen(port, () => {
    console.log(`Editor server listening on port ${port}`)
    console.log(`Game resources: ${GAME_RESOURCES_DIR}`)
  })
}

export { app }
