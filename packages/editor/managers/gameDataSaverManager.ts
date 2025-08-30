import { gameDataProviderToken, IGameDataProvider } from '@editor/providers/gameDataProvider'
import { gameDataStoreProviderToken, IGameDataStoreProvider } from '@editor/providers/gameDataStoreProvider'
import { gameJsonSaverToken, IGameJsonSaver } from '@editor/savers/gameJsonSaver'
import { Token, token } from '@ioc/token'
import { Game, gameSchema } from '@loader/schema/game'

export interface IGameDataSaverManager {
    saveChanges(): Promise<void>
}

const logName = 'GameDataSavermanager'
export const gameDataSaverManagerToken = token<IGameDataSaverManager>(logName)
export const gameDataSaverManagerDependencies: Token<unknown>[] = [
    gameDataStoreProviderToken,
    gameDataProviderToken,
    gameJsonSaverToken
]
export class GameDataSaverManager implements IGameDataSaverManager {
    constructor(
        private gameDataStoreProvider: IGameDataStoreProvider,
        private gameDataProvider: IGameDataProvider,
        private gameJsonSaver: IGameJsonSaver
    ) { }

    public async saveChanges(): Promise<void> {
        const promises: Promise<void>[] = []
        promises.push(this.saveRoot())
        await Promise.all(promises)
    }

    private async saveRoot(): Promise<void> {
        const root = this.gameDataProvider.root
        const item = this.gameDataStoreProvider.retrieveItem<Game>(root.id)
        if (JSON.stringify(item.Original) !== JSON.stringify(item.current)) {
            this.gameJsonSaver.saveJson<Game>(item.path, item.current, gameSchema)
        }
    }
}
