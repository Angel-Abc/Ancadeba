import {
  ISurfaceDefinitionProvider,
  IWidgetDefinitionProvider,
} from '../providers/definition/types'
import {
  surfaceDefinitionProviderToken,
  widgetDefinitionProviderToken,
} from '../providers/definition/tokens'
import { ISurfaceDataStorage } from '../storage/data/types'
import { surfaceDataStorageToken } from '../storage/data/tokens'
import { IBootstrapBootSurface } from './types'
import { ILogger, loggerToken, Token } from '@ancadeba/utils'

export const bootstrapBootSurfaceDependencies: Token<unknown>[] = [
  loggerToken,
  surfaceDefinitionProviderToken,
  widgetDefinitionProviderToken,
  surfaceDataStorageToken,
]

export class BootstrapBootSurface implements IBootstrapBootSurface {
  constructor(
    private readonly logger: ILogger,
    private readonly surfaceDefinitionProvider: ISurfaceDefinitionProvider,
    private readonly widgetDefinitionProvider: IWidgetDefinitionProvider,
    private readonly surfaceDataStorage: ISurfaceDataStorage,
  ) {}

  async execute(bootSurfaceId: string): Promise<void> {
    const bootSurface =
      await this.surfaceDefinitionProvider.getSurfaceDefinition(bootSurfaceId)
    const widgets = await Promise.all(
      bootSurface.layout.widgets.map((widget) =>
        this.widgetDefinitionProvider.getWidgetDefinition(widget.widgetId),
      ),
    )

    this.logger.debug(
      'engine/bootstrap/bootstrapBootSurface',
      'Boot surface {0} loaded widgets {1}.',
      bootSurface,
      widgets,
    )

    this.surfaceDataStorage.surfaceId = bootSurfaceId
  }
}
