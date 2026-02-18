import { Token } from '@ancadeba/utils'
import { languageDefinitionProviderToken } from './tokens'
import { ILanguageDefinitionProvider, ITranslationProvider } from './types'

export const translationProviderDependencies: Token<unknown>[] = [
  languageDefinitionProviderToken,
]

export class TranslationProvider implements ITranslationProvider {
  constructor(
    private readonly languageDefinitionProvider: ILanguageDefinitionProvider,
  ) {}

  getTranslation(key: string): string {
    return this.languageDefinitionProvider.getKeyValue(key)
  }
}
