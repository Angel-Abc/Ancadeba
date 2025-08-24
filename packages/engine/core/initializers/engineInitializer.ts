import { Token, token } from '@ioc/token'
import { coreInitializerToken, ICoreInitializer } from './coreInitializer'
import { gameLoaderToken, IGameLoader } from '@loader/gameLoader'
import { Game } from '@loader/data/game'
import { ILogger, loggerToken } from '@utils/logger'
import { engineStartInitializerToken, IEngineStartInitializer } from './engineStartInitializer'
import { IProvidersInitializer, providersInitializerToken } from './providersInitializer'
import { IManagersInitializer, managersInitializerToken } from './managersInitializer'
import { IRegistriesInitializer, registriesInitializerToken } from './registriesInitializers'

/**
 * Defines the contract for all engine initializers.
 * Implementations perform asynchronous bootstrapping logic
 * and should resolve once their setup is complete.
 */
export interface IInitializer {
    /**
     * Execute the initializer logic.
     *
     * @returns A promise that resolves when initialization finishes.
     */
    initialize(): Promise<void>
}

/**
 * Specialization of {@link IInitializer} used for the main engine
 * bootstrap sequence.
 */
export type IEngineInitializer = IInitializer

const logName = 'EngineInitializer'
export const engineInitializerToken = token<IEngineInitializer>(logName)
export const engineInitializerDependencies: Token<unknown>[] = [
    loggerToken,
    coreInitializerToken,
    providersInitializerToken,
    managersInitializerToken,
    engineStartInitializerToken,
    gameLoaderToken,
    registriesInitializerToken    
]
/**
 * Orchestrates the startup sequence for the game engine.
 *
 * @remarks
 * The initializer loads game data, prepares registries, core systems,
 * providers and managers, and finally starts the engine. Logging is
 * performed throughout the process and an error is thrown if game data
 * cannot be loaded.
 */
export class EngineInitializer implements IEngineInitializer {
    /**
     * Creates a new {@link EngineInitializer}.
     *
     * @param logger Handles diagnostic logging.
     * @param coreInitializer Initializes core browser and DOM features.
     * @param providersInitializer Bootstraps external providers such as input.
     * @param managersInitializer Initializes internal manager classes.
     * @param engineStartInitializer Starts the engine after setup.
     * @param gameLoader Loads the game definition from disk or network.
     * @param registriesInitializer Registers handlers and resolvers.
     */
    constructor(
        private logger: ILogger,
        private coreInitializer: ICoreInitializer,
        private providersInitializer: IProvidersInitializer,
        private managersInitializer: IManagersInitializer,
        private engineStartInitializer: IEngineStartInitializer,
        private gameLoader: IGameLoader,
        private registriesInitializer: IRegistriesInitializer
    ) { }

    /**
     * Initializes all engine subsystems in the correct order.
     *
     * @returns A promise that resolves once the engine is fully started.
     */
    public async initialize(): Promise<void> {
        const game = await this.loadGameDataRoot()
        await this.registriesInitializer.initialize()
        await this.coreInitializer.initialize(game)
        await this.providersInitializer.initialize(game)
        await this.managersInitializer.initialize()
        await this.engineStartInitializer.initialize(game.initialData)
    }

    /**
     * Loads and validates the root game data file.
     *
     * @throws If the game data cannot be loaded.
     * @returns The parsed {@link Game} instance.
     */
    private async loadGameDataRoot(): Promise<Game> {
        const game = await this.gameLoader.loadGame()
        if (!game) {

            throw new Error(this.logger.error(logName, 'Game data is null or undefined'))
        }
        this.logger.debug(logName, 'Game loaded with data {0}', game)
        return game
    }

}
