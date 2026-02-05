import { z } from 'zod'

export const gridLayoutWidgetSchema = z.object({
  widgetId: z.string(),
  position: z.object({
    row: z.number().min(0),
    column: z.number().min(0),
  }),
  size: z.object({
    width: z.number().min(1),
    height: z.number().min(1),
  }),
})

export const gridLayoutSchema = z.object({
  type: z.literal('grid'),
  rows: z.number().min(1),
  columns: z.number().min(1),
  widgets: z.array(gridLayoutWidgetSchema),
})

export const surfaceSchema = z.object({
  surfaceId: z.string(),
  requires: z.array(z.string()),
  layout: gridLayoutSchema,
})

export type Surface = z.infer<typeof surfaceSchema>
