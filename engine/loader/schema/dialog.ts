import { z } from 'zod'
import { conditionSchema } from './condition'
import { actionSchema } from './action'

export const behaviorSchema = z.object({
    'can-move': z.boolean()
})

export const gotoDialogActionSchema = z.object({
    type: z.literal('goto'),
    target: z.string()
})

export const endDialogActionSchema = z.object({
    type: z.literal('end-dialog'),
    message: z.string().optional()
})

export const dialogActionSchema = z.discriminatedUnion('type', [
    ...actionSchema.options,
    gotoDialogActionSchema,
    endDialogActionSchema
])

export const dialogChoiceSchema = z.object({
    id: z.string(),
    label: z.string(),
    visible: conditionSchema.optional(),
    enabled: conditionSchema.optional(),
    action: dialogActionSchema
})

export const dialogSchema = z.object({
    id: z.string(),
    message: z.string(),
    behavior: behaviorSchema.optional(),
    choices: z.array(dialogChoiceSchema)
})

export const dialogSetSchema = z.object({
    id: z.string(),
    'default-behavior': behaviorSchema,
    'start-condition': conditionSchema,
    'start-with': z.string(),
    dialogs: z.array(dialogSchema)
})

export type DialogAction = z.infer<typeof dialogActionSchema>
export type DialogChoice = z.infer<typeof dialogChoiceSchema>
export type Behavior = z.infer<typeof behaviorSchema>
export type Dialog = z.infer<typeof dialogSchema>
export type DialogSet = z.infer<typeof dialogSetSchema>
