import { z } from 'zod'

export const itemSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  type: z.enum(['consumable', 'key', 'equipment', 'quest', 'misc']),
  stackable: z.boolean().default(false),
  maxStack: z.number().int().positive().optional(),
  weight: z.number().nonnegative().default(0),
  image: z.string().optional(),
  /** Optional reference to an appearance that this item provides when equipped */
  appearanceId: z.string().optional(),
  properties: z.record(z.string(), z.unknown()).optional(),
})

export type Item = z.infer<typeof itemSchema>
