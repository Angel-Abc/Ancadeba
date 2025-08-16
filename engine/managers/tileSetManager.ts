import { Token, token } from '@ioc/token'
import { ITileSetLoader, tileSetLoaderToken } from '@loader/tileSetLoader'
import { fatalError } from '@utils/logMessage'
import { gameDataProviderToken, IGameDataProvider } from '@providers/gameDataProvider'

/**
 * Handles loading of tile sets required by maps.
 */
export interface ITileSetManager {
    ensureTileSets(tileSetIds: string[]): Promise<void>
}

const logName = 'TileSetManager'
export const tileSetManagerToken = token<ITileSetManager>(logName)
export const tileSetManagerDependencies: Token<unknown>[] = [
    gameDataProviderToken,
    tileSetLoaderToken
]

/**
 * Default implementation of {@link ITileSetManager}.
 */
export class TileSetManager implements ITileSetManager {
    constructor(
        private gameDataProvider: IGameDataProvider,
        private tileSetLoader: ITileSetLoader
    ) {}

    /**
     * Ensures that the provided tile sets are loaded into memory.
     *
     * @param tileSetIds - Identifiers of tile sets required by the map.
     * @remarks Loads tile sets that have not been previously loaded and stores
     * them in the game data provider.
     */
    public async ensureTileSets(tileSetIds: string[]): Promise<void> {
        await Promise.all(
            tileSetIds.map(async tileSetId => {
                const path = this.gameDataProvider.Game.game.tiles[tileSetId]
                if (!path) fatalError(logName, 'Tile set not found for id {0}', tileSetId)

                if (!this.gameDataProvider.Game.loadedTileSets.has(tileSetId)) {
                    const tileSet = await this.tileSetLoader.loadTileSet(path)
                    this.gameDataProvider.Game.loadedTileSets.add(tileSetId)
                    tileSet.tiles.forEach(tile => this.gameDataProvider.Game.loadedTiles.set(tile.key, tile))
                }
            })
        )
    }
}

