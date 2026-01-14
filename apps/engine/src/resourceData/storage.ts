// Re-export interfaces and types from individual storage files
export type { ISceneDataStorage } from './sceneDataStorage'
export { sceneDataStorageToken } from './sceneDataStorage'

export type { ITileDataStorage } from './tileDataStorage'
export { tileDataStorageToken } from './tileDataStorage'

export type { IMapDataStorage } from './mapDataStorage'
export { mapDataStorageToken } from './mapDataStorage'

export type { IItemDataStorage } from './itemDataStorage'
export { itemDataStorageToken } from './itemDataStorage'

export type { IComponentDefinitionStorage } from './componentDefinitionStorage'
export { componentDefinitionStorageToken } from './componentDefinitionStorage'

export type { IAppearanceCategoryStorage } from './appearanceCategoryStorage'
export { appearanceCategoryStorageToken } from './appearanceCategoryStorage'

export type { IAppearanceDataStorage } from './appearanceDataStorage'
export { appearanceDataStorageToken } from './appearanceDataStorage'

export type { ICssFileStorage, ILanguageFileStorage } from './assetFileStorage'
export {
  cssFileStorageToken,
  languageFileStorageToken,
} from './assetFileStorage'

export type {
  IVirtualKeyStorage,
  IVirtualInputStorage,
  VirtualInputMapping,
} from './virtualInputConfigStorage'
export {
  virtualKeyStorageToken,
  virtualInputStorageToken,
} from './virtualInputConfigStorage'

export type { IResourceRootPath } from './resourceRootPathProvider'
export { resourceRootPathToken } from './resourceRootPathProvider'

export type { IResourceDataLogger } from './resourceDataLogger'
export { resourceDataLoggerToken } from './resourceDataLogger'
