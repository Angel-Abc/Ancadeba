import { z } from 'zod'
import { inputRuleSchema, menuOptionSchema } from './componentCommon'
import { borderSchema, sizeSchema } from './componentTypes'

// Base schema for component definitions (without location, size, visible)
const baseComponentDefinitionSchema = z.object({
  id: z.string(),
  border: borderSchema.optional().default({ width: 0, padding: 0, margin: 0 }),
  inputRules: z.array(inputRuleSchema).optional(),
})

// Define all component type schemas directly
const backgroundComponentDefinitionSchema =
  baseComponentDefinitionSchema.extend({
    type: z.literal('background'),
    color: z.string(),
    image: z.string(),
  })

const inventoryComponentDefinitionSchema = baseComponentDefinitionSchema.extend(
  {
    type: z.literal('inventory'),
    slotsPerRow: z.number().int().positive(),
    rows: z.number().int().positive(),
  }
)

const appearanceComponentDefinitionSchema =
  baseComponentDefinitionSchema.extend({
    type: z.literal('appearance'),
    categoryId: z.string(),
  })

const textLogComponentDefinitionSchema = baseComponentDefinitionSchema.extend({
  type: z.literal('text-log'),
})

const inputBarComponentDefinitionSchema = baseComponentDefinitionSchema.extend({
  type: z.literal('input-bar'),
})

const characterSheetComponentDefinitionSchema =
  baseComponentDefinitionSchema.extend({
    type: z.literal('character-sheet'),
  })

const itemDetailsComponentDefinitionSchema =
  baseComponentDefinitionSchema.extend({
    type: z.literal('item-details'),
    'itemId-field': z.string(),
  })

const menuComponentDefinitionSchema = baseComponentDefinitionSchema.extend({
  type: z.literal('menu'),
  options: z.array(menuOptionSchema).min(1),
})

const squaresMapComponentDefinitionSchema =
  baseComponentDefinitionSchema.extend({
    type: z.literal('squares-map'),
    viewport: sizeSchema,
  })

export const componentDefinitionSchema = z.discriminatedUnion('type', [
  backgroundComponentDefinitionSchema,
  menuComponentDefinitionSchema,
  squaresMapComponentDefinitionSchema,
  inventoryComponentDefinitionSchema,
  appearanceComponentDefinitionSchema,
  characterSheetComponentDefinitionSchema,
  itemDetailsComponentDefinitionSchema,
  textLogComponentDefinitionSchema,
  inputBarComponentDefinitionSchema,
])

export type ComponentDefinition = z.infer<typeof componentDefinitionSchema>
export type BackgroundComponentDefinition = z.infer<
  typeof backgroundComponentDefinitionSchema
>
export type MenuComponentDefinition = z.infer<
  typeof menuComponentDefinitionSchema
>
export type SquaresMapComponentDefinition = z.infer<
  typeof squaresMapComponentDefinitionSchema
>
export type InventoryComponentDefinition = z.infer<
  typeof inventoryComponentDefinitionSchema
>
export type AppearanceComponentDefinition = z.infer<
  typeof appearanceComponentDefinitionSchema
>
export type CharacterSheetComponentDefinition = z.infer<
  typeof characterSheetComponentDefinitionSchema
>
export type ItemDetailsComponentDefinition = z.infer<
  typeof itemDetailsComponentDefinitionSchema
>
export type TextLogComponentDefinition = z.infer<
  typeof textLogComponentDefinitionSchema
>
export type InputBarComponentDefinition = z.infer<
  typeof inputBarComponentDefinitionSchema
>
