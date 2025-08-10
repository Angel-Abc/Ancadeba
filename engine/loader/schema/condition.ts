import { z } from 'zod'

export const scriptConditionSchema = z.object({
    type: z.literal('script'),
    script: z.string()
})

export const conditionSchema = z.discriminatedUnion('type', [scriptConditionSchema])

export type Condition = z.infer<typeof conditionSchema>