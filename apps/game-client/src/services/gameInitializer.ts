import { ILogger, loggerToken, Token, token } from '@ancadeba/utils'
import {
  ILanguageDefinitionProvider,
  ITranslationProvider,
  languageDefinitionProviderToken,
  translationProviderToken,
} from '@ancadeba/engine'
import type { Game } from '@ancadeba/content'

export interface IGameInitializer {
  initialize(gameData: Game): Promise<void>
}

export const gameInitializerToken = token<IGameInitializer>(
  'game-client/services/gameInitializer',
)
export const gameInitializerDependencies: Token<unknown>[] = [
  loggerToken,
  languageDefinitionProviderToken,
  translationProviderToken,
]
export class GameInitializer implements IGameInitializer {
  constructor(
    private readonly logger: ILogger,
    private readonly languageDefinitionProvider: ILanguageDefinitionProvider,
    private readonly translationProvider: ITranslationProvider,
  ) {}

  async initialize(gameData: Game): Promise<void> {
    await this.languageDefinitionProvider.setLanguage(gameData.language)
    const title = this.translationProvider.getTranslation(gameData.title)
    this.logger.info(gameInitializerToken, 'Loading game "{0}" ...', title)
  }
}
