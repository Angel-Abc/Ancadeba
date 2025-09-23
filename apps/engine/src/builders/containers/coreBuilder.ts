import { Container } from '@angelabc/utils/ioc'
import { GameEngine, gameEngineDependencies, gameEngineToken } from '../../core/gameEngine'
import { GameStateProvider, gameStateProviderDependencies, gameStateProviderToken } from '../../core/gameState'

export class CoreBuilder {
    public register(container: Container): void {
        container.register({
            token: gameEngineToken,
            useClass: GameEngine,
            deps: gameEngineDependencies
        })
        container.register({
            token: gameStateProviderToken,
            useClass: GameStateProvider,
            deps: gameStateProviderDependencies
        })
    }
}