import { Container } from '@angelabc/utils/ioc'
import { ILogger, UtilsBuilder } from '@angelabc/utils/utils'
import { CoreBuilder } from './containers/coreBuilder'
import { ProvidersBuilder } from './containers/providersBuilder'
import { LoadersBuilder } from './containers/loadersBuilder'

export interface IContainerBuilder {
    build(): Container
}

export class ContainerBuilder implements IContainerBuilder {
    constructor(
        private logger: ILogger
    ){}

    public build(): Container {
        const result = new Container(this.logger)
        new UtilsBuilder().register(this.logger, result)
        new CoreBuilder().register(result)
        new ProvidersBuilder().register(result)
        new LoadersBuilder().register(result)
        return result
    }
}

