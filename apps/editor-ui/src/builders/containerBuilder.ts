import { Container } from '@angelabc/utils/ioc'
import { ILogger, UtilsBuilder } from '@angelabc/utils/utils'
import { CoreBuilder } from './containers/coreBuilder'
import { ProvidersBuilder } from './containers/providersBuilder'
import { SchemasBuilder } from '@angelabc/schemas/loaders'

export interface IContainerBuilder {
  build(): Container
}

export class ContainerBuilder implements IContainerBuilder {
  constructor(
    private logger: ILogger
  ) { }

  public build(): Container {
    const container = new Container(this.logger)
    new UtilsBuilder().register(this.logger, container, document)
    new SchemasBuilder().register(container, 'http://localhost:3001')
    new ProvidersBuilder().register(container)
    new CoreBuilder().register(container)
    return container
  }
}
