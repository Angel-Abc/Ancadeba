import { InputMatrixBuilder, inputMatrixBuilderDependencies, inputMatrixBuilderToken } from '@builders/inputMatrixBuilder'
import { GameEngine, gameEngineDependencies, gameEngineToken } from '@core/gameEngine'
import { CoreInitializer, coreInitializerDependencies, coreInitializerToken } from '@core/initializers/coreInitializers'
import { EngineInitializer, engineInitializerDependencies, engineInitializerToken } from '@core/initializers/engineInitializer'
import { EngineStartInitializer, engineStartInitializerDependencies, engineStartInitializerToken } from '@core/initializers/engineStartInitializer'
import { ManagersInitializer, managersInitializerDependencies, managersInitializerToken } from '@core/initializers/managersInitializer'
import { ProvidersInitializer, providersInitializerDependencies, providersInitializerToken } from '@core/initializers/providersInitializer'
import { RegistriesInitializer, registriesInitializerDependencies, registriesInitializerToken } from '@core/initializers/registriesInitializers'
import { TurnScheduler, turnSchedulerDependencies, turnSchedulerToken } from '@core/turnScheduler'
import { Container } from '@ioc/container'

export class CoreBuilder {
    public register(container: Container): void {
        container.register({
            token: gameEngineToken,
            useClass: GameEngine,
            deps: gameEngineDependencies
        })
        container.register({
            token: turnSchedulerToken,
            useClass: TurnScheduler,
            deps: turnSchedulerDependencies
        })
        container.register({
            token: inputMatrixBuilderToken,
            useClass: InputMatrixBuilder,
            deps: inputMatrixBuilderDependencies
        })
        container.register({
            token: engineInitializerToken,
            useClass: EngineInitializer,
            deps: engineInitializerDependencies
        })
        container.register({
            token: coreInitializerToken,
            useClass: CoreInitializer,
            deps: coreInitializerDependencies
        })
        container.register({
            token: engineStartInitializerToken,
            useClass: EngineStartInitializer,
            deps: engineStartInitializerDependencies
        })
        container.register({
            token: providersInitializerToken,
            useClass: ProvidersInitializer,
            deps: providersInitializerDependencies
        })
        container.register({
            token: managersInitializerToken,
            useClass: ManagersInitializer,
            deps: managersInitializerDependencies
        })
        container.register({
            token: registriesInitializerToken,
            useClass: RegistriesInitializer,
            deps: registriesInitializerDependencies
        })
    }
}
