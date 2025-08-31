import { z } from 'zod'

export const TranslationSchema = z.union([z.string(), z.array(z.string())])
export const TranslationsSchema = z.record(z.string(), TranslationSchema)

export const languageSchema = z.object({
    id: z.string(),
    translations: TranslationsSchema
})
export type Language = z.infer<typeof languageSchema>
export type Translations = z.infer<typeof TranslationsSchema>
