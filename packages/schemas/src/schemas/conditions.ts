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
  z.object({
    type: z.literal('value-set'),
    name: z.string(),
  }),
  z.object({
    type: z.literal('value-not-set'),
    name: z.string(),
  }),
  z.object({
    type: z.literal('value-equals'),
    name: z.string(),
    value: z.string(),
  }),
])
export type Condition = z.infer<typeof conditionSchema>
export type ValueSetCondition = Extract<Condition, { type: 'value-set' }>
export type ValueNotSetCondition = Extract<Condition, { type: 'value-not-set' }>
export type ValueEqualsCondition = Extract<Condition, { type: 'value-equals' }>
