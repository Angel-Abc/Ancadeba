import { Token, token } from '@ioc/token'
import { type TileSet as TileSetData } from './data/tile'
import { TileSet, tileSetSchema } from './schema/tile'
import { dataPathProviderToken, IDataPathProvider } from '@providers/configProviders'
import { loadJsonResource } from '@utils/loadJsonResource'
import { mapTileSet } from './mappers/tile'

export interface ITileSetLoader {
    loadTileSet(path: string): Promise<TileSetData>
}

const logName = 'TileSetLoader'
export const tileSetLoaderToken = token<ITileSetLoader>(logName)
export const tileSetLoaderDependencies: Token<unknown>[] = [dataPathProviderToken]
export class TileSetLoader implements ITileSetLoader {
    constructor(private basePathProvider: IDataPathProvider) { }

    public async loadTileSet(path: string): Promise<TileSetData> {
        const schema = await loadJsonResource<TileSet>(`${this.basePathProvider.dataPath}/${path}`, tileSetSchema)
        return mapTileSet(schema.id, schema)

    }
}
