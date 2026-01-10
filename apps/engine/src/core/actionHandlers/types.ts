import { Action } from '@ancadeba/schemas'
import { token } from '@ancadeba/utils'

export interface IActionHandler {
  canHandle(action: Action): boolean
  handle(action: Action): void
}

export const actionHandlerToken = token<IActionHandler>(
  'engine/core/actionHandlers/IActionHandler'
)
