// load the absolute minimum to get the boot screen up and running (if defined)

import { ILogger, loggerToken, Token, token } from '@ancadeba/utils'
import { IUIReadySignal, uiReadySignalToken } from '../signals/UIReadySignal'
import {
  gameDefinitionProviderToken,
  IGameDefinitionProvider,
  ISurfaceDefinitionProvider,
  IWidgetDefinitionProvider,
  surfaceDefinitionProviderToken,
  widgetDefinitionProviderToken,
} from '@ancadeba/engine'

export interface IBootLoader {
  loadBootScreen(): Promise<void>
}

export const bootLoaderToken = token<IBootLoader>(
  'game-client/services/bootLoader',
)
export const bootLoaderDependencies: Record<string, Token<unknown>> = {
  logger: loggerToken,
  uiReadySignal: uiReadySignalToken,
  gameDefinitionProvider: gameDefinitionProviderToken,
  surfaceDefinitionProvider: surfaceDefinitionProviderToken,
  widgetDefinitionProvider: widgetDefinitionProviderToken,
}
export class BootLoader implements IBootLoader {
  private readonly logger: ILogger
  private readonly uiReadySignal: IUIReadySignal
  private readonly gameDefinitionProvider: IGameDefinitionProvider
  private readonly surfaceDefinitionProvider: ISurfaceDefinitionProvider
  private readonly widgetDefinitionProvider: IWidgetDefinitionProvider
  constructor({
    logger,
    uiReadySignal,
    gameDefinitionProvider,
    surfaceDefinitionProvider,
    widgetDefinitionProvider,
  }: {
    logger: ILogger
    uiReadySignal: IUIReadySignal
    gameDefinitionProvider: IGameDefinitionProvider
    surfaceDefinitionProvider: ISurfaceDefinitionProvider
    widgetDefinitionProvider: IWidgetDefinitionProvider
  }) {
    this.logger = logger
    this.uiReadySignal = uiReadySignal
    this.gameDefinitionProvider = gameDefinitionProvider
    this.surfaceDefinitionProvider = surfaceDefinitionProvider
    this.widgetDefinitionProvider = widgetDefinitionProvider
  }

  async loadBootScreen(): Promise<void> {
    const gameData = await this.gameDefinitionProvider.getGameDefinition()
    if (!gameData.bootSurfaceId) {
      // no boot surface defined, skip boot surface rendering
      return
    }

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
