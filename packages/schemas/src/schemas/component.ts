import { z } from 'zod'
import { inputRuleSchema, menuOptionSchema } from './componentCommon'
import { sizeSchema, borderSchema } from './componentTypes'
import { conditionSchema } from './conditions'

const locationSchema = z.object({
  x: z.number().int().nonnegative(),
  y: z.number().int().nonnegative(),
})

const baseComponentSchema = z.object({
  location: locationSchema,
  size: sizeSchema,
  visible: z.union([z.boolean(), conditionSchema]).optional().default(true),
  border: borderSchema.optional().default({ width: 0, padding: 0, margin: 0 }),
  inputRules: z.array(inputRuleSchema).optional(),
})

// Define all component type schemas directly
const backgroundComponentSchema = baseComponentSchema.extend({
  type: z.literal('background'),
  color: z.string(),
  image: z.string(),
})

const inventoryComponentSchema = baseComponentSchema.extend({
  type: z.literal('inventory'),
  slotsPerRow: z.number().int().positive(),
  rows: z.number().int().positive(),
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

const itemDetailsComponentSchema = baseComponentSchema.extend({
  type: z.literal('item-details'),
  'itemId-field': z.string(),
})

const menuComponentSchema = baseComponentSchema.extend({
  type: z.literal('menu'),
  options: z.array(menuOptionSchema).min(1),
})

const squaresMapComponentSchema = baseComponentSchema.extend({
  type: z.literal('squares-map'),
  viewport: sizeSchema,
})

// Inline component (legacy format with all properties)
const inlineComponentSchema = z.union([
  backgroundComponentSchema,
  menuComponentSchema,
  squaresMapComponentSchema,
  inventoryComponentSchema,
  appearanceComponentSchema,
  characterSheetComponentSchema,
  itemDetailsComponentSchema,
  textLogComponentSchema,
  inputBarComponentSchema,
])

// Component reference (references a component definition by ID)
const componentReferenceSchema = z.object({
  definitionId: z.string(),
  location: locationSchema,
  size: sizeSchema,
  visible: z.union([z.boolean(), conditionSchema]).optional().default(true),
  // Optional overrides for definition properties
  overrides: z
    .object({
      border: borderSchema.optional(),
      inputRules: z.array(inputRuleSchema).optional(),
      // Type-specific overrides can be added as needed
      color: z.string().optional(),
      image: z.string().optional(),
      categoryId: z.string().optional(),
      viewport: sizeSchema.optional(),
      options: z.array(menuOptionSchema).optional(),
    })
    .optional(),
})

// Union of inline and referenced components
export const componentSchema = z.union([
  inlineComponentSchema,
  componentReferenceSchema,
])

export type Component = z.infer<typeof componentSchema>
export type InlineComponent = z.infer<typeof inlineComponentSchema>
export type ComponentReference = z.infer<typeof componentReferenceSchema>
export type BackgroundComponent = z.infer<typeof backgroundComponentSchema>
export type MenuComponent = z.infer<typeof menuComponentSchema>
export type SquaresMapComponent = z.infer<typeof squaresMapComponentSchema>
export type InventoryComponent = z.infer<typeof inventoryComponentSchema>
export type AppearanceComponent = z.infer<typeof appearanceComponentSchema>
export type CharacterSheetComponent = z.infer<
  typeof characterSheetComponentSchema
>
export type ItemDetailsComponent = z.infer<typeof itemDetailsComponentSchema>
export type TextLogComponent = z.infer<typeof textLogComponentSchema>
export type InputBarComponent = z.infer<typeof inputBarComponentSchema>
