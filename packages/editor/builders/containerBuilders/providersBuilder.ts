import { EditTreeProvider, editTreeProviderDependencies, editTreeProviderToken } from '@editor/providers/editTreeProvider'
import { GameDataProvider, gameDataProviderDependencies, gameDataProviderToken } from '@editor/providers/gameDataProvider'
import { GameDataStoreProvider, gameDataStoreProviderDependencies, gameDataStoreProviderToken } from '@editor/providers/gameDataStoreProvider'
import { Container } from '@ioc/container'

export class ProvidersBuilder {
    public register(container: Container): void {
        container.register({
            token: editTreeProviderToken,
            useClass: EditTreeProvider,
            deps: editTreeProviderDependencies
        })
        container.register({
            token: gameDataProviderToken,
            useClass: GameDataProvider,
            deps: gameDataProviderDependencies
        })
        container.register({
            token: gameDataStoreProviderToken,
            useClass: GameDataStoreProvider,
            deps: gameDataStoreProviderDependencies
        })
    }    
}
