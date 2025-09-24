import { Container } from '@angelabc/utils/ioc'
import { GameEngine, gameEngineDependencies, gameEngineToken } from '../../core/gameEngine'
import { EngineInitializer, engineInitializerDependencies, engineInitializerToken } from '../../core/initializers/engineInitializer'
import { ProvidersInitializer, providersInitializerDependencies, providersInitializerToken } from '../../core/initializers/providersInitializer'

export class CoreBuilder {
    public register(container: Container): void {
        container.register({
            token: gameEngineToken,
            useClass: GameEngine,
            deps: gameEngineDependencies
        })
        container.register({
            token: engineInitializerToken,
            useClass: EngineInitializer,
            deps: engineInitializerDependencies
        })
        container.register({
            token: providersInitializerToken,
            useClass: ProvidersInitializer,
            deps: providersInitializerDependencies
        })
    }
}
