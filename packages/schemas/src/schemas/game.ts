import z from 'zod'
import { BaseSchema } from './base'

export const gameSchema = BaseSchema.extend({
  title: z.string(),
  description: z.string(),
  version: z.string(),
})

export type GameSchemaType = typeof gameSchema
