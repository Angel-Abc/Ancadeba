import { GameEngine, gameEngineDependencies, gameEngineToken, IGameEngine } from '@engine/gameEngine'
import { TurnScheduler, turnSchedulerDependencies, turnSchedulerToken } from '@engine/turnScheduler'
import { Container } from '@ioc/container'
import type { Container as IContainer } from '@ioc/types'
import { MessageBus, messageBusDependencies, messageBusToken } from '@utils/messageBus'
import { MessageQueue, messageQueueToken } from '@utils/messageQueue'
import { GameLoader, gameLoaderToken, IGameLoader } from '@loader/gameLoader'
import { LanguageLoader, languageLoaderDependencies, languageLoaderToken } from '@loader/languageLoader'
import { EngineInitializer, engineInitializerDependencies, engineInitializerToken } from '@engine/engineInitializer'
import { PageLoader, pageLoaderDependencies, pageLoaderToken } from '@loader/pageLoader'
import { dataPathProviderToken, IDataPathProvider } from '@providers/configProviders'
import { GameDataProvider, gameDataProviderDependencies, gameDataProviderToken } from '@providers/gameDataProvider'
import { TranslationService, translationServiceToken } from '@services/translationService'
import { DomManager, domManagerDependencies, domManagerToken } from '@managers/domManager'
import { LanguageManager, languageManagerDependencies, languageManagerToken } from '@managers/languageManager'
import { PageManager, pageManagerDependencies, pageManagerToken } from '@managers/pageManager'
import { IServiceProvider, ServiceProvider, serviceProviderToken } from '@providers/serviceProvider'

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
        this.registerCore(result)
        this.registerProviders(result)
        this.registerLoaders(result)
        this.registerServices(result)
        this.registerManagers(result)
        // Register other dependencies as needed
        return result
    }

    private registerCore(container: Container): void {
        container.register({
            token: turnSchedulerToken,
            useClass: TurnScheduler,
            deps: turnSchedulerDependencies
        })
        container.register({
            token: messageQueueToken,
            useFactory: (c) => new MessageQueue(this.onQueueEmptyProvider(c))
        })
        container.register({
            token: messageBusToken,
            useClass: MessageBus,
            deps: messageBusDependencies
        })
        container.register({
            token: engineInitializerToken,
            useClass: EngineInitializer,
            deps: engineInitializerDependencies
        })
        container.register<IGameEngine>({
            token: gameEngineToken,
            useClass: GameEngine,
            deps: gameEngineDependencies
        })
    }

    private registerProviders(container: Container): void {
        container.register<IServiceProvider>({
            token: serviceProviderToken,
            useFactory: c => new ServiceProvider(c)
        })
        container.register<IDataPathProvider>({
            token: dataPathProviderToken,
            useValue: { dataPath: this.dataPath }
        })
        container.register({
            token: gameDataProviderToken,
            useClass: GameDataProvider,
            deps: gameDataProviderDependencies
        })
    }

    private registerLoaders(container: Container): void {
        container.register<IGameLoader>({
            token: gameLoaderToken,
            useClass: GameLoader,
            deps: [dataPathProviderToken]
        })
        container.register({
            token: languageLoaderToken,
            useClass: LanguageLoader,
            deps: languageLoaderDependencies
        })
        container.register({
            token: pageLoaderToken,
            useClass: PageLoader,
            deps: pageLoaderDependencies
        })
    }

    private registerServices(container: Container): void {
        container.register({
            token: translationServiceToken,
            useClass: TranslationService,
            deps: []
        })
    }

    private registerManagers(container: Container): void {
        container.register({
            token: domManagerToken,
            useClass: DomManager,
            deps: domManagerDependencies,
            scope: 'transient'
        })
        container.register({
            token: languageManagerToken,
            useClass: LanguageManager,
            deps: languageManagerDependencies
        })
        container.register({
            token: pageManagerToken,
            useClass: PageManager,
            deps: pageManagerDependencies
        })
    }
}
