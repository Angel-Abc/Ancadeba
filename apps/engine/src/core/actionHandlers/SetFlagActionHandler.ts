import { Action } from '@ancadeba/schemas'
import { Token, token } from '@ancadeba/utils'
import {
  gameStateManagerToken,
  IGameStateManager,
} from '../../gameState.ts/manager'
import { IActionHandler } from './types'

const logName = 'engine/core/actionHandlers/SetFlagActionHandler'
export const setFlagActionHandlerToken = token<IActionHandler>(logName)
export const setFlagActionHandlerDependencies: Token<unknown>[] = [
  gameStateManagerToken,
]

export class SetFlagActionHandler implements IActionHandler {
  constructor(private readonly gameStateManager: IGameStateManager) {}

  canHandle(action: Action): boolean {
    return action.type === 'set-flag'
  }

  handle(action: Action): void {
    if (action.type === 'set-flag') {
      this.gameStateManager.setFlag(action.name, action.value)
    }
  }
}
