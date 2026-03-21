import { z } from 'zod'

const baseWidgetSchema = z.object({
  widgetId: z.string(),
  requires: z.array(z.string()),
})

export const progressWidgetSchema = baseWidgetSchema.extend({
  showPercentage: z.boolean().optional().default(false),
  type: z.literal('progress'),
})

export const widgetSchema = z.discriminatedUnion('type', [progressWidgetSchema])

export type ProgressWidget = z.infer<typeof progressWidgetSchema>
export interface WidgetByType {
  progress: ProgressWidget
}
export type WidgetType = keyof WidgetByType
export type Widget = WidgetByType[WidgetType]
