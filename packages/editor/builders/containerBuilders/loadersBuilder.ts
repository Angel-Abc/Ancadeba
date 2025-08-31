import { GameLoader, gameLoaderDependencies, gameLoaderToken } from '@editor/loaders/gameLoader'
import { LanguagesLoader, languagesLoaderDependencies, languagesLoaderToken } from '@editor/loaders/languagesLoader'
import { PagesLoader, pagesLoaderDependencies, pagesLoaderToken } from '@editor/loaders/pagesLoader'
import { Loader, loaderDependencies, loaderToken } from '@editor/loaders/loader'
import { Container } from '@ioc/container'

export class LoadersBuilder {
    public register(container: Container): void {
        container.register({
            token: loaderToken,
            useClass: Loader,
            deps: loaderDependencies
        })
        container.register({
            token: gameLoaderToken,
            useClass: GameLoader,
            deps: gameLoaderDependencies
        })
        container.register({
            token: languagesLoaderToken,
            useClass: LanguagesLoader,
            deps: languagesLoaderDependencies
        })
        container.register({
            token: pagesLoaderToken,
            useClass: PagesLoader,
            deps: pagesLoaderDependencies
        })
    }
}
