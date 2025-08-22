import { EditTreeProvider, editTreeProviderDependencies, editTreeProviderToken } from '@editor/providers/editTreeProvider'
import { Container } from '@ioc/container'

export class ProvidersBuilder {
    public register(container: Container): void {
        container.register({
            token: editTreeProviderToken,
            useClass: EditTreeProvider,
            deps: editTreeProviderDependencies
        })
    }    
}
