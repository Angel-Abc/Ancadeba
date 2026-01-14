import { z } from 'zod'
import { inputRuleSchema } from './componentCommon'
import { createComponentTypeSchemas, borderSchema } from './componentTypes'

// Base schema for component definitions (without location, size, visible)
const baseComponentDefinitionSchema = z.object({
  id: z.string(),
  border: borderSchema,
  inputRules: z.array(inputRuleSchema).optional(),
})

// Create all component type schemas using the shared factory
const componentDefinitionTypeSchemas = createComponentTypeSchemas(
  baseComponentDefinitionSchema
)

const backgroundComponentDefinitionSchema =
  componentDefinitionTypeSchemas.background
const inventoryComponentDefinitionSchema =
  componentDefinitionTypeSchemas.inventory
const appearanceComponentDefinitionSchema =
  componentDefinitionTypeSchemas.appearance
const textLogComponentDefinitionSchema = componentDefinitionTypeSchemas.textLog
const inputBarComponentDefinitionSchema =
  componentDefinitionTypeSchemas.inputBar
const characterSheetComponentDefinitionSchema =
  componentDefinitionTypeSchemas.characterSheet
const menuComponentDefinitionSchema = componentDefinitionTypeSchemas.menu
const squaresMapComponentDefinitionSchema =
  componentDefinitionTypeSchemas.squaresMap

export const componentDefinitionSchema = z.discriminatedUnion('type', [
  backgroundComponentDefinitionSchema,
  menuComponentDefinitionSchema,
  squaresMapComponentDefinitionSchema,
  inventoryComponentDefinitionSchema,
  appearanceComponentDefinitionSchema,
  characterSheetComponentDefinitionSchema,
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
export type TextLogComponentDefinition = z.infer<
  typeof textLogComponentDefinitionSchema
>
export type InputBarComponentDefinition = z.infer<
  typeof inputBarComponentDefinitionSchema
>
