import { Container } from '@ioc/container'
import { UtilsBuilder } from '@utils/builder/utilsBuilder'
import { ILogger } from '@utils/logger'
import { dataUrlToken } from './containerBuilders/staticDataTokens'
import { CoreBuilder } from './containerBuilders/coreBuilder'

export interface IRootBuilder {
    build(): Container
}

export class RootBuilder implements IRootBuilder {
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
        return result
    }

    private registerStaticData(container: Container) {
        container.register({
            token: dataUrlToken,
            useValue: this.dataUrl
        })
    }
}
