import { z } from 'zod'

export const BaseSchema = z.object({
  id: z.string(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
})

export type BaseSchemaType = z.infer<typeof BaseSchema>
