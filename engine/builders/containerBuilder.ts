import { GameEngine, gameEngineDependencies, gameEngineToken, IGameEngine } from '@engine/gameEngine'
import { TurnScheduler, turnSchedulerDependencies, turnSchedulerToken } from '@engine/turnScheduler'
import { Container } from '@ioc/container'
import type { Container as IContainer } from '@ioc/types'
import { MessageBus, messageBusDependencies, messageBusToken } from '@utils/messageBus'
import { MessageQueue, messageQueueToken } from '@utils/messageQueue'
import { dataPathProviderToken, IDataPathProvider } from '../providers/configProviders'
import { GameLoader, gameLoaderToken, IGameLoader } from '@loader/gameLoader'

export interface IContainerBuilder {
    build(): Container
}

export class ContainerBuilder implements IContainerBuilder {
    constructor(private onQueueEmptyProvider: (container: IContainer) => () => void = () => () => {}) {}
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
        result.register<IGameEngine>({
            token: gameEngineToken,
            useClass: GameEngine,
            deps: gameEngineDependencies
        })
        result.register<IDataPathProvider>({
            token: dataPathProviderToken,
            useValue: { dataPath: '/data' }
        })
        result.register<IGameLoader>({
            token: gameLoaderToken,
            useClass: GameLoader,
            deps: [dataPathProviderToken]
        })
        // Register other dependencies as needed
        return result
    }
}
