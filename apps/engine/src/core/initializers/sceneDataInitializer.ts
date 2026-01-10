import { Token, token } from '@ancadeba/utils'
import type { Scene } from '@ancadeba/schemas'
import {
  IResourceDataStorage,
  resourceDataStorageToken,
} from '../../resourceData/storage'

export interface ISceneDataInitializer {
  initializeScenes(scenes: Scene[]): void
  initializeStyling(cssFileNames: string[] | undefined): void
}

const logName = 'engine/core/initializers/sceneDataInitializer'
export const sceneDataInitializerToken = token<ISceneDataInitializer>(logName)
export const sceneDataInitializerDependencies: Token<unknown>[] = [
  resourceDataStorageToken,
]

export class SceneDataInitializer implements ISceneDataInitializer {
  constructor(private readonly resourceDataStorage: IResourceDataStorage) {}

  initializeScenes(scenes: Scene[]): void {
    scenes.forEach((scene) => {
      this.resourceDataStorage.addSceneData(scene.id, scene)
    })
  }

  initializeStyling(cssFileNames: string[] | undefined): void {
    cssFileNames?.forEach((fileName) => {
      this.resourceDataStorage.addCssFileName(fileName)
    })
  }
}
