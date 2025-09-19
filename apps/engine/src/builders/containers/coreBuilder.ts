import { Container } from '@angelabc/utils/ioc'
import { GameEngine, gameEngineDependencies, gameEngineToken } from '../../core/gameEngine'

export class CoreBuilder {
    public register(container: Container): void {
        container.register({
            token: gameEngineToken,
            useClass: GameEngine,
            deps: gameEngineDependencies
        })
    }
}