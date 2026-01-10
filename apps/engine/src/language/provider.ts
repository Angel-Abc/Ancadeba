import { Token, token } from '@ancadeba/utils'
import { languageStorageToken } from './storage'

export interface ILanguageProvider {
  getTranslation(key: string): string
}

const logName = 'engine/language/provider'
export const languageProviderToken = token<ILanguageProvider>(logName)
export const languageProviderDependencies: Token<unknown>[] = [
  languageStorageToken,
]
export class LanguageProvider implements ILanguageProvider {
  constructor(private languageStorage: ILanguageProvider) {}
  getTranslation(key: string): string {
    return this.languageStorage.getTranslation(key)
  }
}
