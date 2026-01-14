import { Token, token } from '@ancadeba/utils'
import type { GameData } from '@ancadeba/schemas'
import {
  IVirtualKeyStorage,
  virtualKeyStorageToken,
  IVirtualInputStorage,
  virtualInputStorageToken,
  IResourceDataLogger,
  resourceDataLoggerToken,
} from '../resourceData/storage'
import {
  IGameStateInitializer,
  gameStateInitializerToken,
} from './initializers/gameStateInitializer'
import {
  IEntityInitializer,
  entityInitializerToken,
} from './initializers/entityInitializer'
import {
  ISceneDataInitializer,
  sceneDataInitializerToken,
} from './initializers/sceneDataInitializer'
import {
  ITileDataInitializer,
  tileDataInitializerToken,
} from './initializers/tileDataInitializer'
import {
  IMapDataInitializer,
  mapDataInitializerToken,
} from './initializers/mapDataInitializer'
import {
  IItemDataInitializer,
  itemDataInitializerToken,
} from './initializers/itemDataInitializer'
import {
  IAppearanceCategoryInitializer,
  appearanceCategoryInitializerToken,
} from './initializers/appearanceCategoryInitializer'
import {
  IAppearanceDataInitializer,
  appearanceDataInitializerToken,
} from './initializers/appearanceDataInitializer'

export interface IGameDataInitializer {
  initialize(gameData: GameData): Promise<void>
}

const logName = 'engine/core/gameDataInitializer'
export const gameDataInitializerToken = token<IGameDataInitializer>(logName)
export const gameDataInitializerDependencies: Token<unknown>[] = [
  gameStateInitializerToken,
  entityInitializerToken,
  sceneDataInitializerToken,
  tileDataInitializerToken,
  mapDataInitializerToken,
  itemDataInitializerToken,
  appearanceCategoryInitializerToken,
  appearanceDataInitializerToken,
  virtualKeyStorageToken,
  virtualInputStorageToken,
  resourceDataLoggerToken,
]

export class GameDataInitializer implements IGameDataInitializer {
  constructor(
    private readonly gameStateInitializer: IGameStateInitializer,
    private readonly entityInitializer: IEntityInitializer,
    private readonly sceneDataInitializer: ISceneDataInitializer,
    private readonly tileDataInitializer: ITileDataInitializer,
    private readonly mapDataInitializer: IMapDataInitializer,
    private readonly itemDataInitializer: IItemDataInitializer,
    private readonly appearanceCategoryInitializer: IAppearanceCategoryInitializer,
    private readonly appearanceDataInitializer: IAppearanceDataInitializer,
    private readonly virtualKeyStorage: IVirtualKeyStorage,
    private readonly virtualInputStorage: IVirtualInputStorage,
    private readonly resourceDataLogger: IResourceDataLogger
  ) {}

  async initialize(gameData: GameData): Promise<void> {
    await this.gameStateInitializer.initializeGameState(gameData)
    this.entityInitializer.initializeEntities(gameData)
    this.sceneDataInitializer.initializeScenes(gameData.scenes)
    this.sceneDataInitializer.initializeStyling(gameData.meta.styling)
    this.sceneDataInitializer.initializeComponentDefinitions(
      gameData.componentDefinitions
    )
    this.tileDataInitializer.initializeTiles(gameData.tileSets)
    this.mapDataInitializer.initializeMaps(gameData.maps)
    this.itemDataInitializer.initializeItems(gameData.items)
    this.appearanceCategoryInitializer.initializeAppearanceCategories(
      gameData.appearanceCategories
    )
    this.appearanceDataInitializer.initializeAppearances(gameData.appearances)
    this.virtualKeyStorage.setVirtualKeys(gameData.virtualKeys.mappings)
    this.virtualInputStorage.setVirtualInputs(gameData.virtualInputs.mappings)

    this.resourceDataLogger.logResourceData()
  }
}
