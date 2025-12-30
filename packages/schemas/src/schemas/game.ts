import z from 'zod'
import { BaseSchema } from './base'

export const gameSchema = BaseSchema.extend({
  title: z.string(),
  description: z.string(),
  version: z.string(),
  initialState: z.object({
    scene: z.string(),
    flags: z.record(z.string(), z.boolean()).optional(),
  }),
  scenes: z.array(z.string()),
  styling: z.array(z.string()),
  tileSets: z.array(z.string()),
  maps: z.array(z.string()),
})

export type Game = z.infer<typeof gameSchema>
