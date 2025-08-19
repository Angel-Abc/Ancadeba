import { Token, token } from '@ioc/token'
import { engineInitializerToken, IEngineInitializer } from './engineInitializer'
import type { ILogger } from '@utils/logger'
import { loggerToken } from '@utils/logger'


/**
 * Defines the contract for the central game engine.
 */
export interface IGameEngine {
    /**
     * Starts the game engine by initializing required subsystems.
     *
     * @returns A promise that resolves once initialization is complete.
     */
    start(): Promise<void>
}

const logName: string = 'GameEngine'
export const gameEngineToken = token<IGameEngine>(logName)
export const gameEngineDependencies: Token<unknown>[] = [engineInitializerToken, loggerToken]

/**
 * Concrete implementation of {@link IGameEngine} responsible for bootstrapping
 * the game.
 */
export class GameEngine implements IGameEngine {
    /**
     * Creates a new {@link GameEngine}.
     *
     * @param engineInitializer - Performs game initialization routines.
     */
    constructor(
        private engineInitializer: IEngineInitializer,
        private logger: ILogger
    ) {
    }

    /**
     * Boots the game engine by delegating to the {@link IEngineInitializer}.
     *
     * @returns A promise that resolves when the engine has fully started.
     */
    async start(): Promise<void> {
        this.logger.debug(logName, 'Starting game engine...')
        await this.engineInitializer.initialize()
    }
}
