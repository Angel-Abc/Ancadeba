import { GameEngine, gameEngineDependencies, gameEngineToken, IGameEngine } from '@engine/gameEngine'
import { Container } from '@ioc/container'
import { MessageBus, messageBusDependencies, messageBusToken } from '@utils/messageBus'
import { MessageQueue, messageQueueToken } from '@utils/messageQueue'

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
            useFactory: c => new MessageBus(c.resolve(messageQueueToken)),
            deps: messageBusDependencies
        })
        result.register<IGameEngine>({
            token: gameEngineToken,
            useFactory: c => new GameEngine(c.resolve(messageBusToken)),
            deps: gameEngineDependencies
        })
        return result
    }
}
