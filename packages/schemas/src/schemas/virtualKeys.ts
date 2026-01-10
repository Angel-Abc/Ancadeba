import z from 'zod'
import { BaseSchema } from './base'

export const virtualKeyMappingSchema = z.object({
  code: z.string(),
  shift: z.boolean(),
  ctrl: z.boolean(),
  alt: z.boolean(),
  virtualKey: z.string(),
})

export const virtualKeysSchema = BaseSchema.extend({
  mappings: z.array(virtualKeyMappingSchema),
})

export type VirtualKeyMapping = z.infer<typeof virtualKeyMappingSchema>
export type VirtualKeys = z.infer<typeof virtualKeysSchema>
