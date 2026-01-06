import { Action } from '@ancadeba/schemas'
import { IBrowserAdapter } from '../../system/browserAdapter'
import { IActionHandler } from './types'

export class ExitGameActionHandler implements IActionHandler {
  constructor(private readonly browserAdapter: IBrowserAdapter) {}

  canHandle(action: Action): boolean {
    return action.type === 'exit-game'
  }

  handle(action: Action): void {
    if (action.type === 'exit-game') {
      // TODO: exit game. reload the browser tab for now
      this.browserAdapter.reload()
    }
  }
}
