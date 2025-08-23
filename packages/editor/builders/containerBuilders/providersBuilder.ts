import { EditTreeProvider, editTreeProviderDependencies, editTreeProviderToken } from '@editor/providers/editTreeProvider'
import { GameDataProvider, gameDataProviderDependencies, gameDataProviderToken } from '@editor/providers/gameDataProvider'
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
    }    
}
