import { GameEngine, gameEngineDependencies, gameEngineToken, IGameEngine } from '@engine/gameEngine'
import { Container } from '@ioc/container'
import { MessageBus, messageBusDependencies, messageBusToken } from '@utils/messageBus'
import { MessageQueue, messageQueueToken } from '@utils/messageQueue'
import { dataPathProviderToken, IDataPathProvider } from '../providers/configProviders'
import { GameLoader, gameLoaderToken, IGameLoader } from '@loader/gameLoader'

export interface IContainerBuilder {
    build(): Container
}

export class ContainerBuilder implements IContainerBuilder {
    public build(): Container {
        const result = new Container()
        result.register({
            token: messageQueueToken,
            useFactory: () => new MessageQueue(() => {})
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
