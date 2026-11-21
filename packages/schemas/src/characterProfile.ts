import { z } from 'zod'
import { gameIdSchema } from './gameId.js'

export const characterProfileSchema = z.strictObject({
  fields: z
    .array(gameIdSchema)
    .min(1)
    .refine((ids) => new Set(ids).size === ids.length, 'Choose each field only once'),
  character: gameIdSchema,
})

export type CharacterProfileDefinition = z.infer<typeof characterProfileSchema>
