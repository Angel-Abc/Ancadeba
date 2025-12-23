import { ILogger, loggerToken, Token, token } from '@ancadeba/utils'
import {
  engineMessageBusToken,
  IEngineMessageBus,
} from '../system/engineMessageBus'
import { CORE_MESSAGES } from '../messages/core'
import { IUIReadySignal, uiReadySignalToken } from '../system/uiReadySignal'
import { gameDataLoaderToken, IGameDataLoader } from '@ancadeba/schemas'
import {
  gameStateStorageToken,
  IGameStateStorage,
} from '../gameState.ts/storage'

export interface IGameEngine {
  start(): Promise<void>
}

const logName = 'engine/core/GameEngine'
export const gameEngineToken = token<IGameEngine>(logName)
export const gameEngineDependencies: Token<unknown>[] = [
  loggerToken,
  engineMessageBusToken,
  uiReadySignalToken,
  gameDataLoaderToken,
  gameStateStorageToken,
]
export class GameEngine implements IGameEngine {
  constructor(
    private readonly logger: ILogger,
    private readonly messageBus: IEngineMessageBus,
    private readonly uiReadySignal: IUIReadySignal,
    private readonly gameDataLoader: IGameDataLoader,
    private readonly gameStateStorage: IGameStateStorage
  ) {}

  async start(): Promise<void> {
    const gameData = await this.gameDataLoader.loadGameData()
    this.logger.info(logName, 'loaded game data: {0}', gameData)
    const { scene: initialScene, ...initialState } = gameData.meta.initialState
    this.gameStateStorage.state = {
      title: gameData.meta.title,
      activeScene: initialScene,
      ...initialState,
    }

    // Wait for UI to be ready
    await this.uiReadySignal.ready
    this.messageBus.publish(CORE_MESSAGES.GAME_ENGINE_STARTED, undefined)
  }
}
