import { z } from 'zod'

export const tagsSchema = z.array(z.string())
export type Tags = z.infer<typeof tagsSchema>
