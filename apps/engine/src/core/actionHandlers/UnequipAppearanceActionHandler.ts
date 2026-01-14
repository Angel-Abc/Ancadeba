import { Action } from '@ancadeba/schemas'
import { Token, token } from '@ancadeba/utils'
import {
  IAppearanceService,
  appearanceServiceToken,
} from '../../appearance/appearanceService'
import { IActionHandler } from './types'

const logName = 'engine/core/actionHandlers/UnequipAppearanceActionHandler'
export const unequipAppearanceActionHandlerToken =
  token<IActionHandler>(logName)
export const unequipAppearanceActionHandlerDependencies: Token<unknown>[] = [
  appearanceServiceToken,
]

export class UnequipAppearanceActionHandler implements IActionHandler {
  constructor(private readonly appearanceService: IAppearanceService) {}

  canHandle(action: Action): boolean {
    return action.type === 'unequip-appearance'
  }

  handle(action: Action): void {
    if (action.type !== 'unequip-appearance') {
      return
    }

    this.appearanceService.unequipAppearance(action.categoryId)
  }
}
