/**
 * Loads the root game configuration from disk and validates it against the
 * {@link gameSchema}. The resulting data structure is mapped into an internal
 * representation for the engine to consume.
 */
import { loadJsonResource } from '@utils/loadJsonResource'
import type { ILogger } from '@utils/logger'
import { loggerToken } from '@utils/logger'
import { dataPathProviderToken, IDataPathProvider } from '@providers/configProviders'
import { Game as GameData } from './data/game'
import { Game, gameSchema } from './schema/game'
import { mapGame } from './mappers/game'
import { Token, token } from '@ioc/token'

/**
 * Describes the ability to load a game's configuration.
 */
export interface IGameLoader {
    /**
     * Fetches and validates the root game definition.
     *
     * @returns A promise resolving to the validated and mapped game data.
     */
    loadGame(): Promise<GameData>
}

export const gameLoaderToken = token<IGameLoader>('GameLoader')
export const gameLoaderDependencies: Token<unknown>[] = [dataPathProviderToken, loggerToken]

/**
 * Loads game data using a base path provided by {@link IDataPathProvider}.
 */
export class GameLoader implements IGameLoader {

    /**
     * @param dataPathProvider Provides the base directory for game data files.
     */
    constructor(private dataPathProvider: IDataPathProvider, private logger: ILogger) {
    }

    /**
     * Reads `index.json`, validates it and maps it into runtime data.
     *
     * @returns The fully mapped {@link GameData} object.
     */
    async loadGame(): Promise<GameData> {
        const game = await loadJsonResource<Game>(`${this.dataPathProvider.dataPath}/index.json`, gameSchema, this.logger)
        return mapGame(game, this.dataPathProvider.dataPath)
    }
}
