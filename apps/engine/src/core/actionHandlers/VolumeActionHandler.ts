import { Action } from '@ancadeba/schemas'
import { Token, token } from '@ancadeba/utils'
import { IActionHandler } from './types'
import { ISettingsStorage, settingsStorageToken } from '../../settings/storage'

const logName = 'engine/core/actionHandlers/VolumeActionHandler'
export const volumeActionHandlerToken = token<IActionHandler>(logName)
export const volumeActionHandlerDependencies: Token<unknown>[] = [
  settingsStorageToken,
]

export class VolumeActionHandler implements IActionHandler {
  constructor(private readonly settingsStorage: ISettingsStorage) {}

  canHandle(action: Action): boolean {
    return action.type === 'volume-up' || action.type === 'volume-down'
  }

  handle(action: Action): void {
    if (action.type === 'volume-up') {
      this.settingsStorage.volume = Math.min(
        1,
        Math.round(this.settingsStorage.volume * 10 + 1) / 10
      )
    }

    if (action.type === 'volume-down') {
      this.settingsStorage.volume = Math.max(
        0,
        Math.round(this.settingsStorage.volume * 10 - 1) / 10
      )
    }
  }
}
