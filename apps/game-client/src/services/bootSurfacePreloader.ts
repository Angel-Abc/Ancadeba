import { ILogger, loggerToken, Token, token } from '@ancadeba/utils'
import {
  IWidgetDefinitionProvider,
  ISurfaceDefinitionProvider,
  surfaceDefinitionProviderToken,
  widgetDefinitionProviderToken,
} from '@ancadeba/engine'

export interface IBootSurfacePreloader {
  preload(bootSurfaceId: string): Promise<void>
}

export const bootSurfacePreloaderToken = token<IBootSurfacePreloader>(
  'game-client/services/bootSurfacePreloader',
)
export const bootSurfacePreloaderDependencies: Token<unknown>[] = [
  loggerToken,
  surfaceDefinitionProviderToken,
  widgetDefinitionProviderToken,
]
export class BootSurfacePreloader implements IBootSurfacePreloader {
  constructor(
    private readonly logger: ILogger,
    private readonly surfaceDefinitionProvider: ISurfaceDefinitionProvider,
    private readonly widgetDefinitionProvider: IWidgetDefinitionProvider,
  ) {}

  async preload(bootSurfaceId: string): Promise<void> {
    const bootSurface =
      await this.surfaceDefinitionProvider.getSurfaceDefinition(bootSurfaceId)
    const widgets = await Promise.all(
      bootSurface.layout.widgets.map((widget) =>
        this.widgetDefinitionProvider.getWidgetDefinition(widget.widgetId),
      ),
    )

    this.logger.debug(
      bootSurfacePreloaderToken,
      'Boot surface {0} loaded widgets {1}.',
      bootSurface,
      widgets,
    )
  }
}
