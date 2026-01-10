import { ILogger, loggerToken, Token, token } from '@ancadeba/utils'
import { MapData } from './types'

export interface IMapDataStorage {
  addMapData(mapId: string, data: MapData): void
  getMapData(mapId: string): MapData
  getLoadedMapIds(): string[]
}

const logName = 'engine/resourceData/MapDataStorage'
export const mapDataStorageToken = token<IMapDataStorage>(logName)
export const mapDataStorageDependencies: Token<unknown>[] = [loggerToken]

export class MapDataStorage implements IMapDataStorage {
  private maps: Map<string, MapData> = new Map()

  constructor(private readonly logger: ILogger) {}

  addMapData(mapId: string, data: MapData): void {
    this.maps.set(mapId, data)
  }

  getMapData(mapId: string): MapData {
    const map = this.maps.get(mapId)
    if (!map) {
      this.logger.fatal(logName, 'No map data for id: {0}', mapId)
    }
    return map
  }

  getLoadedMapIds(): string[] {
    return Array.from(this.maps.keys())
  }
}
