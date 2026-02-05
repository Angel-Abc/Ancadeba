import { z } from 'zod'

export const gameSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  version: z.string(),
  surfaces: z.record(z.string(), z.string()),
  widgets: z.record(z.string(), z.string()),
})

export type Game = z.infer<typeof gameSchema>
