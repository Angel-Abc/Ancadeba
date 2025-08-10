import type { Language as LanguageData } from '@loader/data/language'
import { type Language } from '@loader/schema/language'

export function mapLanguage(language: Language): LanguageData {
    return {
        id: language.id,
        translations: Object.fromEntries(
            Object.entries(language.translations).map(([key, value]) => [
                key,
                Array.isArray(value) ? value.join("\n ") : value
            ])
        )
    }
}
