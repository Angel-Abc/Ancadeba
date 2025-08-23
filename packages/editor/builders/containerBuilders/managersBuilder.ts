import { GameDataLoaderManager, gameDataLoaderManagerDependencies, gameDataLoaderManagerToken } from '@editor/managers/gameDataLoaderManager'
import { Container } from '@ioc/container'

export class ManagersBuilder {
    public register(container: Container): void {
        container.register({
            token: gameDataLoaderManagerToken,
            useClass: GameDataLoaderManager,
            deps: gameDataLoaderManagerDependencies
        })
    }
}
