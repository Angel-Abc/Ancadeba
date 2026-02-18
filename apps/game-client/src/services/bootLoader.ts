// load the absolute minimum to get the boot screen up and running (if defined)

import { ILogger, loggerToken, Token, token } from '@ancadeba/utils'
import { IUIReadySignal, uiReadySignalToken } from '../signals/UIReadySignal'
import {
  gameDefinitionProviderToken,
  IGameDefinitionProvider,
  ILanguageDefinitionProvider,
  ISurfaceDefinitionProvider,
  ITranslationProvider,
  IWidgetDefinitionProvider,
  languageDefinitionProviderToken,
  surfaceDefinitionProviderToken,
  translationProviderToken,
  widgetDefinitionProviderToken,
} from '@ancadeba/engine'

export interface IBootLoader {
  loadBootScreen(): Promise<void>
}

export const bootLoaderToken = token<IBootLoader>(
  'game-client/services/bootLoader',
)
export const bootLoaderDependencies: Token<unknown>[] = [
  loggerToken,
  uiReadySignalToken,
  gameDefinitionProviderToken,
  surfaceDefinitionProviderToken,
  widgetDefinitionProviderToken,
  languageDefinitionProviderToken,
  translationProviderToken,
]
export class BootLoader implements IBootLoader {
  constructor(
    private readonly logger: ILogger,
    private readonly uiReadySignal: IUIReadySignal,
    private readonly gameDefinitionProvider: IGameDefinitionProvider,
    private readonly surfaceDefinitionProvider: ISurfaceDefinitionProvider,
    private readonly widgetDefinitionProvider: IWidgetDefinitionProvider,
    private readonly languageDefinitionProvider: ILanguageDefinitionProvider,
    private readonly translationProvider: ITranslationProvider,
  ) {}

  async loadBootScreen(): Promise<void> {
    const gameData = await this.gameDefinitionProvider.getGameDefinition()
    if (!gameData.bootSurfaceId) {
      // no boot surface defined, skip boot surface rendering
      return
    }

    await this.languageDefinitionProvider.setLanguage(gameData.language)
    const title = this.translationProvider.getTranslation(gameData.title)
    this.logger.info(bootLoaderToken, 'Loading game "{0}" ...', title)

    const bootSurface =
      await this.surfaceDefinitionProvider.getSurfaceDefinition(
        gameData.bootSurfaceId,
      )
    const widgets = await Promise.all(
      bootSurface.layout.widgets.map((widget) =>
        this.widgetDefinitionProvider.getWidgetDefinition(widget.widgetId),
      ),
    )

    this.logger.debug(
      bootLoaderToken,
      'Boot surface {0} loaded widgets {1}.',
      bootSurface,
      widgets,
    )

    // wait for the UI to be ready
    await this.uiReadySignal.ready
  }
}
