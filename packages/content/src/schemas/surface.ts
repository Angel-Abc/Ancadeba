import z from 'zod'

export const surfaceCapabilitySchema = z.enum([
  'boot:progress',
  'ecs:projections',
  'world:ready',
  'persistence:listSaves',
])

/**
 * Widget position and size in a grid layout.
 */
export const gridWidgetPositionSchema = z.object({
  x: z.number().int().min(0),
  y: z.number().int().min(0),
  width: z.number().int().min(1),
  height: z.number().int().min(1),
})

/**
 * Widget definition (independent of layout).
 */
export const widgetDefinitionSchema = z
  .object({
    id: z.string(),
    type: z.string(),
  })
  .passthrough()

/**
 * Widget reference in a grid layout (position + widgetId).
 */
export const gridWidgetReferenceSchema = z.object({
  widgetId: z.string(),
  position: gridWidgetPositionSchema,
})

/**
 * Grid layout definition.
 */
export const gridLayoutSchema = z.object({
  type: z.literal('grid'),
  columns: z.number().int().min(1),
  rows: z.number().int().min(1),
  widgets: z.array(gridWidgetReferenceSchema),
})

/**
 * Layout type (currently only grid).
 */
export const layoutSchema = gridLayoutSchema

export const surfaceSchema = z.object({
  id: z.string(),
  tags: z.array(z.string()).optional(),
  requires: z.array(surfaceCapabilitySchema).optional(),
  forbids: z.array(surfaceCapabilitySchema).optional(),
  layout: layoutSchema.optional(),
})

export type SurfaceCapability = z.infer<typeof surfaceCapabilitySchema>
export type GridWidgetPosition = z.infer<typeof gridWidgetPositionSchema>
export type WidgetDefinition = z.infer<typeof widgetDefinitionSchema>
export type GridWidgetReference = z.infer<typeof gridWidgetReferenceSchema>
export type GridLayout = z.infer<typeof gridLayoutSchema>
export type Layout = z.infer<typeof layoutSchema>
export type Surface = z.infer<typeof surfaceSchema>
