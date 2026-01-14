import { Token, token } from '@ancadeba/utils'
import type { Scene, ComponentDefinition } from '@ancadeba/schemas'
import {
  ISceneDataStorage,
  sceneDataStorageToken,
  ICssFileStorage,
  cssFileStorageToken,
  IComponentDefinitionStorage,
  componentDefinitionStorageToken,
} from '../../resourceData/storage'

export interface ISceneDataInitializer {
  initializeScenes(scenes: Scene[]): void
  initializeStyling(cssFileNames: string[] | undefined): void
  initializeComponentDefinitions(definitions: ComponentDefinition[]): void
}

const logName = 'engine/core/initializers/sceneDataInitializer'
export const sceneDataInitializerToken = token<ISceneDataInitializer>(logName)
export const sceneDataInitializerDependencies: Token<unknown>[] = [
  sceneDataStorageToken,
  cssFileStorageToken,
  componentDefinitionStorageToken,
]

export class SceneDataInitializer implements ISceneDataInitializer {
  constructor(
    private readonly sceneDataStorage: ISceneDataStorage,
    private readonly cssFileStorage: ICssFileStorage,
    private readonly componentDefinitionStorage: IComponentDefinitionStorage
  ) {}

  initializeScenes(scenes: Scene[]): void {
    scenes.forEach((scene) => {
      this.sceneDataStorage.addSceneData(scene.id, scene)
    })
  }

  initializeStyling(cssFileNames: string[] | undefined): void {
    cssFileNames?.forEach((fileName) => {
      this.cssFileStorage.addCssFileName(fileName)
    })
  }

  initializeComponentDefinitions(definitions: ComponentDefinition[]): void {
    definitions.forEach((definition) => {
      this.componentDefinitionStorage.addComponentDefinition(
        definition.id,
        definition
      )
    })
  }
}
