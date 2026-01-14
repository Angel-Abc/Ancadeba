import { z } from 'zod'
import { inputRuleSchema, menuOptionSchema } from './componentCommon'
import {
  createComponentTypeSchemas,
  sizeSchema,
  borderSchema,
} from './componentTypes'

const locationSchema = z.object({
  x: z.number().int().nonnegative(),
  y: z.number().int().nonnegative(),
})

const baseComponentSchema = z.object({
  location: locationSchema,
  size: sizeSchema,
  visible: z.boolean().default(true),
  border: borderSchema,
  inputRules: z.array(inputRuleSchema).optional(),
})

// Create all component type schemas using the shared factory
const componentTypeSchemas = createComponentTypeSchemas(baseComponentSchema)

const backgroundComponentSchema = componentTypeSchemas.background
const inventoryComponentSchema = componentTypeSchemas.inventory
const appearanceComponentSchema = componentTypeSchemas.appearance
const textLogComponentSchema = componentTypeSchemas.textLog
const inputBarComponentSchema = componentTypeSchemas.inputBar
const characterSheetComponentSchema = componentTypeSchemas.characterSheet
const menuComponentSchema = componentTypeSchemas.menu
const squaresMapComponentSchema = componentTypeSchemas.squaresMap

// Inline component (legacy format with all properties)
const inlineComponentSchema = z.discriminatedUnion('type', [
  backgroundComponentSchema,
  menuComponentSchema,
  squaresMapComponentSchema,
  inventoryComponentSchema,
  appearanceComponentSchema,
  characterSheetComponentSchema,
  textLogComponentSchema,
  inputBarComponentSchema,
])

// Component reference (references a component definition by ID)
const componentReferenceSchema = z.object({
  definitionId: z.string(),
  location: locationSchema,
  size: sizeSchema,
  visible: z.boolean().default(true),
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
export type TextLogComponent = z.infer<typeof textLogComponentSchema>
export type InputBarComponent = z.infer<typeof inputBarComponentSchema>
