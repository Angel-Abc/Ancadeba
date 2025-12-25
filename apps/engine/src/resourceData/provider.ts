import { Token, token } from '@ancadeba/utils'
import { IResourceDataStorage, resourceDataStorageToken } from './storage'
import { Scene } from '@ancadeba/schemas'

export interface IResourceDataProvider {
  get assetsUrl(): string
  getSceneData(sceneId: string): Scene
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
}
