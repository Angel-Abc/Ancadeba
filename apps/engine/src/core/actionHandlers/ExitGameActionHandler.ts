import { Action } from '@ancadeba/schemas'
import { Token, token } from '@ancadeba/utils'
import {
  engineMessageBusToken,
  IEngineMessageBus,
} from '../../system/engineMessageBus'
import { CORE_MESSAGES } from '../../messages/core'
import { IActionHandler } from './types'

const logName = 'engine/core/actionHandlers/ExitGameActionHandler'
export const exitGameActionHandlerToken = token<IActionHandler>(logName)
export const exitGameActionHandlerDependencies: Token<unknown>[] = [
  engineMessageBusToken,
]

export class ExitGameActionHandler implements IActionHandler {
  constructor(private readonly messageBus: IEngineMessageBus) {}

  canHandle(action: Action): boolean {
    return action.type === 'exit-game'
  }

  handle(action: Action): void {
    if (action.type === 'exit-game') {
      this.messageBus.publish(CORE_MESSAGES.GAME_ENGINE_STOPPED, undefined)
    }
  }
}
