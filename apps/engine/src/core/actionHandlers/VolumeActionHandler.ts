import { Action } from '@ancadeba/schemas'
import { IActionHandler } from './types'

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
