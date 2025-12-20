import { z } from 'zod'

/**
 * Base schema shared by all game resources
 */
export const BaseResourceSchema = z.object({
  id: z.string(),
  name: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

/**
 * Example: Level resource
 * (You will expand this over time)
 */
export const LevelSchema = BaseResourceSchema.extend({
  type: z.literal('level'),
  difficulty: z.number().int().min(1).max(10),
  mapFile: z.string(),
})

/**
 * Inferred TypeScript types
 */
export type BaseResource = z.infer<typeof BaseResourceSchema>
export type Level = z.infer<typeof LevelSchema>
