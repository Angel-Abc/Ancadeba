import { z } from 'zod'

export const conditionSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('flag'),
    name: z.string(),
    value: z.boolean(),
  }),
])
export type Condition = z.infer<typeof conditionSchema>
