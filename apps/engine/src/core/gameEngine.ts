import {
  IKeyboardListener,
  ILogger,
  keyboardListenerToken,
  loggerToken,
  Token,
  token,
} from '@ancadeba/utils'
import {
  engineMessageBusToken,
  IEngineMessageBus,
} from '../system/engineMessageBus'
import { CORE_MESSAGES } from '../messages/core'
import { IUIReadySignal, uiReadySignalToken } from '../system/uiReadySignal'
import { gameDataLoaderToken, IGameDataLoader } from '@ancadeba/schemas'
import {
  gameDataInitializerToken,
  IGameDataInitializer,
} from './gameDataInitializer'
import { IActionExecutor, actionExecutorToken } from './actionExecutor'
import {
  IKeyboardInputService,
  keyboardInputServiceToken,
} from '../system/keyboardInputService'
import {
  IVirtualInputService,
  virtualInputServiceToken,
} from '../system/virtualInputService'
import {
  IMapPositionService,
  mapPositionServiceToken,
} from '../system/mapPositionService'

export interface IGameEngine {
  start(): Promise<void>
  stop(): void
}

const logName = 'engine/core/GameEngine'
export const gameEngineToken = token<IGameEngine>(logName)
export const gameEngineDependencies: Token<unknown>[] = [
  loggerToken,
  engineMessageBusToken,
  uiReadySignalToken,
  gameDataLoaderToken,
  gameDataInitializerToken,
  actionExecutorToken,
  keyboardListenerToken,
  keyboardInputServiceToken,
  virtualInputServiceToken,
  mapPositionServiceToken,
]
export class GameEngine implements IGameEngine {
  constructor(
    private readonly logger: ILogger,
    private readonly messageBus: IEngineMessageBus,
    private readonly uiReadySignal: IUIReadySignal,
    private readonly gameDataLoader: IGameDataLoader,
    private readonly gameDataInitializer: IGameDataInitializer,
    private readonly actionExecutor: IActionExecutor,
    private readonly keyboardListener: IKeyboardListener,
    private readonly keyboardInputService: IKeyboardInputService,
    private readonly virtualInputService: IVirtualInputService,
    private readonly mapPositionService: IMapPositionService
  ) {}

  async start(): Promise<void> {
    const gameData = await this.gameDataLoader.loadGameData()
    this.logger.info(logName, 'loaded game data: {0}', gameData)
    await this.gameDataInitializer.initialize(gameData)
    // Wait for UI to be ready
    await this.uiReadySignal.ready
    this.actionExecutor.start()
    this.keyboardListener.start()
    this.keyboardInputService.start()
    this.virtualInputService.start()
    this.mapPositionService.start()
    this.messageBus.publish(CORE_MESSAGES.GAME_ENGINE_STARTED, undefined)
  }

  stop(): void {
    this.actionExecutor.stop()
    this.keyboardInputService.stop()
    this.virtualInputService.stop()
    this.mapPositionService.stop()
  }
}
