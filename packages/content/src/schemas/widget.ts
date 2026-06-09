import { z } from 'zod'
import { buttonSchema } from './button'

const baseWidgetSchema = z.object({
  widgetId: z.string(),
})

export const progressWidgetSchema = baseWidgetSchema.extend({
  showPercentage: z.boolean().optional().default(false),
  type: z.literal('progress'),
})

export const titleWidgetSchema = baseWidgetSchema.extend({
  type: z.literal('title'),
  title: z.string(),
  'font-size': z.number().optional().default(16),
})

export const buttonBarWidgetSchema = baseWidgetSchema.extend({
  type: z.literal('button-bar'),
  buttons: z.array(buttonSchema),
})

export const squaresMapWidgetSchema = baseWidgetSchema.extend({
  type: z.literal('squares-map'),
  viewportWidth: z.number().int().min(1),
  viewportHeight: z.number().int().min(1),
  track: z.enum(['player', 'free']),
})

export const widgetSchema = z.discriminatedUnion('type', [
  progressWidgetSchema,
  titleWidgetSchema,
  buttonBarWidgetSchema,
  squaresMapWidgetSchema,
])

export type ProgressWidget = z.infer<typeof progressWidgetSchema>
export type TitleWidget = z.infer<typeof titleWidgetSchema>
export type ButtonBarWidget = z.infer<typeof buttonBarWidgetSchema>
export type SquaresMapWidget = z.infer<typeof squaresMapWidgetSchema>
export interface WidgetByType {
  progress: ProgressWidget
  title: TitleWidget
  'button-bar': ButtonBarWidget
  'squares-map': SquaresMapWidget
}
export type WidgetType = keyof WidgetByType
export type Widget = WidgetByType[WidgetType]
