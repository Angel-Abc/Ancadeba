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
  IComponentDefinitionStorage,
  componentDefinitionStorageToken,
  IAppearanceCategoryStorage,
  appearanceCategoryStorageToken,
  IAppearanceDataStorage,
  appearanceDataStorageToken,
  ILanguageFileStorage,
  languageFileStorageToken,
} from './storage'
import {
  Scene,
  Item,
  AppearanceCategory,
  Appearance,
  ComponentDefinition,
  Component,
  InlineComponent,
  ComponentReference,
} from '@ancadeba/schemas'
import { MapData } from './types'

export interface IResourceDataProvider {
  get assetsUrl(): string
  getSceneData(sceneId: string): Scene
  getCssFilePaths(): string[]
  getMapData(mapId: string): MapData
  getItemData(itemId: string): Item
  getComponentDefinition(definitionId: string): ComponentDefinition
  hasComponentDefinition(definitionId: string): boolean
  resolveComponent(component: Component): InlineComponent
  getAppearanceCategoryData(categoryId: string): AppearanceCategory
  getAppearanceData(appearanceId: string): Appearance
  getAllAppearanceCategories(): AppearanceCategory[]
  getAppearancesByCategory(categoryId: string): Appearance[]
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
  componentDefinitionStorageToken,
  appearanceCategoryStorageToken,
  appearanceDataStorageToken,
  languageFileStorageToken,
]
export class ResourceDataProvider implements IResourceDataProvider {
  constructor(
    private readonly resourceRootPath: IResourceRootPath,
    private readonly sceneDataStorage: ISceneDataStorage,
    private readonly cssFileStorage: ICssFileStorage,
    private readonly mapDataStorage: IMapDataStorage,
    private readonly itemDataStorage: IItemDataStorage,
    private readonly componentDefinitionStorage: IComponentDefinitionStorage,
    private readonly appearanceCategoryStorage: IAppearanceCategoryStorage,
    private readonly appearanceDataStorage: IAppearanceDataStorage,
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
  getComponentDefinition(definitionId: string): ComponentDefinition {
    return this.componentDefinitionStorage.getComponentDefinition(definitionId)
  }
  hasComponentDefinition(definitionId: string): boolean {
    return this.componentDefinitionStorage.hasComponentDefinition(definitionId)
  }
  resolveComponent(component: Component): InlineComponent {
    // If it's already an inline component, return as-is
    if ('type' in component) {
      return component as InlineComponent
    }

    // It's a component reference, resolve it
    const reference = component as ComponentReference
    const definition = this.getComponentDefinition(reference.definitionId)

    // Merge definition with scene-level properties and overrides
    const resolved: InlineComponent = {
      ...definition,
      location: reference.location,
      size: reference.size,
      visible: reference.visible,
    } as InlineComponent

    // Apply overrides if present
    if (reference.overrides) {
      Object.assign(resolved, reference.overrides)
    }

    return resolved
  }
  getAppearanceCategoryData(categoryId: string): AppearanceCategory {
    return this.appearanceCategoryStorage.getAppearanceCategoryData(categoryId)
  }
  getAppearanceData(appearanceId: string): Appearance {
    return this.appearanceDataStorage.getAppearanceData(appearanceId)
  }
  getAllAppearanceCategories(): AppearanceCategory[] {
    return this.appearanceCategoryStorage.getAllAppearanceCategories()
  }
  getAppearancesByCategory(categoryId: string): Appearance[] {
    return this.appearanceDataStorage.getAppearancesByCategory(categoryId)
  }
  getLanguageFilePaths(language: string): string[] {
    return this.languageFileStorage
      .getLanguageFileNames(language)
      .map(
        (fileName) => `${this.resourceRootPath.rootPath}/languages/${fileName}`
      )
  }
}
