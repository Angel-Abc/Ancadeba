import { ILogger, loggerToken, Token, token } from '@ancadeba/utils'
import { Tile } from '@ancadeba/schemas'

export interface ITileDataStorage {
  addTileData(tileId: string, data: Tile): void
  getTileData(tileId: string): Tile
  getLoadedTileIds(): string[]
}

const logName = 'engine/resourceData/TileDataStorage'
export const tileDataStorageToken = token<ITileDataStorage>(logName)
export const tileDataStorageDependencies: Token<unknown>[] = [loggerToken]

export class TileDataStorage implements ITileDataStorage {
  private tiles: Map<string, Tile> = new Map()

  constructor(private readonly logger: ILogger) {}

  addTileData(tileId: string, data: Tile): void {
    this.tiles.set(tileId, data)
  }

  getTileData(tileId: string): Tile {
    const tile = this.tiles.get(tileId)
    if (!tile) {
      this.logger.fatal(logName, 'No tile data for id: {0}', tileId)
    }
    return tile
  }

  getLoadedTileIds(): string[] {
    return Array.from(this.tiles.keys())
  }
}
