import { Action } from '@ancadeba/schemas'
import { IGameStateManager } from '../../gameState.ts/manager'
import { IActionHandler } from './types'

export class SwitchSceneActionHandler implements IActionHandler {
  constructor(private readonly gameStateManager: IGameStateManager) {}

  canHandle(action: Action): boolean {
    return action.type === 'switch-scene'
  }

  handle(action: Action): void {
    if (action.type === 'switch-scene') {
      this.gameStateManager.switchScene(action.targetSceneId)
    }
  }
}
