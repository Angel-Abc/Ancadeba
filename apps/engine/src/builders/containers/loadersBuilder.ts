import { Container } from '@angelabc/utils/ioc'
import { GameDataLoader, gameDataLoaderDependencies, gameDataLoaderToken } from '../../loaders/gameDataLoader'

export class LoadersBuilder {
    public register(container: Container): void {
        container.register({
            token: gameDataLoaderToken,
            useClass: GameDataLoader,
            deps: gameDataLoaderDependencies
        })
    }
}