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

const borderSchema = z.object({
  width: z.number().int().nonnegative(),
  padding: z.number().int().nonnegative(),
})

const baseComponentSchema = z.object({
  location: locationSchema,
  size: sizeSchema,
  visible: z.boolean(),
  border: borderSchema,
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
])

export type Component = z.infer<typeof componentSchema>
export type BackgroundComponent = z.infer<typeof backgroundComponentSchema>
export type MenuComponent = z.infer<typeof menuComponentSchema>
export type SquaresMapComponent = z.infer<typeof squaresMapComponentSchema>
