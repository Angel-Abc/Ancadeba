import { z } from 'zod'
import { actionSchema } from './action'

export const buttonSchema = z.object({
    label: z.string(),
    action: actionSchema
})

export type Button = z.infer<typeof buttonSchema>
