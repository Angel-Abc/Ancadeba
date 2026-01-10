import { ILogger, loggerToken, Token, token } from '@ancadeba/utils'
import {
  IJsonConfiguration,
  jsonConfigurationToken,
  Scene,
  Tile,
} from '@ancadeba/schemas'
import { MapData } from './types'
import { VirtualKeyMapping } from '../system/virtualKeyMapper'

export interface VirtualInputMapping {
  virtualKeys: string[]
  virtualInput: string
  label: string
}

export interface IResourceRootPath {
  get rootPath(): string
}

export interface ISceneDataStorage {
  addSceneData(sceneId: string, data: Scene): void
  getSceneData(sceneId: string): Scene
}

export interface ITileDataStorage {
  addTileData(tileId: string, data: Tile): void
  getTileData(tileId: string): Tile
}

export interface IMapDataStorage {
  addMapData(mapId: string, data: MapData): void
  getMapData(mapId: string): MapData
}

export interface ICssFileStorage {
  addCssFileName(fileName: string): void
  getCssFileNames(): string[]
}

export interface ILanguageFileStorage {
  getLanguageFileNames(language: string): string[]
  setLanguageFileNames(language: string, fileNames: string[]): void
}

export interface IVirtualKeyStorage {
  setVirtualKeys(virtualKeys: VirtualKeyMapping[]): void
  getVirtualKeys(): VirtualKeyMapping[]
}

export interface IVirtualInputStorage {
  setVirtualInputs(virtualInputs: VirtualInputMapping[]): void
  getVirtualInputs(): VirtualInputMapping[]
}

export interface IResourceDataLogger {
  logResourceData(): void
}

export interface IResourceDataStorage
  extends IResourceRootPath,
    ISceneDataStorage,
    ITileDataStorage,
    IMapDataStorage,
    ICssFileStorage,
    ILanguageFileStorage,
    IVirtualKeyStorage,
    IVirtualInputStorage,
    IResourceDataLogger {}

const logName = 'engine/resourceData/storage'
export const resourceDataStorageToken = token<IResourceDataStorage>(logName)
export const sceneDataStorageToken = token<ISceneDataStorage>(
  'engine/resourceData/sceneDataStorage'
)
export const tileDataStorageToken = token<ITileDataStorage>(
  'engine/resourceData/tileDataStorage'
)
export const mapDataStorageToken = token<IMapDataStorage>(
  'engine/resourceData/mapDataStorage'
)
export const cssFileStorageToken = token<ICssFileStorage>(
  'engine/resourceData/cssFileStorage'
)
export const languageFileStorageToken = token<ILanguageFileStorage>(
  'engine/resourceData/languageFileStorage'
)
export const virtualKeyStorageToken = token<IVirtualKeyStorage>(
  'engine/resourceData/virtualKeyStorage'
)
export const virtualInputStorageToken = token<IVirtualInputStorage>(
  'engine/resourceData/virtualInputStorage'
)
export const resourceDataLoggerToken = token<IResourceDataLogger>(
  'engine/resourceData/resourceDataLogger'
)
export const resourceRootPathToken = token<IResourceRootPath>(
  'engine/resourceData/resourceRootPath'
)

export const resourceDataStorageDependencies: Token<unknown>[] = [
  loggerToken,
  jsonConfigurationToken,
]
export class ResourceDataStorage implements IResourceDataStorage {
  private scenes: Map<string, Scene> = new Map()
  private tiles: Map<string, Tile> = new Map()
  private maps: Map<string, MapData> = new Map()
  private languageFiles: Map<string, string[]> = new Map()
  private cssFileNames: string[] = []
  private virtualKeys: VirtualKeyMapping[] = []
  private virtualInputs: VirtualInputMapping[] = []

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

  getLanguageFileNames(language: string): string[] {
    if (!this.languageFiles.has(language)) {
      this.logger.fatal(
        logName,
        'No language files for language: {0}',
        language
      )
    }
    return this.languageFiles.get(language)!
  }

  setLanguageFileNames(language: string, fileNames: string[]): void {
    this.languageFiles.set(language, fileNames)
  }

  setVirtualKeys(virtualKeys: VirtualKeyMapping[]): void {
    this.virtualKeys = virtualKeys
  }

  getVirtualKeys(): VirtualKeyMapping[] {
    return this.virtualKeys
  }

  setVirtualInputs(virtualInputs: VirtualInputMapping[]): void {
    this.virtualInputs = virtualInputs
  }

  getVirtualInputs(): VirtualInputMapping[] {
    return this.virtualInputs
  }
}
