import { Container } from '@ioc/container'
import { ActionHandlersLoader, actionHandlersLoaderDependencies, actionHandlersLoaderToken } from '@loader/actionHandlersLoader'
import { DialogSetLoader, dialogSetLoaderDependencies, dialogSetLoaderToken } from '@loader/dialogSetLoader'
import { GameLoader, gameLoaderDependencies, gameLoaderToken } from '@loader/gameLoader'
import { GameMapLoader, gameMapLoaderDependencies, gameMapLoaderToken } from '@loader/gameMapLoader'
import { LanguageLoader, languageLoaderDependencies, languageLoaderToken } from '@loader/languageLoader'
import { PageLoader, pageLoaderDependencies, pageLoaderToken } from '@loader/pageLoader'
import { TileSetLoader, tileSetLoaderDependencies, tileSetLoaderToken } from '@loader/tileSetLoader'
import { VirtualInputsLoader, virtualInputsLoaderDependencies, virtualInputsLoaderToken } from '@loader/virtualInputsLoader'
import { VirtualKeysLoader, virtualKeysLoaderDependencies, virtualKeysLoaderToken } from '@loader/virtualKeysLoader'

export class LoadersBuilder {
    public register(container: Container): void {
        container.register({
            token: gameLoaderToken,
            useClass: GameLoader,
            deps: gameLoaderDependencies
        })
        container.register({
            token: languageLoaderToken,
            useClass: LanguageLoader,
            deps: languageLoaderDependencies
        })
        container.register({
            token: virtualKeysLoaderToken,
            useClass: VirtualKeysLoader,
            deps: virtualKeysLoaderDependencies
        })
        container.register({
            token: virtualInputsLoaderToken,
            useClass: VirtualInputsLoader,
            deps: virtualInputsLoaderDependencies
        })
        container.register({
            token: actionHandlersLoaderToken,
            useClass: ActionHandlersLoader,
            deps: actionHandlersLoaderDependencies
        })
        container.register({
            token: dialogSetLoaderToken,
            useClass: DialogSetLoader,
            deps: dialogSetLoaderDependencies
        })
        container.register({
            token: gameMapLoaderToken,
            useClass: GameMapLoader,
            deps: gameMapLoaderDependencies
        })
        container.register({
            token: tileSetLoaderToken,
            useClass: TileSetLoader,
            deps: tileSetLoaderDependencies
        })
        container.register({
            token: pageLoaderToken,
            useClass: PageLoader,
            deps: pageLoaderDependencies
        })
    }
}
