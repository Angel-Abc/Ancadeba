import { z } from 'zod'

export const gridLayoutWidgetSchema = z.object({
  widgetId: z.string(),
  position: z.object({
    row: z.number().int().min(0),
    column: z.number().int().min(0),
  }),
  size: z.object({
    width: z.number().int().min(1),
    height: z.number().int().min(1),
  }),
  border: z.boolean().optional().default(true),
})

export const gridLayoutSchema = z
  .object({
    type: z.literal('grid'),
    rows: z.number().int().min(1),
    columns: z.number().int().min(1),
    widgets: z.array(gridLayoutWidgetSchema),
  })
  .superRefine((layout, context) => {
    layout.widgets.forEach((widget, index) => {
      const rowEnd = widget.position.row + widget.size.height
      const columnEnd = widget.position.column + widget.size.width

      if (rowEnd > layout.rows) {
        context.addIssue({
          code: 'custom',
          path: ['widgets', index, 'size', 'height'],
          message: `Widget ${widget.widgetId} exceeds grid row bounds`,
        })
      }

      if (columnEnd > layout.columns) {
        context.addIssue({
          code: 'custom',
          path: ['widgets', index, 'size', 'width'],
          message: `Widget ${widget.widgetId} exceeds grid column bounds`,
        })
      }
    })
  })

export const layoutSchema = z.discriminatedUnion('type', [gridLayoutSchema])

export type GridLayoutWidget = z.infer<typeof gridLayoutWidgetSchema>
export type GridLayout = z.infer<typeof gridLayoutSchema>
export interface LayoutByType {
  grid: GridLayout
}
export type LayoutType = keyof LayoutByType
export type Layout = LayoutByType[LayoutType]
