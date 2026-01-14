import { z } from 'zod'

export const actionSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('switch-scene'),
    targetSceneId: z.string(),
  }),
  z.object({
    type: z.literal('exit-game'),
  }),
  z.object({
    type: z.literal('set-flag'),
    name: z.string(),
    value: z.boolean(),
  }),
  z.object({
    type: z.literal('back'),
  }),
  z.object({
    type: z.literal('volume-up'),
  }),
  z.object({
    type: z.literal('volume-down'),
  }),
  z.object({
    type: z.literal('add-item'),
    itemId: z.string(),
    quantity: z.number().int().positive().default(1),
  }),
  z.object({
    type: z.literal('remove-item'),
    itemId: z.string(),
    quantity: z.number().int().positive().default(1),
  }),
  z.object({
    type: z.literal('equip-appearance'),
    categoryId: z.string(),
    appearanceId: z.string(),
  }),
  z.object({
    type: z.literal('unequip-appearance'),
    categoryId: z.string(),
  }),
])

export type Action = z.infer<typeof actionSchema>
export type AddItemAction = Extract<Action, { type: 'add-item' }>
export type RemoveItemAction = Extract<Action, { type: 'remove-item' }>
export type EquipAppearanceAction = Extract<
  Action,
  { type: 'equip-appearance' }
>
export type UnequipAppearanceAction = Extract<
  Action,
  { type: 'unequip-appearance' }
>
