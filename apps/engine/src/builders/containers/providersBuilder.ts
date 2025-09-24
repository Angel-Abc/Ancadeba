import { Container } from '@angelabc/utils/ioc'
import { GameStateProvider, gameStateProviderDependencies, gameStateProviderToken } from '../../providers/gameStateProvider'

export class ProvidersBuilder {
    public register(container: Container): void {
        container.register({
            token: gameStateProviderToken,
            useClass: GameStateProvider,
            deps: gameStateProviderDependencies
        })
    }
}