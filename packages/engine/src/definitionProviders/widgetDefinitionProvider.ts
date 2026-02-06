import { ILogger, loggerToken, Token } from '@ancadeba/utils'
import {
  gameDefinitionProviderToken,
  widgetDefinitionProviderToken,
} from './tokens'
import { IGameDefinitionProvider, IWidgetDefinitionProvider } from './types'
import { IWidgetLoader, Widget, widgetLoaderToken } from '@ancadeba/content'

export const widgetDefinitionProviderDependencies: Token<unknown>[] = [
  loggerToken,
  gameDefinitionProviderToken,
  widgetLoaderToken,
]

export class WidgetDefinitionProvider implements IWidgetDefinitionProvider {
  private widgetCache: Map<string, Widget> = new Map()

  constructor(
    private readonly logger: ILogger,
    private readonly gameDefinitionProvider: IGameDefinitionProvider,
    private readonly widgetLoader: IWidgetLoader,
  ) {}

  async getWidgetDefinition(widgetId: string): Promise<Widget> {
    if (this.widgetCache.has(widgetId)) {
      return this.widgetCache.get(widgetId)!
    }

    const game = await this.gameDefinitionProvider.getGameDefinition()
    const widgetPath = game.widgets[widgetId]

    if (!widgetPath) {
      throw new Error(
        this.logger.error(
          widgetDefinitionProviderToken,
          'Widget with ID {0} not found in game definition.',
          widgetId,
        ),
      )
    }

    const widget = await this.widgetLoader.loadWidget(widgetPath)
    this.widgetCache.set(widgetId, widget)
    return widget
  }
}
