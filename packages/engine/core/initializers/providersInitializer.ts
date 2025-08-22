import { Token, token } from '@ioc/token'
import { Game } from '@loader/data/game'
import { gameDataProviderToken, IGameDataProvider } from '@providers/gameDataProvider'
import { IVirtualInputProvider, virtualInputProviderToken } from '@providers/virtualInputProvider'
import { IVirtualKeyProvider, virtualKeyProviderToken } from '@providers/virtualKeyProvider'

export interface IProvidersInitializer {
    initialize(game: Game): Promise<void>
}

const logName = 'ProvidersInitializer'
export const providersInitializerToken = token<IProvidersInitializer>(logName)
export const providersInitializerDependencies: Token<unknown>[] = [
    gameDataProviderToken,
    virtualKeyProviderToken,
    virtualInputProviderToken
]
export class ProvidersInitializer implements IProvidersInitializer {
    constructor(
        private gameDataProvider: IGameDataProvider,
        private virtualKeyProvider: IVirtualKeyProvider,
        private virtualInputProvider: IVirtualInputProvider
    ){}

    public async initialize(game: Game): Promise<void> {
        await this.gameDataProvider.initialize(game)
        await this.virtualKeyProvider.initialize()
        await this.virtualInputProvider.initialize()
    }
}
