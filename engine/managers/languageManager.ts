import { ILanguageLoader, languageLoaderToken } from '@loader/languageLoader'
import { ITranslationService, translationServiceToken } from '../services/translationService'
import { token } from '@ioc/token'
import { fatalError } from '@utils/logMessage'

const logName = 'LanguageManager'

export interface ILanguageManager {
    getLanguage(): string
    setLanguage(language: string): Promise<void>
}

export const languageManagerToken = token<ILanguageManager>('LanguageManager')
export const languageManagerDependencies = [languageLoaderToken, translationServiceToken]
export class LanguageManager implements ILanguageManager {
    private currentLanguage: string | null = null

    constructor(
        private languageLoader: ILanguageLoader,
        private translationService: ITranslationService
    ) {}

    public getLanguage(): string {
        if (!this.currentLanguage) fatalError(logName, 'No language set')
        return this.currentLanguage
    }

    public async setLanguage(language: string): Promise<void> {
        const loadedLanguage = await this.languageLoader.loadLanguage(language)
        if (!loadedLanguage) fatalError(logName, `Language ${language} not found`)
        this.translationService.setLanguage(loadedLanguage)
        this.currentLanguage = language
    }
}
