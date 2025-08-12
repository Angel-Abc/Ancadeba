import { ILanguageLoader, languageLoaderToken } from '@loader/languageLoader'
import { ITranslationService, translationServiceToken } from '../services/translationService'
import { token } from '@ioc/token'
import { fatalError } from '@utils/logMessage'
import { gameDataProviderToken, IGameDataProvider } from '../providers/gameDataProvider'

const logName = 'LanguageManager'

export interface ILanguageManager {
    getLanguage(): string
    setLanguage(language: string): Promise<void>
}

export const languageManagerToken = token<ILanguageManager>('LanguageManager')
export const languageManagerDependencies = [languageLoaderToken, translationServiceToken,gameDataProviderToken]
export class LanguageManager implements ILanguageManager {
    constructor(
        private languageLoader: ILanguageLoader,
        private translationService: ITranslationService,
        private gameDataProvider: IGameDataProvider
    ) {}

    public getLanguage(): string {
        if (!this.gameDataProvider.Context.language) fatalError(logName, 'No language set')
        return this.gameDataProvider.Context.language
    }

    public async setLanguage(languageKey: string): Promise<void> {
        const paths = this.gameDataProvider.Game.game.languages[languageKey]
        if (!paths) fatalError(logName, `Unknown language key: ${languageKey}`)

        if (this.gameDataProvider.Game.loadedLanguages[languageKey] === undefined) {
            const language = await this.languageLoader.loadLanguage(paths)
            this.gameDataProvider.Game.loadedLanguages[languageKey] = language
        }

        const languageData = this.gameDataProvider.Game.loadedLanguages[languageKey]
        this.translationService.setLanguage(languageData)
        this.gameDataProvider.Context.language = languageKey
    }
}
