import { Token, token } from '@ancadeba/utils'
import { IResourceDataStorage, resourceDataStorageToken } from './storage'
import { Scene } from '@ancadeba/schemas'
import { MapData } from './types'

export interface IResourceDataProvider {
  get assetsUrl(): string
  getSceneData(sceneId: string): Scene
  getCssFilePaths(): string[]
  getMapData(mapId: string): MapData
  getLanguageFilePaths(language: string): string[]
}

const logName = 'engine/resourceData/provider'
export const resourceDataProviderToken = token<IResourceDataProvider>(logName)
export const resourceDataProviderDependencies: Token<unknown>[] = [
  resourceDataStorageToken,
]
export class ResourceDataProvider implements IResourceDataProvider {
  constructor(private readonly resourceDataStorage: IResourceDataStorage) {}
  get assetsUrl(): string {
    return `${this.resourceDataStorage.rootPath}/assets`
  }
  getSceneData(sceneId: string): Scene {
    return this.resourceDataStorage.getSceneData(sceneId)
  }
  getCssFilePaths(): string[] {
    return this.resourceDataStorage
      .getCssFileNames()
      .map((fileName) => `${this.assetsUrl}/css/${fileName}`)
  }
  getMapData(mapId: string): MapData {
    return this.resourceDataStorage.getMapData(mapId)
  }
  getLanguageFilePaths(language: string): string[] {
    return this.resourceDataStorage
      .getLanguageFileNames(language)
      .map(
        (fileName) =>
          `${this.resourceDataStorage.rootPath}/languages/${fileName}`
      )
  }
}
