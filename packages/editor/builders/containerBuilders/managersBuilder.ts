import { GameDataLoaderManager, gameDataLoaderManagerDependencies, gameDataLoaderManagerToken } from '@editor/managers/gameDataLoaderManager'
import { GameDataSaverManager, gameDataSaverManagerDependencies, gameDataSaverManagerToken } from '@editor/managers/gameDataSaverManager'
import { Container } from '@ioc/container'

export class ManagersBuilder {
    public register(container: Container): void {
        container.register({
            token: gameDataLoaderManagerToken,
            useClass: GameDataLoaderManager,
            deps: gameDataLoaderManagerDependencies
        })
        container.register({
            token: gameDataSaverManagerToken,
            useClass: GameDataSaverManager,
            deps: gameDataSaverManagerDependencies
        })
    }
}
