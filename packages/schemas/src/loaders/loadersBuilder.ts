import { Container } from '@angelabc/utils/ioc'
import { GameLoader, gameLoaderDependencies, gameLoaderToken } from './gameLoader'

export class LoadersBuilder {
    public register(container: Container): void {
        container.register({
            token: gameLoaderToken,
            useClass: GameLoader,
            deps: gameLoaderDependencies
        })
    }
}