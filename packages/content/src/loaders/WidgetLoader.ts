import { loggerToken, type ILogger, type Token } from '@ancadeba/utils'
import {
  widgetDefinitionSchema,
  type WidgetDefinition,
} from '../schemas/surface'
import { resourcesConfigurationToken } from '../configuration/tokens'
import type { IResourcesConfiguration } from '../configuration/types'
import { type IWidgetLoader, WidgetLoaderLogName } from './types'

export const widgetLoaderDependencies: Token<unknown>[] = [
  loggerToken,
  resourcesConfigurationToken,
]

export class WidgetLoader implements IWidgetLoader {
  public static readonly logName: string = WidgetLoaderLogName

  constructor(
    private readonly logger: ILogger,
    private readonly resourcesConfiguration: IResourcesConfiguration,
  ) {}

  async load(widgetPath: string): Promise<WidgetDefinition> {
    const baseUrl = this.resourcesConfiguration.getResourcesPath()
    this.logger.debug(
      WidgetLoader.logName,
      'Loading widget from {0}/{1}',
      baseUrl,
      widgetPath,
    )

    const response = await fetch(`${baseUrl}/${widgetPath}`)

    if (!response.ok) {
      throw new Error(`Failed to load widget ${widgetPath}: ${response.status}`)
    }

    const data = await response.json()
    const parsed = widgetDefinitionSchema.parse(data)

    this.logger.debug(WidgetLoader.logName, 'Widget loaded: {0}', parsed.id)
    return parsed
  }

  async loadAll(widgetPaths: string[]): Promise<WidgetDefinition[]> {
    const baseUrl = this.resourcesConfiguration.getResourcesPath()
    this.logger.debug(
      WidgetLoader.logName,
      'Loading {0} widgets from {1}',
      widgetPaths.length,
      baseUrl,
    )

    const widgets = await Promise.all(
      widgetPaths.map((path) => this.load(path)),
    )

    this.logger.debug(
      WidgetLoader.logName,
      'Loaded {0} widgets: {1}',
      widgets.length,
      widgets.map((w) => w.id).join(', '),
    )

    return widgets
  }
}
