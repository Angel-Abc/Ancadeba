/**
 * Loads a tileset description from disk, verifies its structure with
 * {@link tileSetSchema} and produces the engine's internal tileset data.
 */
import { Token, token } from '@ioc/token'
import { type TileSet as TileSetData } from './data/tile'
import { TileSet, tileSetSchema } from './schema/tile'
import { dataPathProviderToken, IDataPathProvider } from '@providers/configProviders'
import { loadJsonResource } from '@utils/loadJsonResource'
import { mapTileSet } from './mappers/tile'

/**
 * Defines the interface for fetching and validating tileset definitions.
 */
export interface ITileSetLoader {
    /**
     * Retrieves a tileset JSON file and maps it to runtime data.
     *
     * @param path Path to the tileset file relative to the base data directory.
     * @returns A promise resolving to the validated and mapped tileset data.
     */
    loadTileSet(path: string): Promise<TileSetData>
}

const logName = 'TileSetLoader'
export const tileSetLoaderToken = token<ITileSetLoader>(logName)
export const tileSetLoaderDependencies: Token<unknown>[] = [dataPathProviderToken]
/**
 * Concrete implementation of {@link ITileSetLoader} that resolves files using
 * {@link IDataPathProvider}.
 */
export class TileSetLoader implements ITileSetLoader {
    /**
     * @param basePathProvider Provides the directory containing tileset files.
     */
    constructor(private basePathProvider: IDataPathProvider) { }

    /**
     * Loads a tileset file, validates its contents and maps it into engine
     * compatible data.
     *
     * @param path Location of the tileset JSON relative to the base path.
     * @returns The mapped {@link TileSetData} object.
     */
    public async loadTileSet(path: string): Promise<TileSetData> {
        const schema = await loadJsonResource<TileSet>(`${this.basePathProvider.dataPath}/${path}`, tileSetSchema)
        return mapTileSet(this.basePathProvider.dataPath, schema)
    }
}
