import { DefaultSettings } from '@ancadeba/schemas'
import { ILogger, loggerToken, Token, token } from '@ancadeba/utils'
import { IStorageAdapter, storageAdapterToken } from '../system/storageAdapter'
import { Settings } from './types'

export interface ISettingsStorage {
  setDefaultSettings(defaultSettings: DefaultSettings): void
  get language(): string
  get volume(): number
  set language(value: string)
  set volume(value: number)
}

const logName = 'engine/core/settings/storage'
const STORAGE_KEY = 'ancadeba-settings'
export const settingsStorageToken = token<ISettingsStorage>(logName)
export const settingsStorageDependencies: Token<unknown>[] = [
  loggerToken,
  storageAdapterToken,
]
export class SettingsStorage implements ISettingsStorage {
  private settings: Settings
  constructor(
    private logger: ILogger,
    private storageAdapter: IStorageAdapter
  ) {
    const storedData = this.storageAdapter.getItem(STORAGE_KEY)
    if (storedData) {
      try {
        const parsed = JSON.parse(storedData) as Settings
        this.settings = {
          language: parsed.language ?? null,
          volume: parsed.volume ?? null,
        }
      } catch {
        this.settings = {
          language: null,
          volume: null,
        }
      }
    } else {
      this.settings = {
        language: null,
        volume: null,
      }
    }
  }

  setDefaultSettings(defaultSettings: DefaultSettings): void {
    this.settings.language = this.settings.language ?? defaultSettings.language
    this.settings.volume = this.settings.volume ?? defaultSettings.volume
    this.updateStorage()
  }

  updateStorage(): void {
    this.storageAdapter.setItem(STORAGE_KEY, JSON.stringify(this.settings))
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
