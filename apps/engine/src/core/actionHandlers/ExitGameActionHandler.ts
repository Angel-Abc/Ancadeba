import { Action } from '@ancadeba/schemas'
import { Token, token } from '@ancadeba/utils'
import {
  browserAdapterToken,
  IBrowserAdapter,
} from '../../system/browserAdapter'
import { IActionHandler } from './types'

const logName = 'engine/core/actionHandlers/ExitGameActionHandler'
export const exitGameActionHandlerToken = token<IActionHandler>(logName)
export const exitGameActionHandlerDependencies: Token<unknown>[] = [
  browserAdapterToken,
]

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
