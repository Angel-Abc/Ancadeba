import type { Game } from '@ancadeba/content'
import {
  ILanguageDefinitionProvider,
  ITranslationProvider,
} from '../providers/definition/types'
import {
  languageDefinitionProviderToken,
  translationProviderToken,
} from '../providers/definition/tokens'
import { IBootstrapGameDefinition } from './types'
import { ILogger, loggerToken, Token } from '@ancadeba/utils'
import type { IGameStyleLoader } from '../styling/types'
import { gameStyleLoaderToken } from '../styling/tokens'

export const bootstrapGameDefinitionDependencies: Token<unknown>[] = [
  loggerToken,
  gameStyleLoaderToken,
  languageDefinitionProviderToken,
  translationProviderToken,
]

export class BootstrapGameDefinition implements IBootstrapGameDefinition {
  constructor(
    private readonly logger: ILogger,
    private readonly gameStyleLoader: IGameStyleLoader,
    private readonly languageDefinitionProvider: ILanguageDefinitionProvider,
    private readonly translationProvider: ITranslationProvider,
  ) {}

  async execute(gameData: Game): Promise<void> {
    await this.gameStyleLoader.loadStyles(gameData.styles ?? [])
    await this.languageDefinitionProvider.setLanguage(gameData.language)
    const title = this.translationProvider.getTranslation(gameData.title)
    this.logger.info(
      'engine/bootstrap/bootstrapGameDefinition',
      'Loading game "{0}" ...',
      title,
    )
  }
}
