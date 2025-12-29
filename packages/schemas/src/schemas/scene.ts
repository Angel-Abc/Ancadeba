import { z } from 'zod'
import { BaseSchema } from './base'
import { actionSchema } from './action'
import { conditionSchema } from './conditions'

/* ---------- Shared Schemas ---------- */

const locationSchema = z.object({
  x: z.number().int().nonnegative(),
  y: z.number().int().nonnegative(),
})

const sizeSchema = z.object({
  width: z.number().int().positive(),
  height: z.number().int().positive(),
})

/* ---------- Screen Schema ---------- */

export const gridScreenSchema = z.object({
  type: z.literal('grid'),
  grid: z.object({
    rows: z.number().int().positive(),
    columns: z.number().int().positive(),
  }),
})

const screenSchema = gridScreenSchema

/* ---------- Component Schemas ---------- */

const backgroundComponentSchema = z.object({
  type: z.literal('background'),
  color: z.string(),
  image: z.string(),
  location: locationSchema,
  size: sizeSchema,
  visible: z.boolean(),
})

const menuOptionSchema = z.object({
  label: z.string(),
  actions: z.array(actionSchema).min(1),
  condition: conditionSchema.optional(),
})

const menuComponentSchema = z.object({
  type: z.literal('menu'),
  options: z.array(menuOptionSchema).min(1),
  location: locationSchema,
  size: sizeSchema,
  visible: z.boolean(),
})

const componentSchema = z.discriminatedUnion('type', [
  backgroundComponentSchema,
  menuComponentSchema,
])

/* ---------- Root Schema ---------- */

export const sceneSchema = BaseSchema.extend({
  screen: screenSchema,
  components: z.array(componentSchema),
})

/* ---------- Inferred Type (optional) ---------- */

export type Scene = z.infer<typeof sceneSchema>
export type Screen = z.infer<typeof screenSchema>
export type GridScreen = z.infer<typeof gridScreenSchema>
export type Component = z.infer<typeof componentSchema>
export type BackgroundComponent = z.infer<typeof backgroundComponentSchema>
export type MenuComponent = z.infer<typeof menuComponentSchema>
