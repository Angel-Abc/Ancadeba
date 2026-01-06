import { Action } from '@ancadeba/schemas'

export interface IActionHandler {
  canHandle(action: Action): boolean
  handle(action: Action): void
}
