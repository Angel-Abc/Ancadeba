import { token } from '@ioc/token'
import { Language } from '@loader/data/language'
import { fatalError, logWarning } from '@utils/logMessage'

/**
 * Exposes translation utilities for converting keys to localized strings.
 */
export interface ITranslationService {
    /**
     * Looks up the localized string for a key.
     * Logs a warning and returns the key itself if the translation is missing.
     * Implementations should trigger a fatal error when no language has been configured.
     *
     * @param key - Translation key to look up.
     * @returns Localized string for the key or the key itself when missing.
     */
    translate(key: string): string

    /**
     * Sets the active language used for translation lookups.
     *
     * @param language - Language data containing translations.
     */
    setLanguage(language: Language): void
}

const logName = 'TranslationService'
export const translationServiceToken = token<ITranslationService>(logName)

/**
 * Service that resolves translation keys using provided {@link Language} data.
 * Must have a language configured before translation; otherwise `fatalError` is invoked.
 * If a key cannot be translated, `logWarning` is emitted and the key is returned.
 */
export class TranslationService implements ITranslationService {
    private language: Language | null = null

    /**
     * Translates a key using the current language.
     *
     * @param key - Translation key to resolve.
     * @returns Localized string for the key or the key itself when missing.
     * @throws via `fatalError` when language is not set.
     * Logs a warning when the key is absent in translations.
     */
    public translate(key: string): string {
        if (this.language === null) fatalError(logName, 'Language not set for translation')
        const translation = this.language.translations[key]
        if (translation === undefined) {
            logWarning(logName, 'Missing translation for key {0}', key)
            return key
        }
        return translation
    }

    /**
     * Sets the language data to be used for subsequent translations.
     *
     * @param language - Language that provides translation mappings.
     */
    public setLanguage(language: Language): void {
        this.language = language
    }
}
