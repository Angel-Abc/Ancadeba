import { Container, IContainer, ILogger } from '@ancadeba/utils'
import { registerServices as registerGameClientServices } from '../helpers/iocHelper'
import { registerServices as registerUtilsServices } from '@ancadeba/utils'
import { registerServices as registerContentServices } from '@ancadeba/content'
import { registerServices as registerEngineServices } from '@ancadeba/engine'
import { registerServices as registerEngineUiServices } from '@ancadeba/engine-ui'

export interface IContainerBuilder {
  build(): IContainer
}
const logName = 'game-client/builders/containerBuilder'
export class ContainerBuilder implements IContainerBuilder {
  constructor(
    private readonly logger: ILogger,
    private readonly resourcesDataPath: string,
  ) {}

  public build(): IContainer {
    this.logger.debug(
      logName,
      'Building IoC container with resources data path {0}',
      this.resourcesDataPath,
    )

    const container = new Container(this.logger)
    registerGameClientServices(container)
    registerUtilsServices(container)
    registerContentServices(container, this.resourcesDataPath)
    registerEngineServices(container)
    registerEngineUiServices(container)
    return container
  }
}
