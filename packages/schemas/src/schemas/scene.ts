import { z } from 'zod'
import { BaseSchema } from './base'
import { componentSchema } from './component'

export const gridScreenSchema = z.object({
  type: z.literal('grid'),
  grid: z.object({
    rows: z.number().int().positive(),
    columns: z.number().int().positive(),
  }),
})

const screenSchema = gridScreenSchema

export const sceneSchema = BaseSchema.extend({
  screen: screenSchema,
  components: z.array(componentSchema),
})

export type Scene = z.infer<typeof sceneSchema>
export type Screen = z.infer<typeof screenSchema>
export type GridScreen = z.infer<typeof gridScreenSchema>
