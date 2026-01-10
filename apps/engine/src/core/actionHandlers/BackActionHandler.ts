import { Action } from '@ancadeba/schemas'
import { Token, token } from '@ancadeba/utils'
import {
  gameStateManagerToken,
  IGameStateManager,
} from '../../gameState.ts/manager'
import { IActionHandler } from './types'

const logName = 'engine/core/actionHandlers/BackActionHandler'
export const backActionHandlerToken = token<IActionHandler>(logName)
export const backActionHandlerDependencies: Token<unknown>[] = [
  gameStateManagerToken,
]

export class BackActionHandler implements IActionHandler {
  constructor(private readonly gameStateManager: IGameStateManager) {}

  canHandle(action: Action): boolean {
    return action.type === 'back'
  }

  handle(action: Action): void {
    if (action.type === 'back') {
      this.gameStateManager.goBack()
    }
  }
}
