import { Action } from '@ancadeba/schemas'
import { IGameStateManager } from '../../gameState.ts/manager'
import { IActionHandler } from './types'

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
