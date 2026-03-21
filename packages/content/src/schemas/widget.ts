import { z } from 'zod'
import { buttonSchema } from './button'

const baseWidgetSchema = z.object({
  widgetId: z.string(),
  requires: z.array(z.string()),
})

export const progressWidgetSchema = baseWidgetSchema.extend({
  showPercentage: z.boolean().optional().default(false),
  type: z.literal('progress'),
})

export const titleWidgetSchema = baseWidgetSchema.extend({
  type: z.literal('title'),
  title: z.string(),
})

export const buttonBarWidgetSchema = baseWidgetSchema.extend({
  type: z.literal('button-bar'),
  buttons: z.array(buttonSchema),
})

export const widgetSchema = z.discriminatedUnion('type', [
  progressWidgetSchema,
  titleWidgetSchema,
  buttonBarWidgetSchema,
])

export type ProgressWidget = z.infer<typeof progressWidgetSchema>
export type TitleWidget = z.infer<typeof titleWidgetSchema>
export type ButtonBarWidget = z.infer<typeof buttonBarWidgetSchema>
export interface WidgetByType {
  progress: ProgressWidget
  title: TitleWidget
  'button-bar': ButtonBarWidget
}
export type WidgetType = keyof WidgetByType
export type Widget = WidgetByType[WidgetType]
