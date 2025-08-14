/**
 * Coordinates loading of translation files and exposes the currently active
 * language for the game. This manager centralizes language switching logic
 * so that other components can rely on a single source of truth.
 */
import { ILanguageLoader, languageLoaderToken } from '@loader/languageLoader'
import { ITranslationService, translationServiceToken } from '@services/translationService'
import { Token, token } from '@ioc/token'
import { fatalError } from '@utils/logMessage'
import { gameDataProviderToken, IGameDataProvider } from '@providers/gameDataProvider'

/**
 * Contract for managing the active application language.
 */
export interface ILanguageManager {
    /**
     * Retrieves the currently active language key.
     */
    getLanguage(): string

    /**
     * Switches the active language and loads translations as needed.
     *
     * @param language - Identifier for the language to activate.
     */
    setLanguage(language: string): Promise<void>
}

const logName = 'LanguageManager'
export const languageManagerToken = token<ILanguageManager>(logName)
export const languageManagerDependencies: Token<unknown>[] = [languageLoaderToken, translationServiceToken, gameDataProviderToken]
/**
 * Default implementation of {@link ILanguageManager} that loads translation
 * data and updates the active language in the game's context.
 */
export class LanguageManager implements ILanguageManager {
    /**
     * Creates a new {@link LanguageManager}.
     *
     * @param languageLoader - Loader responsible for retrieving language data
     * from the file system or network.
     * @param translationService - Service used to provide translations at
     * runtime.
     * @param gameDataProvider - Access to the game's runtime data and context.
     */
    constructor(
        private languageLoader: ILanguageLoader,
        private translationService: ITranslationService,
        private gameDataProvider: IGameDataProvider
    ) {}

    /**
     * Returns the key for the active language.
     *
     * @throws If no language has been set yet.
     */
    public getLanguage(): string {
        if (!this.gameDataProvider.Context.language) fatalError(logName, 'No language set')
        return this.gameDataProvider.Context.language
    }

    /**
     * Loads the specified language if necessary and sets it as the active
     * language.
     *
     * @param languageKey - Identifier for the language to load.
     * @throws If the provided language key is unknown.
     */
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
