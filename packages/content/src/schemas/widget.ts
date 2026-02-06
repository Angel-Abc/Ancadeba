import { z } from 'zod'

const baseWidgetSchema = z.object({
  widgetId: z.string(),
  requires: z.array(z.string()),
})

export const progressWidgetSchema = baseWidgetSchema.extend({
  type: z.literal('progress'),
})

export const widgetSchema = z.discriminatedUnion('type', [progressWidgetSchema])

export type Widget = z.infer<typeof widgetSchema>
