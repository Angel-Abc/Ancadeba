import { Token, token } from '@ancadeba/utils'
import {
  IResourceDataProvider,
  resourceDataProviderToken,
} from '../resourceData/provider'
import { gameDataLoaderToken, IGameDataLoader } from '@ancadeba/schemas'

export interface ILanguageLoader {
  loadTranslations(languageCode: string): Promise<Map<string, string>>
}

const logName = 'engine/language/loader'
export const languageLoaderToken = token<ILanguageLoader>(logName)
export const languageLoaderDependencies: Token<unknown>[] = [
  resourceDataProviderToken,
  gameDataLoaderToken,
]
export class LanguageLoader implements ILanguageLoader {
  constructor(
    private resourceDataProvider: IResourceDataProvider,
    private gameDataLoader: IGameDataLoader
  ) {}

  async loadTranslations(languageCode: string): Promise<Map<string, string>> {
    const languageFilePaths =
      this.resourceDataProvider.getLanguageFilePaths(languageCode)
    const translations = await this.gameDataLoader.loadLanguageData(
      languageFilePaths
    )
    return translations
  }
}
