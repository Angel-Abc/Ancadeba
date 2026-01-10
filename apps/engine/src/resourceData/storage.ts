// Re-export interfaces and types from individual storage files
export type { ISceneDataStorage } from './SceneDataStorage'
export { sceneDataStorageToken } from './SceneDataStorage'

export type { ITileDataStorage } from './TileDataStorage'
export { tileDataStorageToken } from './TileDataStorage'

export type { IMapDataStorage } from './MapDataStorage'
export { mapDataStorageToken } from './MapDataStorage'

export type { ICssFileStorage, ILanguageFileStorage } from './AssetFileStorage'
export {
  cssFileStorageToken,
  languageFileStorageToken,
} from './AssetFileStorage'

export type {
  IVirtualKeyStorage,
  IVirtualInputStorage,
  VirtualInputMapping,
} from './VirtualInputConfigStorage'
export {
  virtualKeyStorageToken,
  virtualInputStorageToken,
} from './VirtualInputConfigStorage'

export type { IResourceRootPath } from './ResourceRootPathProvider'
export { resourceRootPathToken } from './ResourceRootPathProvider'

export type { IResourceDataLogger } from './ResourceDataLogger'
export { resourceDataLoggerToken } from './ResourceDataLogger'
