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

export interface IGameDataInitializer {
  initialize(gameData: GameData): Promise<void>
}

const logName = 'engine/core/gameDataInitializer'
export const gameDataInitializerToken = token<IGameDataInitializer>(logName)
export const gameDataInitializerDependencies: Token<unknown>[] = [
  gameStateInitializerToken,
  sceneDataInitializerToken,
  tileDataInitializerToken,
  mapDataInitializerToken,
  virtualKeyStorageToken,
  virtualInputStorageToken,
  resourceDataLoggerToken,
]

export class GameDataInitializer implements IGameDataInitializer {
  constructor(
    private readonly gameStateInitializer: IGameStateInitializer,
    private readonly sceneDataInitializer: ISceneDataInitializer,
    private readonly tileDataInitializer: ITileDataInitializer,
    private readonly mapDataInitializer: IMapDataInitializer,
    private readonly virtualKeyStorage: IVirtualKeyStorage,
    private readonly virtualInputStorage: IVirtualInputStorage,
    private readonly resourceDataLogger: IResourceDataLogger
  ) {}

  async initialize(gameData: GameData): Promise<void> {
    await this.gameStateInitializer.initializeGameState(gameData)
    this.sceneDataInitializer.initializeScenes(gameData.scenes)
    this.sceneDataInitializer.initializeStyling(gameData.meta.styling)
    this.tileDataInitializer.initializeTiles(gameData.tileSets)
    this.mapDataInitializer.initializeMaps(gameData.maps)
    this.virtualKeyStorage.setVirtualKeys(gameData.virtualKeys.mappings)
    this.virtualInputStorage.setVirtualInputs(gameData.virtualInputs.mappings)

    this.resourceDataLogger.logResourceData()
  }
}
