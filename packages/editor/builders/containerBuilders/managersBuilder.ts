import { GameDefinitionLoaderManager, gameDefinitionLoaderManagerDependencies, gameDefinitionLoaderManagerToken } from '@editor/managers/gameDefinitionLoaderManager'
import { Container } from '@ioc/container'

export class ManagersBuilder {
    public register(container: Container): void {
        container.register({
            token: gameDefinitionLoaderManagerToken,
            useClass: GameDefinitionLoaderManager,
            deps: gameDefinitionLoaderManagerDependencies
        })
    }
}
