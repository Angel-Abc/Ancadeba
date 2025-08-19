/**
 * Loads a game map configuration from disk, validates it against
 * {@link gameMapSchema} and maps the result into the engine's internal
 * representation.
 */
import { Token, token } from '@ioc/token'
import { type GameMap as GameMapData } from './data/map'
import { dataPathProviderToken, IDataPathProvider } from '@providers/configProviders'
import { loadJsonResource } from '@utils/loadJsonResource'
import type { ILogger } from '@utils/logger'
import { loggerToken } from '@utils/logger'
import { GameMap, gameMapSchema } from '@loader/schema/map'
import { mapGameMap } from './mappers/map'

/**
 * Describes the capability to retrieve and validate map definitions.
 */
export interface IGameMapLoader {
    /**
     * Loads a map JSON file and converts it to runtime data.
     *
     * @param path Path to the map file, relative to the base data directory.
     * @returns A promise resolving to the validated and mapped map data.
     */
    loadMap(path: string): Promise<GameMapData>
}

const logName = 'GameMapLoader'
export const gameMapLoaderToken = token<IGameMapLoader>(logName)
export const gameMapLoaderDependencies: Token<unknown>[] = [dataPathProviderToken, loggerToken]
/**
 * Retrieves map data using a base path provided by
 * {@link IDataPathProvider}.
 */
export class GameMapLoader implements IGameMapLoader {
    /**
     * @param dataPathProvider Supplies the directory containing map resources.
     */
    constructor(private dataPathProvider: IDataPathProvider, private logger: ILogger) { }

    /**
     * Reads a map file, validates its structure and maps it into engine
     * specific data.
     *
     * @param path Location of the map JSON relative to the base path.
     * @returns The mapped {@link GameMapData} object.
     */
    public async loadMap(path: string): Promise<GameMapData> {
        const schema = await loadJsonResource<GameMap>(`${this.dataPathProvider.dataPath}/${path}`, gameMapSchema, this.logger)
        return mapGameMap(schema)
    }
}
