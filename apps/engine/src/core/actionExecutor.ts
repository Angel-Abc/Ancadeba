import { Action } from '@ancadeba/schemas'
import { ILogger, loggerToken, Token, token } from '@ancadeba/utils'
import { CORE_MESSAGES } from '../messages/core'
import {
  engineMessageBusToken,
  IEngineMessageBus,
} from '../system/engineMessageBus'
import { IActionHandler } from './actionHandlers/types'
import { backActionHandlerToken } from './actionHandlers/BackActionHandler'
import { exitGameActionHandlerToken } from './actionHandlers/ExitGameActionHandler'
import { setFlagActionHandlerToken } from './actionHandlers/SetFlagActionHandler'
import { switchSceneActionHandlerToken } from './actionHandlers/SwitchSceneActionHandler'
import { volumeActionHandlerToken } from './actionHandlers/VolumeActionHandler'

export interface IActionExecutor {
  start(): void
}

const logName = 'engine/core/ActionExecutor'
export const actionExecutorToken = token<IActionExecutor>(logName)
export const actionExecutorDependencies: Token<unknown>[] = [
  loggerToken,
  engineMessageBusToken,
  switchSceneActionHandlerToken,
  exitGameActionHandlerToken,
  setFlagActionHandlerToken,
  backActionHandlerToken,
  volumeActionHandlerToken,
]

export class ActionExecutor implements IActionExecutor {
  private readonly handlers: IActionHandler[]

  constructor(
    private readonly logger: ILogger,
    private readonly messageBus: IEngineMessageBus,
    switchSceneHandler: IActionHandler,
    exitGameHandler: IActionHandler,
    setFlagHandler: IActionHandler,
    backHandler: IActionHandler,
    volumeHandler: IActionHandler
  ) {
    this.handlers = [
      switchSceneHandler,
      exitGameHandler,
      setFlagHandler,
      backHandler,
      volumeHandler,
    ]
  }

  start(): void {
    this.messageBus.subscribe(CORE_MESSAGES.EXECUTE_ACTION, (payload) => {
      this.execute(payload.action)
    })
  }

  private execute(action: Action): void {
    const handler = this.handlers.find((h) => h.canHandle(action))
    if (handler) {
      handler.handle(action)
    } else {
      this.logger.warn(
        logName,
        'No handler found for action type: {0}',
        action.type
      )
    }
  }
}
