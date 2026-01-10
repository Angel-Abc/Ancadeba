import { ILogger, loggerToken, Token, token } from '@ancadeba/utils'
import { Scene } from '@ancadeba/schemas'

export interface ISceneDataStorage {
  addSceneData(sceneId: string, data: Scene): void
  getSceneData(sceneId: string): Scene
  getLoadedSceneIds(): string[]
}

const logName = 'engine/resourceData/SceneDataStorage'
export const sceneDataStorageToken = token<ISceneDataStorage>(logName)
export const sceneDataStorageDependencies: Token<unknown>[] = [loggerToken]

export class SceneDataStorage implements ISceneDataStorage {
  private scenes: Map<string, Scene> = new Map()

  constructor(private readonly logger: ILogger) {}

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

  getLoadedSceneIds(): string[] {
    return Array.from(this.scenes.keys())
  }
}
