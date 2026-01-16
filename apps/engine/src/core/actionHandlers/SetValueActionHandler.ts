import { Action } from '@ancadeba/schemas'
import { Token, token } from '@ancadeba/utils'
import {
  gameStateManagerToken,
  IGameStateManager,
} from '../../gameState.ts/manager'
import { IActionHandler } from './types'

const logName = 'engine/core/actionHandlers/SetValueActionHandler'
export const setValueActionHandlerToken = token<IActionHandler>(logName)
export const setValueActionHandlerDependencies: Token<unknown>[] = [
  gameStateManagerToken,
]

export class SetValueActionHandler implements IActionHandler {
  constructor(private readonly gameStateManager: IGameStateManager) {}

  canHandle(action: Action): boolean {
    return action.type === 'set-value' || action.type === 'unset-value'
  }

  handle(action: Action): void {
    if (action.type === 'set-value') {
      this.gameStateManager.setValue(action.name, action.value)
    } else if (action.type === 'unset-value') {
      this.gameStateManager.unsetValue(action.name)
    }
  }
}
