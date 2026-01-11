import { z } from 'zod'

export const conditionSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('flag'),
    name: z.string(),
    value: z.boolean(),
  }),
  z.object({
    type: z.literal('can-move-up'),
  }),
  z.object({
    type: z.literal('can-move-down'),
  }),
  z.object({
    type: z.literal('can-move-left'),
  }),
  z.object({
    type: z.literal('can-move-right'),
  }),
])
export type Condition = z.infer<typeof conditionSchema>
