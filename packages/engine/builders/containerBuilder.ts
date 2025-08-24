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

