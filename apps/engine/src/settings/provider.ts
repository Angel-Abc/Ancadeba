import { token } from '@ancadeba/utils'
import { ISettingsStorage, settingsStorageToken } from './storage'

export interface ISettingsProvider {
  get language(): string
  get volume(): number
}

const logName = 'engine/core/settings/provider'
export const settingsProviderToken = token<ISettingsProvider>(logName)
export const settingsProviderDependencies = [settingsStorageToken]
export class SettingsProvider implements ISettingsProvider {
  constructor(private settingsStorage: ISettingsStorage) {}

  get language(): string {
    return this.settingsStorage.language
  }
  get volume(): number {
    return this.settingsStorage.volume
  }
}
