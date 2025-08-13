import { token } from '@ioc/token'
import { Language } from '@loader/data/language'
import { fatalError, logWarning } from '@utils/logMessage'

export interface ITranslationService {
    translate(key: string): string
    setLanguage(language: Language): void
}

const logName = 'TranslationService'
export const translationServiceToken = token<ITranslationService>(logName)
export class TranslationService implements ITranslationService {
    private language: Language | null = null

    public translate(key: string): string {
        if (this.language === null) fatalError(logName, 'Language not set for translation')
        const translation = this.language.translations[key]
        if (translation === undefined) {
            logWarning(logName, 'Missing translation for key {0}', key)
            return key
        }
        return translation
    }

    public setLanguage(language: Language): void {
        this.language = language
    }
}
