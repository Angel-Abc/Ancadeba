import z from 'zod'
import { BaseSchema } from './base'

export const virtualInputMappingSchema = z.object({
  virtualKeys: z.array(z.string()),
  virtualInput: z.string(),
  label: z.string(),
})

export const virtualInputsSchema = BaseSchema.extend({
  mappings: z.array(virtualInputMappingSchema),
})

export type VirtualInputMapping = z.infer<typeof virtualInputMappingSchema>
export type VirtualInputs = z.infer<typeof virtualInputsSchema>
