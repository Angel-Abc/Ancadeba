import { Token, token } from '@angelabc/utils/ioc'
import { gameStateProviderToken, IGameStateProvider } from '../../providers/gameStateProvider'

export interface IProvidersInitializer {
    initialize(): Promise<void>
}

const logName = 'ProvidersInitializers'
export const providersInitializerToken = token<IProvidersInitializer>(logName)
export const providersInitializerDependencies: Token<unknown>[] = [
    gameStateProviderToken
]
export class ProvidersInitializer implements IProvidersInitializer {
    constructor(
        private gameStateProvider: IGameStateProvider
    ) { }

    public async initialize(): Promise<void> {
        await this.gameStateProvider.initialize()
    }
}