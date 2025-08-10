import { z } from 'zod'
import { actionSchema } from './action'

export const handlerSchema = z.object({
    message: z.string(),
    action: actionSchema
})

export const handlersSchema = z.array(handlerSchema)

export type Handler = z.infer<typeof handlerSchema>
export type Handlers = z.infer<typeof handlersSchema>