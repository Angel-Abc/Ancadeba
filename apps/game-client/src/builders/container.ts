import {
  registerServices as registerUtilsServices,
  Container,
  type IContainer,
  type ILogger,
} from '@ancadeba/utils'
import { registerServices as registerGameClientServices } from '../helpers/iocHelper.js'

export interface IContainerBuilder {
  build(): IContainer
}

const logName = 'game-client/builders/container'
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
    registerUtilsServices(container)
    registerGameClientServices(container, this.resourcesDataPath)

    return container
  }
}
