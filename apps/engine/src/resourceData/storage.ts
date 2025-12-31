import { ILogger, loggerToken, Token, token } from '@ancadeba/utils'
import {
  IJsonConfiguration,
  jsonConfigurationToken,
  Scene,
  Tile,
} from '@ancadeba/schemas'
import { MapData } from './types'

export interface IResourceDataStorage {
  get rootPath(): string
  logResourceData(): void
  addSceneData(sceneId: string, data: Scene): void
  getSceneData(sceneId: string): Scene
  addTileData(tileId: string, data: Tile): void
  getTileData(tileId: string): Tile
  addCssFileName(fileName: string): void
  getCssFileNames(): string[]
  addMapData(mapId: string, data: MapData): void
  getMapData(mapId: string): MapData
}

const logName = 'engine/resourceData/storage'
export const resourceDataStorageToken = token<IResourceDataStorage>(logName)
export const resourceDataStorageDependencies: Token<unknown>[] = [
  loggerToken,
  jsonConfigurationToken,
]
export class ResourceDataStorage implements IResourceDataStorage {
  private scenes: Map<string, Scene> = new Map()
  private tiles: Map<string, Tile> = new Map()
  private maps: Map<string, MapData> = new Map()
  private cssFileNames: string[] = []

  constructor(
    private readonly logger: ILogger,
    private readonly jsonConfiguration: IJsonConfiguration
  ) {}

  get rootPath(): string {
    return this.jsonConfiguration.rootPath
  }

  addSceneData(sceneId: string, data: Scene): void {
    this.scenes.set(sceneId, data)
  }

  getSceneData(sceneId: string): Scene {
    const scene = this.scenes.get(sceneId)
    if (!scene) {
      this.logger.fatal(logName, 'No scene data for id: {0}', sceneId)
    }
    return scene
  }

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

  addCssFileName(fileName: string): void {
    this.cssFileNames.push(fileName)
  }

  getCssFileNames(): string[] {
    return this.cssFileNames
  }

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

  logResourceData(): void {
    this.logger.debug(
      logName,
      'Scenes loaded: {0}',
      Array.from(this.scenes.keys())
    )

    this.logger.debug(
      logName,
      'Tiles loaded: {0}',
      Array.from(this.tiles.keys())
    )
    this.logger.debug(logName, 'Maps loaded: {0}', Array.from(this.maps.keys()))

    this.logger.debug(logName, 'CSS files loaded: {0}', this.cssFileNames)
  }
}
