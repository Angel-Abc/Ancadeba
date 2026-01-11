import { z } from 'zod'
import { BaseSchema } from './base'
import { componentSchema, inputRuleSchema } from './component'
import { inputRangeSchema } from './inputRange'

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
  inputRules: z.array(inputRuleSchema).optional(),
  inputRanges: inputRangeSchema.optional(),
})

export type Scene = z.infer<typeof sceneSchema>
export type Screen = z.infer<typeof screenSchema>
export type GridScreen = z.infer<typeof gridScreenSchema>
