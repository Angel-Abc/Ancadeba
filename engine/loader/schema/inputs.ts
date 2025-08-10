import { z } from 'zod'
import { conditionSchema } from './condition'
import { actionSchema } from './action'

export const inputSchema = z.object({
    virtualInput: z.string(),
    preferredRow: z.int().nonnegative().optional(),
    preferredCol: z.int().nonnegative().optional(),
    label: z.string(),
    description: z.string(),
    visible: conditionSchema,
    enabled: conditionSchema,
    action: actionSchema  
})

export const virtualKeySchema = z.object({
    virtualKey: z.string(),
    keyCode: z.string(),
    shift: z.boolean().optional(),
    ctrl: z.boolean().optional(),
    alt: z.boolean().optional(),
})
export const virtualKeysSchema = z.array(virtualKeySchema)

export const virtualInputSchema = z.object({
    virtualInput: z.string(),
    virtualKeys: z.array(z.string()),
    label: z.string()
})
export const virtualInputsSchema = z.array(virtualInputSchema)

export type VirtualKeys = z.infer<typeof virtualKeysSchema>
export type VirtualKey = z.infer<typeof virtualKeySchema>
export type VirtualInputs = z.infer<typeof virtualInputsSchema>
export type VirtualInput = z.infer<typeof virtualInputSchema>
export type Input = z.infer<typeof inputSchema>