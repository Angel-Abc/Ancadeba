import { Token, token } from '@ancadeba/utils'
import {
  IResourceRootPath,
  resourceRootPathToken,
  ISceneDataStorage,
  sceneDataStorageToken,
  ICssFileStorage,
  cssFileStorageToken,
  IMapDataStorage,
  mapDataStorageToken,
  IItemDataStorage,
  itemDataStorageToken,
  ILanguageFileStorage,
  languageFileStorageToken,
} from './storage'
import { Scene, Item } from '@ancadeba/schemas'
import { MapData } from './types'

export interface IResourceDataProvider {
  get assetsUrl(): string
  getSceneData(sceneId: string): Scene
  getCssFilePaths(): string[]
  getMapData(mapId: string): MapData
  getItemData(itemId: string): Item
  getLanguageFilePaths(language: string): string[]
}

const logName = 'engine/resourceData/provider'
export const resourceDataProviderToken = token<IResourceDataProvider>(logName)
export const resourceDataProviderDependencies: Token<unknown>[] = [
  resourceRootPathToken,
  sceneDataStorageToken,
  cssFileStorageToken,
  mapDataStorageToken,
  itemDataStorageToken,
  languageFileStorageToken,
]
export class ResourceDataProvider implements IResourceDataProvider {
  constructor(
    private readonly resourceRootPath: IResourceRootPath,
    private readonly sceneDataStorage: ISceneDataStorage,
    private readonly cssFileStorage: ICssFileStorage,
    private readonly mapDataStorage: IMapDataStorage,
    private readonly itemDataStorage: IItemDataStorage,
    private readonly languageFileStorage: ILanguageFileStorage
  ) {}
  get assetsUrl(): string {
    return `${this.resourceRootPath.rootPath}/assets`
  }
  getSceneData(sceneId: string): Scene {
    return this.sceneDataStorage.getSceneData(sceneId)
  }
  getCssFilePaths(): string[] {
    return this.cssFileStorage
      .getCssFileNames()
      .map((fileName) => `${this.assetsUrl}/css/${fileName}`)
  }
  getMapData(mapId: string): MapData {
    return this.mapDataStorage.getMapData(mapId)
  }
  getItemData(itemId: string): Item {
    return this.itemDataStorage.getItemData(itemId)
  }
  getLanguageFilePaths(language: string): string[] {
    return this.languageFileStorage
      .getLanguageFileNames(language)
      .map(
        (fileName) => `${this.resourceRootPath.rootPath}/languages/${fileName}`
      )
  }
}
