import { EditTreeProvider, editTreeProviderDependencies, editTreeProviderToken } from '@editor/providers/editTreeProvider'
import { GameDefinitionProvider, gameDefinitionProviderDependencies, gameDefinitionProviderToken } from '@editor/providers/gameDefinitionProvider'
import { Container } from '@ioc/container'

export class ProvidersBuilder {
    public register(container: Container): void {
        container.register({
            token: gameDefinitionProviderToken,
            useClass: GameDefinitionProvider,
            deps: gameDefinitionProviderDependencies
        })
        container.register({
            token: editTreeProviderToken,
            useClass: EditTreeProvider,
            deps: editTreeProviderDependencies
        })
    }    
}
