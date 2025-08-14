import { Token, token } from '@ioc/token'
import { type GameMap as GameMapData } from './data/map'
import { dataPathProviderToken, IDataPathProvider } from '@providers/configProviders'
import { loadJsonResource } from '@utils/loadJsonResource'
import { GameMap, gameMapSchema } from './schema/map'
import { mapGameMap } from './mappers/map'

export interface IGameMapLoader {
    loadMap(path: string): Promise<GameMapData>
}

const logName = 'GameMapLoader'
export const gameMapLoaderToken = token<IGameMapLoader>(logName)
export const gameMapLoaderDependencies: Token<unknown>[] = [dataPathProviderToken]
export class GameMapLoader implements IGameMapLoader {
    constructor(private basePathProvider: IDataPathProvider) { }

    public async loadMap(path: string): Promise<GameMapData> {
        const schema = await loadJsonResource<GameMap>(`${this.basePathProvider.dataPath}/${path}`, gameMapSchema)
        return mapGameMap(schema)
    }
}
