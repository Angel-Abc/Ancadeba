import { Container } from '@angelabc/utils/ioc'
import { GameDataProvider, gameDataProviderDependencies, gameDataProviderToken } from '../../providers/gameDataProvider'

export class ProvidersBuilder {
    public register(container: Container): void {
        container.register({
            token: gameDataProviderToken,
            useClass: GameDataProvider,
            deps: gameDataProviderDependencies
        })
    }
}