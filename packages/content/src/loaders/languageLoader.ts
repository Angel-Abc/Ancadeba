import { ILogger, loadJsonResource, loggerToken, Token } from '@ancadeba/utils'
import { resourceConfigurationToken } from '../configuration/tokens'
import { ILanguageLoader } from './types'
import { IResourceConfiguration } from '../configuration/types'
import { Language, languageSchema } from '../schemas/language'

export const languageLoaderDependencies: Token<unknown>[] = [
  loggerToken,
  resourceConfigurationToken,
]
export class LanguageLoader implements ILanguageLoader {
  constructor(
    private readonly logger: ILogger,
    private readonly resourceConfiguration: IResourceConfiguration,
  ) {}

  async loadLanguage(languagePath: string): Promise<Language> {
    const path = `${this.resourceConfiguration.resourcePath}/${languagePath}`
    return loadJsonResource<Language>(path, languageSchema, this.logger)
  }
}
