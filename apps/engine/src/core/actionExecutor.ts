import { Action } from '@ancadeba/schemas'
import {
  assertNever,
  ILogger,
  loggerToken,
  Token,
  token,
} from '@ancadeba/utils'
import {
  gameStateManagerToken,
  IGameStateManager,
} from '../gameState.ts/manager'
import { CORE_MESSAGES } from '../messages/core'
import {
  engineMessageBusToken,
  IEngineMessageBus,
} from '../system/engineMessageBus'
import { browserAdapterToken, IBrowserAdapter } from '../system/browserAdapter'

export interface IActionExecutor {
  start(): void
}

const logName = 'engine/core/ActionExecutor'
export const actionExecutorToken = token<IActionExecutor>(logName)
export const actionExecutorDependencies: Token<unknown>[] = [
  loggerToken,
  engineMessageBusToken,
  gameStateManagerToken,
  browserAdapterToken,
]

export class ActionExecutor implements IActionExecutor {
  constructor(
    private readonly logger: ILogger,
    private readonly messageBus: IEngineMessageBus,
    private readonly gameStateManager: IGameStateManager,
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
        this.gameStateManager.switchScene(action.targetSceneId)
        return
      case 'exit-game':
        // TODO: exit game. reload the browser tab for now
        this.browserAdapter.reload()
        return
      case 'set-flag':
        this.gameStateManager.setFlag(action.name, action.value)
        return
      case 'back': {
        this.gameStateManager.goBack()
        return
      }
      case 'volume-up':
        // TODO: implement volume control
        return
      case 'volume-down':
        // TODO: implement volume control
        return
      default: {
        this.logger.warn(
          logName,
          'Unknown action type: {0}',
          (action as Action).type
        )
        return assertNever(action)
      }
    }
  }
}
