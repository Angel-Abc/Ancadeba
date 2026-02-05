import { ILogger, loadJsonResource, loggerToken, Token } from '@ancadeba/utils'
import { resourceConfigurationToken } from '../configuration/tokens'
import { IWidgetLoader } from './types'
import { IResourceConfiguration } from '../configuration/types'
import { Widget, widgetSchema } from '../schemas/widget'

export const widgetLoaderDependencies: Token<unknown>[] = [
  loggerToken,
  resourceConfigurationToken,
]
export class WidgetLoader implements IWidgetLoader {
  constructor(
    private readonly logger: ILogger,
    private readonly resourceConfiguration: IResourceConfiguration,
  ) {}

  async loadWidget(widgetPath: string): Promise<Widget> {
    const path = `${this.resourceConfiguration.resourcePath}/${widgetPath}`
    return loadJsonResource<Widget>(path, widgetSchema, this.logger)
  }
}
