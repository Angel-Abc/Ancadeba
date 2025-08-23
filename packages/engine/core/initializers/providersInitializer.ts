import { Token, token } from '@ioc/token'
import { Game } from '@loader/data/game'
import { gameDataProviderToken, IGameDataProvider } from '@providers/gameDataProvider'
import { IVirtualInputProvider, virtualInputProviderToken } from '@providers/virtualInputProvider'
import { IVirtualKeyProvider, virtualKeyProviderToken } from '@providers/virtualKeyProvider'

/**
 * Bootstraps external provider services used by the engine.
 */
export interface IProvidersInitializer {
    /**
     * Initialize provider instances using the loaded game data.
     *
     * @param game Game metadata used to seed provider state.
     */
    initialize(game: Game): Promise<void>
}

const logName = 'ProvidersInitializer'
export const providersInitializerToken = token<IProvidersInitializer>(logName)
export const providersInitializerDependencies: Token<unknown>[] = [
    gameDataProviderToken,
    virtualKeyProviderToken,
    virtualInputProviderToken
]
/**
 * Coordinates initialization of game data and input providers.
 */
export class ProvidersInitializer implements IProvidersInitializer {
    /**
     * @param gameDataProvider Supplies game configuration data.
     * @param virtualKeyProvider Sets up keyboard input mapping.
     * @param virtualInputProvider Activates virtual input mechanisms.
     */
    constructor(
        private gameDataProvider: IGameDataProvider,
        private virtualKeyProvider: IVirtualKeyProvider,
        private virtualInputProvider: IVirtualInputProvider
    ){}

    /**
     * Initializes all provider instances in sequence.
     *
     * @param game Parsed game data used during initialization.
     */
    public async initialize(game: Game): Promise<void> {
        await this.gameDataProvider.initialize(game)
        await this.virtualKeyProvider.initialize()
        await this.virtualInputProvider.initialize()
    }
}
