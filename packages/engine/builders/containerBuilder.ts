import { Container } from '@ioc/container'
import { ILogger } from '@utils/logger'
import { CoreBuilder } from './containerBuilders/coreBuilder'
import { IContainer } from '@ioc/types'
import { ManagersBuilder } from './containerBuilders/managersBuilder'
import { LoadersBuilder } from './containerBuilders/loadersBuilder'
import { dataPathProviderToken } from '@providers/configProviders'
import { ServicesBuilder } from './containerBuilders/servicesBuilder'
import { ProvidersBuilder } from './containerBuilders/providersBuilder'
import { UtilsBuilder } from '../../shared/builder/utilsBuilder'
import { ActionsBuilder } from './containerBuilders/actionsBuilder'
import { RegistriesBuilder } from './containerBuilders/registriesBuilder'
import { ConditionsBuilder } from './containerBuilders/conditionsBuilder'
import { ActionHandlerRegistrar, actionHandlerRegistrarsToken, ConditionResolverRegistrar, conditionResolverRegistrarsToken, InputsProviderRegistrar, inputsProviderRegistrarsToken } from './containerBuilders/registrars'
import { InputsBuilder } from './containerBuilders/inputsBuilder'

export interface IContainerBuilder {
  build(): Container
}

export class ContainerBuilder implements IContainerBuilder {
  
  constructor(
    private logger: ILogger,
    private dataPath: string,
    private onQueueEmptyProvider: (container: IContainer) => () => void,
    private actionHandlerRegistrars: ActionHandlerRegistrar[],
    private inputsProviderRegistrars: InputsProviderRegistrar[],
    private conditionResolverRegistrars: ConditionResolverRegistrar[]
  ){}

  public build(): Container {
    const result = new Container(this.logger)
    this.registerStaticData(result)
    new UtilsBuilder(this.logger, this.onQueueEmptyProvider).register(result)
    new CoreBuilder().register(result)
    new ManagersBuilder().register(result)
    new LoadersBuilder().register(result)
    new ServicesBuilder().register(result)
    new ProvidersBuilder().register(result)
    new ActionsBuilder().register(result)
    new RegistriesBuilder().register(result)
    new ConditionsBuilder().register(result)
    new InputsBuilder().register(result)
    return result
  }

  private registerStaticData(container: Container){
    container.register({
      token: dataPathProviderToken,
      useValue: {
        dataPath: this.dataPath
      }
    })
    container.register({
      token: actionHandlerRegistrarsToken,
      useValue: this.actionHandlerRegistrars
    })
    container.register({
      token: inputsProviderRegistrarsToken,
      useValue: this.inputsProviderRegistrars
    })
    container.register({
      token: conditionResolverRegistrarsToken,
      useValue: this.conditionResolverRegistrars
    })
  }
}


// /**
//  * Wires together all engine components using dependency injection.
//  */
// export class ContainerBuilder implements IContainerBuilder {
//   /**
//    * @param onQueueEmptyProvider Factory for creating callbacks when the message queue empties.
//    * @param dataPath Base path for loading game data resources.
//    */
//   constructor(
//     private onQueueEmptyProvider: (container: IContainer) => () => void = () => () => { },
//     private dataPath: string = process.env.DATA_PATH ?? '/data',
//     private loggerFactory: () => ILogger,
//     private actionHandlerRegistrars: ActionHandlerRegistrar[] = [],
//     private conditionResolverRegistrars: ConditionResolverRegistrar[] = [],
//     private inputsProviderRegistrars: InputsProviderRegistrar[] = [],
//   ) {
//   }

//   /**
//    * Build and configure the dependency container.
//    *
//    * @returns Populated container instance.
//    * @remarks Mutates the new container by registering all engine services.
//    */
//   public build(): Container {
//     const logger = this.loggerFactory()
//     const result = new Container(logger)
//     result.register({ token: loggerToken, useValue: logger })
//     new CoreBuilder(
//       this.onQueueEmptyProvider,
//       this.actionHandlerRegistrars,
//       this.conditionResolverRegistrars,
//       this.inputsProviderRegistrars,
//     ).register(result)
//     new ProvidersBuilder(this.dataPath).register(result)
//     new LoadersBuilder().register(result)
//     new ServicesBuilder().register(result)
//     new RegistriesBuilder().register(result)
//     // Registers managers including map, tile set and player position managers
//     new ManagersBuilder().register(result)
//     new ActionsBuilder().register(result)
//     new ConditionsBuilder().register(result)
//     // Hook for custom service registrations
//     logger.info('ContainerBuilder', 'Container build: {0}', result)
//     return result
//   }
// }

