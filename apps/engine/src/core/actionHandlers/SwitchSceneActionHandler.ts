import { Action } from '@ancadeba/schemas'
import { Token, token } from '@ancadeba/utils'
import {
  gameStateManagerToken,
  IGameStateManager,
} from '../../gameState.ts/manager'
import { IActionHandler } from './types'

const logName = 'engine/core/actionHandlers/SwitchSceneActionHandler'
export const switchSceneActionHandlerToken = token<IActionHandler>(logName)
export const switchSceneActionHandlerDependencies: Token<unknown>[] = [
  gameStateManagerToken,
]

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
