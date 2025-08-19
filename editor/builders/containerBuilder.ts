import { Container } from '@ioc/container'
import { ILogger, loggerToken } from '@utils/logger'

export interface IContainerBuilder {
    build(): Container
}

export class ContainerBuilder implements IContainerBuilder {
    constructor(
        private loggerFactory: () => ILogger
    ) { }

    public build(): Container {
        const logger = this.loggerFactory()
        const result = new Container(logger)
        result.register({ token: loggerToken, useValue: logger })
        return result
    }
}
