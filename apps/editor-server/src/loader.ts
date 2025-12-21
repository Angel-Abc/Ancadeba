import fs from 'node:fs'
import z from 'zod'
import { gameSchema } from '@ancadeba/schemas'

export const categorySchemaValidators: Record<string, any> = {
  game: gameSchema,
}

export function loadJsonResource(url: string, category: string): any {
  const jsonFile = fs.readFileSync(url, 'utf-8')
  const object: any = JSON.parse(jsonFile)
  const schema = categorySchemaValidators[category]
  z.parse(schema, object)
  return object
}
