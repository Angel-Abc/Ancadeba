import { Token, token } from '@ancadeba/utils'
import type { TileSet } from '@ancadeba/schemas'
import {
  ITileDataStorage,
  tileDataStorageToken,
} from '../../resourceData/storage'

export interface ITileDataInitializer {
  initializeTiles(tileSets: TileSet[]): void
}

const logName = 'engine/core/initializers/tileDataInitializer'
export const tileDataInitializerToken = token<ITileDataInitializer>(logName)
export const tileDataInitializerDependencies: Token<unknown>[] = [
  tileDataStorageToken,
]

export class TileDataInitializer implements ITileDataInitializer {
  constructor(private readonly tileDataStorage: ITileDataStorage) {}

  initializeTiles(tileSets: TileSet[]): void {
    tileSets.forEach((tileSet) => {
      tileSet.tiles.forEach((tile) => {
        const tileId = `${tileSet.id}.${tile.id}`
        this.tileDataStorage.addTileData(tileId, tile)
      })
    })
  }
}
