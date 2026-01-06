import { Action } from '@ancadeba/schemas'
import { IGameStateManager } from '../../gameState.ts/manager'
import { IActionHandler } from './types'

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
