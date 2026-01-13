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
  z.object({
    type: z.literal('has-item'),
    itemId: z.string(),
    quantity: z.number().int().positive().default(1),
  }),
  z.object({
    type: z.literal('inventory-space'),
    requiredSlots: z.number().int().positive(),
  }),
])
export type Condition = z.infer<typeof conditionSchema>
