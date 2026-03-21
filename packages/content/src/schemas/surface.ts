import { z } from 'zod'
import { layoutSchema } from './layout'

export const surfaceSchema = z.object({
  surfaceId: z.string(),
  layout: layoutSchema,
})

export type Surface = z.infer<typeof surfaceSchema>
