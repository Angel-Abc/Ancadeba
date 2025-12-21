import express, { type Application } from 'express'
import path from 'node:path'
import fs from 'node:fs'
import z from 'zod'
import { invariant } from '@ancadeba/utils'
import { gameSchema } from '@ancadeba/schemas'

export const categorySchemaValidators: Record<string, any> = {
  game: (json: string) => gameSchema.parse(json),
}

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

app.get('/api/:category/:resource', (req, res) => {
  const { category, resource } = req.params
  const resourcePath = `${GAME_RESOURCES_DIR}/${category}/${resource}.json`
  const jsonFile = fs.readFileSync(resourcePath, 'utf-8')
  const object: any = JSON.parse(jsonFile)
  z.parse(categorySchemaValidators[category], object)
  res.json(object)
})

if (process.env.NODE_ENV !== 'test') {
  const port = Number(process.env.PORT ?? 3001)
  app.listen(port, () => {
    console.log(`Editor server listening on port ${port}`)
    console.log(`Game resources: ${GAME_RESOURCES_DIR}`)
  })
}

export { app }
