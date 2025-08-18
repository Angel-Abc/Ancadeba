
/**
 * Collection of translation strings for a particular language.
 *
 * @property id           Language identifier (e.g. `"en"`).
 * @property translations Map of translation keys to localized text.
 */
export type Language = {
    id: string
    translations: Record<string, string>
}
