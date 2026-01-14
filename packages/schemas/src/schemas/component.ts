import { z } from 'zod'
import { actionSchema } from './action'
import { conditionSchema } from './conditions'

const locationSchema = z.object({
  x: z.number().int().nonnegative(),
  y: z.number().int().nonnegative(),
})

const sizeSchema = z.object({
  width: z.number().int().positive(),
  height: z.number().int().positive(),
})

const borderSchema = z
  .object({
    width: z.number().int().nonnegative().default(0),
    padding: z.number().int().nonnegative().default(0),
    margin: z.number().int().nonnegative().default(0),
  })
  .default({ width: 0, padding: 0, margin: 0 })

export const inputRuleSchema = z.object({
  virtualInput: z.string().optional(),
  enabled: conditionSchema.optional(),
  visible: conditionSchema.optional(),
  caption: z.string().optional(),
})

const baseComponentSchema = z.object({
  location: locationSchema,
  size: sizeSchema,
  visible: z.boolean().default(true),
  border: borderSchema,
  inputRules: z.array(inputRuleSchema).optional(),
})

const backgroundComponentSchema = baseComponentSchema.extend({
  type: z.literal('background'),
  color: z.string(),
  image: z.string(),
})

const menuOptionSchema = z.object({
  label: z.string(),
  actions: z.array(actionSchema).min(1),
  condition: conditionSchema.optional(),
})

const inventoryComponentSchema = baseComponentSchema.extend({
  type: z.literal('inventory'),
})

const appearanceComponentSchema = baseComponentSchema.extend({
  type: z.literal('appearance'),
  categoryId: z.string(),
})

const textLogComponentSchema = baseComponentSchema.extend({
  type: z.literal('text-log'),
})

const inputBarComponentSchema = baseComponentSchema.extend({
  type: z.literal('input-bar'),
})

const characterSheetComponentSchema = baseComponentSchema.extend({
  type: z.literal('character-sheet'),
})

const menuComponentSchema = baseComponentSchema.extend({
  type: z.literal('menu'),
  options: z.array(menuOptionSchema).min(1),
})

const squaresMapComponentSchema = baseComponentSchema.extend({
  type: z.literal('squares-map'),
  viewport: sizeSchema,
})

export const componentSchema = z.discriminatedUnion('type', [
  backgroundComponentSchema,
  menuComponentSchema,
  squaresMapComponentSchema,
  inventoryComponentSchema,
  appearanceComponentSchema,
  characterSheetComponentSchema,
  textLogComponentSchema,
  inputBarComponentSchema,
])

export type Component = z.infer<typeof componentSchema>
export type BackgroundComponent = z.infer<typeof backgroundComponentSchema>
export type MenuComponent = z.infer<typeof menuComponentSchema>
export type SquaresMapComponent = z.infer<typeof squaresMapComponentSchema>
export type InventoryComponent = z.infer<typeof inventoryComponentSchema>
export type AppearanceComponent = z.infer<typeof appearanceComponentSchema>
export type CharacterSheetComponent = z.infer<
  typeof characterSheetComponentSchema
>
export type TextLogComponent = z.infer<typeof textLogComponentSchema>
export type InputBarComponent = z.infer<typeof inputBarComponentSchema>
export type InputRule = z.infer<typeof inputRuleSchema>
