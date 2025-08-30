import { GameJsonLoader, gameJsonLoaderDependencies, gameJsonLoaderToken } from '@editor/loaders/gameJsonLoader'
import { Container } from '@ioc/container'

export class LoadersBuilder {
    public register(container: Container): void {
        container.register({
            token: gameJsonLoaderToken,
            useClass: GameJsonLoader,
            deps: gameJsonLoaderDependencies
        })
    }    
}
