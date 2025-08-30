import { Container } from '@ioc/container'
import { ILogger } from '@utils/logger'
import { UtilsBuilder } from '../../shared/builder/utilsBuilder'
import { CoreBuilder } from './containerBuilders/coreBuilder'
import { ManagersBuilder } from './containerBuilders/managersBuilder'
import { ProvidersBuilder } from './containerBuilders/providersBuilder'
import { ValidatorsBuilder } from './containerBuilders/validatorsBuilder'
import { dataUrlToken } from './staticDataTokens'
import { LoadersBuilder } from './containerBuilders/loadersBuilder'
import { SaversBuilder } from './containerBuilders/saversBuilder'

export interface IContainerBuilder {
    build(): Container
}

export class ContainerBuilder implements IContainerBuilder {
    constructor(
        private loggerFactory: () => ILogger,
        private dataUrl: string
    ) { }

    public build(): Container {
        const logger = this.loggerFactory()
        const result = new Container(logger)
        this.registerStaticData(result)
        new UtilsBuilder(logger, () => () => {}).register(result)
        new CoreBuilder().register(result)
        new ManagersBuilder().register(result)
        new ProvidersBuilder().register(result)
        new ValidatorsBuilder().register(result)
        new LoadersBuilder().register(result)
        new SaversBuilder().register(result)
        return result
    }

    private registerStaticData(container: Container) {
        container.register({
            token: dataUrlToken,
            useValue: this.dataUrl
        })
    }
}
