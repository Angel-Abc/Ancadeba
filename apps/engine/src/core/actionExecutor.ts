import { Action } from '@ancadeba/schemas'
import { ILogger, token } from '@ancadeba/utils'
import { CORE_MESSAGES } from '../messages/core'
import { IEngineMessageBus } from '../system/engineMessageBus'
import { IActionHandler } from './actionHandlers/types'

export interface IActionExecutor {
  start(): void
  stop(): void
}

const logName = 'engine/core/ActionExecutor'
export const actionExecutorToken = token<IActionExecutor>(logName)

export class ActionExecutor implements IActionExecutor {
  private readonly handlers: IActionHandler[]
  private unsubscribe?: () => void

  constructor(
    private readonly logger: ILogger,
    private readonly messageBus: IEngineMessageBus,
    handlers: IActionHandler[]
  ) {
    this.handlers = handlers
  }

  start(): void {
    if (this.unsubscribe) {
      this.unsubscribe()
      this.unsubscribe = undefined
    }
    this.unsubscribe = this.messageBus.subscribe(
      CORE_MESSAGES.EXECUTE_ACTION,
      (payload) => {
      this.execute(payload.action)
      }
    )
  }

  stop(): void {
    if (this.unsubscribe) {
      this.unsubscribe()
      this.unsubscribe = undefined
    }
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
