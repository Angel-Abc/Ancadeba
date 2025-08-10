import { z } from 'zod'

export const postMessageActionSchema = z.object({
    type: z.literal('post-message'),
    message: z.string(),
    payload: z.union([z.number(), z.string(), z.record(z.string(), z.unknown())])
})

export const scriptActionSchema = z.object({
    type: z.literal('script'),
    script: z.union([z.string(), z.array(z.string())])  
})

export const actionSchema = z.discriminatedUnion('type', [postMessageActionSchema, scriptActionSchema])

export type Action = z.infer<typeof actionSchema>