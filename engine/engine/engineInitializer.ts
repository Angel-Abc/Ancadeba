import { Token, token } from '@ioc/token'
import { gameLoaderToken, IGameLoader } from '@loader/gameLoader'
import { IMessageBus, messageBusToken } from '@utils/messageBus'
import { domManagerToken, IDomManager } from '@managers/domManager'
import { ILanguageManager, languageManagerToken } from '@managers/languageManager'
import { gameDataProviderToken, IGameDataProvider } from '@providers/gameDataProvider'
import { Game } from '@loader/data/game'
import { fatalError, logDebug } from '@utils/logMessage'
import { START_GAME_ENGINE_MESSAGE, SWITCH_PAGE } from '@messages/system'
import { actionHandlerRegistryToken, IActionHandlerRegistry } from '@registries/actionHandlerRegistry'
import { postMessageActionToken } from '@actions/postMessageAction'
import { pageManagerToken, IPageManager } from '@managers/pageManager'
import { actionManagerToken, IActionManager } from '@managers/actionManager'

/**
 * Contract for components that prepare and start the game engine.
 */
export interface IEngineInitializer {
    /**
     * Loads game data and boots up all required subsystems.
     *
     * @returns Resolves when initialization is complete.
     */
    initialize(): Promise<void>
}

const logName = 'EngineInitializer'
export const engineInitializerToken = token<IEngineInitializer>(logName)
export const engineInitializerDependencies: Token<unknown>[] = [
    messageBusToken,
    gameLoaderToken,
    domManagerToken,
    languageManagerToken,
    gameDataProviderToken,
    actionHandlerRegistryToken,
    pageManagerToken,
    actionManagerToken
]
/**
 * Default {@link IEngineInitializer} implementation that orchestrates loading
 * game data and configuring core managers.
 */
export class EngineInitializer implements IEngineInitializer {
    /**
     * Creates a new {@link EngineInitializer}.
     *
     * @param messageBus - Bus used to dispatch initialization messages.
     * @param gameLoader - Service responsible for retrieving game data.
     * @param domManager - Manager controlling DOM related operations.
     * @param languageManager - Handles localization and language setup.
     * @param gameDataProvider - Stores and provides loaded game data.
     * @param actionHandlerRegistry - Registry used to register action handlers.
     * @param pageManager - Manages page initialization and navigation.
     * @param actionManager - Initializes and manages actions.
     */
    constructor(
        private messageBus: IMessageBus,
        private gameLoader: IGameLoader,
        private domManager: IDomManager,
        private languageManager: ILanguageManager,
        private gameDataProvider: IGameDataProvider,
        private actionHandlerRegistry: IActionHandlerRegistry,
        private pageManager: IPageManager,
        private actionManager: IActionManager
    ){}

    /**
     * Initializes the engine by loading game data and setting up managers.
     *
     * @returns Resolves when initialization tasks finish.
     */
    public async initialize(): Promise<void> {
        const game = await this.loadGameDataRoot()
        this.gameDataProvider.initialize(game)
        this.pageManager.initialize()
        this.actionManager.initialize()
        await this.languageManager.setLanguage(game.initialData.language)
        this.setupBrowser(game)
        this.registerActions()
        this.messageBus.postMessage({
            message: START_GAME_ENGINE_MESSAGE,
            payload: null
        })
        this.messageBus.postMessage({
            message: SWITCH_PAGE,
            payload: game.initialData.startPage
        })
    }

    /**
     * Registers built-in action handlers with the registry.
     */
    private registerActions(): void {
        this.actionHandlerRegistry.registerActionHandler('post-message', postMessageActionToken)
    }

    /**
     * Prepares browser elements such as title and stylesheets.
     *
     * @param game - Loaded game data used for configuration.
     */
    private setupBrowser(game: Game) {
        this.domManager.setTitle(game.title)
        game.cssFiles.forEach((cssFile: string) => {
            this.domManager.setCssFile(cssFile)
            logDebug(logName, 'CSS file {0} set', cssFile)
        })
    }

    /**
     * Loads the root {@link Game} data structure.
     *
     * @returns The fully loaded game information.
     * @throws {@link fatalError} if no game data is returned.
     */
    private async loadGameDataRoot(): Promise<Game> {
        const game = await this.gameLoader.loadGame()
        if (!game) fatalError(logName, 'Game data is null or undefined')
        logDebug(logName, 'Game loaded with data {0}', game)
        return game
    }
}
