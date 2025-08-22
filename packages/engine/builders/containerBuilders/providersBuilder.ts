import { Container } from '@ioc/container'
import { GameDataProvider, gameDataProviderDependencies, gameDataProviderToken } from '@providers/gameDataProvider'
import { ServiceProvider, serviceProviderToken } from '@providers/serviceProvider'
import { VirtualInputProvider, virtualInputProviderDependencies, virtualInputProviderToken } from '@providers/virtualInputProvider'
import { VirtualKeyProvider, virtualKeyProviderDependencies, virtualKeyProviderToken } from '@providers/virtualKeyProvider'

export class ProvidersBuilder {
    public register(container: Container): void {
        container.register({
            token: gameDataProviderToken,
            useClass: GameDataProvider,
            deps: gameDataProviderDependencies
        })
        container.register({
            token: virtualKeyProviderToken,
            useClass: VirtualKeyProvider,
            deps: virtualKeyProviderDependencies
        })
        container.register({
            token: virtualInputProviderToken,
            useClass: VirtualInputProvider,
            deps: virtualInputProviderDependencies
        })
        container.register({
            token: serviceProviderToken,
            useFactory: c => new ServiceProvider(c)
        })
    }
}
