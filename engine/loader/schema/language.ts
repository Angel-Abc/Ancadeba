import { z } from 'zod'

export const languageSchema = z.object({
    id: z.string(),
    translations: z.record(z.string(), z.union([z.string(), z.array(z.string())]))
})
export type Language = z.infer<typeof languageSchema>