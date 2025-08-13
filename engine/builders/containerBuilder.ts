import { GameEngine, gameEngineDependencies, gameEngineToken, IGameEngine } from '@engine/gameEngine'
import { TurnScheduler, turnSchedulerDependencies, turnSchedulerToken } from '@engine/turnScheduler'
import { Container } from '@ioc/container'
import type { Container as IContainer } from '@ioc/types'
import { MessageBus, messageBusDependencies, messageBusToken } from '@utils/messageBus'
import { MessageQueue, messageQueueToken } from '@utils/messageQueue'
import { dataPathProviderToken, IDataPathProvider } from '../providers/configProviders'
import { GameLoader, gameLoaderToken, IGameLoader } from '@loader/gameLoader'
import { DomManager, domManagerDependencies, domManagerToken } from '../managers/domManager'
import { TranslationService, translationServiceToken } from '../services/translationService'
import { LanguageManager, languageManagerDependencies, languageManagerToken } from '../managers/languageManager'
import { LanguageLoader, languageLoaderDependencies, languageLoaderToken } from '@loader/languageLoader'
import { GameDataProvider, gameDataProviderDependencies, gameDataProviderToken } from '../providers/gameDataProvider'
import { EngineInitializer, engineInitializerDependencies, engineInitializerToken } from '@engine/engineInitializer'
import { PageManager, pageManagerDependencies, pageManagerToken } from '../managers/pageManager'
import { PageLoader, pageLoaderDependencies, pageLoaderToken } from '@loader/pageLoader'

export interface IContainerBuilder {
    build(): Container
}

export class ContainerBuilder implements IContainerBuilder {
    constructor(
        private onQueueEmptyProvider: (container: IContainer) => () => void = () => () => {},
        private dataPath: string = process.env.DATA_PATH ?? '/data',
    ) {}

    public build(): Container {
        const result = new Container()
        result.register({
            token: turnSchedulerToken,
            useClass: TurnScheduler,
            deps: turnSchedulerDependencies
        })
        result.register({
            token: messageQueueToken,
            useFactory: (container) => new MessageQueue(this.onQueueEmptyProvider(container))
        })
        result.register({
            token: messageBusToken,
            useClass: MessageBus,
            deps: messageBusDependencies
        })
        result.register({
            token: engineInitializerToken,
            useClass: EngineInitializer,
            deps: engineInitializerDependencies
        })
        result.register<IGameEngine>({
            token: gameEngineToken,
            useClass: GameEngine,
            deps: gameEngineDependencies
        })
        result.register<IDataPathProvider>({
            token: dataPathProviderToken,
            useValue: { dataPath: this.dataPath }
        })
        result.register<IGameLoader>({
            token: gameLoaderToken,
            useClass: GameLoader,
            deps: [dataPathProviderToken]
        })
        result.register({
            token: domManagerToken,
            useClass: DomManager,
            deps: domManagerDependencies,
            scope: 'transient'
        })
        result.register({
            token: translationServiceToken,
            useClass: TranslationService,
            deps: []
        })
        result.register({
            token: languageManagerToken,
            useClass: LanguageManager,
            deps: languageManagerDependencies
        })
        result.register({
            token: languageLoaderToken,
            useClass: LanguageLoader,
            deps: languageLoaderDependencies
        })
        result.register({
            token: gameDataProviderToken,
            useClass: GameDataProvider,
            deps: gameDataProviderDependencies
        })
        result.register({
            token: pageManagerToken,
            useClass: PageManager,
            deps: pageManagerDependencies
        })
        result.register({
            token: pageLoaderToken,
            useClass: PageLoader,
            deps: pageLoaderDependencies
        })
        // Register other dependencies as needed
        return result
    }
}
