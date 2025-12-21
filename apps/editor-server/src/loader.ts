import fs from 'node:fs'
import z from 'zod'
import { gameSchema } from '@ancadeba/schemas'

export const categorySchemaValidators: Record<string, z.ZodTypeAny> = {
  game: gameSchema,
}

export function loadJsonResource(url: string, category: string): unknown {
  const jsonFile = fs.readFileSync(url, 'utf-8')
  const object = JSON.parse(jsonFile) as unknown
  const schema = categorySchemaValidators[category]
  if (!schema) {
    throw new Error(`Unknown schema category: ${category}`)
  }
  z.parse(schema, object)
  return object
}
