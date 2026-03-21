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
  border: z.boolean().optional().default(true),
})

export const gridLayoutSchema = z.object({
  type: z.literal('grid'),
  rows: z.number().min(1),
  columns: z.number().min(1),
  widgets: z.array(gridLayoutWidgetSchema),
})

export const layoutSchema = z.discriminatedUnion('type', [gridLayoutSchema])

export type GridLayoutWidget = z.infer<typeof gridLayoutWidgetSchema>
export type GridLayout = z.infer<typeof gridLayoutSchema>
export interface LayoutByType {
  grid: GridLayout
}
export type LayoutType = keyof LayoutByType
export type Layout = LayoutByType[LayoutType]
