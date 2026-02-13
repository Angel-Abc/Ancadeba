import { z } from 'zod'

export const languageSchema = z.object({
  translations: z.record(z.string(), z.string()),
})

export type Language = z.infer<typeof languageSchema>
