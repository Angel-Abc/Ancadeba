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
import { conditionResolverRegistryToken, IConditionResolverRegistry } from '@registries/conditionResolverRegistry'
import { IInputsProviderRegistry, inputsProviderRegistryToken } from '@registries/inputsProviderRegistry'
import { subsystemInitializersToken, ISubsystemInitializer } from '@core/subsystemInitializer'

export type ActionHandlerRegistrar = (registry: IActionHandlerRegistry) => void
export type ConditionResolverRegistrar = (registry: IConditionResolverRegistry) => void
export type InputsProviderRegistrar = (registry: IInputsProviderRegistry) => void

export const actionHandlerRegistrarsToken = token<ActionHandlerRegistrar[]>('action-handler-registrars')
export const conditionResolverRegistrarsToken = token<ConditionResolverRegistrar[]>('condition-resolver-registrars')
export const inputsProviderRegistrarsToken = token<InputsProviderRegistrar[]>('inputs-provider-registrars')

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
    loggerToken,
    inputsProviderRegistryToken,
    subsystemInitializersToken,
    actionHandlerRegistrarsToken,
    conditionResolverRegistrarsToken,
    inputsProviderRegistrarsToken,
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
     */
    constructor(
        private messageBus: IMessageBus,
        private gameLoader: IGameLoader,
        private domManager: IDomManager,
        private languageManager: ILanguageManager,
        private gameDataProvider: IGameDataProvider,
        private actionHandlerRegistry: IActionHandlerRegistry,
        private conditionResolverRegistry: IConditionResolverRegistry,
        private logger: ILogger,
        private inputsProviderRegistry: IInputsProviderRegistry,
        private subsystemInitializers: ISubsystemInitializer[],
        private actionHandlerRegistrars: ActionHandlerRegistrar[],
        private conditionResolverRegistrars: ConditionResolverRegistrar[],
        private inputsProviderRegistrars: InputsProviderRegistrar[],
    ){}

    /**
     * Initializes the engine by loading game data and setting up managers.
     *
     * @returns Resolves when initialization tasks finish.
     */
    public async initialize(): Promise<void> {
        const game = await this.loadGameDataRoot()
        this.gameDataProvider.initialize(game)
        for (const initializer of this.subsystemInitializers) {
            await initializer.initialize()
        }
        await this.languageManager.setLanguage(game.initialData.language)
        this.setupBrowser(game)
        this.actionHandlerRegistrars.forEach(r => r(this.actionHandlerRegistry))
        this.conditionResolverRegistrars.forEach(r => r(this.conditionResolverRegistry))
        this.inputsProviderRegistrars.forEach(r => r(this.inputsProviderRegistry))
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
