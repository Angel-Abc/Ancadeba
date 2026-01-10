import { Token, token } from '@ancadeba/utils'
import { Translations } from './types'
import { ILanguageLoader, languageLoaderToken } from './loader'

export interface ILanguageStorage {
  setLanguage(language: string): Promise<void>
  getTranslation(key: string): string
}

const logName = 'engine/language/storage'
export const languageStorageToken = token<ILanguageStorage>(logName)
export const languageStorageDependencies: Token<unknown>[] = [
  languageLoaderToken,
]
export class LanguageStorage implements ILanguageStorage {
  private currentLanguage: string | null = null
  private translations: Translations = new Map()

  constructor(private languageLoader: ILanguageLoader) {}

  async setLanguage(language: string): Promise<void> {
    if (this.currentLanguage !== language) {
      await this.languageLoader
        .loadTranslations(language)
        .then((loadedTranslations) => {
          this.translations = loadedTranslations
        })
      this.currentLanguage = language
    }
  }

  getTranslation(key: string): string {
    return this.translations.get(key) || key
  }
}
