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
import {
  browserAdapterToken,
  IBrowserAdapter,
} from '../system/browserAdapter'

export interface IActionExecutor {
  start(): void
}

const logName = 'engine/core/ActionExecutor'
export const actionExecutorToken = token<IActionExecutor>(logName)
export const actionExecutorDependencies: Token<unknown>[] = [
  loggerToken,
  engineMessageBusToken,
  gameStateStorageToken,
  browserAdapterToken,
]

export class ActionExecutor implements IActionExecutor {
  constructor(
    private readonly logger: ILogger,
    private readonly messageBus: IEngineMessageBus,
    private readonly gameStateStorage: IGameStateStorage,
    private readonly browserAdapter: IBrowserAdapter
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
        // switching scene is most of the time a push on the scene stack
        this.gameStateStorage.update({ activeScene: action.targetSceneId })
        this.gameStateStorage.update({
          sceneStack: [
            ...this.gameStateStorage.state.sceneStack,
            action.targetSceneId,
          ],
        })
        this.messageBus.publish(CORE_MESSAGES.SCENE_CHANGED, {
          sceneId: action.targetSceneId,
        })
        return
      case 'exit-game':
        // TODO: exit game. reload the browser tab for now
        this.browserAdapter.reload()
        return
      case 'set-flag':
        this.gameStateStorage.setFlag(action.name, action.value)
        return
      case 'back': {
        const sceneStack = this.gameStateStorage.state.sceneStack
        if (sceneStack.length <= 1) {
          this.logger.warn(logName, 'Cannot go back, scene stack is empty')
          return
        }
        const newSceneStack = sceneStack.slice(0, -1)
        const previousSceneId = newSceneStack[newSceneStack.length - 1]
        this.gameStateStorage.update({ sceneStack: newSceneStack })
        this.gameStateStorage.update({ activeScene: previousSceneId })
        this.messageBus.publish(CORE_MESSAGES.SCENE_CHANGED, {
          sceneId: previousSceneId!,
        })
        return
      }
      case 'volume-up':
        // TODO: implement volume control
        return
      case 'volume-down':
        // TODO: implement volume control
        return
      default: {
        const exhaustiveCheck: never = action
        this.logger.warn(
          logName,
          `Unknown action type: ${(exhaustiveCheck as Action).type}`
        )
        return
      }
    }
  }
}
