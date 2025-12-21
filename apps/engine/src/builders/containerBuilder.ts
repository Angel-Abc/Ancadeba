import {
  Container,
  IContainer,
  ILogger,
  registerServices as registerUtilsServices,
} from '@ancadeba/utils'
import { registerServices as registerSchemasServices } from '@ancadeba/schemas'

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
    registerSchemasServices(container, this.resourcesDataPath)
    return container
  }
}
