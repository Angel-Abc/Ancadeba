import { gameDataProviderToken, IGameDataProvider } from '@editor/providers/gameDataProvider'
import { gameDataStoreProviderToken, IGameDataStoreProvider, rootPath } from '@editor/providers/gameDataStoreProvider'
import { gameJsonSaverToken, IGameJsonSaver } from '@editor/savers/gameJsonSaver'
import { Token, token } from '@ioc/token'
import { Game, gameSchema } from '@loader/schema/game'
import { Language, languageSchema } from '@loader/schema/language'
import { Page, pageSchema } from '@loader/schema/page'

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
        const changed = this.gameDataStoreProvider.getChangedItems()
        const promises: Promise<void>[] = []
        for (const item of changed) {
            const path = item.path
            if (path === rootPath || path === 'index.json') {
                promises.push(this.gameJsonSaver.saveJson<Game>(path, item.data as Game, gameSchema))
            } else if (/(^|\/)languages\//i.test(path)) {
                promises.push(this.gameJsonSaver.saveJson<Language>(path, item.data as Language, languageSchema))
            } else if (/(^|\/)pages\//i.test(path)) {
                promises.push(this.gameJsonSaver.saveJson<Page>(path, item.data as Page, pageSchema))
            } else {
                // Unknown path type for now; skip
            }
        }
        await Promise.all(promises)
    }
}
