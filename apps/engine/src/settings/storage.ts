import { DefaultSettings } from '@ancadeba/schemas'
import { ILogger, loggerToken, Token, token } from '@ancadeba/utils'
import { Settings } from './types'

export interface ISettingsStorage {
  setDefaultSettings(defaultSettings: DefaultSettings): void
  get language(): string
  get volume(): number
  set language(value: string)
  set volume(value: number)
}

const logName = 'engine/core/settings/storage'
export const settingsStorageToken = token<ISettingsStorage>(logName)
export const settingsStorageDependencies: Token<unknown>[] = [loggerToken]
export class SettingsStorage implements ISettingsStorage {
  private settings: Settings
  constructor(private logger: ILogger) {
    // TODO load settings from persistent storage or initialize with nulls when not in storage
    this.settings = {
      language: null,
      volume: null,
    }
  }

  setDefaultSettings(defaultSettings: DefaultSettings): void {
    this.settings.language = this.settings.language ?? defaultSettings.language
    this.settings.volume = this.settings.volume ?? defaultSettings.volume
    this.updateStorage()
  }

  updateStorage(): void {
    // TODO persist settings to storage
  }

  get language(): string {
    if (this.settings.language === null)
      this.logger.fatal(logName, 'Language setting is not initialized')
    return this.settings.language!
  }

  get volume(): number {
    if (this.settings.volume === null)
      this.logger.fatal(logName, 'Volume setting is not initialized')
    return this.settings.volume!
  }

  set language(value: string) {
    this.settings.language = value
    this.updateStorage()
  }

  set volume(value: number) {
    this.settings.volume = value
    this.updateStorage()
  }
}
