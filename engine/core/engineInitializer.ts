import { Token, token } from '@ioc/token'
import { gameLoaderToken, IGameLoader } from '@loader/gameLoader'
import { IMessageBus, messageBusToken } from '@utils/messageBus'
import { domManagerToken, IDomManager } from '@managers/domManager'
import { ILanguageManager, languageManagerToken } from '@managers/languageManager'
import { gameDataProviderToken, IGameDataProvider } from '@providers/gameDataProvider'
import { Game } from '@loader/data/game'
import type { ILogger } from '@utils/logger'
import { loggerToken } from '@utils/logger'
import { START_GAME_ENGINE_MESSAGE, SWITCH_PAGE } from '@messages/system'
import { actionHandlerRegistryToken, IActionHandlerRegistry } from '@registries/actionHandlerRegistry'
import { postMessageActionToken } from '@actions/postMessageAction'
import { pageManagerToken, IPageManager } from '@managers/pageManager'
import { actionManagerToken, IActionManager } from '@managers/actionManager'
import { IMapManager, mapManagerToken } from '@managers/mapManager'
import { IVirtualKeyProvider, virtualKeyProviderToken } from '@providers/virtualKeyProvider'
import { IVirtualInputProvider, virtualInputProviderToken } from '@providers/virtualInputProvider'
import { ITurnManager, turnManagerToken } from '@managers/turnManager'
import { conditionResolverRegistryToken, IConditionResolverRegistry } from '@registries/conditionResolverRegistry'
import { scriptConditionToken } from '@conditions/scriptCondition'
import { IInputsProviderRegistry, inputsProviderRegistryToken } from '@registries/inputsProviderRegistry'
import { pageInputsProviderToken } from '@inputs/pageInputsProvider'
import { IInputManager, inputManagerToken } from '@managers/inputManager'
import { scriptActionToken } from '@actions/scriptAction'

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
    conditionResolverRegistryToken,
    pageManagerToken,
    actionManagerToken,
    mapManagerToken,
    virtualKeyProviderToken,
    virtualInputProviderToken,
    loggerToken,
    turnManagerToken,
    inputsProviderRegistryToken,
    inputManagerToken
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
        private conditionResolverRegistry: IConditionResolverRegistry,
        private pageManager: IPageManager,
        private actionManager: IActionManager,
        private mapManager: IMapManager,
        private virtualKeyProvider: IVirtualKeyProvider,
        private virtualInputProvider: IVirtualInputProvider,
        private logger: ILogger,
        private turnManager: ITurnManager,
        private inputsProviderRegistry: IInputsProviderRegistry,
        private inputManager: IInputManager
    ){}

    /**
     * Initializes the engine by loading game data and setting up managers.
     *
     * @returns Resolves when initialization tasks finish.
     */
    public async initialize(): Promise<void> {
        const game = await this.loadGameDataRoot()
        this.gameDataProvider.initialize(game)
        await this.virtualKeyProvider.initialize()
        await this.virtualInputProvider.initialize()
        await this.initializeManagers()
        await this.languageManager.setLanguage(game.initialData.language)
        this.setupBrowser(game)
        this.registerActions()
        this.registerConditions()
        this.registerInputsProviders()
        this.messageBus.postMessage({
            message: START_GAME_ENGINE_MESSAGE,
            payload: null
        })
        this.messageBus.postMessage({
            message: SWITCH_PAGE,
            payload: game.initialData.startPage
        })
    }

    private async initializeManagers(): Promise<void> {
        this.pageManager.initialize()
        await this.actionManager.initialize()
        this.mapManager.initialize()
        this.turnManager.initialize()
        this.inputManager.initialize()
    }

    /**
     * Registers built-in action handlers with the registry.
     */
    private registerActions(): void {
        this.actionHandlerRegistry.registerActionHandler('post-message', postMessageActionToken)
        this.actionHandlerRegistry.registerActionHandler('script', scriptActionToken)
    }

    private registerConditions(): void {
        this.conditionResolverRegistry.registerConditionResolver('script', scriptConditionToken)
    }

    private registerInputsProviders(): void {
        this.inputsProviderRegistry.registerInputsProvider(pageInputsProviderToken)
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
            this.logger.debug(logName, 'CSS file {0} set', cssFile)
        })
    }

    /**
     * Loads the root {@link Game} data structure.
     *
     * @returns The fully loaded game information.
     * @throws Error if no game data is returned.
     */
    private async loadGameDataRoot(): Promise<Game> {
        const game = await this.gameLoader.loadGame()
        if (!game) {
            this.logger.error(logName, 'Game data is null or undefined')
            throw new Error('Game data is null or undefined')
        }
        this.logger.debug(logName, 'Game loaded with data {0}', game)
        return game
    }
}
