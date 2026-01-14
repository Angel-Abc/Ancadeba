import { z } from 'zod'
import { actionSchema } from './action'
import { conditionSchema } from './conditions'

export const inputRuleSchema = z.object({
  virtualInput: z.string().optional(),
  enabled: conditionSchema.optional(),
  visible: conditionSchema.optional(),
  caption: z.string().optional(),
})

export const menuOptionSchema = z.object({
  label: z.string(),
  actions: z.array(actionSchema).min(1),
  condition: conditionSchema.optional(),
})

export type InputRule = z.infer<typeof inputRuleSchema>
export type MenuOption = z.infer<typeof menuOptionSchema>
