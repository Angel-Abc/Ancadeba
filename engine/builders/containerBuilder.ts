import { GameEngine, gameEngineDependencies, gameEngineToken, IGameEngine } from '@engine/gameEngine'
import { Container } from '@ioc/container'

export interface IContainerBuilder {
    build(): Container
}

export class ContainerBuilder implements IContainerBuilder {
    public build(): Container {
        const result =  new Container()
        result.register<IGameEngine>({
            token: gameEngineToken,
            useClass: GameEngine,
            deps: gameEngineDependencies
        })
        return result
    }
}
