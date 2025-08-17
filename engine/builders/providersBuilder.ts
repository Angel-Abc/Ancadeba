import { PageInputsProvider, pageInputsProviderDependencies, pageInputsProviderToken } from '@inputs/pageInputsProvider'
import { Container } from '@ioc/container'
import { dataPathProviderToken, IDataPathProvider } from '@providers/configProviders'
import { GameDataProvider, gameDataProviderDependencies, gameDataProviderToken } from '@providers/gameDataProvider'
import { ServiceProvider, serviceProviderToken } from '@providers/serviceProvider'
import { VirtualInputProvider, virtualInputProviderDependencies, virtualInputProviderToken } from '@providers/virtualInputProvider'
import { VirtualKeyProvider, virtualKeyProviderDependencies, virtualKeyProviderToken } from '@providers/virtualKeyProvider'

/**
 * Registers provider services for data, configuration and input.
 */
export class ProvidersBuilder {
  constructor(private dataPath: string) {}

  /**
   * Register provider dependencies into the container.
   */
  register(container: Container): void {
    container.register({
      token: serviceProviderToken,
      useFactory: c => new ServiceProvider(c)
    })
    container.register<IDataPathProvider>({
      token: dataPathProviderToken,
      useValue: { dataPath: this.dataPath }
    })
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
      token: pageInputsProviderToken,
      useClass: PageInputsProvider,
      deps: pageInputsProviderDependencies
    })
  }
}

