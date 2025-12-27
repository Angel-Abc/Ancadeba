import {
  Container,
  IContainer,
  ILogger,
  registerServices as registerUtilsServices,
} from '@ancadeba/utils'
import { registerServices as registerSchemasServices } from '@ancadeba/schemas'
import { registerServices } from './iocHelper'
import { registerServices as registerUiServices } from '@ancadeba/ui'

export interface IContainerBuilder {
  build(): IContainer
}

export class ContainerBuilder implements IContainerBuilder {
  constructor(
    private readonly logger: ILogger,
    private readonly resourcesDataPath: string
  ) {}

  build(): IContainer {
    const container = new Container(this.logger)
    registerUtilsServices(container, this.logger)
    registerUiServices(container, document)
    registerSchemasServices(container, this.resourcesDataPath)
    registerServices(container)
    return container
  }
}
