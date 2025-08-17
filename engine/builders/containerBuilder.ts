import { Container } from '@ioc/container'
import type { Container as IContainer } from '@ioc/types'

import { ActionsBuilder } from './containerBuilders/actionsBuilder'
import { CoreBuilder } from './containerBuilders/coreBuilder'
import { LoadersBuilder } from './containerBuilders/loadersBuilder'
import { ManagersBuilder } from './containerBuilders/managersBuilder'
import { ProvidersBuilder } from './containerBuilders/providersBuilder'
import { RegistriesBuilder } from './containerBuilders/registriesBuilder'
import { ServicesBuilder } from './containerBuilders/servicesBuilder'
import { ConsoleLogger, loggerToken } from '@utils/logger'
import { ConditionsBuilder } from './containerBuilders/conditionsBuilder'

/**
 * Builder abstraction for creating and configuring a dependency injection container.
 */
export interface IContainerBuilder {
  /**
   * Construct and configure a service container.
   *
   * @returns A fully configured container instance.
   */
  build(): Container
}

/**
 * Wires together all engine components using dependency injection.
 */
export class ContainerBuilder implements IContainerBuilder {
  /**
   * @param onQueueEmptyProvider Factory for creating callbacks when the message queue empties.
   * @param dataPath Base path for loading game data resources.
   */
  constructor(
    private onQueueEmptyProvider: (container: IContainer) => () => void = () => () => {},
    private dataPath: string = process.env.DATA_PATH ?? '/data',
  ) {}

  /**
   * Build and configure the dependency container.
   *
   * @returns Populated container instance.
   * @remarks Mutates the new container by registering all engine services.
   */
  public build(): Container {
    const logger = new ConsoleLogger()
    const result = new Container(logger)
    result.register({ token: loggerToken, useValue: logger })
    new CoreBuilder(this.onQueueEmptyProvider).register(result)
    new ProvidersBuilder(this.dataPath).register(result)
    new LoadersBuilder().register(result)
    new ServicesBuilder().register(result)
    new RegistriesBuilder().register(result)
    // Registers managers including map, tile set and player position managers
    new ManagersBuilder().register(result)
    new ActionsBuilder().register(result)
    new ConditionsBuilder().register(result)
    // Hook for custom service registrations
    logger.info('ContainerBuilder', 'Container build: {0}', result)
    return result
  }
}

