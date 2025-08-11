import { loadJsonResource } from '@utils/loadJsonResource'
import { dataPathProviderToken, IDataPathProvider } from '../providers/configProviders'
import { Game as GameData } from './data/game'
import { Game, gameSchema } from './schema/game'
import { mapGame } from './mappers/game'
import { token } from '@ioc/token'

export interface IGameLoader {
    loadGame: () => Promise<GameData>
}

export const gameLoaderToken = token<IGameLoader>('GameLoader')
export const gameLoaderDependencies = [dataPathProviderToken]
export class GameLoader implements IGameLoader {
    private basePathProvider: IDataPathProvider
    
    constructor(basePathProvider: IDataPathProvider) {
        this.basePathProvider = basePathProvider
    }
    async loadGame(): Promise<GameData> {
        const game = await loadJsonResource<Game>(`${this.basePathProvider.dataPath}/index.json`, gameSchema)
        return mapGame(game)
    }
}