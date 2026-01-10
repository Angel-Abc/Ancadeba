import { Token, token } from '@ancadeba/utils'
import type { Map as MapData, Tile } from '@ancadeba/schemas'
import {
  IResourceDataStorage,
  resourceDataStorageToken,
} from '../../resourceData/storage'

export interface IMapDataInitializer {
  initializeMaps(maps: MapData[]): void
}

const logName = 'engine/core/initializers/mapDataInitializer'
export const mapDataInitializerToken = token<IMapDataInitializer>(logName)
export const mapDataInitializerDependencies: Token<unknown>[] = [
  resourceDataStorageToken,
]

export class MapDataInitializer implements IMapDataInitializer {
  constructor(private readonly resourceDataStorage: IResourceDataStorage) {}

  initializeMaps(maps: MapData[]): void {
    maps.forEach((map) => {
      this.resourceDataStorage.addMapData(map.id, {
        id: map.id,
        width: map.width,
        height: map.height,
        tiles: new Map<string, Tile>(
          map.tiles.map((tile) => [
            tile.key,
            this.resourceDataStorage.getTileData(tile.tile),
          ])
        ),
        squares: map.map.map((row) => row.split(',')),
      })
    })
  }
}
