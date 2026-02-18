import {
  ILogger,
  IMessageBus,
  loggerToken,
  messageBusToken,
  Token,
} from '@ancadeba/utils'
import {
  gameDefinitionProviderToken,
  languageDefinitionProviderToken,
} from './tokens'
import { ILanguageLoader, languageLoaderToken } from '@ancadeba/content'
import { IGameDefinitionProvider, ILanguageDefinitionProvider } from './types'
import { MESSAGE_ENGINE_LANGUAGE_CHANGED } from './messages'

export const languageDefinitionProviderDependencies: Token<unknown>[] = [
  loggerToken,
  gameDefinitionProviderToken,
  languageLoaderToken,
  messageBusToken,
]
export class LanguageDefinitionProvider implements ILanguageDefinitionProvider {
  private languageId: string | null = null
  private languageData: Map<string, string> = new Map()

  constructor(
    private readonly logger: ILogger,
    private readonly gameDefinitionProvider: IGameDefinitionProvider,
    private readonly languageLoader: ILanguageLoader,
    private readonly messageBus: IMessageBus,
  ) {}

  async setLanguage(languageId: string): Promise<void> {
    if (this.languageId === languageId) {
      return
    }
    this.languageData.clear()
    const gameDefinition = await this.gameDefinitionProvider.getGameDefinition()
    const languageKeys = gameDefinition.languages[languageId]
    if (!languageKeys) {
      throw new Error(
        this.logger.error(
          languageDefinitionProviderToken,
          'Language with id {0} not found in game definition',
          languageId,
        ),
      )
    }
    for (const key of languageKeys) {
      const values = await this.languageLoader.loadLanguage(key)
      for (const [key, value] of Object.entries(values.translations)) {
        this.languageData.set(key, value)
      }
    }
    this.languageId = languageId
    this.messageBus.publish(MESSAGE_ENGINE_LANGUAGE_CHANGED, {
      languageId: this.languageId,
    })
  }

  getKeyValue(key: string): string {
    const value = this.languageData.get(key)
    if (!value) {
      this.logger.warn(
        languageDefinitionProviderToken,
        'Key {0} not found in language data for language {1}',
        key,
        this.languageId,
      )
      return key
    }
    return value
  }
}
