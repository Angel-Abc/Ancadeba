import { Container } from '@angelabc/utils/ioc'
import { GameStateProvider, gameStateProviderDependencies, gameStateProviderToken } from '../../providers/gameStateProvider'
import { GameDataProvider, gameDataProviderDependencies, gameDataProviderToken } from '../../providers/gameDataProvider'

export class ProvidersBuilder {
    public register(container: Container): void {
        container.register({
            token: gameStateProviderToken,
            useClass: GameStateProvider,
            deps: gameStateProviderDependencies
        })
        container.register({
            token: gameDataProviderToken,
            useClass: GameDataProvider,
            deps: gameDataProviderDependencies
        })
    }
}