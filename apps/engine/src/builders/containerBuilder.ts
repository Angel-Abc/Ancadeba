import { Container } from '@angelabc/utils/ioc'
import { ILogger } from '@angelabc/utils/utils'

export interface IContainerBuilder {
    build(): Container
}

export class ContainerBuilder implements IContainerBuilder {
    constructor(
        private logger: ILogger
    ){}

    public build(): Container {
        // no code here yet
    }
}

