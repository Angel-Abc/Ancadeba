import { ILogger, loggerToken, Token, token } from '@ancadeba/utils'
import {
  IJsonConfiguration,
  jsonConfigurationToken,
  Scene,
} from '@ancadeba/schemas'

export interface IResourceDataStorage {
  get rootPath(): string
  addSceneData(sceneId: string, data: Scene): void
  getSceneData(sceneId: string): Scene
}

const logName = 'engine/resourceData/storage'
export const resourceDataStorageToken = token<IResourceDataStorage>(logName)
export const resourceDataStorageDependencies: Token<unknown>[] = [
  loggerToken,
  jsonConfigurationToken,
]
export class ResourceDataStorage implements IResourceDataStorage {
  private scenes: Map<string, Scene> = new Map()

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
}
