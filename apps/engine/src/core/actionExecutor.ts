import { Action } from '@ancadeba/schemas'
import { ILogger, loggerToken, Token, token } from '@ancadeba/utils'
import {
  IGameStateStorage,
  gameStateStorageToken,
} from '../gameState.ts/storage'
import { CORE_MESSAGES } from '../messages/core'
import {
  engineMessageBusToken,
  IEngineMessageBus,
} from '../system/engineMessageBus'

export interface IActionExecutor {
  start(): void
}

const logName = 'engine/core/ActionExecutor'
export const actionExecutorToken = token<IActionExecutor>(logName)
export const actionExecutorDependencies: Token<unknown>[] = [
  loggerToken,
  engineMessageBusToken,
  gameStateStorageToken,
]

export class ActionExecutor implements IActionExecutor {
  constructor(
    private readonly logger: ILogger,
    private readonly messageBus: IEngineMessageBus,
    private readonly gameStateStorage: IGameStateStorage
  ) {}

  start(): void {
    this.messageBus.subscribe(CORE_MESSAGES.EXECUTE_ACTION, (payload) => {
      this.execute(payload.action)
    })
  }

  private execute(action: Action): void {
    switch (action.type) {
      case 'switch-scene':
        // TODO: Move scene switching logic to SceneManager
        this.gameStateStorage.update({ activeScene: action.targetSceneId })
        this.messageBus.publish(CORE_MESSAGES.SCENE_CHANGED, {
          sceneId: action.targetSceneId,
        })
        return
      default:
        this.logger.warn(logName, `Unknown action type: ${action.type}`)
        return
    }
  }
}
