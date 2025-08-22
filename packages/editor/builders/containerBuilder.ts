import { dataUrlToken } from '@editor/managers/gameDefinitionLoaderManager'
import { Container } from '@ioc/container'
import { ILogger } from '@utils/logger'
import { UtilsBuilder } from '../../shared/builder/utilsBuilder'
import { CoreBuilder } from './containerBuilders/coreBuilder'
import { ManagersBuilder } from './containerBuilders/managersBuilder'
import { ProvidersBuilder } from './containerBuilders/providersBuilder'

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
        new UtilsBuilder(logger, () => () => {}).register(result)
        this.registerStaticData(result)
        new CoreBuilder().register(result)
        new ManagersBuilder().register(result)
        new ProvidersBuilder().register(result)
        return result
    }

    private registerStaticData(container: Container) {
        container.register({
            token: dataUrlToken,
            useValue: this.dataUrl
        })
    }
}
