import { z } from 'zod'

const baseWidgetSchema = z.object({
  widgetId: z.string(),
  requires: z.array(z.string()),
})

export const progressWidgetSchema = baseWidgetSchema.extend({
  widgetId: z.string(),
  type: z.literal('progress'),
  requires: z.array(z.string()),
})

export const widgetSchema = z.discriminatedUnion('type', [progressWidgetSchema])

export type Widget = z.infer<typeof widgetSchema>
