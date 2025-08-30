import { gameDataProviderToken, IGameDataProvider } from '@editor/providers/gameDataProvider'
import { gameDataStoreProviderToken, IGameDataStoreProvider } from '@editor/providers/gameDataStoreProvider'
import { gameJsonSaverToken, IGameJsonSaver } from '@editor/savers/gameJsonSaver'
import { Token, token } from '@ioc/token'

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
export class GameDataSavermanager implements IGameDataSaverManager {
    constructor(
        private gameDataStoreProvider: IGameDataStoreProvider,
        private gameDataProvider: IGameDataProvider,
        private gameJsonSaver: IGameJsonSaver
    ) { }

    public async saveChanges(): Promise<void> {
        const items = this.gameDataStoreProvider.getChangedItems()
        const promises: Promise<void>[] = []
       // promises.push(this.saveRoot())

        await Promise.all(
            items.map(item =>
                fetch(`/data/${item.path}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(item.data)
                })
            )
        )
        await Promise.all(promises)
    }
/*
    private async saveRoot(): Promise<void> {
        const root = this.gameDataProvider.
    }*/
}
