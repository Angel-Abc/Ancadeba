import { Action } from '@ancadeba/schemas'
import { Token, token } from '@ancadeba/utils'
import { IActionHandler } from './types'

const logName = 'engine/core/actionHandlers/VolumeActionHandler'
export const volumeActionHandlerToken = token<IActionHandler>(logName)
export const volumeActionHandlerDependencies: Token<unknown>[] = []

export class VolumeActionHandler implements IActionHandler {
  canHandle(action: Action): boolean {
    return action.type === 'volume-up' || action.type === 'volume-down'
  }

  handle(action: Action): void {
    if (action.type === 'volume-up' || action.type === 'volume-down') {
      // TODO: implement volume control
    }
  }
}
