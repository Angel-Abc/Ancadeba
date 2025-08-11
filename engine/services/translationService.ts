import { token } from '@ioc/token'
import { Language } from '@loader/data/language'
import { fatalError } from '@utils/logMessage'

const logName = 'TranslationService'

export interface ITranslationService {
    translate(ket: string): string
    setLanguage(language: Language): void
}

export const translationServiceToken = token<ITranslationService>('translationServiceToken')
export class TranslationService implements ITranslationService {
    private language: Language | null = null

    public translate(key: string): string {
        if (this.language === null) fatalError(logName, 'Language not set for translation')
        return this.language.translations[key] ?? key
    }

    public setLanguage(language: Language): void {
        this.language = language
    }
}
